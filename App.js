import React, { useState, useEffect, Component } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src_app/context/AuthContext';
import { StreakProvider, useStreak } from './src_app/context/StreakContext';
import { Header } from './src_app/components/Common/Header';
import { TabBar } from './src_app/components/Common/TabBar';
import { AuthScreen } from './src_app/screens/AuthScreen';
import { DashboardScreen } from './src_app/screens/DashboardScreen';
import { JournalScreen } from './src_app/screens/JournalScreen';
import { AnalyticsScreen } from './src_app/screens/AnalyticsScreen';
import { SettingsScreen } from './src_app/screens/SettingsScreen';

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

const initialMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 }
};

const MainNavigator = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { challenge } = useStreak();

  return (
    <View style={styles.webWrapper}>
      <View style={styles.appContainer}>
        <StatusBar style="light" />
        <Header
          currentStreak={challenge?.currentStreak || 0}
          isBroken={challenge?.isBroken || challenge?.currentStreak === 0}
        />

        <View style={styles.screenContainer}>
          {activeTab === 'dashboard' && (
            <DashboardScreen onNavigateToVault={() => setActiveTab('vault')} />
          )}
          {activeTab === 'journal' && <JournalScreen />}
          {activeTab === 'heatmap' && <AnalyticsScreen />}
          {activeTab === 'vault' && <SettingsScreen />}
        </View>

        <TabBar activeTab={activeTab} onSelectTab={setActiveTab} />
      </View>
    </View>
  );
};

const RootRouter = () => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
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
      <MainNavigator />
    </StreakProvider>
  );
};

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = '#05080c';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    }
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialMetrics} style={styles.safeArea}>
      <GlobalErrorBoundary>
        <AuthProvider>
          <RootRouter />
        </AuthProvider>
      </GlobalErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#05080c'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#05080c',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%'
  },
  loadingText: {
    color: '#8b949e',
    fontSize: 13,
    fontWeight: '700'
  },
  webWrapper: {
    flex: 1,
    backgroundColor: '#05080c',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%'
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#0d1117',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : '100%',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#21262d',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%'
  },
  screenContainer: {
    flex: 1,
    width: '100%'
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#161b22',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%'
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ef4444',
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
    backgroundColor: '#0d1117',
    padding: 10,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16
  },
  errorStackText: {
    color: '#8b949e',
    fontSize: 11,
    fontFamily: 'monospace'
  },
  retryBtn: {
    backgroundColor: '#238636',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700'
  }
});
