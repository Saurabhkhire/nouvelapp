import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken, getToken } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [focusAreas, setFocusAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load the current session from the backend using the stored JWT.
  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setProfile(null);
      setFocusAreas([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api('/me');
      setUser(data.user);
      setProfile(data.profile || null);
      setFocusAreas(data.focusAreas || []);
    } catch {
      // token invalid/expired — clear it and fall back to logged-out state
      clearToken();
      setUser(null);
      setProfile(null);
      setFocusAreas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function signup(payload) {
    const res = await api('/auth/signup', { method: 'POST', body: payload });
    setToken(res.token);
    setUser(res.user);
    return res;
  }

  async function login(payload) {
    const res = await api('/auth/login', { method: 'POST', body: payload });
    setToken(res.token);
    setUser(res.user);
    await refresh();
    return res;
  }

  function logout() {
    clearToken();
    setUser(null);
    setProfile(null);
    setFocusAreas([]);
  }

  // Permanently delete the account and all data on the server.
  async function deleteAccount() {
    await api('/account', { method: 'DELETE' });
    logout();
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, focusAreas, loading, signup, login, logout, deleteAccount, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}
