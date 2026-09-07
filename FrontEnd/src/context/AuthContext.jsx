import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  getMe as apiGetMe,
  getStoredToken,
  getStoredUser,
  clearStoredAuth,
  setStoredAuth
} from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const res = await apiGetMe();
          if (res && res.success && res.user) {
            setUser(res.user);
          }
        } catch (err) {
          console.warn('Session expired or server unreachable:', err.message);
          // Keep stored user if offline dev mode
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginUser = async (credentials) => {
    const res = await apiLogin(credentials);
    if (res && res.success) {
      setUser(res.user);
      setToken(res.token);
      setStoredAuth(res.token, res.user);
    }
    return res;
  };

  const registerUser = async (userData) => {
    const res = await apiRegister(userData);
    if (res && res.success) {
      setUser(res.user);
      setToken(res.token);
      setStoredAuth(res.token, res.user);
    }
    return res;
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    clearStoredAuth();
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    role: user ? user.role : null,
    login: loginUser,
    register: registerUser,
    logout: logoutUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
