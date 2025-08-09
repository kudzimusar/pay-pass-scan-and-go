import { Plus } from "lucide-react";
import { Link } from "wouter";

interface BalanceCardProps {
  currency: 'USD' | 'ZWL';
  balance: string;
  label: string;
}

export default function BalanceCard({ currency, balance, label }: BalanceCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-blue-100 text-sm">{label}</p>
          <p className={`font-bold ${currency === 'USD' ? 'text-2xl' : 'text-xl'}`}>
            {currency === 'USD' ? '$' : 'ZWL '}
            {balance}
          </p>
        </div>
        <div className="text-right">
          <p className="text-blue-100 text-xs">Available</p>
          <Link href="/top-up" className="text-white text-sm font-medium hover:text-blue-200 transition-colors">
            <Plus className="h-4 w-4 inline mr-1" />
            Top Up
          </Link>
        </div>
      </div>
    </div>
  );
}
