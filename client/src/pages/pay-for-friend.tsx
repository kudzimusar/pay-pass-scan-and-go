import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { FriendNetworkCard } from "@/components/friend-network-card";
import { CrossBorderPaymentForm } from "@/components/cross-border-payment-form";
import { 
  Users, 
  Plus, 
  Search, 
  Globe, 
  Shield, 
  TrendingUp,
  DollarSign,
  Building2,
  LayoutGrid,
  List,
  ChevronLeft,
  Bell,
  Home,
  Wallet,
  Settings,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface Friend {
  id: string;
  relationship: "family" | "friend" | "business";
  name: string;
  nickname?: string;
  location: string;
  isVerified: boolean;
  hasWhatsApp: boolean;
  monthlyLimit: number;
  spentThisMonth: number;
  lastTransaction?: string;
  avatar?: string;
  type: "individual" | "organization";
}

const MOCK_FRIENDS: Friend[] = [
  {
    id: "1",
    relationship: "family",
    name: "Tinashe Musar",
    nickname: "Brother",
    location: "Harare, Zimbabwe",
    isVerified: true,
    hasWhatsApp: true,
    monthlyLimit: 500,
    spentThisMonth: 320,
    lastTransaction: "2 days ago",
    type: "individual"
  },
  {
    id: "2",
    relationship: "business",
    name: "ZUPCO Transport",
    location: "National, Zimbabwe",
    isVerified: true,
    hasWhatsApp: false,
    monthlyLimit: 200,
    spentThisMonth: 45,
    lastTransaction: "1 week ago",
    type: "organization"
  },
  {
    id: "3",
    relationship: "friend",
    name: "Farai Gumbo",
    nickname: "Farai",
    location: "Bulawayo, Zimbabwe",
    isVerified: false,
    hasWhatsApp: true,
    monthlyLimit: 150,
    spentThisMonth: 0,
    type: "individual"
  },
  {
    id: "4",
    relationship: "business",
    name: "ZESA Holdings",
    location: "Harare, Zimbabwe",
    isVerified: true,
    hasWhatsApp: false,
    monthlyLimit: 300,
    spentThisMonth: 120,
    lastTransaction: "3 days ago",
    type: "organization"
  }
];

export default function PayForFriendPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  const filteredFriends = MOCK_FRIENDS.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         friend.nickname?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
                      (activeTab === "individuals" && friend.type === "individual") ||
                      (activeTab === "organizations" && friend.type === "organization");
    return matchesSearch && matchesTab;
  });

  const totalMonthlySupport = MOCK_FRIENDS.reduce((acc, f) => acc + f.spentThisMonth, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-start p-0 sm:p-4">
      <div className="mobile-container bg-white shadow-2xl sm:rounded-[3rem] overflow-hidden relative">
        {/* App Header */}
      <header className="app-header flex items-center justify-between">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setLocation("/")}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">Pay for Friend</h1>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Button>
      </header>

      <main className="app-content space-y-6">
        {/* Hero Stats Card */}
        <Card className="bg-primary text-white border-none rounded-[2.5rem] overflow-hidden shadow-lg shadow-primary/20">
          <CardContent className="p-8 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Monthly Support</p>
                <h2 className="text-4xl font-black mt-1">${totalMonthlySupport.toFixed(2)}</h2>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Globe className="w-4 h-4" />
              <span>Supporting 4 loved ones in Zimbabwe</span>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              placeholder="Search friends or organizations..." 
              className="input-native pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-slate-100 p-1 rounded-2xl w-full h-12">
                <TabsTrigger value="all" className="rounded-xl flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
                <TabsTrigger value="individuals" className="rounded-xl flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">People</TabsTrigger>
                <TabsTrigger value="organizations" className="rounded-xl flex-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">Orgs</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-2xl h-12 w-12 border-slate-100 shrink-0"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Network Grid/List */}
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4" : "space-y-3"}>
          {filteredFriends.map((friend) => (
            <FriendNetworkCard 
              key={friend.id} 
              friend={friend} 
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Dialog open={isAddingFriend} onOpenChange={setIsAddingFriend}>
            <DialogTrigger asChild>
              <Button className="h-24 rounded-[2rem] flex-col gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none shadow-none">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold">Add New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem]">
              <DialogHeader>
                <DialogTitle>Add to Network</DialogTitle>
                <DialogDescription>
                  Sync your contacts or add a Zimbabwean organization manually to your network.
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 text-center space-y-4">
                <Button className="w-full rounded-2xl h-14">Sync Contacts</Button>
                <Button variant="outline" className="w-full rounded-2xl h-14">Add Organization</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="h-24 rounded-[2rem] flex-col gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100 border-none shadow-none">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs font-bold">Verification</span>
          </Button>
        </div>
      </main>

      {/* App Navigation */}
      <nav className="app-nav">
        <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-slate-400" onClick={() => setLocation("/")}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Button>
        <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-primary">
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium">Friends</span>
        </Button>
        <div className="relative -top-6">
          <Button className="w-14 h-14 rounded-2xl shadow-lg shadow-primary/40 bg-primary">
            <Plus className="w-8 h-8" />
          </Button>
        </div>
        <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-slate-400" onClick={() => setLocation("/wallet")}>
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-medium">Wallet</span>
        </Button>
        <Button variant="ghost" className="flex-col gap-1 h-auto py-1 text-slate-400" onClick={() => setLocation("/settings")}>
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium">Settings</span>
        </Button>
        </nav>
      </div>
    </div>
  );
}
