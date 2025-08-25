import { useState, useEffect } from "react";
import { User, Operator } from "@shared/schema";

export function useAuthState() {
  const [user, setUser] = useState<any>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<'user' | 'operator' | 'admin' | 'merchant' | 'partner' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app start
    const storedToken = localStorage.getItem('paypass_token');
    const storedUser = localStorage.getItem('paypass_user');
    const storedOperator = localStorage.getItem('paypass_operator');
    const storedAdmin = localStorage.getItem('paypass_admin');
    const storedMerchant = localStorage.getItem('paypass_merchant');
    const storedPartner = localStorage.getItem('paypass_partner');
    const storedUserType = localStorage.getItem('paypass_user_type') as 'user' | 'operator' | 'admin' | 'merchant' | 'partner' | null;

    if (storedToken && storedUserType) {
      setToken(storedToken);
      setUserType(storedUserType);
      
      if (storedUserType === 'user' && storedUser) {
        setUser(JSON.parse(storedUser));
      } else if (storedUserType === 'operator' && storedOperator) {
        setOperator(JSON.parse(storedOperator));
      } else if (storedUserType === 'admin' && storedAdmin) {
        setUser(JSON.parse(storedAdmin));
      } else if (storedUserType === 'merchant' && storedMerchant) {
        setUser(JSON.parse(storedMerchant));
      } else if (storedUserType === 'partner' && storedPartner) {
        setUser(JSON.parse(storedPartner));
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData: any, type: 'user' | 'operator' | 'admin' | 'merchant' | 'partner') => {
    setToken(userData.token);
    setUserType(type);
    
    // Clear all stored user data first
    localStorage.removeItem('paypass_user');
    localStorage.removeItem('paypass_operator');
    localStorage.removeItem('paypass_admin');
    localStorage.removeItem('paypass_merchant');
    localStorage.removeItem('paypass_partner');
    
    if (type === 'user') {
      setUser(userData.user);
      setOperator(null);
      localStorage.setItem('paypass_user', JSON.stringify(userData.user));
    } else if (type === 'operator') {
      setOperator(userData.operator);
      setUser(null);
      localStorage.setItem('paypass_operator', JSON.stringify(userData.operator));
    } else if (type === 'admin') {
      setUser(userData.admin);
      setOperator(null);
      localStorage.setItem('paypass_admin', JSON.stringify(userData.admin));
    } else if (type === 'merchant') {
      setUser(userData.merchant);
      setOperator(null);
      localStorage.setItem('paypass_merchant', JSON.stringify(userData.merchant));
    } else if (type === 'partner') {
      setUser(userData.partner);
      setOperator(null);
      localStorage.setItem('paypass_partner', JSON.stringify(userData.partner));
    }
    
    localStorage.setItem('paypass_token', userData.token);
    localStorage.setItem('paypass_user_type', type);
  };

  const logout = () => {
    setUser(null);
    setOperator(null);
    setToken(null);
    setUserType(null);
    localStorage.removeItem('paypass_token');
    localStorage.removeItem('paypass_user');
    localStorage.removeItem('paypass_operator');
    localStorage.removeItem('paypass_admin');
    localStorage.removeItem('paypass_merchant');
    localStorage.removeItem('paypass_partner');
    localStorage.removeItem('paypass_user_type');
  };

  return {
    user,
    operator,
    token,
    userType,
    login,
    logout,
    isLoading
  };
}
