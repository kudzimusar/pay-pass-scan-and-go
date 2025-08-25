"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload,
  Download,
  Play,
  Pause,
  StopCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface BulkPayment {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'paused';
  totalRecipients: number;
  totalAmount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  currency: string;
  scheduledDate?: string;
  createdDate: string;
  completedDate?: string;
  creator: string;
}

interface PaymentRecipient {
  id: string;
  name: string;
  email: string;
  accountNumber: string;
  bankCode?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  reference?: string;
  failureReason?: string;
}

export default function BulkPaymentProcessing() {
  const [bulkPayments, setBulkPayments] = useState<BulkPayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<BulkPayment | null>(null);
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Mock data
  const mockBulkPayments: BulkPayment[] = [
    {
      id: 'bp_001',
      name: 'Monthly Salary Payments',
      description: 'January 2024 salary payments for all employees',
      status: 'completed',
      totalRecipients: 150,
      totalAmount: 2500000,
      processedCount: 150,
      successCount: 148,
      failedCount: 2,
      currency: 'USD',
      scheduledDate: '2024-01-31T09:00:00Z',
      createdDate: '2024-01-25T14:30:00Z',
      completedDate: '2024-01-31T09:45:00Z',
      creator: 'John Smith'
    },
    {
      id: 'bp_002',
      name: 'Vendor Payments Q4',
      description: 'Quarterly payments to approved vendors',
      status: 'processing',
      totalRecipients: 75,
      totalAmount: 1250000,
      processedCount: 45,
      successCount: 43,
      failedCount: 2,
      currency: 'USD',
      scheduledDate: '2024-02-01T10:00:00Z',
      createdDate: '2024-01-28T11:15:00Z',
      creator: 'Jane Doe'
    },
    {
      id: 'bp_003',
      name: 'Contractor Payments',
      description: 'Monthly payments to freelancers and contractors',
      status: 'scheduled',
      totalRecipients: 25,
      totalAmount: 125000,
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      currency: 'USD',
      scheduledDate: '2024-02-05T14:00:00Z',
      createdDate: '2024-01-30T16:45:00Z',
      creator: 'Mike Johnson'
    }
  ];

  const mockRecipients: PaymentRecipient[] = [
    {
      id: 'rec_001',
      name: 'John Employee',
      email: 'john@company.com',
      accountNumber: '****1234',
      bankCode: 'CHASE',
      amount: 5000,
      currency: 'USD',
      status: 'completed',
      reference: 'SAL_JAN_2024_001'
    },
    {
      id: 'rec_002',
      name: 'Jane Worker',
      email: 'jane@company.com',
      accountNumber: '****5678',
      bankCode: 'BOA',
      amount: 4500,
      currency: 'USD',
      status: 'completed',
      reference: 'SAL_JAN_2024_002'
    },
    {
      id: 'rec_003',
      name: 'Bob Contractor',
      email: 'bob@contractor.com',
      accountNumber: '****9012',
      bankCode: 'WELLS',
      amount: 3000,
      currency: 'USD',
      status: 'failed',
      reference: 'SAL_JAN_2024_003',
      failureReason: 'Invalid account number'
    }
  ];

  useEffect(() => {
    setBulkPayments(mockBulkPayments);
    setRecipients(mockRecipients);
  }, []);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const startPayment = (paymentId: string) => {
    setBulkPayments(prev => 
      prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'processing' }
          : payment
      )
    );
  };

  const pausePayment = (paymentId: string) => {
    setBulkPayments(prev => 
      prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'paused' }
          : payment
      )
    );
  };

  const stopPayment = (paymentId: string) => {
    setBulkPayments(prev => 
      prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'failed' }
          : payment
      )
    );
  };

  const downloadTemplate = () => {
    // Mock CSV template download
    const csvContent = `Name,Email,Account Number,Bank Code,Amount,Currency,Reference
John Doe,john@example.com,1234567890,CHASE,1000,USD,REF001
Jane Smith,jane@example.com,0987654321,BOA,1500,USD,REF002`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_payment_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Payment Processing</h1>
          <p className="text-muted-foreground">
            Create and manage bulk payments to multiple recipients
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Create New Batch
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bulkPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bulkPayments.reduce((sum, bp) => sum + bp.totalRecipients, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(bulkPayments.reduce((sum, bp) => sum + bp.totalAmount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7%</div>
            <p className="text-xs text-muted-foreground">
              +0.3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="batches">Payment Batches</TabsTrigger>
          <TabsTrigger value="create">Create Batch</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Batches</CardTitle>
              <CardDescription>Manage your bulk payment batches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bulkPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold">{payment.name}</h3>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                        </div>
                        <Badge className={getStatusColor(payment.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(payment.status)}
                            <span>{payment.status.toUpperCase()}</span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payment.status === 'scheduled' && (
                          <Button size="sm" onClick={() => startPayment(payment.id)}>
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {payment.status === 'processing' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => pausePayment(payment.id)}>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => stopPayment(payment.id)}>
                              <StopCircle className="h-4 w-4 mr-1" />
                              Stop
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Recipients</p>
                        <p className="font-semibold">{payment.totalRecipients}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-semibold">{formatCurrency(payment.totalAmount, payment.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progress</p>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={(payment.processedCount / payment.totalRecipients) * 100} 
                            className="flex-1"
                          />
                          <span className="text-xs">
                            {payment.processedCount}/{payment.totalRecipients}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-semibold">
                          {payment.processedCount > 0 
                            ? ((payment.successCount / payment.processedCount) * 100).toFixed(1) 
                            : '0'
                          }%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Created: {formatDate(payment.createdDate)} by {payment.creator}</span>
                      {payment.scheduledDate && (
                        <span>Scheduled: {formatDate(payment.scheduledDate)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Bulk Payment</CardTitle>
              <CardDescription>Upload a file or manually enter payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="batch-name">Batch Name</Label>
                  <Input id="batch-name" placeholder="Enter batch name" />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="ZWL">ZWL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" placeholder="Enter batch description" />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Payment File</h3>
                <p className="text-muted-foreground mb-4">
                  Upload a CSV or Excel file with payment details
                </p>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Choose File
                    </Button>
                  </label>
                  <div className="flex justify-center">
                    <Button variant="link" onClick={downloadTemplate} className="text-sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download Template
                    </Button>
                  </div>
                </div>

                {isUploading && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Save as Draft</Button>
                <Button>Process Batch</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Templates</CardTitle>
              <CardDescription>Saved templates for recurring bulk payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Monthly Salary Template', recipients: 150, lastUsed: '2024-01-31' },
                  { name: 'Vendor Payment Template', recipients: 75, lastUsed: '2024-01-28' },
                  { name: 'Contractor Template', recipients: 25, lastUsed: '2024-01-15' }
                ].map((template, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.recipients} recipients • Last used: {template.lastUsed}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reports</CardTitle>
              <CardDescription>Generate and download payment reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Batches:</span>
                        <span className="font-semibold">{bulkPayments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Recipients:</span>
                        <span className="font-semibold">
                          {bulkPayments.reduce((sum, bp) => sum + bp.totalRecipients, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold">
                          {formatCurrency(bulkPayments.reduce((sum, bp) => sum + bp.totalAmount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate:</span>
                        <span className="font-semibold text-green-600">98.7%</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Failed Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Review and retry failed payments
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Failed This Month:</span>
                        <span className="font-semibold text-red-600">4</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold">{formatCurrency(12500)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Main Reason:</span>
                        <span className="text-sm">Invalid Account</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Review Failed
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedPayment.name}</CardTitle>
                  <CardDescription>{selectedPayment.description}</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedPayment.status)}>
                      {selectedPayment.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recipients</p>
                    <p className="font-semibold">{selectedPayment.totalRecipients}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">
                      {formatCurrency(selectedPayment.totalAmount, selectedPayment.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="font-semibold">
                      {selectedPayment.processedCount > 0 
                        ? ((selectedPayment.successCount / selectedPayment.processedCount) * 100).toFixed(1)
                        : '0'
                      }%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Recipients</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3">Name</th>
                          <th className="text-left p-3">Account</th>
                          <th className="text-left p-3">Amount</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.slice(0, 10).map((recipient) => (
                          <tr key={recipient.id} className="border-t">
                            <td className="p-3">
                              <div>
                                <p className="font-semibold">{recipient.name}</p>
                                <p className="text-sm text-muted-foreground">{recipient.email}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <p>{recipient.accountNumber}</p>
                                {recipient.bankCode && (
                                  <p className="text-sm text-muted-foreground">{recipient.bankCode}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {formatCurrency(recipient.amount, recipient.currency)}
                            </td>
                            <td className="p-3">
                              <Badge className={getStatusColor(recipient.status)}>
                                {recipient.status.toUpperCase()}
                              </Badge>
                              {recipient.failureReason && (
                                <p className="text-xs text-red-600 mt-1">{recipient.failureReason}</p>
                              )}
                            </td>
                            <td className="p-3 text-sm">{recipient.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
