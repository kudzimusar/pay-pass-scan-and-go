import { apiRequestWithFallback } from "./api-with-fallback";

export async function loginUser(phone: string, pin: string) {
  const response = await apiRequestWithFallback('POST', '/api/auth/login', { phone, pin });
  return response.json();
}

export async function registerUser(userData: {
  fullName: string;
  phone: string;
  email: string;
  pin: string;
  biometricEnabled?: boolean;
}) {
  const response = await apiRequestWithFallback('POST', '/api/auth/register', userData);
  return response.json();
}

export async function loginOperator(phone: string, pin: string) {
  const response = await apiRequestWithFallback('POST', '/api/auth/operator/login', { phone, pin });
  return response.json();
}

export async function registerOperator(operatorData: {
  companyName: string;
  phone: string;
  email: string;
  pin: string;
}) {
  const response = await apiRequestWithFallback('POST', '/api/auth/operator/register', operatorData);
  return response.json();
}
