import { useState, useEffect } from "react";
import { User, Operator } from "@shared/schema";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userType, setUserType] = useState<'user' | 'operator' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app start
    const storedToken = localStorage.getItem('paypass_token');
    const storedUser = localStorage.getItem('paypass_user');
    const storedOperator = localStorage.getItem('paypass_operator');
    const storedUserType = localStorage.getItem('paypass_user_type') as 'user' | 'operator' | null;

    if (storedToken && storedUserType) {
      setToken(storedToken);
      setUserType(storedUserType);
      
      if (storedUserType === 'user' && storedUser) {
        setUser(JSON.parse(storedUser));
      } else if (storedUserType === 'operator' && storedOperator) {
        setOperator(JSON.parse(storedOperator));
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData: any, type: 'user' | 'operator') => {
    setToken(userData.token);
    setUserType(type);
    
    if (type === 'user') {
      setUser(userData.user);
      setOperator(null);
      localStorage.setItem('paypass_user', JSON.stringify(userData.user));
      localStorage.removeItem('paypass_operator');
    } else {
      setOperator(userData.operator);
      setUser(null);
      localStorage.setItem('paypass_operator', JSON.stringify(userData.operator));
      localStorage.removeItem('paypass_user');
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
