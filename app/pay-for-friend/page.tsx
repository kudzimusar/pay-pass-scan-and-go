"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FriendNetworkCard } from "@/components/friend-network-card";
import { CrossBorderPaymentForm } from "@/components/cross-border-payment-form";
import { 
  Users, 
  Plus, 
  Search, 
  Globe, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  MessageCircle,
  Building2,
  Filter,
  LayoutGrid,
  List
} from "lucide-react";
import { toast } from "sonner";

interface Friend {
  id: string;
  relationship: "family" | "friend" | "business";
  nickname?: string;
  isVerified: boolean;
  monthlyLimit: string;
  totalSent: string;
  lastPaymentAt?: string;
  createdAt: string;
  recipient: {
    id: string;
    fullName: string;
    phone: string;
    countryCode: string;
  };
  whatsappEnabled?: boolean;
}

interface User {
  id: string;
  fullName: string;
  isInternational: boolean;
  kycStatus: string;
  countryCode: string;
}

export default function PayForFriendPage() {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setUser({
        id: "user-123",
        fullName: "John Diaspora",
        isInternational: true,
        kycStatus: "verified",
        countryCode: "US",
      });
      setLoading(false);
    }, 1000);

    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      // Mock data representing the diverse stakeholders
      const mockFriends: Friend[] = [
        {
          id: "friend-1",
          relationship: "family",
          nickname: "Mom",
          isVerified: true,
          monthlyLimit: "2000.00",
          totalSent: "450.00",
          lastPaymentAt: "2024-01-15T10:30:00Z",
          createdAt: "2023-12-01T09:00:00Z",
          recipient: {
            id: "recipient-1",
            fullName: "Mary Diaspora",
            phone: "+263771234567",
            countryCode: "ZW",
          },
          whatsappEnabled: true
        },
        {
          id: "org-1",
          relationship: "business",
          nickname: "ZESA Holdings",
          isVerified: true,
          monthlyLimit: "500.00",
          totalSent: "120.00",
          lastPaymentAt: "2024-01-10T14:20:00Z",
          createdAt: "2024-01-05T11:15:00Z",
          recipient: {
            id: "recipient-org-1",
            fullName: "ZESA Utilities",
            phone: "+263242123456",
            countryCode: "ZW",
          },
        },
        {
          id: "org-2",
          relationship: "business",
          nickname: "ZUPCO Transport",
          isVerified: true,
          monthlyLimit: "300.00",
          totalSent: "45.00",
          lastPaymentAt: "2024-01-16T08:00:00Z",
          createdAt: "2024-01-05T11:15:00Z",
          recipient: {
            id: "recipient-org-2",
            fullName: "ZUPCO Public Transport",
            phone: "+263242987654",
            countryCode: "ZW",
          },
        },
        {
          id: "org-3",
          relationship: "business",
          nickname: "OK Zimbabwe",
          isVerified: true,
          monthlyLimit: "1000.00",
          totalSent: "850.00",
          lastPaymentAt: "2024-01-12T16:45:00Z",
          createdAt: "2023-11-20T10:00:00Z",
          recipient: {
            id: "recipient-org-3",
            fullName: "OK Supermarkets",
            phone: "+263242555666",
            countryCode: "ZW",
          },
        },
        {
          id: "friend-2",
          relationship: "friend",
          nickname: "Tinashe",
          isVerified: false,
          monthlyLimit: "200.00",
          totalSent: "0.00",
          createdAt: "2024-01-17T12:00:00Z",
          recipient: {
            id: "recipient-2",
            fullName: "Tinashe Mutasa",
            phone: "+263772111222",
            countryCode: "ZW",
          },
          whatsappEnabled: true
        }
      ];
      setFriends(mockFriends);
    } catch (error) {
      toast.error("Failed to load contacts");
    }
  };

  const handleSendPayment = (friendId: string) => {
    setSelectedFriendId(friendId);
    setShowPaymentForm(true);
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    setPaymentLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Payment processed successfully!");
      setShowPaymentForm(false);
      setSelectedFriendId(null);
      
      // Reload friends to update totals
      await loadFriends();
    } catch (error) {
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = (friend.recipient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          friend.nickname?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "individuals") return matchesSearch && friend.relationship !== "business";
    if (activeTab === "organizations") return matchesSearch && friend.relationship === "business";
    return matchesSearch;
  });

  const totalSentThisMonth = friends.reduce((sum, friend) => sum + parseFloat(friend.totalSent), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Syncing with PayPass Network...</p>
        </div>
      </div>
    );
  }

  if (!user?.isInternational) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription className="font-medium">
            The "Pay for your Friend" feature is exclusively for international users. 
            Please verify your international status in account settings to enable cross-border payments.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Hero Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Pay for your Friend
                </h1>
              </div>
              <p className="text-gray-500 max-w-md">
                Empowering the diaspora to support loved ones and pay organizations in Zimbabwe directly.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600">Monthly Support</p>
                <p className="text-2xl font-black text-blue-900">${totalSentThisMonth.toFixed(2)}</p>
              </div>
              <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                <Plus className="w-5 h-5 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Controls & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search friends, family or organizations..." 
              className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
              <TabsList className="bg-gray-100 p-1 h-11">
                <TabsTrigger value="all" className="px-4">All</TabsTrigger>
                <TabsTrigger value="individuals" className="px-4">Individuals</TabsTrigger>
                <TabsTrigger value="organizations" className="px-4">Organizations</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Separator orientation="vertical" className="h-8 mx-2 hidden lg:block" />
            
            <div className="flex items-center bg-gray-100 p-1 rounded-lg h-11">
              <Button 
                variant={viewMode === "grid" ? "white" : "ghost"} 
                size="sm" 
                className="h-9 w-9 p-0"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "white" : "ghost"} 
                size="sm" 
                className="h-9 w-9 p-0"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contacts Grid */}
        {filteredFriends.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
            {filteredFriends.map((friend) => (
              <FriendNetworkCard 
                key={friend.id} 
                friend={friend} 
                onSendPayment={handleSendPayment}
                onViewDetails={(id) => toast.info(`Viewing details for ${id}`)}
                onSendWhatsAppRequest={(id) => toast.success(`WhatsApp request sent to ${id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No contacts found</h3>
            <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            <Button variant="link" className="mt-2 text-blue-600" onClick={() => {setSearchTerm(""); setActiveTab("all");}}>
              Clear all filters
            </Button>
          </div>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none">
            <CrossBorderPaymentForm 
              friends={friends} 
              onSubmit={handlePaymentSubmit}
              isLoading={paymentLoading}
            />
          </DialogContent>
        </Dialog>

        {/* Quick Stats & Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">PayPass Secure</h3>
                <p className="text-blue-100 text-sm">Every transaction is encrypted and monitored by our AI fraud detection system.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="bg-green-50 w-10 h-10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Organization Network</h3>
                <p className="text-gray-500 text-sm">We've partnered with 500+ Zimbabwean organizations for instant bill payments.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="bg-purple-50 w-10 h-10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">WhatsApp Ready</h3>
                <p className="text-gray-500 text-sm">Send payment requests and receipts directly through WhatsApp for easy tracking.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
