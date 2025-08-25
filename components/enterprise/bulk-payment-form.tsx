'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
  FileText
} from 'lucide-react';

interface BulkPaymentFormProps {
  onBulkPaymentSubmit?: (data: any) => void;
}

export default function BulkPaymentForm({ onBulkPaymentSubmit }: BulkPaymentFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Mock parsing of CSV file
      const mockPayments = [
        { id: 1, recipient: 'john.doe@email.com', amount: 1000, currency: 'USD', description: 'Salary payment' },
        { id: 2, recipient: 'jane.smith@email.com', amount: 1500, currency: 'USD', description: 'Bonus payment' },
        { id: 3, recipient: 'bob.wilson@email.com', amount: 800, currency: 'USD', description: 'Commission' },
        { id: 4, recipient: 'alice.brown@email.com', amount: 1200, currency: 'USD', description: 'Salary payment' },
        { id: 5, recipient: 'charlie.davis@email.com', amount: 900, currency: 'USD', description: 'Bonus payment' },
      ];
      setPayments(mockPayments);
    }
  };

  const handleBulkPayment = async () => {
    setProcessing(true);
    setProgress(0);

    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }

    // Mock results
    const mockResults = {
      total: payments.length,
      successful: Math.floor(payments.length * 0.9),
      failed: Math.floor(payments.length * 0.1),
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      processingTime: '2.5 seconds',
      errors: [
        { id: 3, error: 'Insufficient funds' },
        { id: 5, error: 'Invalid recipient email' },
      ],
    };

    setResults(mockResults);
    setProcessing(false);

    if (onBulkPaymentSubmit) {
      onBulkPaymentSubmit({ payments, results: mockResults });
    }
  };

  const downloadTemplate = () => {
    const template = `recipient_email,amount,currency,description
john.doe@email.com,1000,USD,Salary payment
jane.smith@email.com,1500,USD,Bonus payment`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_payment_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Payment Upload
          </CardTitle>
          <CardDescription>
            Upload a CSV file with payment details to process multiple payments at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="file-upload">Payment File (CSV)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{file.name}</span>
              <Badge variant="secondary">{payments.length} payments</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Preview */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payment Preview
            </CardTitle>
            <CardDescription>
              Review the payments before processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {payment.recipient.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{payment.recipient}</p>
                      <p className="text-sm text-muted-foreground">{payment.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-muted/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    USD {payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Total Payments</p>
                  <p className="text-2xl font-bold">{payments.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Section */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Process Payments
            </CardTitle>
            <CardDescription>
              Review and process the bulk payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing payments...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{results.successful}</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{results.failed}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${results.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Processing Time</p>
                    <p className="text-2xl font-bold text-gray-600">{results.processingTime}</p>
                  </div>
                </div>

                {results.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Errors ({results.errors.length})
                    </h4>
                    <div className="space-y-1">
                      {results.errors.map((error: any) => (
                        <div key={error.id} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                          Payment {error.id}: {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleBulkPayment} 
                disabled={processing || payments.length === 0}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Process Payments
                  </>
                )}
              </Button>
              <Button variant="outline" disabled={processing}>
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Options */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Options</CardTitle>
          <CardDescription>
            Configure additional settings for bulk payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled-date">Scheduled Date</Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" className="w-full mt-1 p-2 border rounded-md">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes for this bulk payment..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="fraud-check" className="rounded" />
            <Label htmlFor="fraud-check">Enable enhanced fraud detection</Label>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="notifications" className="rounded" defaultChecked />
            <Label htmlFor="notifications">Send notifications to recipients</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}