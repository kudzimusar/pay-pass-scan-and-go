import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import MobileHeader from "@/components/mobile-header";
import TransactionItem from "@/components/transaction-item";

export default function TransactionHistory() {
  const [activeFilter, setActiveFilter] = useState('All');
  const { token } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/user/transactions'],
    enabled: !!token,
  });

  const filterOptions = ['All', 'Bus', 'Shops', 'Bills', 'Transfers'];

  const filteredTransactions = transactions?.filter((transaction: any) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bus') return transaction.category === 'bus';
    if (activeFilter === 'Shops') return transaction.category === 'shop';
    if (activeFilter === 'Bills') return transaction.category === 'utility';
    if (activeFilter === 'Transfers') return transaction.category === 'transfer';
    return true;
  }) || [];

  const groupTransactionsByDate = (transactions: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(transaction);
    });
    
    return groups;
  };

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gradient-paypass pt-12 pb-6 px-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <h1 className="text-lg font-semibold">Transaction History</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-white/10 p-1 rounded-lg">
          {filterOptions.map((filter) => (
            <Button
              key={filter}
              variant="ghost"
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 py-2 px-3 text-sm rounded-md ${
                activeFilter === filter
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-blue-100'
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Transaction List */}
      <div className="flex-1 px-6 py-4 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                {i % 3 === 0 && (
                  <Skeleton className="h-5 w-20 mb-3" />
                )}
                <Skeleton className="h-16 w-full rounded-xl mb-3" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedTransactions).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date}>
                <h2 className="text-sm font-medium text-gray-500 mb-3">{date}</h2>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-500 text-sm">
                {activeFilter === 'All' 
                  ? "You haven't made any transactions yet."
                  : `No ${activeFilter.toLowerCase()} transactions found.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
