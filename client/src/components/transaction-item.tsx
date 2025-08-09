import { Transaction } from "@shared/schema";
import { Bus, Plus, ShoppingCart, Zap, Send, ArrowDownLeft } from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
}

export default function TransactionItem({ transaction }: TransactionItemProps) {
  const getIcon = () => {
    switch (transaction.category) {
      case 'bus':
        return <Bus className="text-paypass-green" />;
      case 'transfer':
        if (transaction.type === 'topup') {
          return <Plus className="text-paypass-blue" />;
        }
        return <Send className="text-paypass-green" />;
      case 'utility':
        return <Zap className="text-yellow-600" />;
      case 'shop':
        return <ShoppingCart className="text-orange-500" />;
      default:
        return <ArrowDownLeft className="text-gray-500" />;
    }
  };

  const getIconBgColor = () => {
    switch (transaction.category) {
      case 'bus':
        return 'bg-paypass-green/10';
      case 'transfer':
        return transaction.type === 'topup' ? 'bg-blue-100' : 'bg-paypass-green/10';
      case 'utility':
        return 'bg-yellow-100';
      case 'shop':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getAmountColor = () => {
    if (transaction.type === 'topup' || transaction.type === 'receive') {
      return 'text-paypass-green';
    }
    return 'text-gray-900';
  };

  const formatAmount = () => {
    const prefix = transaction.type === 'topup' || transaction.type === 'receive' ? '+' : '-';
    const symbol = transaction.currency === 'USD' ? '$' : 'ZWL ';
    return `${prefix}${symbol}${transaction.amount}`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const transactionDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Today, ${transactionDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (diffInDays === 1) {
      return `Yesterday, ${transactionDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    
    return transactionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className={`w-10 h-10 ${getIconBgColor()} rounded-full flex items-center justify-center mr-3`}>
            {getIcon()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{transaction.description}</p>
            <p className="text-xs text-gray-500">
              {formatDate(transaction.createdAt!)} • {transaction.status}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${getAmountColor()}`}>
            {formatAmount()}
          </p>
          <p className="text-xs text-gray-500">{transaction.currency}</p>
        </div>
      </div>
    </div>
  );
}
