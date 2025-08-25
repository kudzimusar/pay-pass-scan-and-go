'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Download, Filter } from 'lucide-react';

interface AnalyticsDashboardProps {
  type: 'transactions' | 'revenue' | 'users';
  dateRange: { from: Date; to: Date };
  data: any;
}

export function AnalyticsDashboard({ type, dateRange, data }: AnalyticsDashboardProps) {
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDetailedData();
  }, [type, dateRange, filter]);

  const fetchDetailedData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/${type}/detailed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange,
          filter,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDetailedData(result.data);
      }
    } catch (error) {
      console.error(`Error fetching ${type} detailed data:`, error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`/api/analytics/${type}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange,
          filter,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'transactions':
        return {
          title: 'Transaction Analytics',
          description: 'Detailed transaction analysis and insights',
          metrics: [
            { label: 'Total', value: data.total, color: 'text-blue-600' },
            { label: 'Successful', value: data.successful, color: 'text-green-600' },
            { label: 'Failed', value: data.failed, color: 'text-red-600' },
            { label: 'Pending', value: data.pending, color: 'text-yellow-600' },
          ],
          columns: ['Date', 'Total', 'Successful', 'Failed', 'Pending', 'Success Rate'],
        };
      case 'revenue':
        return {
          title: 'Revenue Analytics',
          description: 'Revenue generation and financial insights',
          metrics: [
            { label: 'Total Revenue', value: `$${data.total?.toLocaleString()}`, color: 'text-green-600' },
            { label: 'This Month', value: `$${data.thisMonth?.toLocaleString()}`, color: 'text-blue-600' },
            { label: 'Last Month', value: `$${data.lastMonth?.toLocaleString()}`, color: 'text-purple-600' },
            { label: 'Growth', value: `${data.trend?.toFixed(1)}%`, color: data.trend >= 0 ? 'text-green-600' : 'text-red-600' },
          ],
          columns: ['Date', 'Revenue', 'Fees', 'Net Revenue', 'Growth', 'Currency'],
        };
      case 'users':
        return {
          title: 'User Analytics',
          description: 'User growth and engagement insights',
          metrics: [
            { label: 'Total Users', value: data.total?.toLocaleString(), color: 'text-blue-600' },
            { label: 'Active Users', value: data.active?.toLocaleString(), color: 'text-green-600' },
            { label: 'New Users', value: data.new?.toLocaleString(), color: 'text-purple-600' },
            { label: 'Growth', value: `${data.trend?.toFixed(1)}%`, color: data.trend >= 0 ? 'text-green-600' : 'text-red-600' },
          ],
          columns: ['Date', 'Total', 'Active', 'New', 'Churned', 'Retention Rate'],
        };
      default:
        return {
          title: 'Analytics',
          description: 'Analytics dashboard',
          metrics: [],
          columns: [],
        };
    }
  };

  const config = getTypeConfig();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>Loading detailed data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {config.metrics.map((metric, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'successful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('successful')}
            >
              Successful
            </Button>
            <Button
              variant={filter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('failed')}
            >
              Failed
            </Button>
            <Button
              variant={filter === 'high-value' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('high-value')}
            >
              High Value
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Data</CardTitle>
          <CardDescription>
            {detailedData.length} records found for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {config.columns.map((column, index) => (
                    <TableHead key={index}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailedData.slice(0, 20).map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value: any, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {typeof value === 'number' 
                          ? value.toLocaleString() 
                          : typeof value === 'string' && value.includes('%')
                          ? value
                          : typeof value === 'string' && value.startsWith('$')
                          ? value
                          : value
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {detailedData.length > 20 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing first 20 of {detailedData.length} records
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Automated insights from the data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Growth Trend</h4>
                <p className="text-sm text-blue-700">
                  {data.trend >= 0 ? 'Positive' : 'Negative'} growth trend observed over the selected period.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <div className="h-5 w-5 bg-green-600 rounded-full mt-0.5"></div>
              <div>
                <h4 className="font-semibold text-green-900">Performance</h4>
                <p className="text-sm text-green-700">
                  {type === 'transactions' && data.successful && data.total
                    ? `${((data.successful / data.total) * 100).toFixed(1)}% success rate`
                    : type === 'revenue'
                    ? `Revenue growth of ${Math.abs(data.trend).toFixed(1)}%`
                    : `User growth of ${Math.abs(data.trend).toFixed(1)}%`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="h-5 w-5 bg-yellow-600 rounded-full mt-0.5"></div>
              <div>
                <h4 className="font-semibold text-yellow-900">Recommendations</h4>
                <p className="text-sm text-yellow-700">
                  {type === 'transactions' && data.failed > data.successful * 0.1
                    ? 'Consider reviewing failed transaction patterns to improve success rates.'
                    : type === 'revenue' && data.trend < 0
                    ? 'Focus on revenue optimization strategies to reverse the declining trend.'
                    : type === 'users' && data.trend < 0
                    ? 'Implement user retention strategies to improve user growth.'
                    : 'Continue monitoring current performance metrics.'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}