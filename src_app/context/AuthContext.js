import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAllStoredAccounts,
  saveAllStoredAccounts,
  getStoredActiveSession,
  saveStoredActiveSession,
  setActiveUserStorageId
} from '../storage/asyncStorage';

const AuthContext = createContext(null);

export const AVATAR_OPTIONS = ['🔥', '⚡', '🚀', '👑', '🥷', '💻', '🐺', '🦁', '🎯', '💎'];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load session on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        let accounts = await getAllStoredAccounts();
        if (!accounts || accounts.length === 0) {
          // Initialize default profile matching challenger ID from screenshot
          const defaultUser = {
            id: 'jyotiraditya_369',
            username: 'jyotiraditya_369',
            displayName: 'Jyotiraditya',
            avatar: '⚡',
            pin: null,
            createdAt: Date.now()
          };
          accounts = [defaultUser];
          await saveAllStoredAccounts(accounts);
          await saveStoredActiveSession(defaultUser.username);
        }
        setSavedAccounts(accounts);

        const activeId = await getStoredActiveSession();
        const matched = accounts.find((a) => a.username.toLowerCase() === (activeId || '').toLowerCase());
        const targetUser = matched || accounts[0];
        if (targetUser) {
          setActiveUserStorageId(targetUser.username);
          setCurrentUser(targetUser);
        }
      } catch (e) {
        console.error('Error initializing auth:', e);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register a new user ID / account
  const register = async ({ username, displayName, avatar = '🔥', pin = '' }) => {
    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUser) {
      throw new Error('Please enter a valid User ID (letters, numbers, underscores).');
    }

    const accounts = await getAllStoredAccounts();
    const existing = accounts.find((a) => a.username.toLowerCase() === cleanUser);
    if (existing) {
      throw new Error(`User ID "@${cleanUser}" already exists on this device.`);
    }

    const newUser = {
      id: cleanUser,
      username: cleanUser,
      displayName: displayName.trim() || `@${cleanUser}`,
      avatar: avatar || '🔥',
      pin: pin ? pin.trim() : null,
      createdAt: Date.now()
    };

    const updatedAccounts = [...accounts, newUser];
    await saveAllStoredAccounts(updatedAccounts);
    setSavedAccounts(updatedAccounts);

    // Set active session
    await saveStoredActiveSession(newUser.username);
    setActiveUserStorageId(newUser.username);
    setCurrentUser(newUser);

    return newUser;
  };

  // Sign in to an existing ID
  const login = async (username, pin = '') => {
    const cleanUser = username.trim().toLowerCase();
    const accounts = await getAllStoredAccounts();
    const user = accounts.find((a) => a.username.toLowerCase() === cleanUser);

    if (!user) {
      throw new Error(`Account "@${cleanUser}" not found. Please create an account first.`);
    }

    if (user.pin && user.pin !== pin.trim()) {
      throw new Error('Incorrect Security PIN. Please try again.');
    }

    await saveStoredActiveSession(user.username);
    setActiveUserStorageId(user.username);
    setCurrentUser(user);

    return user;
  };

  // Log out of the current account
  const logout = async () => {
    await saveStoredActiveSession(null);
    setActiveUserStorageId('guest');
    setCurrentUser(null);
  };

  // Reset or remove PIN for an account (Forgot Password / PIN recovery)
  const resetPin = async (username, newPin = '') => {
    const cleanUser = username.trim().toLowerCase();
    const accounts = await getAllStoredAccounts();
    const userIndex = accounts.findIndex((a) => a.username.toLowerCase() === cleanUser);

    if (userIndex === -1) {
      throw new Error(`Account "@${cleanUser}" not found on this device.`);
    }

    const updatedUser = {
      ...accounts[userIndex],
      pin: newPin && newPin.trim().length > 0 ? newPin.trim() : null
    };

    const updatedAccounts = [...accounts];
    updatedAccounts[userIndex] = updatedUser;

    await saveAllStoredAccounts(updatedAccounts);
    setSavedAccounts(updatedAccounts);

    // Auto-login into the updated account
    await saveStoredActiveSession(updatedUser.username);
    setActiveUserStorageId(updatedUser.username);
    setCurrentUser(updatedUser);

    return updatedUser;
  };

  // Update or clear PIN for the currently logged in user
  const updatePin = async (newPin = '') => {
    if (!currentUser) return;
    return await resetPin(currentUser.username, newPin);
  };

  // Quick switch profile
  const switchAccount = async (targetUsername) => {
    return await login(targetUsername);
  };

  // Delete an account and its saved session
  const deleteAccount = async (targetUsername) => {
    const accounts = await getAllStoredAccounts();
    const filtered = accounts.filter((a) => a.username.toLowerCase() !== targetUsername.toLowerCase());
    await saveAllStoredAccounts(filtered);
    setSavedAccounts(filtered);

    if (currentUser && currentUser.username.toLowerCase() === targetUsername.toLowerCase()) {
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        savedAccounts,
        isAuthLoading,
        login,
        register,
        logout,
        resetPin,
        updatePin,
        switchAccount,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

