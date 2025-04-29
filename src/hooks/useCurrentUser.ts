/**
 * Hook to access the currently logged-in user
 */

import { useState, useEffect } from 'react';

interface User {
  pubkey: string;
  name?: string;
  picture?: string;
}

export function useCurrentUser() {
  // In a real implementation, this would fetch from localStorage or the Nostr provider
  const [user, setUser] = useState<User | null>(null);
  
  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('knowtation:currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user', err);
        localStorage.removeItem('knowtation:currentUser');
      }
    }
  }, []);
  
  // Functions to login/logout
  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('knowtation:currentUser', JSON.stringify(newUser));
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('knowtation:currentUser');
  };

  return {
    user,
    login,
    logout,
  };
}