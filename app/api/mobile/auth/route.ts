import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mobile Authentication API - Optimized for mobile app usage
// Handles login, registration, token refresh, and device management

const mobileLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceId: z.string(),
  deviceName: z.string(),
  deviceType: z.enum(['ios', 'android']),
  appVersion: z.string(),
  fcmToken: z.string().optional(), // For push notifications
  biometricEnabled: z.boolean().optional(),
  fingerprint: z.string().optional() // Device fingerprint for security
});

const mobileRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phoneNumber: z.string().min(10),
  dateOfBirth: z.string(),
  deviceId: z.string(),
  deviceName: z.string(),
  deviceType: z.enum(['ios', 'android']),
  appVersion: z.string(),
  fcmToken: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, "Must accept terms"),
  acceptPrivacy: z.boolean().refine(val => val === true, "Must accept privacy policy")
});

const tokenRefreshSchema = z.object({
  refreshToken: z.string(),
  deviceId: z.string()
});

const biometricSetupSchema = z.object({
  userId: z.string(),
  biometricType: z.enum(['fingerprint', 'face', 'voice']),
  enabled: z.boolean(),
  deviceId: z.string()
});

// Mock user database - in production, use real database
const mockUsers = new Map();
const mockDevices = new Map();
const mockTokens = new Map();

// Generate JWT tokens
const generateTokens = (userId: string, deviceId: string) => {
  const accessToken = jwt.sign(
    { 
      userId, 
      deviceId, 
      type: 'access',
      platform: 'mobile'
    },
    process.env.JWT_SECRET || 'mobile-secret',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { 
      userId, 
      deviceId, 
      type: 'refresh',
      platform: 'mobile'
    },
    process.env.JWT_REFRESH_SECRET || 'mobile-refresh-secret',
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// POST /api/mobile/auth - Mobile Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'login':
        return handleLogin(body);
      case 'register':
        return handleRegister(body);
      case 'refresh':
        return handleTokenRefresh(body);
      case 'biometric_setup':
        return handleBiometricSetup(body);
      case 'logout':
        return handleLogout(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Mobile auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

async function handleLogin(body: any) {
  const validation = mobileLoginSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid login data',
        details: validation.error.errors
      },
      { status: 400 }
    );
  }

  const { email, password, deviceId, deviceName, deviceType, appVersion, fcmToken, fingerprint } = validation.data;

  // Check if user exists
  const existingUser = Array.from(mockUsers.values()).find((user: any) => user.email === email);
  
  if (!existingUser) {
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Verify password
  const passwordValid = await bcrypt.compare(password, existingUser.password);
  if (!passwordValid) {
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Check for suspicious device
  const deviceKey = `${existingUser.id}-${deviceId}`;
  let deviceInfo = mockDevices.get(deviceKey);
  
  const isNewDevice = !deviceInfo;
  const requiresVerification = isNewDevice || (fingerprint && deviceInfo?.fingerprint !== fingerprint);

  // Update or create device record
  deviceInfo = {
    userId: existingUser.id,
    deviceId,
    deviceName,
    deviceType,
    appVersion,
    fcmToken,
    fingerprint,
    firstSeen: deviceInfo?.firstSeen || new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    trusted: deviceInfo?.trusted || !isNewDevice,
    loginCount: (deviceInfo?.loginCount || 0) + 1
  };
  mockDevices.set(deviceKey, deviceInfo);

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(existingUser.id, deviceId);
  
  // Store refresh token
  mockTokens.set(refreshToken, {
    userId: existingUser.id,
    deviceId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Prepare user data for mobile (exclude sensitive info)
  const userData = {
    id: existingUser.id,
    email: existingUser.email,
    firstName: existingUser.firstName,
    lastName: existingUser.lastName,
    phoneNumber: existingUser.phoneNumber,
    profileImage: existingUser.profileImage,
    preferences: existingUser.preferences || {
      language: 'en',
      currency: 'USD',
      notifications: true,
      biometricAuth: existingUser.biometricEnabled || false
    },
    wallet: {
      id: existingUser.walletId,
      balance: existingUser.balance || 0,
      currency: existingUser.currency || 'USD'
    },
    verification: {
      email: existingUser.emailVerified || false,
      phone: existingUser.phoneVerified || false,
      identity: existingUser.identityVerified || false
    },
    permissions: existingUser.permissions || ['send', 'receive', 'pay_bills']
  };

  const response = {
    success: true,
    data: {
      user: userData,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900 // 15 minutes
      },
      device: {
        id: deviceId,
        trusted: deviceInfo.trusted,
        requiresVerification
      },
      features: {
        biometricAuth: true,
        pushNotifications: true,
        qrPayments: true,
        nfcPayments: deviceType === 'android',
        crossBorderPayments: true,
        billPayments: true,
        topUp: true
      }
    }
  };

  // If new device, include security notice
  if (isNewDevice) {
    response.data.securityNotice = {
      type: 'new_device',
      message: 'Login from new device detected. Please verify your identity.',
      actions: ['verify_email', 'verify_phone']
    };
  }

  return NextResponse.json(response);
}

async function handleRegister(body: any) {
  const validation = mobileRegisterSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid registration data',
        details: validation.error.errors
      },
      { status: 400 }
    );
  }

  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    phoneNumber, 
    dateOfBirth,
    deviceId,
    deviceName,
    deviceType,
    appVersion,
    fcmToken
  } = validation.data;

  // Check if user already exists
  const existingUser = Array.from(mockUsers.values()).find((user: any) => 
    user.email === email || user.phoneNumber === phoneNumber
  );
  
  if (existingUser) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'User already exists with this email or phone number' 
      },
      { status: 409 }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    walletId,
    balance: 0,
    currency: 'USD',
    emailVerified: false,
    phoneVerified: false,
    identityVerified: false,
    createdAt: new Date().toISOString(),
    preferences: {
      language: 'en',
      currency: 'USD',
      notifications: true,
      biometricAuth: false
    },
    permissions: ['send', 'receive', 'pay_bills']
  };
  
  mockUsers.set(userId, newUser);

  // Register device
  const deviceKey = `${userId}-${deviceId}`;
  mockDevices.set(deviceKey, {
    userId,
    deviceId,
    deviceName,
    deviceType,
    appVersion,
    fcmToken,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    trusted: true, // First device is trusted
    loginCount: 1
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(userId, deviceId);
  
  // Store refresh token
  mockTokens.set(refreshToken, {
    userId,
    deviceId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Prepare response data
  const userData = {
    id: userId,
    email,
    firstName,
    lastName,
    phoneNumber,
    preferences: newUser.preferences,
    wallet: {
      id: walletId,
      balance: 0,
      currency: 'USD'
    },
    verification: {
      email: false,
      phone: false,
      identity: false
    },
    permissions: newUser.permissions
  };

  return NextResponse.json({
    success: true,
    data: {
      user: userData,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900
      },
      device: {
        id: deviceId,
        trusted: true,
        requiresVerification: false
      },
      onboarding: {
        steps: [
          { id: 'verify_email', title: 'Verify Email', required: true, completed: false },
          { id: 'verify_phone', title: 'Verify Phone', required: true, completed: false },
          { id: 'setup_security', title: 'Setup Security', required: false, completed: false },
          { id: 'add_funds', title: 'Add Funds', required: false, completed: false }
        ],
        currentStep: 'verify_email'
      },
      features: {
        biometricAuth: true,
        pushNotifications: true,
        qrPayments: true,
        nfcPayments: deviceType === 'android',
        crossBorderPayments: false, // Enabled after verification
        billPayments: true,
        topUp: true
      }
    }
  });
}

async function handleTokenRefresh(body: any) {
  const validation = tokenRefreshSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid refresh token data' },
      { status: 400 }
    );
  }

  const { refreshToken, deviceId } = validation.data;

  // Check if refresh token exists and is valid
  const tokenData = mockTokens.get(refreshToken);
  if (!tokenData) {
    return NextResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 }
    );
  }

  // Check if token is expired
  if (new Date(tokenData.expiresAt) < new Date()) {
    mockTokens.delete(refreshToken);
    return NextResponse.json(
      { success: false, error: 'Refresh token expired' },
      { status: 401 }
    );
  }

  // Verify device matches
  if (tokenData.deviceId !== deviceId) {
    return NextResponse.json(
      { success: false, error: 'Device mismatch' },
      { status: 401 }
    );
  }

  // Verify JWT token
  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'mobile-refresh-secret');
  } catch (error) {
    mockTokens.delete(refreshToken);
    return NextResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 }
    );
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenData.userId, deviceId);
  
  // Remove old refresh token and store new one
  mockTokens.delete(refreshToken);
  mockTokens.set(newRefreshToken, {
    userId: tokenData.userId,
    deviceId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  return NextResponse.json({
    success: true,
    data: {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900
      }
    }
  });
}

