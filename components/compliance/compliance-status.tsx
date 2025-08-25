'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Shield,
  User,
  MapPin,
  Briefcase,
  Upload,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface ComplianceStatusProps {
  userId: string;
  status: {
    overall: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_review';
    kycStatus: 'not_started' | 'in_progress' | 'pending_review' | 'approved' | 'rejected';
    amlStatus: 'not_started' | 'in_progress' | 'approved' | 'flagged';
    documentsStatus: 'not_uploaded' | 'uploaded' | 'verified' | 'rejected';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    lastUpdated: string;
    expiryDate?: string;
  };
  details: {
    kycProgress: number;
    documentsUploaded: number;
    totalDocuments: number;
    completionPercentage: number;
  };
  onRefresh: () => void;
  onStartKYC: () => void;
  onUploadDocuments: () => void;
  onViewDetails: (type: string) => void;
}

export function ComplianceStatus({ 
  userId, 
  status, 
  details, 
  onRefresh, 
  onStartKYC, 
  onUploadDocuments, 
  onViewDetails 
}: ComplianceStatusProps) {
  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_review':
      case 'requires_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'flagged': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending_review':
      case 'requires_review': return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'flagged': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOverallStatusMessage = () => {
    switch (status.overall) {
      case 'approved':
        return {
          title: 'Compliance Approved',
          message: 'Your account is fully verified and compliant.',
          color: 'text-green-700'
        };
      case 'rejected':
        return {
          title: 'Compliance Rejected',
          message: 'Your verification was rejected. Please review the requirements and resubmit.',
          color: 'text-red-700'
        };
      case 'requires_review':
        return {
          title: 'Manual Review Required',
          message: 'Your application requires additional review by our compliance team.',
          color: 'text-yellow-700'
        };
      case 'in_progress':
        return {
          title: 'Verification in Progress',
          message: 'We are currently reviewing your submitted information.',
          color: 'text-blue-700'
        };
      default:
        return {
          title: 'Verification Pending',
          message: 'Please complete your KYC verification to unlock all features.',
          color: 'text-gray-700'
        };
    }
  };

  const statusMessage = getOverallStatusMessage();

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Compliance Status
            </div>
            <Badge className={getStatusColor(status.overall)}>
              {status.overall.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Last updated: {new Date(status.lastUpdated).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {getStatusIcon(status.overall)}
              <div>
                <h3 className={`font-semibold ${statusMessage.color}`}>{statusMessage.title}</h3>
                <p className="text-gray-600">{statusMessage.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">{details.completionPercentage}%</span>
                </div>
                <Progress value={details.completionPercentage} className="w-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Level</span>
                <Badge className={getRiskLevelColor(status.riskLevel)}>
                  {status.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            {status.expiryDate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Verification expires on {new Date(status.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KYC Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            KYC Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.kycStatus)}
              <span className="font-medium capitalize">
                {status.kycStatus.replace('_', ' ')}
              </span>
            </div>
            <Badge className={getStatusColor(status.kycStatus)}>
              {status.kycStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Personal Information</span>
              {details.kycProgress > 20 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Address Verification</span>
              {details.kycProgress > 40 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Identity Documents</span>
              {details.kycProgress > 60 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Employment Information</span>
              {details.kycProgress > 80 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex gap-2">
              {status.kycStatus === 'not_started' && (
                <Button onClick={onStartKYC} className="flex-1">
                  Start KYC Verification
                </Button>
              )}
              {status.kycStatus === 'in_progress' && (
                <Button onClick={() => onViewDetails('kyc')} variant="outline" className="flex-1">
                  Continue KYC
                </Button>
              )}
              <Button 
                onClick={() => onViewDetails('kyc')} 
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AML Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            AML Screening
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.amlStatus)}
              <span className="font-medium capitalize">
                {status.amlStatus.replace('_', ' ')}
              </span>
            </div>
            <Badge className={getStatusColor(status.amlStatus)}>
              {status.amlStatus.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Sanctions Screening</span>
              {status.amlStatus === 'approved' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : status.amlStatus === 'flagged' ? (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">PEP Check</span>
              {status.amlStatus === 'approved' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : status.amlStatus === 'flagged' ? (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Adverse Media Check</span>
              {status.amlStatus === 'approved' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : status.amlStatus === 'flagged' ? (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={() => onViewDetails('aml')} 
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              View AML Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.documentsStatus)}
              <span className="font-medium capitalize">
                {status.documentsStatus.replace('_', ' ')}
              </span>
            </div>
            <Badge className={getStatusColor(status.documentsStatus)}>
              {details.documentsUploaded}/{details.totalDocuments} UPLOADED
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Identity Document</span>
              {details.documentsUploaded > 0 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Address Proof</span>
              {details.documentsUploaded > 1 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Income Verification</span>
              {details.documentsUploaded > 2 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Selfie Verification</span>
              {details.documentsUploaded > 3 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex gap-2">
              <Button 
                onClick={onUploadDocuments} 
                variant={details.documentsUploaded < details.totalDocuments ? "default" : "outline"}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {details.documentsUploaded < details.totalDocuments ? 'Upload Documents' : 'Manage Documents'}
              </Button>
              <Button 
                onClick={() => onViewDetails('documents')} 
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onRefresh}>
          Refresh Status
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onViewDetails('compliance')}>
            <FileText className="w-4 h-4 mr-2" />
            Full Report
          </Button>
          {status.overall === 'approved' && (
            <Button onClick={() => window.print()}>
              Download Certificate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
