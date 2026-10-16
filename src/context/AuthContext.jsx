import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredToken,
  setStoredToken,
  apiGetMe,
  apiVerifyOtp,
  apiUpdateProfile,
  apiLogout,
  apiGetMyPurchases,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasedRecipeIds, setPurchasedRecipeIds] = useState(new Set());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('');

  // Fetch user's purchased recipes
  const refreshPurchases = useCallback(async () => {
    try {
      const data = await apiGetMyPurchases();
      if (data.success && data.purchases) {
        const idSet = new Set(data.purchases.map(p => p.recipe_id));
        setPurchasedRecipeIds(idSet);
      }
    } catch (err) {
      // Unauthenticated or error
      setPurchasedRecipeIds(new Set());
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiGetMe();
        if (data.success && data.user) {
          setUser(data.user);
          await refreshPurchases();
        } else {
          setStoredToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [refreshPurchases]);

  // Login via verified OTP
  const loginWithOtp = async (identifier, otp, type) => {
    const data = await apiVerifyOtp(identifier, otp, type);
    if (data.success && data.token && data.user) {
      setStoredToken(data.token);
      setUser(data.user);
      await refreshPurchases();
      setAuthModalOpen(false);
      return data.user;
    }
    throw new Error(data.error || 'Verification failed');
  };

  // Update profile name
  const updateDisplayName = async (name) => {
    const data = await apiUpdateProfile(name);
    if (data.success && data.user) {
      setUser(data.user);
      return data.user;
    }
    throw new Error(data.error || 'Failed to update name');
  };

  // Logout
  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
    setPurchasedRecipeIds(new Set());
  };

  const openAuthModal = (reason = '') => {
    setAuthModalReason(reason);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthModalReason('');
  };

  const isRecipeUnlocked = useCallback(
    (recipe) => {
      if (!recipe) return false;
      if (!recipe.isPremium && recipe.price === 0) return true;
      return purchasedRecipeIds.has(recipe.id);
    },
    [purchasedRecipeIds]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        purchasedRecipeIds,
        refreshPurchases,
        loginWithOtp,
        updateDisplayName,
        logout,
        authModalOpen,
        authModalReason,
        openAuthModal,
        closeAuthModal,
        isRecipeUnlocked,
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