async function handleBiometricSetup(body: any) {
  const validation = biometricSetupSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid biometric setup data' },
      { status: 400 }
    );
  }

  const { userId, biometricType, enabled, deviceId } = validation.data;

  // Update user biometric settings
  const user = mockUsers.get(userId);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );
  }

  user.biometricEnabled = enabled;
  user.biometricType = enabled ? biometricType : null;
  mockUsers.set(userId, user);

  // Update device settings
  const deviceKey = `${userId}-${deviceId}`;
  const device = mockDevices.get(deviceKey);
  if (device) {
    device.biometricEnabled = enabled;
    device.biometricType = biometricType;
    mockDevices.set(deviceKey, device);
  }

  return NextResponse.json({
    success: true,
    data: {
      biometricEnabled: enabled,
      biometricType: enabled ? biometricType : null,
      message: enabled ? 
        `${biometricType} authentication enabled successfully` : 
        'Biometric authentication disabled'
    }
  });
}

async function handleLogout(body: any) {
  const { refreshToken, deviceId } = body;

  if (refreshToken) {
    // Remove refresh token
    mockTokens.delete(refreshToken);
  }

  if (deviceId) {
    // Update device last seen
    Array.from(mockDevices.entries()).forEach(([key, device]: [string, any]) => {
      if (device.deviceId === deviceId) {
        device.lastSeen = new Date().toISOString();
        mockDevices.set(key, device);
      }
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}

// GET /api/mobile/auth - Get authentication status
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mobile-secret') as any;
      
      if (decoded.platform !== 'mobile') {
        return NextResponse.json(
          { success: false, error: 'Invalid token platform' },
          { status: 401 }
        );
      }

      const user = mockUsers.get(decoded.userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const deviceKey = `${decoded.userId}-${decoded.deviceId}`;
      const device = mockDevices.get(deviceKey);

      return NextResponse.json({
        success: true,
        data: {
          userId: decoded.userId,
          deviceId: decoded.deviceId,
          tokenType: decoded.type,
          tokenValid: true,
          deviceTrusted: device?.trusted || false,
          expiresAt: new Date(decoded.exp * 1000).toISOString()
        }
      });
      
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
