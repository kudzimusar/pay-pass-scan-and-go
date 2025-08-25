'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search,
  FileText,
  AlertCircle,
  Eye,
  Target,
  Globe
} from 'lucide-react';

interface AMLCheckResult {
  id: string;
  userId: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'requires_review';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  checks: {
    sanctionsScreening: CheckResult;
    pepCheck: CheckResult;
    adverseMediaCheck: CheckResult;
    watchlistCheck: CheckResult;
    countryRiskCheck: CheckResult;
  };
  findings: Finding[];
  recommendations: string[];
  completedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface CheckResult {
  status: 'pending' | 'passed' | 'failed' | 'warning';
  score: number;
  details: string;
  matches?: Match[];
}

interface Match {
  name: string;
  type: string;
  confidence: number;
  source: string;
  details: string;
}

interface Finding {
  type: 'warning' | 'alert' | 'violation';
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  dateFound: string;
}

interface AMLCheckProps {
  userId: string;
  onComplete: (result: AMLCheckResult) => void;
  initialData?: AMLCheckResult;
}

export function AMLCheck({ userId, onComplete, initialData }: AMLCheckProps) {
  const [result, setResult] = useState<AMLCheckResult | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCheck, setCurrentCheck] = useState('');

  useEffect(() => {
    if (initialData) {
      setResult(initialData);
    }
  }, [initialData]);

  const startAMLCheck = async () => {
    setIsLoading(true);
    setProgress(0);
    setCurrentCheck('Initializing AML screening...');

    try {
      // Simulate AML check process
      const checks = [
        { name: 'Sanctions Screening', duration: 2000 },
        { name: 'PEP Check', duration: 1500 },
        { name: 'Adverse Media Check', duration: 3000 },
        { name: 'Watchlist Check', duration: 1000 },
        { name: 'Country Risk Assessment', duration: 1500 }
      ];

      let currentProgress = 0;
      const progressStep = 100 / checks.length;

      for (const check of checks) {
        setCurrentCheck(`Running ${check.name}...`);
        await new Promise(resolve => setTimeout(resolve, check.duration));
        currentProgress += progressStep;
        setProgress(currentProgress);
      }

      setCurrentCheck('Analyzing results...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock result
      const mockResult: AMLCheckResult = {
        id: `aml_${Date.now()}`,
        userId,
        status: 'passed',
        riskLevel: 'low',
        score: 85,
        checks: {
          sanctionsScreening: {
            status: 'passed',
            score: 95,
            details: 'No matches found in sanctions databases',
            matches: []
          },
          pepCheck: {
            status: 'passed',
            score: 90,
            details: 'No matches found in PEP databases',
            matches: []
          },
          adverseMediaCheck: {
            status: 'warning',
            score: 75,
            details: 'Minor adverse media found, requires review',
            matches: [
              {
                name: 'John Smith',
                type: 'Media Mention',
                confidence: 65,
                source: 'Financial Times',
                details: 'Mentioned in article about industry changes'
              }
            ]
          },
          watchlistCheck: {
            status: 'passed',
            score: 100,
            details: 'No matches found in global watchlists',
            matches: []
          },
          countryRiskCheck: {
            status: 'passed',
            score: 80,
            details: 'Low country risk assessment',
            matches: []
          }
        },
        findings: [
          {
            type: 'warning',
            category: 'Media',
            description: 'Minor media mention found',
            severity: 'low',
            source: 'Adverse Media Check',
            dateFound: new Date().toISOString()
          }
        ],
        recommendations: [
          'Customer can proceed with standard monitoring',
          'Consider periodic reviews due to minor media findings',
          'Maintain enhanced documentation for audit purposes'
        ],
        completedAt: new Date().toISOString()
      };

      setResult(mockResult);
      onComplete(mockResult);
      setProgress(100);
      setCurrentCheck('AML check completed');
    } catch (error) {
      console.error('AML check failed:', error);
    } finally {
      setIsLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCheckIcon = (checkType: string) => {
    switch (checkType) {
      case 'sanctionsScreening': return <Shield className="w-5 h-5" />;
      case 'pepCheck': return <Target className="w-5 h-5" />;
      case 'adverseMediaCheck': return <Search className="w-5 h-5" />;
      case 'watchlistCheck': return <Eye className="w-5 h-5" />;
      case 'countryRiskCheck': return <Globe className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  if (!result && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            AML Screening
          </CardTitle>
          <CardDescription>
            Perform Anti-Money Laundering compliance checks for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Start AML Check</h3>
            <p className="text-gray-600 mb-6">
              This will perform comprehensive screening against sanctions lists, PEP databases, and adverse media sources.
            </p>
            <Button onClick={startAMLCheck} className="px-8">
              Start AML Screening
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            AML Screening in Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg font-medium">{currentCheck}</p>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-gray-600">
              {Math.round(progress)}% Complete
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* Overall Result */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              AML Screening Results
            </div>
            <Badge className={getRiskLevelColor(result.riskLevel)}>
              {result.riskLevel.toUpperCase()} RISK
            </Badge>
          </CardTitle>
          <CardDescription>
            Completed on {new Date(result.completedAt!).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{result.score}</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {getStatusIcon(result.status)}
                <span className="font-semibold capitalize">{result.status}</span>
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold mb-1">{result.findings.length}</div>
              <div className="text-sm text-gray-600">Findings</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Check Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(result.checks).map(([checkType, checkResult]) => (
              <div key={checkType} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCheckIcon(checkType)}
                    <span className="font-medium capitalize">
                      {checkType.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(checkResult.status)}
                    <span className="text-sm font-medium">{checkResult.score}/100</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{checkResult.details}</p>
                
                {checkResult.matches && checkResult.matches.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Matches Found:</h4>
                    <div className="space-y-2">
                      {checkResult.matches.map((match, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{match.name}</div>
                              <div className="text-sm text-gray-600">{match.details}</div>
                              <div className="text-xs text-gray-500">Source: {match.source}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {match.confidence}% match
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Findings */}
      {result.findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.findings.map((finding, index) => (
                <Alert key={index} className={
                  finding.severity === 'critical' ? 'border-red-500' :
                  finding.severity === 'high' ? 'border-orange-500' :
                  finding.severity === 'medium' ? 'border-yellow-500' :
                  'border-blue-500'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{finding.description}</div>
                        <div className="text-sm text-gray-600">
                          Category: {finding.category} | Source: {finding.source}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {finding.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {result.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setResult(null)}>
          Run New Check
        </Button>
        <Button onClick={() => window.print()}>
          <FileText className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>
    </div>
  );
}