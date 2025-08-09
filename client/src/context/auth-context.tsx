import { createContext, useContext, ReactNode } from "react";
import { User, Operator } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  operator: Operator | null;
  token: string | null;
  userType: 'user' | 'operator' | null;
  login: (userData: any, userType: 'user' | 'operator') => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  value: AuthContextType;
}

export function AuthProvider({ children, value }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
