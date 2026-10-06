import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { dbService } from '../services/db/databaseService';
import { useToast } from '../components/ui/ToastContext';

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchDemoUser: (role: UserRole) => Promise<void>;
  isAdmin: boolean;
  isInstructor: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    async function initUser() {
      try {
        const user = await dbService.getCurrentUser();
        setCurrentUser(user);
      } catch (e) {
        console.error('Failed to load user', e);
      } finally {
        setIsLoading(false);
      }
    }
    initUser();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await dbService.login(email, password);
      if (res.error) {
        toast.error(res.error, 'Authentication Failed');
        return false;
      }
      setCurrentUser(res.user);
      toast.success(`Welcome back, ${res.user.fullName}!`, 'Signed In');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.', 'Error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await dbService.logout();
    setCurrentUser(null);
    toast.info('You have been signed out.', 'Signed Out');
  };

  const switchDemoUser = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const targetEmail =
        role === 'admin'
          ? 'admin@examflow.edu'
          : role === 'instructor'
          ? 'instructor@examflow.edu'
          : 'student@examflow.edu';

      const user = await dbService.login(targetEmail);
      if (user.user) {
        setCurrentUser(user.user);
        toast.success(`Switched to demo role: ${role.toUpperCase()} (${user.user.fullName})`, 'Role Switched');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isInstructor = currentUser?.role === 'instructor';
  const isStudent = currentUser?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout,
        switchDemoUser,
        isAdmin,
        isInstructor,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
