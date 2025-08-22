import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Handshake,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  Key,
  RefreshCw,
  Copy,
  ExternalLink,
  Code,
  Server,
  Shield,
  Users,
  Globe
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "processing";
  method: "mobile_money" | "bank_transfer" | "card" | "qr";
  partnerType: "mobile_money" | "bank" | "fintech";
  timestamp: string;
  processingTime: number;
  errorMessage?: string;
}

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  status: "active" | "inactive" | "error";
  responseTime: number;
  successRate: number;
  lastTested: string;
  description: string;
}

interface IntegrationMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageResponseTime: number;
  uptime: number;
  activeUsers: number;
  dailyVolume: number;
  monthlyVolume: number;
  errorRate: number;
  apiCalls: number;
}

export default function PartnerDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "api-monitoring" | "analytics" | "integrations" | "settings">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1h" | "24h" | "7d" | "30d">("24h");

  // Mock data for partner
  const partnerData = {
    companyName: user?.companyName || "Demo Partner",
    partnerType: user?.partnerType || "mobile_money",
    integrationKey: user?.integrationKey || "demo_integration_key",
    totalTransactions: 45000,
    successfulTransactions: 43200,
    failedTransactions: 1800,
    averageResponseTime: 245,
    uptime: 99.8,
    activeUsers: 12500,
    dailyVolume: 1250.75,
    monthlyVolume: 45678.90,
    errorRate: 0.4,
    apiCalls: 156000
  };

  const recentTransactions: Transaction[] = [
    {
      id: "txn_001",
      userId: "user_123",
      amount: 45.50,
      status: "completed",
      method: "mobile_money",
      partnerType: "mobile_money",
      timestamp: "2024-01-15T14:30:00Z",
      processingTime: 1.2
    },
    {
      id: "txn_002",
      userId: "user_456",
      amount: 89.75,
      status: "completed",
      method: "bank_transfer",
      partnerType: "bank",
      timestamp: "2024-01-15T14:25:00Z",
      processingTime: 2.1
    },
    {
      id: "txn_003",
      userId: "user_789",
      amount: 23.40,
      status: "failed",
      method: "mobile_money",
      partnerType: "mobile_money",
      timestamp: "2024-01-15T14:20:00Z",
      processingTime: 0.8,
      errorMessage: "Insufficient funds"
    },
    {
      id: "txn_004",
      userId: "user_101",
      amount: 156.80,
      status: "processing",
      method: "card",
      partnerType: "fintech",
      timestamp: "2024-01-15T14:15:00Z",
      processingTime: 3.5
    },
    {
      id: "txn_005",
      userId: "user_202",
      amount: 67.25,
      status: "completed",
      method: "qr",
      partnerType: "mobile_money",
      timestamp: "2024-01-15T14:10:00Z",
      processingTime: 0.9
    }
  ];

  const apiEndpoints: APIEndpoint[] = [
    {
      id: "api_001",
      name: "Payment Processing",
      url: "/api/v1/payments/process",
      method: "POST",
      status: "active",
      responseTime: 245,
      successRate: 99.6,
      lastTested: "2024-01-15T14:30:00Z",
      description: "Process payment transactions"
    },
    {
      id: "api_002",
      name: "Account Balance",
      url: "/api/v1/accounts/balance",
      method: "GET",
      status: "active",
      responseTime: 120,
      successRate: 99.9,
      lastTested: "2024-01-15T14:25:00Z",
      description: "Get account balance information"
    },
    {
      id: "api_003",
      name: "Transaction History",
      url: "/api/v1/transactions/history",
      method: "GET",
      status: "active",
      responseTime: 180,
      successRate: 99.7,
      lastTested: "2024-01-15T14:20:00Z",
      description: "Retrieve transaction history"
    },
    {
      id: "api_004",
      name: "User Verification",
      url: "/api/v1/users/verify",
      method: "POST",
      status: "error",
      responseTime: 500,
      successRate: 95.2,
      lastTested: "2024-01-15T14:15:00Z",
      description: "Verify user identity"
    },
    {
      id: "api_005",
      name: "Webhook Notifications",
      url: "/api/v1/webhooks/notify",
      method: "POST",
      status: "inactive",
      responseTime: 0,
      successRate: 0,
      lastTested: "2024-01-15T14:10:00Z",
      description: "Send webhook notifications"
    }
  ];

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getApiStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApiStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Wifi className="h-4 w-4" />;
      case 'inactive': return <WifiOff className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                <Handshake className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{partnerData.companyName}</h1>
                <p className="text-sm text-gray-500 capitalize">{partnerData.partnerType.replace('_', ' ')} Partner</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "transactions", label: "Transactions", icon: DollarSign },
              { id: "api-monitoring", label: "API Monitoring", icon: Activity },
              { id: "analytics", label: "Analytics", icon: TrendingUp },
              { id: "integrations", label: "Integrations", icon: Code },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{partnerData.totalTransactions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+5% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{((partnerData.successfulTransactions / partnerData.totalTransactions) * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">96% success rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{partnerData.averageResponseTime}ms</div>
                  <p className="text-xs text-muted-foreground">-12ms from last week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{partnerData.uptime}%</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">API Gateway</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Database</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">User Verification API</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <WifiOff className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">Webhook Service</span>
                      </div>
                      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(transaction.status)}
                          <div>
                            <div className="font-medium text-sm">${transaction.amount}</div>
                            <div className="text-xs text-gray-500">{transaction.method.replace('_', ' ')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </Badge>
                          <div className="text-xs text-gray-500">{transaction.processingTime}s</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Key */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Key</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={partnerData.integrationKey} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(partnerData.integrationKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use this key to authenticate API requests to the PayPass platform
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Transaction ID</th>
                        <th className="text-left py-3 px-4 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 font-medium">Method</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Response Time</th>
                        <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">{transaction.id}</td>
                          <td className="py-3 px-4 font-medium">{formatCurrency(transaction.amount)}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="capitalize">
                              {transaction.method.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(transaction.status)}
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{transaction.processingTime}s</td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {formatDate(transaction.timestamp)}
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "api-monitoring" && (
          <div className="space-y-6">
            {/* API Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{apiEndpoints.filter(api => api.status === 'active').length}</div>
                  <p className="text-xs text-muted-foreground">of {apiEndpoints.length} total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(apiEndpoints.reduce((acc, api) => acc + api.responseTime, 0) / apiEndpoints.length)}ms
                  </div>
                  <p className="text-xs text-muted-foreground">across all endpoints</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(apiEndpoints.reduce((acc, api) => acc + api.successRate, 0) / apiEndpoints.length)}%
                  </div>
                  <p className="text-xs text-muted-foreground">average across endpoints</p>
                </CardContent>
              </Card>
            </div>

            {/* API Endpoints Table */}
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiEndpoints.map((endpoint) => (
                    <div key={endpoint.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getApiStatusIcon(endpoint.status)}
                          <div>
                            <h3 className="font-medium">{endpoint.name}</h3>
                            <p className="text-sm text-gray-500">{endpoint.description}</p>
                          </div>
                        </div>
                        <Badge className={getApiStatusColor(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">URL:</span>
                          <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                            {endpoint.url}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Method:</span>
                          <Badge variant="outline" className="ml-1">{endpoint.method}</Badge>
                        </div>
                        <div>
                          <span className="text-gray-500">Response Time:</span>
                          <div className="font-medium">{endpoint.responseTime}ms</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Success Rate:</span>
                          <div className="font-medium">{endpoint.successRate}%</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-500">
                          Last tested: {formatDate(endpoint.lastTested)}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Transaction volume chart would go here</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Response time chart would go here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error Rate Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Error rate chart would go here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
                    <p className="text-sm text-blue-700">
                      Use your integration key to authenticate API requests. All requests should include the key in the Authorization header.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">API Base URL</h4>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value="https://api.paypass.co.zw/v1" 
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard("https://api.paypass.co.zw/v1")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Authentication</h4>
                    <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                      Authorization: Bearer {partnerData.integrationKey}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Example Request</h4>
                    <div className="bg-gray-100 p-3 rounded font-mono text-xs">
                      <div>POST /api/v1/payments/process</div>
                      <div>Headers: Authorization: Bearer {partnerData.integrationKey}</div>
                      <div>Body: {"{"}</div>
                      <div>  "amount": 100.00,</div>
                      <div>  "currency": "USD",</div>
                      <div>  "description": "Payment"</div>
                      <div>{"}"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input 
                      id="webhook-url"
                      placeholder="https://your-domain.com/webhook"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook-secret">Webhook Secret</Label>
                    <Input 
                      id="webhook-secret"
                      type="password"
                      placeholder="Enter webhook secret"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="events">Events to Listen For</Label>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        payment.completed
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" defaultChecked />
                        payment.failed
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        user.created
                      </label>
                    </div>
                  </div>
                  <Button>Save Webhook Configuration</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Partner Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input 
                      id="company-name"
                      value={partnerData.companyName}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="partner-type">Partner Type</Label>
                    <Input 
                      id="partner-type"
                      value={partnerData.partnerType.replace('_', ' ')}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      value={user?.email || ""}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone"
                      value={user?.phone || ""}
                      disabled
                      className="mt-1"
                    />
                  </div>
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-pin">Current PIN</Label>
                    <Input 
                      id="current-pin"
                      type="password"
                      placeholder="Enter current PIN"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-pin">New PIN</Label>
                    <Input 
                      id="new-pin"
                      type="password"
                      placeholder="Enter new PIN"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-pin">Confirm New PIN</Label>
                    <Input 
                      id="confirm-pin"
                      type="password"
                      placeholder="Confirm new PIN"
                      className="mt-1"
                    />
                  </div>
                  <Button>Update PIN</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}