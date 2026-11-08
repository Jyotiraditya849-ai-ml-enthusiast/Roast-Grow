import React, { useState, useEffect, useCallback, Component } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaInsetsContext, initialWindowMetrics } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { NotificationProvider } from './src_app/context/NotificationContext';
import { CyberNotificationBanner } from './src_app/components/Common/CyberNotificationBanner';
import { CyberAlertModal } from './src_app/components/Common/CyberAlertModal';
import { AuthProvider, useAuth } from './src_app/context/AuthContext';
import { StreakProvider, useStreak } from './src_app/context/StreakContext';
import { FocusTimerProvider } from './src_app/context/FocusTimerContext';
import { Header } from './src_app/components/Common/Header';
import { TabBar } from './src_app/components/Common/TabBar';
import { AuthScreen } from './src_app/screens/AuthScreen';
import { DashboardScreen } from './src_app/screens/DashboardScreen';
import { CreateMissionScreen } from './src_app/screens/CreateMissionScreen';
import { JournalScreen } from './src_app/screens/JournalScreen';
import { AnalyticsScreen } from './src_app/screens/AnalyticsScreen';
import { SettingsScreen } from './src_app/screens/SettingsScreen';
import { THEME } from './src_app/theme';

// Error Boundary to prevent any blank white screen
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Crash caught by GlobalErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.toString() || 'Unknown runtime error'}
          </Text>
          <ScrollView style={styles.errorStackBox}>
            <Text style={styles.errorStackText}>
              {this.state.errorInfo?.componentStack || 'No component stack'}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text style={styles.retryBtnText}>Try Reloading</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const { width: WIN_WIDTH, height: WIN_HEIGHT } = Dimensions.get('window');

const initialMetrics = {
  frame: {
    x: 0,
    y: 0,
    width: WIN_WIDTH || 420,
    height: WIN_HEIGHT || 900
  },
  insets: { top: 0, left: 0, right: 0, bottom: 0 }
};

const MainNavigator = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { challenge } = useStreak();

  const handleSelectTab = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  return (
    <View style={styles.webWrapper}>
      <View style={styles.appContainer}>
        <StatusBar style="light" />
        <Header
          currentStreak={challenge?.currentStreak || 0}
          isBroken={challenge?.isBroken || challenge?.currentStreak === 0}
        />

        <View style={styles.screenContainer}>
          <View style={[styles.screenTabWrapper, activeTab !== 'dashboard' && styles.screenTabHidden]}>
            <DashboardScreen
              onNavigateToVault={() => handleSelectTab('vault')}
              onNavigateToCreate={() => handleSelectTab('create')}
            />
          </View>

          <View style={[styles.screenTabWrapper, activeTab !== 'journal' && styles.screenTabHidden]}>
            <JournalScreen />
          </View>

          <View style={[styles.screenTabWrapper, activeTab !== 'create' && styles.screenTabHidden]}>
            <CreateMissionScreen onNavigateToHome={() => handleSelectTab('dashboard')} />
          </View>

          <View style={[styles.screenTabWrapper, activeTab !== 'heatmap' && styles.screenTabHidden]}>
            <AnalyticsScreen />
          </View>

          <View style={[styles.screenTabWrapper, activeTab !== 'vault' && styles.screenTabHidden]}>
            <SettingsScreen />
          </View>
        </View>

        <TabBar activeTab={activeTab} onSelectTab={handleSelectTab} />
      </View>
    </View>
  );
};

const RootRouter = () => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.marigold} />
        <Text style={styles.loadingText}>Loading Challenger ID...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.webWrapper}>
        <View style={styles.appContainer}>
          <StatusBar style="light" />
          <AuthScreen />
        </View>
      </View>
    );
  }

  return (
    <StreakProvider>
      <FocusTimerProvider>
        <MainNavigator />
      </FocusTimerProvider>
    </StreakProvider>
  );
};

const SafeAppWrapper = ({ children }) => {
  if (Platform.OS === 'web') {
    return (
      <SafeAreaInsetsContext.Provider value={{ top: 0, bottom: 0, left: 0, right: 0 }}>
        <View style={styles.safeArea}>
          {children}
        </View>
      </SafeAreaInsetsContext.Provider>
    );
  }
  return (
    <SafeAreaProvider initialMetrics={initialMetrics} style={styles.safeArea}>
      {children}
    </SafeAreaProvider>
  );
};

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = THEME.bgApp;
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.height = '100%';
      document.documentElement.style.height = '100%';
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.height = '100%';
        rootEl.style.display = 'flex';
        rootEl.style.flexDirection = 'column';
      }
    }

    if (Platform.OS !== 'web') {
      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('[App] Notification tapped:', response.notification?.request?.content?.title);
      });
      return () => sub.remove();
    }
  }, []);

  return (
    <GlobalErrorBoundary>
      <SafeAppWrapper>
        <NotificationProvider>
          <AuthProvider>
            <RootRouter />
          </AuthProvider>
          <CyberNotificationBanner />
          <CyberAlertModal />
        </NotificationProvider>
      </SafeAppWrapper>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bgApp,
    height: Platform.OS === 'web' ? '100%' : undefined
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%'
  },
  loadingText: {
    color: THEME.marigoldLight,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5
  },
  webWrapper: {
    flex: 1,
    backgroundColor: THEME.bgApp,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: Platform.OS === 'web' ? '100%' : undefined,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%'
  },
  appContainer: {
    flex: 1,
    backgroundColor: THEME.bgApp,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : '100%',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: THEME.borderSubtle,
    height: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    alignSelf: 'center'
  },
  screenContainer: {
    flex: 1,
    width: '100%'
  },
  screenTabWrapper: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  screenTabHidden: {
    display: 'none'
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0507',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%'
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.crimsonPureRed,
    marginBottom: 10
  },
  errorMessage: {
    color: '#f0f6fc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14
  },
  errorStackBox: {
    maxHeight: 180,
    backgroundColor: '#050304',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 63, 0.3)',
    width: '100%',
    marginBottom: 16
  },
  errorStackText: {
    color: '#fca5a5',
    fontSize: 11,
    fontFamily: 'monospace'
  },
  retryBtn: {
    backgroundColor: THEME.crimsonDeep,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.crimson
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700'
  }
});
