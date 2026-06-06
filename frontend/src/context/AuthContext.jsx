import { createContext, useContext, useEffect, useState } from 'react';
import { offlineService } from '../services/offline.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  function refresh() {
    const savedUser = offlineService.getUser();
    const savedProfile = offlineService.getProfile();
    setUser(savedUser);
    setProfile(savedProfile);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function signup(payload) {
    const newUser = {
      id: Date.now(),
      name: payload.name,
      email: payload.email,
      created_at: new Date().toISOString(),
      assessmentCompleted: false,
    };
    offlineService.setUser(newUser);
    setUser(newUser);
    return Promise.resolve({ user: newUser, token: 'offline-token' });
  }

  function login(payload) {
    // In offline mode, just check if user exists by email
    const savedUser = offlineService.getUser();
    if (savedUser && savedUser.email === payload.email) {
      setUser(savedUser);
      return Promise.resolve({
        user: savedUser,
        token: 'offline-token',
        assessmentCompleted: savedUser.assessmentCompleted || false,
      });
    }
    return Promise.reject(new Error('User not found. Please sign up first.'));
  }

  function logout() {
    offlineService.clearUser();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}