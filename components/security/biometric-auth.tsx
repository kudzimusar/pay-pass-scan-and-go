"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Fingerprint, 
  Eye, 
  Smartphone, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  Lock,
  Unlock,
  Camera,
  Scan
} from 'lucide-react';

interface BiometricAuthProps {
  onAuthSuccess?: (authMethod: string) => void;
  onAuthFailure?: (error: string) => void;
  requiredMethods?: string[];
  fallbackEnabled?: boolean;
}

interface BiometricCapability {
  type: 'fingerprint' | 'faceId' | 'voiceId' | 'retinal' | 'palm';
  name: string;
  icon: React.ReactNode;
  available: boolean;
  enrolled: boolean;
  accuracy: number;
  description: string;
}

interface AuthAttempt {
  id: string;
  method: string;
  timestamp: Date;
  success: boolean;
  confidence: number;
  deviceInfo: string;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onAuthSuccess,
  onAuthFailure,
  requiredMethods = ['fingerprint'],
  fallbackEnabled = true
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [selectedMethod, setSelectedMethod] = useState<string>('fingerprint');
  const [attempts, setAttempts] = useState<AuthAttempt[]>([]);
  const [deviceCapabilities, setDeviceCapabilities] = useState<BiometricCapability[]>([]);

  // Mock biometric capabilities - in production, these would be detected from the device
  const mockCapabilities: BiometricCapability[] = [
    {
      type: 'fingerprint',
      name: 'Fingerprint',
      icon: <Fingerprint className="h-6 w-6" />,
      available: true,
      enrolled: true, // Security Method Enrollment
      accuracy: 99.2, // Authentication Accuracy Tracking
      description: 'Touch sensor authentication'
    },
    {
      type: 'faceId',
      name: 'Face ID',
      icon: <Camera className="h-6 w-6" />,
      available: true,
      enrolled: true,
      accuracy: 97.8,
      description: 'Facial recognition authentication'
    },
    {
      type: 'voiceId',
      name: 'Voice ID',
      icon: <Smartphone className="h-6 w-6" />,
      available: true,
      enrolled: false,
      accuracy: 94.5,
      description: 'Voice pattern authentication'
    },
    {
      type: 'retinal',
      name: 'Retinal Scan',
      icon: <Eye className="h-6 w-6" />,
      available: false,
      enrolled: false,
      accuracy: 99.9,
      description: 'Eye retina pattern authentication'
    },
    {
      type: 'palm',
      name: 'Palm Print',
      icon: <Scan className="h-6 w-6" />,
      available: false,
      enrolled: false,
      accuracy: 98.1,
      description: 'Palm vein pattern authentication'
    }
  ];

  useEffect(() => {
    // Simulate device capability detection
    setDeviceCapabilities(mockCapabilities);
  }, []);

  const handleBiometricAuth = useCallback(async (method: string) => {
    setIsAuthenticating(true);
    setAuthStatus('scanning');
    setSelectedMethod(method);

    try {
      // Simulate biometric authentication process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure (90% success rate)
      const success = Math.random() > 0.1;
      const confidence = success ? 85 + Math.random() * 15 : Math.random() * 50;
      
      const attempt: AuthAttempt = {
        id: Date.now().toString(),
        method,
        timestamp: new Date(),
        success,
        confidence,
        deviceInfo: navigator.userAgent.split(' ')[0]
      };

      setAttempts(prev => [attempt, ...prev.slice(0, 9)]); // Keep last 10 attempts

      if (success) {
        setAuthStatus('success');
        onAuthSuccess?.(method);
      } else {
        setAuthStatus('failed');
        onAuthFailure?.('Biometric authentication failed');
      }
    } catch (error) {
      setAuthStatus('failed');
      onAuthFailure?.('Authentication error occurred');
    } finally {
      setIsAuthenticating(false);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setAuthStatus('idle');
      }, 3000);
    }
  }, [onAuthSuccess, onAuthFailure]);

  const getMethodIcon = (method: string) => {
    const capability = deviceCapabilities.find(cap => cap.type === method);
    return capability?.icon || <Shield className="h-6 w-6" />;
  };

  const getStatusIcon = () => {
    switch (authStatus) {
      case 'scanning':
        return <Clock className="h-6 w-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Lock className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (authStatus) {
      case 'scanning':
        return `Scanning ${selectedMethod}...`;
      case 'success':
        return 'Authentication successful!';
      case 'failed':
        return 'Authentication failed. Please try again.';
      default:
        return 'Ready for biometric authentication';
    }
  };

  const availableMethods = deviceCapabilities.filter(cap => cap.available && cap.enrolled);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Secure access using your unique biological features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Authentication Status */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              {getStatusIcon()}
            </div>
            <h3 className="text-lg font-medium mb-2">{getStatusMessage()}</h3>
            {authStatus === 'scanning' && (
              <p className="text-sm text-gray-500">
                Please position your {selectedMethod} on the sensor
              </p>
            )}
          </div>

          {/* Available Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {availableMethods.map((capability) => (
              <div
                key={capability.type}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedMethod === capability.type 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMethod(capability.type)}
              >
                <div className="flex items-center gap-3 mb-2">
                  {capability.icon}
                  <div>
                    <h4 className="font-medium">{capability.name}</h4>
                    <p className="text-sm text-gray-500">{capability.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={capability.enrolled ? 'outline' : 'secondary'}>
                    {capability.accuracy}% accuracy
                  </Badge>
                  {capability.enrolled && (
                    <Badge variant="outline" className="text-green-600">
                      Enrolled
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => handleBiometricAuth(selectedMethod)}
              disabled={isAuthenticating || !availableMethods.some(m => m.type === selectedMethod)}
              className="flex-1"
            >
              {isAuthenticating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  {getMethodIcon(selectedMethod)}
                  <span className="ml-2">Authenticate with {selectedMethod}</span>
                </>
              )}
            </Button>
            
            {fallbackEnabled && (
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Fallback Options
              </Button>
            )}
          </div>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your biometric data is processed locally on your device and never stored on our servers. 
              This ensures maximum privacy and security for your authentication.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Device Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Device Security Capabilities</CardTitle>
          <CardDescription>
            Available biometric authentication methods on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deviceCapabilities.map((capability) => (
              <div key={capability.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {capability.icon}
                  <div>
                    <div className="font-medium">{capability.name}</div>
                    <div className="text-sm text-gray-500">{capability.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={capability.available ? 'outline' : 'secondary'}>
                    {capability.available ? 'Available' : 'Not Available'}
                  </Badge>
                  {capability.available && (
                    <Badge variant={capability.enrolled ? 'outline' : 'destructive'}>
                      {capability.enrolled ? 'Enrolled' : 'Not Enrolled'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Authentication Attempts */}
      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Authentication Attempts</CardTitle>
            <CardDescription>
              History of biometric authentication attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {attempt.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium capitalize">{attempt.method}</div>
                      <div className="text-sm text-gray-500">
                        {attempt.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {attempt.confidence.toFixed(1)}% confidence
                    </div>
                    <div className="text-xs text-gray-500">{attempt.deviceInfo}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BiometricAuth;
