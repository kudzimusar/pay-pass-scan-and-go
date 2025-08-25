'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Shield,
  FileText,
  Settings,
  BarChart3,
  CreditCard,
  Globe,
  Download
} from 'lucide-react';

interface CorporateDashboardProps {
  className?: string;
}

export default function CorporateDashboard({ className }: CorporateDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [corporateData, setCorporateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCorporateData();
  }, []);

  const loadCorporateData = async () => {
    setLoading(true);
    try {
      // Mock corporate data
      const mockData = {
        company: {
          name: 'TechCorp Solutions',
          id: 'CORP_001',
          plan: 'Enterprise',
          status: 'active',
          employees: 1250,
          departments: 8,
        },
        financials: {
          totalSpent: 2450000,
          monthlySpent: 185000,
          pendingPayments: 45000,
          savings: 125000,
          currency: 'USD',
        },
        transactions: {
          total: 15420,
          thisMonth: 1234,
          pending: 89,
          failed: 23,
        },
        users: {
          total: 1250,
          active: 1180,
          admins: 15,
          pendingApprovals: 8,
        },
        departments: [
          { name: 'Engineering', users: 450, budget: 850000, spent: 720000 },
          { name: 'Sales', users: 200, budget: 500000, spent: 420000 },
          { name: 'Marketing', users: 150, budget: 300000, spent: 280000 },
          { name: 'HR', users: 80, budget: 150000, spent: 120000 },
          { name: 'Finance', users: 60, budget: 200000, spent: 180000 },
          { name: 'Operations', users: 120, budget: 250000, spent: 220000 },
          { name: 'Legal', users: 40, budget: 100000, spent: 85000 },
          { name: 'IT Support', users: 150, budget: 200000, spent: 175000 },
        ],
        recentActivity: [
          { type: 'payment', description: 'Bulk payment processed for Engineering team', amount: 50000, timestamp: new Date().toISOString() },
          { type: 'user', description: 'New user added to Sales department', amount: null, timestamp: new Date(Date.now() - 3600000).toISOString() },
          { type: 'budget', description: 'Budget increased for Marketing department', amount: 25000, timestamp: new Date(Date.now() - 7200000).toISOString() },
          { type: 'approval', description: 'Payment approval required for Finance team', amount: 15000, timestamp: new Date(Date.now() - 10800000).toISOString() },
        ],
      };

      setCorporateData(mockData);
    } catch (error) {
      console.error('Error loading corporate data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <span>Loading corporate dashboard...</span>
        </div>
      </div>
    );
  }

  if (!corporateData) {
    return (
      <div className="text-center text-muted-foreground p-6">
        Unable to load corporate data
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {corporateData.company.name}
          </h1>
          <p className="text-muted-foreground">
            Enterprise Dashboard • {corporateData.company.plan} Plan
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            {corporateData.company.status.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(corporateData.financials.totalSpent / 1000000).toFixed(1)}M
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporateData.users.active.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              {((corporateData.users.active / corporateData.users.total) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporateData.transactions.thisMonth.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              This month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{corporateData.company.departments}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-blue-500 mr-1" />
              All active
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Current month overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Budget</span>
                  <span className="text-sm font-medium">${corporateData.financials.monthlySpent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending Payments</span>
                  <span className="text-sm font-medium text-orange-600">${corporateData.financials.pendingPayments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Savings</span>
                  <span className="text-sm font-medium text-green-600">${corporateData.financials.savings.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Budget Utilization</span>
                    <span className="text-sm font-medium">
                      {((corporateData.financials.monthlySpent / (corporateData.financials.monthlySpent + corporateData.financials.savings)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(corporateData.financials.monthlySpent / (corporateData.financials.monthlySpent + corporateData.financials.savings)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest corporate activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {corporateData.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'payment' ? 'bg-green-100' :
                        activity.type === 'user' ? 'bg-blue-100' :
                        activity.type === 'budget' ? 'bg-yellow-100' : 'bg-orange-100'
                      }`}>
                        {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-600" />}
                        {activity.type === 'user' && <Users className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'budget' && <BarChart3 className="h-4 w-4 text-yellow-600" />}
                        {activity.type === 'approval' && <FileText className="h-4 w-4 text-orange-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.amount && (
                        <Badge variant="outline" className="text-xs">
                          ${activity.amount.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Department Overview</h3>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {corporateData.departments.map((dept: any) => (
                <Card key={dept.name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                    <CardDescription>{dept.users} users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Budget</span>
                        <span className="font-medium">${dept.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Spent</span>
                        <span className="font-medium">${dept.spent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining</span>
                        <span className="font-medium text-green-600">${(dept.budget - dept.spent).toLocaleString()}</span>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Utilization</span>
                          <span>{((dept.spent / dept.budget) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (dept.spent / dept.budget) > 0.9 ? 'bg-red-500' :
                              (dept.spent / dept.budget) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(dept.spent / dept.budget) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">User Management</h3>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{corporateData.users.total.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">All employees</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Administrators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{corporateData.users.admins}</div>
                  <p className="text-sm text-muted-foreground">System admins</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{corporateData.users.pendingApprovals}</div>
                  <p className="text-sm text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transaction Overview</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{corporateData.transactions.total.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{corporateData.transactions.thisMonth.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{corporateData.transactions.pending}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{corporateData.transactions.failed}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Reports & Analytics</h3>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports</CardTitle>
                  <CardDescription>Budget and spending analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Monthly Budget Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Department Spending Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Cost Optimization Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Reports</CardTitle>
                  <CardDescription>User activity and management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    User Activity Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Department User Distribution
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Permission Audit Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}