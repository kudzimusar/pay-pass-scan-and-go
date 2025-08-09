import { useQuery } from "@tanstack/react-query";
import { QrCode, Send, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import BalanceCard from "@/components/balance-card";
import TransactionItem from "@/components/transaction-item";

export default function Dashboard() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['/api/user/wallet'],
    enabled: !!token,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/user/transactions'],
    enabled: !!token,
  });

  if (!user) {
    setLocation("/");
    return null;
  }

  if (walletLoading) {
    return (
      <div className="flex flex-col h-screen">
        <div className="bg-gradient-paypass pt-12 pb-6 px-6 text-white">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Skeleton className="h-6 w-32 bg-white/20" />
              <Skeleton className="h-4 w-24 bg-white/20 mt-1" />
            </div>
            <Skeleton className="h-8 w-8 rounded bg-white/20" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl bg-white/20" />
            <Skeleton className="h-20 w-full rounded-xl bg-white/20" />
          </div>
        </div>
        <div className="flex-1 px-6 py-6">
          <Skeleton className="h-32 w-full rounded-xl mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const recentTransactions = transactions?.slice(0, 3) || [];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-gradient-paypass pt-12 pb-6 px-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-lg font-semibold">Welcome, {user.fullName}</h1>
            <p className="text-blue-100 text-sm">Ready to pay?</p>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Button>
          </Link>
        </div>
        
        {/* Balance Cards */}
        <div className="space-y-3">
          <BalanceCard 
            currency="USD" 
            balance={wallet?.usdBalance || "0.00"} 
            label="USD Balance" 
          />
          <BalanceCard 
            currency="ZWL" 
            balance={wallet?.zwlBalance || "0.00"} 
            label="ZWL Balance" 
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto bg-gray-50">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          {/* Tap to Pay Button */}
          <Link href="/qr-scanner">
            <Button className="w-full bg-paypass-blue text-white rounded-xl p-6 mb-4 hover:bg-blue-700 h-auto">
              <div className="text-center">
                <QrCode className="h-8 w-8 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Tap to Pay</h3>
                <p className="text-blue-100 text-sm">Scan QR code to pay</p>
              </div>
            </Button>
          </Link>
          
          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/send-money">
              <Button variant="outline" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md h-auto">
                <div className="text-center w-full">
                  <Send className="h-5 w-5 text-paypass-green mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Send Money</h3>
                  <p className="text-xs text-gray-500">To friends & family</p>
                </div>
              </Button>
            </Link>
            
            <Link href="/pay-bills">
              <Button variant="outline" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md h-auto">
                <div className="text-center w-full">
                  <FileText className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900">Pay Bills</h3>
                  <p className="text-xs text-gray-500">Utilities & more</p>
                </div>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/transactions" className="text-paypass-blue text-sm font-medium">
              View All
            </Link>
          </div>
          
          {transactionsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <div className="text-gray-400 mb-4">
                <QrCode className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500 text-sm mb-4">Start by scanning a QR code to make your first payment</p>
              <Link href="/qr-scanner">
                <Button className="bg-paypass-blue hover:bg-blue-700">
                  Make Your First Payment
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
}
