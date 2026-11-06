import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { dbService } from '../services/db/databaseService';
import { useToast } from '../components/ui/ToastContext';
import { getStoredToken } from '../lib/jwt';
import { JwtTokenModal } from '../components/auth/JwtTokenModal';

interface AuthContextType {
  currentUser: UserProfile | null;
  jwtToken: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchDemoUser: (role: UserRole) => Promise<void>;
  openJwtModal: () => void;
  closeJwtModal: () => void;
  isAdmin: boolean;
  isInstructor: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(getStoredToken());
  const [isJwtModalOpen, setIsJwtModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    async function initUser() {
      try {
        const user = await dbService.getCurrentUser();
        setCurrentUser(user);
        setJwtToken(getStoredToken());
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
        toast.error(res.error, 'Authentication Blocked');
        return false;
      }
      setCurrentUser(res.user);
      const token = res.token || getStoredToken();
      setJwtToken(token);
      toast.success(`Welcome back, ${res.user.fullName}!`, 'Signed In (JWT Active)');
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
    setJwtToken(null);
    toast.info('You have been signed out. JWT revoked.', 'Signed Out');
  };

  const switchDemoUser = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const targetEmail =
        role === 'admin'
          ? 'admin@examflow.edu'
          : role === 'instructor'
          ? 'instructor@examflow.edu'
          : 'surendra@examflow.edu';

      const user = await dbService.login(targetEmail);
      if (user.user) {
        setCurrentUser(user.user);
        setJwtToken(user.token || getStoredToken());
        toast.success(`Switched to demo role: ${role.toUpperCase()} (${user.user.fullName})`, 'Role Switched');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openJwtModal = () => setIsJwtModalOpen(true);
  const closeJwtModal = () => setIsJwtModalOpen(false);

  const isAdmin = currentUser?.role === 'admin';
  const isInstructor = currentUser?.role === 'instructor';
  const isStudent = currentUser?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        jwtToken,
        isLoading,
        login,
        logout,
        switchDemoUser,
        openJwtModal,
        closeJwtModal,
        isAdmin,
        isInstructor,
        isStudent,
      }}
    >
      {children}
      <JwtTokenModal
        isOpen={isJwtModalOpen}
        onClose={closeJwtModal}
        token={jwtToken}
      />
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
