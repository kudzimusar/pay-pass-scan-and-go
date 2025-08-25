import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  QrCode, 
  CreditCard, 
  Receipt,
  Settings,
  LogOut,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Store
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import MerchantQRGenerator from "@/components/merchant-qr-generator";

interface Transaction {
  id: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  type: "payment" | "refund" | "topup";
  status: "completed" | "pending" | "failed";
  method: "qr" | "card" | "mobile_money";
  description: string;
  timestamp: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  lastVisit: string;
  visitCount: number;
  status: "active" | "inactive";
}

export default function MerchantDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "customers" | "analytics" | "qr-generator" | "settings">("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for merchant
  const merchantData = {
    businessName: user?.businessName || "Demo Business",
    businessType: user?.businessType || "retailer",
    totalRevenue: 45678.90,
    todayRevenue: 1234.56,
    totalCustomers: 1247,
    activeCustomers: 892,
    totalTransactions: 3456,
    todayTransactions: 23,
    averageTransaction: 13.21,
    qrScans: 156,
    cardPayments: 89,
    mobileMoney: 111
  };

  const recentTransactions: Transaction[] = [
    {
      id: "txn_001",
      customerName: "John Doe",
      customerPhone: "+263771234567",
      amount: 45.50,
      type: "payment",
      status: "completed",
      method: "qr",
      description: "Groceries purchase",
      timestamp: "2024-01-15T14:30:00Z"
    },
    {
      id: "txn_002",
      customerName: "Sarah Wilson",
      customerPhone: "+263772345678",
      amount: 89.75,
      type: "payment",
      status: "completed",
      method: "mobile_money",
      description: "Utility bill payment",
      timestamp: "2024-01-15T14:25:00Z"
    },
    {
      id: "txn_003",
      customerName: "Mike Johnson",
      customerPhone: "+263773456789",
      amount: 23.40,
      type: "payment",
      status: "pending",
      method: "card",
      description: "Service fee",
      timestamp: "2024-01-15T14:20:00Z"
    },
    {
      id: "txn_004",
      customerName: "Emma Davis",
      customerPhone: "+263774567890",
      amount: 156.80,
      type: "payment",
      status: "completed",
      method: "qr",
      description: "Large purchase",
      timestamp: "2024-01-15T14:15:00Z"
    },
    {
      id: "txn_005",
      customerName: "David Brown",
      customerPhone: "+263775678901",
      amount: 67.25,
      type: "refund",
      status: "completed",
      method: "mobile_money",
      description: "Returned items",
      timestamp: "2024-01-15T14:10:00Z"
    }
  ];

  const topCustomers: Customer[] = [
    {
      id: "cust_001",
      name: "John Doe",
      phone: "+263771234567",
      totalSpent: 2345.67,
      lastVisit: "2024-01-15T14:30:00Z",
      visitCount: 45,
      status: "active"
    },
    {
      id: "cust_002",
      name: "Sarah Wilson",
      phone: "+263772345678",
      totalSpent: 1890.45,
      lastVisit: "2024-01-15T14:25:00Z",
      visitCount: 32,
      status: "active"
    },
    {
      id: "cust_003",
      name: "Mike Johnson",
      phone: "+263773456789",
      totalSpent: 1567.89,
      lastVisit: "2024-01-15T14:20:00Z",
      visitCount: 28,
      status: "active"
    },
    {
      id: "cust_004",
      name: "Emma Davis",
      phone: "+263774567890",
      totalSpent: 1234.56,
      lastVisit: "2024-01-15T14:15:00Z",
      visitCount: 19,
      status: "active"
    },
    {
      id: "cust_005",
      name: "David Brown",
      phone: "+263775678901",
      totalSpent: 987.65,
      lastVisit: "2024-01-15T14:10:00Z",
      visitCount: 15,
      status: "inactive"
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
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'qr': return <QrCode className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'mobile_money': return <Receipt className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{merchantData.businessName}</h1>
                <p className="text-sm text-gray-500 capitalize">{merchantData.businessType}</p>
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
              { id: "payments", label: "Payments", icon: DollarSign },
              { id: "customers", label: "Customers", icon: Users },
              { id: "analytics", label: "Analytics", icon: TrendingUp },
              { id: "qr-generator", label: "QR Generator", icon: QrCode },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-green-500 text-green-600"
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
                  <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(merchantData.todayRevenue)}</div>
                  <p className="text-xs text-muted-foreground">+12% from yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(merchantData.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">+8% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{merchantData.todayTransactions}</div>
                  <p className="text-xs text-muted-foreground">+5 from yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{merchantData.activeCustomers}</div>
                  <p className="text-xs text-muted-foreground">+23 this week</p>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">QR Payments</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{merchantData.qrScans}</div>
                        <div className="text-xs text-gray-500">43%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Card Payments</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{merchantData.cardPayments}</div>
                        <div className="text-xs text-gray-500">25%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">Mobile Money</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{merchantData.mobileMoney}</div>
                        <div className="text-xs text-gray-500">32%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getMethodIcon(transaction.method)}
                          <div>
                            <div className="font-medium text-sm">{transaction.customerName}</div>
                            <div className="text-xs text-gray-500">{transaction.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">{formatCurrency(transaction.amount)}</div>
                          <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col space-y-2">
                    <QrCode className="h-6 w-6" />
                    <span>Generate QR Code</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <Download className="h-6 w-6" />
                    <span>Download Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <Plus className="h-6 w-6" />
                    <span>Add Product</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "payments" && (
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
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Customer</th>
                        <th className="text-left py-3 px-4 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 font-medium">Method</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{transaction.customerName}</div>
                              <div className="text-sm text-gray-500">{transaction.customerPhone}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">{formatCurrency(transaction.amount)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {getMethodIcon(transaction.method)}
                              <span className="capitalize">{transaction.method.replace('_', ' ')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </td>
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

        {activeTab === "customers" && (
          <div className="space-y-6">
            {/* Customer Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{merchantData.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">+15 this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{merchantData.activeCustomers}</div>
                  <p className="text-xs text-muted-foreground">72% of total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Customer Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(merchantData.averageTransaction)}</div>
                  <p className="text-xs text-muted-foreground">per transaction</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                        <div className="text-sm text-gray-500">{customer.visitCount} visits</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {customer.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
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
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                  <p className="text-gray-500">Chart visualization would go here</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Pie chart would go here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Line chart would go here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "qr-generator" && (
          <MerchantQRGenerator 
            merchantId={user?.id || "demo_merchant"}
            businessName={merchantData.businessName}
          />
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <Input value={merchantData.businessName} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <Input value={merchantData.businessType} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input value={user?.phone || ""} disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input value={user?.email || ""} />
                  </div>
                  <Button>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}