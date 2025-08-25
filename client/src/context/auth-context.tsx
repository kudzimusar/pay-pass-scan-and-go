import { createContext, useContext, ReactNode } from "react";
import { User, Operator } from "@shared/schema";

interface Admin {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Merchant {
  id: string;
  businessName: string;
  phone: string;
  email: string;
  businessType: string;
  licenseNumber: string;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Partner {
  id: string;
  companyName: string;
  phone: string;
  email: string;
  partnerType: string;
  integrationKey: string;
  totalTransactions: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | Admin | Merchant | Partner | null;
  operator: Operator | null;
  token: string | null;
  userType: 'user' | 'operator' | 'admin' | 'merchant' | 'partner' | null;
  login: (userData: any, userType: 'user' | 'operator' | 'admin' | 'merchant' | 'partner') => void;
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
