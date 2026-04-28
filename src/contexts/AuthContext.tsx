import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            setUser(data.user);
          }
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (e) {
        console.error('Auth verification failed', e);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      console.error(`Auth request failed with status: ${res.status}`);
      let message = 'Operation failed';
      try {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const error = JSON.parse(text);
          message = error.message || message;
        } else {
          message = `Server error (${res.status})`;
        }
      } catch (e) {
        // Not JSON
      }
      throw new Error(message);
    }

    const data = await res.json();
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName })
    });
    
    if (!res.ok) {
      console.error(`Signup request failed with status: ${res.status}`);
      let message = 'Signup failed';
      try {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const error = JSON.parse(text);
          message = error.message || message;
        } else {
          message = `Server error (${res.status})`;
        }
      } catch (e) {
        // Not JSON
      }
      throw new Error(message);
    }

    const data = await res.json();
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
