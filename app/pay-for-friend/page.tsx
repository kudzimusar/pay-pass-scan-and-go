"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Clock,
  MessageCircle,
  Send
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
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [whatsappContacts, setWhatsappContacts] = useState<any[]>([]);
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [showWhatsAppSync, setShowWhatsAppSync] = useState(false);

  // Mock user data - in real app, this would come from auth context
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

    // Load friends list
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      // Mock data - in real app, this would be an API call
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
        },
        {
          id: "friend-2",
          relationship: "friend",
          nickname: "Best Friend",
          isVerified: true,
          monthlyLimit: "1000.00",
          totalSent: "125.00",
          lastPaymentAt: "2024-01-10T14:20:00Z",
          createdAt: "2024-01-05T11:15:00Z",
          recipient: {
            id: "recipient-2",
            fullName: "Tendai Mukamuri",
            phone: "+263772345678",
            countryCode: "ZW",
          },
        },
        {
          id: "friend-3",
          relationship: "business",
          isVerified: false,
          monthlyLimit: "500.00",
          totalSent: "0.00",
          createdAt: "2024-01-20T16:45:00Z",
          recipient: {
            id: "recipient-3",
            fullName: "Local Business Partner",
            phone: "+263773456789",
            countryCode: "ZW",
          },
        },
      ];
      setFriends(mockFriends);
    } catch (error) {
      toast.error("Failed to load friends list");
    }
  };

  const handleSendPayment = (friendId: string) => {
    setSelectedFriendId(friendId);
    setShowPaymentForm(true);
  };

  const handleViewDetails = (friendId: string) => {
    // Navigate to friend details page
    toast.info("Friend details view coming soon");
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    setPaymentLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Payment initiated successfully! Your friend will receive the money within 1-3 business days.");
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

  // WhatsApp integration functions
  const handleWhatsAppSync = async () => {
    setSyncingContacts(true);
    try {
      // In a real app, this would integrate with WhatsApp Business API
      // For demo purposes, we'll simulate syncing contacts
      const mockWhatsAppContacts = [
        { number: "+263771234567", name: "John Doe", isWhatsAppUser: true },
        { number: "+263772345678", name: "Jane Smith", isWhatsAppUser: true },
        { number: "+263773456789", name: "Mike Johnson", isWhatsAppUser: true },
      ];

      const response = await fetch('/api/whatsapp/contacts/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          contacts: mockWhatsAppContacts,
          autoCreateFriendNetwork: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setWhatsappContacts(result.contacts);
        toast.success(`Synced ${result.stats.totalContacts} WhatsApp contacts successfully!`);
        
        // Reload friends list to show new connections
        await loadFriends();
      } else {
        throw new Error('Failed to sync contacts');
      }
    } catch (error) {
      toast.error("Failed to sync WhatsApp contacts. Please try again.");
      console.error('WhatsApp sync error:', error);
    } finally {
      setSyncingContacts(false);
      setShowWhatsAppSync(false);
    }
  };

  const sendWhatsAppPaymentRequest = async (friend: Friend, amount: number, currency: string, message: string) => {
    try {
      const response = await fetch('/api/whatsapp/payment-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          to: friend.recipient.phone,
          amount,
          currency,
          message,
          friendNetworkId: friend.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Payment request sent via WhatsApp!");
        return result;
      } else {
        throw new Error('Failed to send WhatsApp payment request');
      }
    } catch (error) {
      toast.error("Failed to send WhatsApp payment request.");
      console.error('WhatsApp payment request error:', error);
      throw error;
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.recipient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSentThisMonth = friends.reduce((sum, friend) => sum + parseFloat(friend.totalSent), 0);
  const totalLimit = friends.reduce((sum, friend) => sum + parseFloat(friend.monthlyLimit), 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user?.isInternational) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            The "Pay for your Friend" feature is only available for international users. 
            Please update your account settings to access cross-border payments.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Globe className="w-8 h-8 text-blue-600" />
            <span>Pay for your Friend</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Send money to friends and family back home with ease
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {user.kycStatus === "verified" && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          
          {/* WhatsApp Sync Button */}
          <Dialog open={showWhatsAppSync} onOpenChange={setShowWhatsAppSync}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                <MessageCircle className="w-4 h-4 mr-2" />
                Sync WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sync WhatsApp Contacts</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Import your WhatsApp contacts to easily send payment requests through WhatsApp. 
                  This will create friend networks for existing PayPass users in your contacts.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Benefits:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Send payment requests via WhatsApp</li>
                    <li>• Instant notifications to friends</li>
                    <li>• Auto-create trusted friend networks</li>
                    <li>• Seamless payment experience</li>
                  </ul>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleWhatsAppSync} 
                    disabled={syncingContacts}
                    className="flex-1"
                  >
                    {syncingContacts ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Sync Contacts
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowWhatsAppSync(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Friend</DialogTitle>
              </DialogHeader>
              <p className="text-gray-600">
                Feature coming soon! You'll be able to add friends by phone number.
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KYC Warning */}
      {user.kycStatus !== "verified" && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Identity Verification Required</p>
              <p>Complete your identity verification to send payments over $1,000 and access all features.</p>
              <Button variant="outline" size="sm" className="mt-2">
                Complete Verification
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Friends</p>
                <p className="text-2xl font-bold">{friends.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Sent This Month</p>
                <p className="text-2xl font-bold">${totalSentThisMonth.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Monthly Limits</p>
                <p className="text-2xl font-bold">${totalLimit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold">{friends.filter(f => f.isVerified).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="friends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="send">Send Money</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Friends Grid */}
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFriends.map((friend) => (
                <FriendNetworkCard
                  key={friend.id}
                  friend={{
                    ...friend,
                    whatsappEnabled: true, // In real app, this would be determined by WhatsApp contact sync
                  }}
                  onSendPayment={handleSendPayment}
                  onViewDetails={handleViewDetails}
                  onSendWhatsAppRequest={async (friendId) => {
                    const friendData = friends.find(f => f.id === friendId);
                    if (friendData) {
                      try {
                        await sendWhatsAppPaymentRequest(friendData, 50, "USD", "Quick payment request via WhatsApp");
                      } catch (error) {
                        // Error already handled in sendWhatsAppPaymentRequest
                      }
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No friends found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? "No friends match your search." : "Start by adding friends you want to send money to."}
                </p>
                <Button onClick={() => setShowAddFriend(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Friend
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="send">
          <CrossBorderPaymentForm
            friends={friends}
            onSubmit={handlePaymentSubmit}
            isLoading={paymentLoading}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment History</h3>
              <p className="text-gray-600">
                Payment history feature coming soon. You'll be able to view all your cross-border transactions here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Money</DialogTitle>
          </DialogHeader>
          {selectedFriendId && (
            <CrossBorderPaymentForm
              friends={friends.filter(f => f.id === selectedFriendId)}
              onSubmit={handlePaymentSubmit}
              isLoading={paymentLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}