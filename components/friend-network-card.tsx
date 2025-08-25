"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Shield, 
  Clock, 
  DollarSign, 
  Phone,
  MapPin,
  Calendar,
  TrendingUp
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
  };
  onSendPayment: (friendId: string) => void;
  onViewDetails: (friendId: string) => void;
}

const relationshipColors = {
  family: "bg-green-100 text-green-800 hover:bg-green-200",
  friend: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  business: "bg-purple-100 text-purple-800 hover:bg-purple-200",
};

const relationshipIcons = {
  family: "👨‍👩‍👧‍👦",
  friend: "👥",
  business: "🏢",
};

export function FriendNetworkCard({ friend, onSendPayment, onViewDetails }: FriendNetworkCardProps) {
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
    // Format +263771234567 to +263 77 123 4567
    if (phone.startsWith("+263")) {
      return `+263 ${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {getInitials(friend.recipient.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {friend.nickname || friend.recipient.fullName}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={relationshipColors[friend.relationship]}
                >
                  {relationshipIcons[friend.relationship]} {friend.relationship}
                </Badge>
                {friend.isVerified && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendPayment(friend.id)}
            className="shrink-0"
          >
            <Send className="w-4 h-4 mr-1" />
            Send
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              {formatPhoneNumber(friend.recipient.phone)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              {friend.recipient.countryCode === "ZW" ? "Zimbabwe" : friend.recipient.countryCode}
            </div>
          </div>

          <Separator />

          {/* Monthly Spending Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Monthly Limit</span>
              <span className="font-medium">{formatCurrency(monthlyLimit)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  usagePercentage > 80
                    ? "bg-red-500"
                    : usagePercentage > 60
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Used: {formatCurrency(totalSent)}</span>
              <span>Remaining: {formatCurrency(remainingLimit)}</span>
            </div>
          </div>

          <Separator />

          {/* Payment History Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-600">Total Sent</p>
                <p className="font-semibold">{formatCurrency(totalSent)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-600">Last Payment</p>
                <p className="font-semibold">
                  {friend.lastPaymentAt 
                    ? format(new Date(friend.lastPaymentAt), "MMM dd")
                    : "Never"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(friend.id)}
              className="flex-1"
            >
              View Details
            </Button>
            <Button
              size="sm"
              onClick={() => onSendPayment(friend.id)}
              className="flex-1"
              disabled={remainingLimit <= 0}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Send Money
            </Button>
          </div>

          {/* Connection Date */}
          <div className="text-xs text-gray-400 flex items-center justify-center">
            <Calendar className="w-3 h-3 mr-1" />
            Connected {format(new Date(friend.createdAt), "MMM dd, yyyy")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}