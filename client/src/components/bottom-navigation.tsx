import { Home, History, QrCode, Send, User } from "lucide-react";
import { Link, useLocation } from "wouter";

interface BottomNavigationProps {
  userType?: 'user' | 'operator';
}

export default function BottomNavigation({ userType = 'user' }: BottomNavigationProps) {
  const [location] = useLocation();

  if (userType === 'operator') {
    return (
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex justify-around">
          <Link href="/operator" className={`flex flex-col items-center py-2 ${location === '/operator' ? 'text-paypass-blue' : 'text-gray-400'}`}>
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          <Link href="/operator/qr" className={`flex flex-col items-center py-2 ${location.includes('/operator/qr') ? 'text-paypass-blue' : 'text-gray-400'}`}>
            <QrCode className="h-5 w-5 mb-1" />
            <span className="text-xs">QR Codes</span>
          </Link>
          <Link href="/operator/reports" className={`flex flex-col items-center py-2 ${location.includes('/operator/reports') ? 'text-paypass-blue' : 'text-gray-400'}`}>
            <History className="h-5 w-5 mb-1" />
            <span className="text-xs">Reports</span>
          </Link>
          <Link href="/settings" className={`flex flex-col items-center py-2 ${location === '/settings' ? 'text-paypass-blue' : 'text-gray-400'}`}>
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3">
      <div className="flex justify-around">
        <Link href="/dashboard" className={`flex flex-col items-center py-2 ${location === '/dashboard' ? 'text-paypass-blue' : 'text-gray-400'}`}>
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </Link>
        <Link href="/transactions" className={`flex flex-col items-center py-2 ${location === '/transactions' ? 'text-paypass-blue' : 'text-gray-400'}`}>
          <History className="h-5 w-5 mb-1" />
          <span className="text-xs">History</span>
        </Link>
        <Link href="/qr-scanner" className={`flex flex-col items-center py-2 ${location === '/qr-scanner' ? 'text-paypass-blue' : 'text-gray-400'}`}>
          <QrCode className="h-5 w-5 mb-1" />
          <span className="text-xs">Scan</span>
        </Link>
        <Link href="/send-money" className={`flex flex-col items-center py-2 ${location === '/send-money' ? 'text-paypass-blue' : 'text-gray-400'}`}>
          <Send className="h-5 w-5 mb-1" />
          <span className="text-xs">Send</span>
        </Link>
        <Link href="/settings" className={`flex flex-col items-center py-2 ${location === '/settings' ? 'text-paypass-blue' : 'text-gray-400'}`}>
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Profile</span>
        </Link>
      </div>
    </div>
  );
}
