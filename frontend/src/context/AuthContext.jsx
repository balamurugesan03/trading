import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(() => !!localStorage.getItem('adminToken'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then(({ user: freshUser }) => {
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const { token, user: loggedInUser } = await authService.login(credentials);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (data) => {
    const { token, user: newUser } = await authService.register(data);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsImpersonating(false);
    setUser(null);
  };

  // Admin "Login as Customer": stashes the admin's own session so it can be restored,
  // then swaps in the impersonation token/user without a full page reload.
  const impersonate = (token, targetUser) => {
    const currentToken = localStorage.getItem('token');
    const currentUser = localStorage.getItem('user');
    if (currentToken) localStorage.setItem('adminToken', currentToken);
    if (currentUser) localStorage.setItem('adminUser', currentUser);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(targetUser));
    setIsImpersonating(true);
    setUser(targetUser);
  };

  const returnToAdmin = () => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    if (!adminToken || !adminUser) return;
    localStorage.setItem('token', adminToken);
    localStorage.setItem('user', adminUser);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsImpersonating(false);
    setUser(JSON.parse(adminUser));
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser, isImpersonating, impersonate, returnToAdmin }),
    [user, loading, isImpersonating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
