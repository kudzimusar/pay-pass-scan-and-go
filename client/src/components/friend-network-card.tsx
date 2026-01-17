"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Send, 
  Shield, 
  Clock, 
  DollarSign, 
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  MessageCircle,
  Building2,
  User2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";

interface FriendNetworkCardProps {
  friend: {
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
  };
  onSendPayment: (friendId: string) => void;
  onViewDetails: (friendId: string) => void;
  onSendWhatsAppRequest?: (friendId: string) => void;
}

const relationshipStyles = {
  family: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <User2 className="w-3 h-3 mr-1" />,
    label: "Family"
  },
  friend: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <User2 className="w-3 h-3 mr-1" />,
    label: "Friend"
  },
  business: {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: <Building2 className="w-3 h-3 mr-1" />,
    label: "Organization"
  },
};

export function FriendNetworkCard({ friend, onSendPayment, onViewDetails, onSendWhatsAppRequest }: FriendNetworkCardProps) {
  const monthlyLimit = parseFloat(friend.monthlyLimit);
  const totalSent = parseFloat(friend.totalSent);
  const remainingLimit = monthlyLimit - totalSent;
  const usagePercentage = (totalSent / monthlyLimit) * 100;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith("+263")) {
      return `+263 ${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  const style = relationshipStyles[friend.relationship];

  return (
    <TooltipProvider>
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-l-4 border-l-transparent hover:border-l-blue-500 bg-white" data-testid={`friend-card-${friend.id}`}>
        <CardHeader className="pb-3 p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-gray-100 group-hover:border-blue-100 transition-colors">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                    {getInitials(friend.recipient.fullName)}
                  </AvatarFallback>
                </Avatar>
                {friend.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500 fill-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-base sm:text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {friend.nickname || friend.recipient.fullName}
                  </CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className={`${style.color} text-[10px] uppercase tracking-wider font-bold py-0.5`}>
                    {style.icon}
                    {style.label}
                  </Badge>
                  {friend.whatsappEnabled && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] uppercase tracking-wider font-bold py-0.5">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(friend.id)}
                  className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="pt-0 p-4 sm:p-5 space-y-4">
          {/* Contact & Location */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
              <Phone className="w-3 h-3 mr-2 text-blue-500" />
              <span className="truncate">{formatPhoneNumber(friend.recipient.phone)}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
              <MapPin className="w-3 h-3 mr-2 text-red-500" />
              <span>{friend.recipient.countryCode === "ZW" ? "Zimbabwe" : friend.recipient.countryCode}</span>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Budget Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">Monthly Budget</span>
              <span className="font-bold text-gray-900">{formatCurrency(monthlyLimit)}</span>
            </div>
            <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  usagePercentage > 90
                    ? "bg-red-500"
                    : usagePercentage > 70
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-medium">
              <span className={usagePercentage > 90 ? "text-red-600" : "text-gray-500"}>
                Used: {formatCurrency(totalSent)} ({Math.round(usagePercentage)}%)
              </span>
              <span className="text-gray-500">
                Left: {formatCurrency(remainingLimit)}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 py-2 bg-blue-50/30 rounded-lg px-3">
            <div className="space-y-0.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-tight font-semibold">Total Sent</p>
              <div className="flex items-center text-sm font-bold text-gray-900">
                <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                {formatCurrency(totalSent)}
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-gray-500 uppercase tracking-tight font-semibold">Last Payment</p>
              <div className="flex items-center text-sm font-bold text-gray-900">
                <Clock className="w-3 h-3 mr-1 text-blue-600" />
                {friend.lastPaymentAt 
                  ? format(new Date(friend.lastPaymentAt), "MMM dd")
                  : "None"
                }
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 pt-1">
            <Button
              onClick={() => onSendPayment(friend.id)}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-all active:scale-[0.98]"
              disabled={remainingLimit <= 0}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Send Money
            </Button>
            
            {friend.whatsappEnabled && onSendWhatsAppRequest && (
              <Button
                variant="outline"
                onClick={() => onSendWhatsAppRequest(friend.id)}
                className="w-full h-10 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 font-semibold"
                disabled={remainingLimit <= 0}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Request
              </Button>
            )}
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Added {format(new Date(friend.createdAt), "MMM yyyy")}
            </div>
            {remainingLimit <= 0 && (
              <div className="flex items-center text-red-500 font-bold">
                <AlertCircle className="w-3 h-3 mr-1" />
                Limit Reached
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
