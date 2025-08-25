'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  EyeOff, 
  Clock, 
  MapPin, 
  DollarSign,
  User,
  Smartphone,
  Activity
} from 'lucide-react';

interface FraudAlertProps {
  alert: {
    id: string;
    transactionId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    timestamp: string;
    status: 'open' | 'investigating' | 'resolved' | 'false_positive';
    details: {
      amount?: number;
      currency?: string;
      location?: string;
      device?: string;
      user?: string;
      patterns?: string[];
    };
  };
  onAction?: (action: string, alertId: string) => void;
}

export default function FraudAlert({ alert, onAction }: FraudAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'false_positive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'amount_anomaly':
        return <DollarSign className="h-4 w-4" />;
      case 'location_anomaly':
        return <MapPin className="h-4 w-4" />;
      case 'time_anomaly':
        return <Clock className="h-4 w-4" />;
      case 'device_anomaly':
        return <Smartphone className="h-4 w-4" />;
      case 'behavioral_anomaly':
        return <Activity className="h-4 w-4" />;
      case 'user_anomaly':
        return <User className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, alert.id);
    }
  };

  return (
    <Card className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' : 
                     alert.severity === 'high' ? 'border-l-orange-500' :
                     alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
              {getTypeIcon(alert.type)}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {alert.type.replace('_', ' ').toUpperCase()}
                <Badge className={getSeverityColor(alert.severity)}>
                  {alert.severity.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span>ID: {alert.transactionId}</span>
                <span>•</span>
                <span>{new Date(alert.timestamp).toLocaleString()}</span>
                <span>•</span>
                <Badge variant="outline" className={getStatusColor(alert.status)}>
                  {alert.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1"
          >
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fraud Alert</AlertTitle>
          <AlertDescription>
            {alert.description}
          </AlertDescription>
        </Alert>

        {isExpanded && (
          <div className="space-y-4">
            {/* Alert Details */}
            <div className="grid grid-cols-2 gap-4">
              {alert.details.amount && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-sm">
                    {alert.details.currency} {alert.details.amount.toLocaleString()}
                  </p>
                </div>
              )}
              {alert.details.location && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-sm">{alert.details.location}</p>
                </div>
              )}
              {alert.details.device && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Device</label>
                  <p className="text-sm">{alert.details.device}</p>
                </div>
              )}
              {alert.details.user && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">User</label>
                  <p className="text-sm">{alert.details.user}</p>
                </div>
              )}
            </div>

            {/* Patterns */}
            {alert.details.patterns && alert.details.patterns.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Detected Patterns</label>
                <div className="flex flex-wrap gap-2">
                  {alert.details.patterns.map((pattern, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {alert.status === 'open' && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction('block')}
                    className="flex-1"
                  >
                    Block Transaction
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAction('investigate')}
                    className="flex-1"
                  >
                    Investigate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('false_positive')}
                    className="flex-1"
                  >
                    Mark as False Positive
                  </Button>
                </>
              )}
              {alert.status === 'investigating' && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction('block')}
                    className="flex-1"
                  >
                    Block Transaction
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAction('resolve')}
                    className="flex-1"
                  >
                    Resolve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('false_positive')}
                    className="flex-1"
                  >
                    Mark as False Positive
                  </Button>
                </>
              )}
              {alert.status === 'resolved' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('reopen')}
                  className="flex-1"
                >
                  Reopen Investigation
                </Button>
              )}
              {alert.status === 'false_positive' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('reopen')}
                  className="flex-1"
                >
                  Reopen Investigation
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('view_details')}
                className="flex-1"
              >
                View Full Details
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions (always visible) */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('view_transaction')}
            className="flex-1"
          >
            View Transaction
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('view_user')}
            className="flex-1"
          >
            View User Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('similar_alerts')}
            className="flex-1"
          >
            Similar Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}