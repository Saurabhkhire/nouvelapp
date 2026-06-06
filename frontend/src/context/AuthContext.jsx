import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await api('/me');
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      clearToken();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function signup(payload) {
    const data = await api('/auth/signup', { method: 'POST', body: payload });
    setToken(data.token);
    setUser(data.user);
    await refresh();
    return data;
  }

  async function login(payload) {
    const data = await api('/auth/login', { method: 'POST', body: payload });
    setToken(data.token);
    setUser(data.user);
    await refresh();
    return data;
  }

  function logout() {
    clearToken();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
