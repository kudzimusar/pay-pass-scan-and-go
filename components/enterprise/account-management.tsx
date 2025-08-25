'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Settings, 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface CorporateAccount {
  id: string;
  companyName: string;
  accountType: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'pending' | 'closed';
  registrationDate: string;
  lastActivity: string;
  totalTransactions: number;
  totalVolume: number;
  users: number;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    role: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  verificationStatus: {
    business: 'verified' | 'pending' | 'rejected';
    documents: 'complete' | 'incomplete' | 'expired';
    compliance: 'compliant' | 'non_compliant' | 'under_review';
  };
  limits: {
    dailyTransaction: number;
    monthlyVolume: number;
    singleTransaction: number;
  };
  features: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AccountManagementProps {
  onCreateAccount: (accountData: Partial<CorporateAccount>) => void;
  onUpdateAccount: (accountId: string, updates: Partial<CorporateAccount>) => void;
  onDeleteAccount: (accountId: string) => void;
  onViewDetails: (accountId: string) => void;
}

export function AccountManagement({ 
  onCreateAccount, 
  onUpdateAccount, 
  onDeleteAccount, 
  onViewDetails 
}: AccountManagementProps) {
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<CorporateAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, statusFilter, typeFilter]);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockAccounts: CorporateAccount[] = [
        {
          id: 'corp_001',
          companyName: 'TechCorp Solutions',
          accountType: 'enterprise',
          status: 'active',
          registrationDate: '2024-01-15',
          lastActivity: '2024-03-10',
          totalTransactions: 15420,
          totalVolume: 2847629.50,
          users: 25,
          primaryContact: {
            name: 'John Smith',
            email: 'john.smith@techcorp.com',
            phone: '+1-555-123-4567',
            role: 'CFO'
          },
          billingAddress: {
            street: '123 Business Ave',
            city: 'New York',
            state: 'NY',
            country: 'United States',
            postalCode: '10001'
          },
          verificationStatus: {
            business: 'verified',
            documents: 'complete',
            compliance: 'compliant'
          },
          limits: {
            dailyTransaction: 500000,
            monthlyVolume: 10000000,
            singleTransaction: 100000
          },
          features: ['bulk_payments', 'api_access', 'custom_reporting', 'dedicated_support'],
          riskLevel: 'low'
        },
        {
          id: 'corp_002',
          companyName: 'Global Trade Inc',
          accountType: 'premium',
          status: 'pending',
          registrationDate: '2024-03-01',
          lastActivity: '2024-03-08',
          totalTransactions: 0,
          totalVolume: 0,
          users: 5,
          primaryContact: {
            name: 'Sarah Johnson',
            email: 'sarah@globaltrade.com',
            phone: '+1-555-987-6543',
            role: 'Finance Manager'
          },
          billingAddress: {
            street: '456 Commerce St',
            city: 'Chicago',
            state: 'IL',
            country: 'United States',
            postalCode: '60601'
          },
          verificationStatus: {
            business: 'pending',
            documents: 'incomplete',
            compliance: 'under_review'
          },
          limits: {
            dailyTransaction: 100000,
            monthlyVolume: 2000000,
            singleTransaction: 25000
          },
          features: ['bulk_payments', 'standard_reporting'],
          riskLevel: 'medium'
        }
      ];
      
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.primaryContact.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(account => account.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(account => account.accountType === typeFilter);
    }

    setFilteredAccounts(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic': return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'complete':
      case 'compliant': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
      case 'incomplete':
      case 'under_review': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
      case 'expired':
      case 'non_compliant': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleCreateAccount = () => {
    setShowCreateForm(true);
    setSelectedAccount(null);
  };

  const handleEditAccount = (account: CorporateAccount) => {
    setSelectedAccount(account);
    setShowCreateForm(true);
  };

  const handleSubmitForm = (formData: Partial<CorporateAccount>) => {
    if (selectedAccount) {
      onUpdateAccount(selectedAccount.id, formData);
    } else {
      onCreateAccount(formData);
    }
    setShowCreateForm(false);
    setSelectedAccount(null);
  };

  if (showCreateForm) {
    return (
      <AccountForm
        account={selectedAccount}
        onSubmit={handleSubmitForm}
        onCancel={() => {
          setShowCreateForm(false);
          setSelectedAccount(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Corporate Account Management</h1>
          <p className="text-gray-600">Manage enterprise customer accounts and settings</p>
        </div>
        <Button onClick={handleCreateAccount}>
          <Plus className="w-4 h-4 mr-2" />
          New Account
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Accounts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Company name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Account Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Corporate Accounts ({filteredAccounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading accounts...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No accounts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAccounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg">{account.companyName}</h3>
                        <p className="text-gray-600 text-sm">{account.primaryContact.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(account.status)}>
                        {account.status.toUpperCase()}
                      </Badge>
                      <Badge className={getTypeColor(account.accountType)}>
                        {account.accountType.toUpperCase()}
                      </Badge>
                      <Badge className={getRiskLevelColor(account.riskLevel)}>
                        {account.riskLevel.toUpperCase()} RISK
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Transactions</p>
                      <p className="font-semibold">{account.totalTransactions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Volume</p>
                      <p className="font-semibold">${account.totalVolume.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Users</p>
                      <p className="font-semibold">{account.users}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Activity</p>
                      <p className="font-semibold">{new Date(account.lastActivity).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {getVerificationIcon(account.verificationStatus.business)}
                        <span className="text-sm">Business</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getVerificationIcon(account.verificationStatus.documents)}
                        <span className="text-sm">Documents</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getVerificationIcon(account.verificationStatus.compliance)}
                        <span className="text-sm">Compliance</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(account.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAccount(account)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteAccount(account.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AccountFormProps {
  account?: CorporateAccount | null;
  onSubmit: (data: Partial<CorporateAccount>) => void;
  onCancel: () => void;
}

function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    companyName: account?.companyName || '',
    accountType: account?.accountType || 'basic',
    primaryContact: {
      name: account?.primaryContact.name || '',
      email: account?.primaryContact.email || '',
      phone: account?.primaryContact.phone || '',
      role: account?.primaryContact.role || ''
    },
    billingAddress: {
      street: account?.billingAddress.street || '',
      city: account?.billingAddress.city || '',
      state: account?.billingAddress.state || '',
      country: account?.billingAddress.country || '',
      postalCode: account?.billingAddress.postalCode || ''
    },
    limits: {
      dailyTransaction: account?.limits.dailyTransaction || 10000,
      monthlyVolume: account?.limits.monthlyVolume || 100000,
      singleTransaction: account?.limits.singleTransaction || 5000
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {account ? 'Edit Corporate Account' : 'Create Corporate Account'}
          </CardTitle>
          <CardDescription>
            {account ? 'Update account information and settings' : 'Add a new corporate customer account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="limits">Limits</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, accountType: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <Input
                      id="contactName"
                      value={formData.primaryContact.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, name: e.target.value }
                      }))}
                      placeholder="Primary contact name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactRole">Role</Label>
                    <Input
                      id="contactRole"
                      value={formData.primaryContact.role}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, role: e.target.value }
                      }))}
                      placeholder="Job title/role"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.primaryContact.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, email: e.target.value }
                      }))}
                      placeholder="contact@company.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      value={formData.primaryContact.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        primaryContact: { ...prev.primaryContact, phone: e.target.value }
                      }))}
                      placeholder="+1-555-123-4567"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.billingAddress.street}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      billingAddress: { ...prev.billingAddress, street: e.target.value }
                    }))}
                    placeholder="123 Business Ave"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.billingAddress.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, city: e.target.value }
                      }))}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.billingAddress.state}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, state: e.target.value }
                      }))}
                      placeholder="NY"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.billingAddress.country}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, country: e.target.value }
                      }))}
                      placeholder="United States"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.billingAddress.postalCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        billingAddress: { ...prev.billingAddress, postalCode: e.target.value }
                      }))}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="limits" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="dailyLimit">Daily Transaction Limit ($)</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    value={formData.limits.dailyTransaction}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      limits: { ...prev.limits, dailyTransaction: Number(e.target.value) }
                    }))}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyLimit">Monthly Volume Limit ($)</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    value={formData.limits.monthlyVolume}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      limits: { ...prev.limits, monthlyVolume: Number(e.target.value) }
                    }))}
                    placeholder="100000"
                  />
                </div>
                <div>
                  <Label htmlFor="singleLimit">Single Transaction Limit ($)</Label>
                  <Input
                    id="singleLimit"
                    type="number"
                    value={formData.limits.singleTransaction}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      limits: { ...prev.limits, singleTransaction: Number(e.target.value) }
                    }))}
                    placeholder="5000"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-6 border-t">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                {account ? 'Update Account' : 'Create Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
