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
  TrendingUp,
  MessageCircle
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

function FriendNetworkCardComponent({ friend, onSendPayment, onViewDetails, onSendWhatsAppRequest }: FriendNetworkCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  try {
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
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg" data-testid={`friend-card-${friend.nickname || friend.recipient.fullName}`}>
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm sm:text-base">
                {getInitials(friend.recipient.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {friend.nickname || friend.recipient.fullName}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`${relationshipColors[friend.relationship]} text-xs sm:text-sm`}
                >
                  {relationshipIcons[friend.relationship]} {friend.relationship}
                </Badge>
                {friend.isVerified && (
                  <Badge variant="outline" className="text-green-600 border-green-200 text-xs sm:text-sm">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {friend.whatsappEnabled && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs sm:text-sm">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    WhatsApp
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendPayment(friend.id)}
            className="shrink-0 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            data-testid="send-money-button"
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Send
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-4 sm:p-6">
        <div className="space-y-4">
          {/* Contact Information */}
          <div className="space-y-2">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              {formatPhoneNumber(friend.recipient.phone)}
            </div>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              {friend.recipient.countryCode === "ZW" ? "Zimbabwe" : friend.recipient.countryCode}
            </div>
          </div>

          <Separator />

          {/* Monthly Spending Limit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Monthly Limit</span>
              <span className="font-medium">{formatCurrency(monthlyLimit)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <div>
                <p className="text-gray-600">Total Sent</p>
                <p className="font-semibold">{formatCurrency(totalSent)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
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
          <form className="space-y-2 pt-2" data-testid="action-buttons">
            <Label htmlFor="view-details-button" className="sr-only">View friend details</Label>
            <Label htmlFor="send-money-button" className="sr-only">Send money to friend</Label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                id="view-details-button"
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(friend.id)}
                className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
                data-testid="view-details-button"
                aria-label={`View details for ${friend.nickname || friend.recipient.fullName}`}
              >
                View Details
              </Button>
              <Button
                id="send-money-button"
                size="sm"
                onClick={() => onSendPayment(friend.id)}
                className="flex-1 h-10 sm:h-9 text-xs sm:text-sm"
                disabled={remainingLimit <= 0}
                data-testid="send-money-button"
                aria-label={`Send money to ${friend.nickname || friend.recipient.fullName}`}
              >
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Send Money
              </Button>
            </div>
            {friend.whatsappEnabled && onSendWhatsAppRequest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendWhatsAppRequest(friend.id)}
                className="w-full h-10 sm:h-9 text-xs sm:text-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                disabled={remainingLimit <= 0}
                data-testid="whatsapp-request-button"
                aria-label={`Send WhatsApp payment request to ${friend.nickname || friend.recipient.fullName}`}
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Send WhatsApp Request
              </Button>
            )}
          </form>

          {/* Connection Date */}
          <div className="text-xs text-gray-400 flex items-center justify-center">
            <Calendar className="w-3 h-3 mr-1" />
            Connected {format(new Date(friend.createdAt), "MMM dd, yyyy")}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  } catch (error) {
    console.error('Error rendering FriendNetworkCard:', error);
    return (
      <Card className="p-4">
        <CardContent>
          <p className="text-red-600">Error loading friend information</p>
        </CardContent>
      </Card>
    );
  }
}

export const FriendNetworkCard = React.memo(FriendNetworkCardComponent);