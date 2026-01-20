import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { CrossBorderPaymentForm } from "./cross-border-payment-form";
import { 
  CheckCircle2, 
  MessageCircle, 
  Building2, 
  MoreHorizontal,
  MapPin
} from "lucide-react";

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

interface FriendNetworkCardProps {
  friend: Friend;
  viewMode: "grid" | "list";
}

export function FriendNetworkCard({ friend, viewMode }: FriendNetworkCardProps) {
  const usagePercent = (friend.spentThisMonth / friend.monthlyLimit) * 100;
  const isOverLimit = usagePercent >= 90;

  if (viewMode === "list") {
    return (
      <Card className="card-native p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
              friend.type === "organization" ? "bg-slate-800" : "bg-primary"
            }`}>
              {friend.name.substring(0, 2).toUpperCase()}
            </div>
            {friend.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-50" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{friend.nickname || friend.name}</h3>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {friend.location}
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl bg-slate-900 hover:bg-slate-800 h-10 px-4">
                Pay
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-0 overflow-hidden border-none">
              <DialogHeader className="sr-only">
                <DialogTitle>Send Payment to {friend.nickname || friend.name}</DialogTitle>
                <DialogDescription>Enter the amount and details for your cross-border payment.</DialogDescription>
              </DialogHeader>
              <CrossBorderPaymentForm recipient={friend} />
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-native p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white font-bold text-2xl shadow-inner ${
              friend.type === "organization" ? "bg-slate-800" : "bg-primary"
            }`}>
              {friend.name.substring(0, 2).toUpperCase()}
            </div>
            {friend.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">{friend.nickname || friend.name}</h3>
              {friend.type === "organization" && (
                <Building2 className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {friend.location}
            </p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="rounded-full text-slate-400">
          <MoreHorizontal className="w-6 h-6" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
          <span className="text-slate-400">Monthly Budget</span>
          <span className={isOverLimit ? "text-red-500" : "text-slate-900"}>
            ${friend.spentThisMonth} / ${friend.monthlyLimit}
          </span>
        </div>
        <Progress 
          value={usagePercent} 
          className="h-2.5 rounded-full bg-slate-100" 
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex-1 rounded-2xl h-12 font-bold bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-200">
              Send Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-0 overflow-hidden border-none">
            <DialogHeader className="sr-only">
              <DialogTitle>Send Payment to {friend.nickname || friend.name}</DialogTitle>
              <DialogDescription>Enter the amount and details for your cross-border payment.</DialogDescription>
            </DialogHeader>
            <CrossBorderPaymentForm recipient={friend} />
          </DialogContent>
        </Dialog>
        
        {friend.hasWhatsApp && (
          <Button variant="outline" size="icon" className="rounded-2xl h-12 w-12 border-slate-100 text-green-600 hover:bg-green-50 hover:text-green-700">
            <MessageCircle className="w-6 h-6" />
          </Button>
        )}
      </div>
    </Card>
  );
}
