'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface RegulatoryReportData {
  id: string;
  type: 'suspicious_activity' | 'compliance_summary' | 'transaction_monitoring' | 'customer_due_diligence';
  period: {
    start: string;
    end: string;
  };
  status: 'pending' | 'generated' | 'submitted' | 'approved';
  metrics: {
    totalTransactions: number;
    suspiciousActivities: number;
    kycCompletions: number;
    amlScreenings: number;
    riskAssessments: number;
    complianceViolations: number;
  };
  statistics: {
    transactionVolume: number;
    averageTransactionSize: number;
    highRiskTransactions: number;
    flaggedCustomers: number;
    newCustomers: number;
    verifiedCustomers: number;
  };
  findings: Finding[];
  recommendations: string[];
  generatedAt: string;
  generatedBy: string;
}

interface Finding {
  id: string;
  type: 'violation' | 'risk' | 'anomaly' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  details: string;
  affectedEntities: number;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  dateDetected: string;
  actions: string[];
}

interface RegulatoryReportProps {
  onGenerate: (config: ReportConfig) => void;
  onExport: (reportId: string, format: string) => void;
  initialData?: RegulatoryReportData;
}

interface ReportConfig {
  type: string;
  period: {
    start: string;
    end: string;
  };
  includeMetrics: boolean;
  includeFindings: boolean;
  includeRecommendations: boolean;
  format: 'pdf' | 'excel' | 'csv';
}

export function RegulatoryReport({ onGenerate, onExport, initialData }: RegulatoryReportProps) {
  const [reportData, setReportData] = useState<RegulatoryReportData | null>(initialData || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    type: 'compliance_summary',
    period: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeMetrics: true,
    includeFindings: true,
    includeRecommendations: true,
    format: 'pdf'
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockData: RegulatoryReportData = {
        id: `report_${Date.now()}`,
        type: config.type as any,
        period: config.period,
        status: 'generated',
        metrics: {
          totalTransactions: 12547,
          suspiciousActivities: 23,
          kycCompletions: 156,
          amlScreenings: 89,
          riskAssessments: 234,
          complianceViolations: 3
        },
        statistics: {
          transactionVolume: 2847629.50,
          averageTransactionSize: 226.85,
          highRiskTransactions: 45,
          flaggedCustomers: 12,
          newCustomers: 78,
          verifiedCustomers: 234
        },
        findings: [
          {
            id: 'finding_1',
            type: 'violation',
            severity: 'high',
            category: 'Transaction Monitoring',
            description: 'Unusual transaction patterns detected',
            details: 'Multiple high-value transactions from new customers without proper documentation',
            affectedEntities: 5,
            status: 'investigating',
            dateDetected: new Date().toISOString(),
            actions: ['Enhanced due diligence required', 'Transaction review initiated', 'Customer contact scheduled']
          },
          {
            id: 'finding_2',
            type: 'risk',
            severity: 'medium',
            category: 'Customer Due Diligence',
            description: 'Incomplete KYC documentation',
            details: 'Several customers have pending document verification',
            affectedEntities: 23,
            status: 'open',
            dateDetected: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            actions: ['Document follow-up required', 'Customer notification sent']
          }
        ],
        recommendations: [
          'Implement enhanced monitoring for new customer transactions',
          'Increase KYC documentation completion rate through automated reminders',
          'Consider lowering transaction limits for unverified customers',
          'Review and update risk assessment criteria'
        ],
        generatedAt: new Date().toISOString(),
        generatedBy: 'System Admin'
      };

      setReportData(mockData);
      onGenerate(config);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': 
      case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      case 'investigating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'violation': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'risk': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'anomaly': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'recommendation': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!reportData && !isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Regulatory Report Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive compliance and regulatory reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select 
                  value={config.type} 
                  onValueChange={(value: string) => setConfig(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliance_summary">Compliance Summary</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity Report</SelectItem>
                    <SelectItem value="transaction_monitoring">Transaction Monitoring</SelectItem>
                    <SelectItem value="customer_due_diligence">Customer Due Diligence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format">Export Format</Label>
                <Select 
                  value={config.format} 
                  onValueChange={(value: string) => setConfig(prev => ({ ...prev, format: value as 'pdf' | 'excel' | 'csv' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={config.period.start}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig(prev => ({
                    ...prev,
                    period: { ...prev.period, start: e.target.value }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={config.period.end}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig(prev => ({
                    ...prev,
                    period: { ...prev.period, end: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Report Sections</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.includeMetrics}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, includeMetrics: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Metrics & Statistics</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.includeFindings}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, includeFindings: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Findings & Violations</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.includeRecommendations}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfig(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include Recommendations</span>
                </label>
              </div>
            </div>

            <Button onClick={handleGenerate} className="w-full" size="lg">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGenerating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generating Regulatory Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-medium">Processing compliance data...</p>
            <p className="text-gray-600">This may take a few moments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Regulatory Report
            </div>
            <Badge className={getStatusColor(reportData.status)} variant="outline">
              {reportData.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Report Period: {new Date(reportData.period.start).toLocaleDateString()} - {new Date(reportData.period.end).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reportData.id}</div>
              <div className="text-sm text-gray-600">Report ID</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{reportData.type.replace('_', ' ').toUpperCase()}</div>
              <div className="text-sm text-gray-600">Report Type</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{new Date(reportData.generatedAt).toLocaleDateString()}</div>
              <div className="text-sm text-gray-600">Generated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Total Transactions</span>
                </div>
                <div className="text-2xl font-bold">{reportData.metrics.totalTransactions.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Suspicious Activities</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{reportData.metrics.suspiciousActivities}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">KYC Completions</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{reportData.metrics.kycCompletions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Transaction Volume</span>
                </div>
                <div className="text-2xl font-bold">${reportData.statistics.transactionVolume.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Risk Assessments</span>
                </div>
                <div className="text-2xl font-bold">{reportData.metrics.riskAssessments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-medium">Violations</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{reportData.metrics.complianceViolations}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Transactions</span>
                    <span className="font-semibold">{reportData.metrics.totalTransactions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High-Risk Transactions</span>
                    <span className="font-semibold text-orange-600">{reportData.statistics.highRiskTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Transaction Size</span>
                    <span className="font-semibold">${reportData.statistics.averageTransactionSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction Volume</span>
                    <span className="font-semibold">${reportData.statistics.transactionVolume.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>New Customers</span>
                    <span className="font-semibold">{reportData.statistics.newCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified Customers</span>
                    <span className="font-semibold text-green-600">{reportData.statistics.verifiedCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flagged Customers</span>
                    <span className="font-semibold text-red-600">{reportData.statistics.flaggedCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KYC Completions</span>
                    <span className="font-semibold">{reportData.metrics.kycCompletions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <div className="space-y-4">
            {reportData.findings.map((finding: Finding) => (
              <Card key={finding.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(finding.type)}
                      <span className="font-semibold">{finding.category}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(finding.severity)} variant="outline">
                        {finding.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(finding.status)} variant="outline">
                        {finding.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <h4 className="font-medium mb-2">{finding.description}</h4>
                  <p className="text-gray-600 text-sm mb-3">{finding.details}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>Affected Entities: {finding.affectedEntities}</span>
                    <span>Detected: {new Date(finding.dateDetected).toLocaleDateString()}</span>
                  </div>

                  {finding.actions.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Actions Taken:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {finding.actions.map((action: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => setReportData(null)}>
          Generate New Report
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onExport(reportData.id, 'pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => onExport(reportData.id, 'excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={() => window.print()}>
            <FileText className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>
    </div>
  );
}
