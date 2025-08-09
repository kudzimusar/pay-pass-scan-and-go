import { ArrowLeft, Settings, X } from "lucide-react";
import { Link } from "wouter";

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  showSettings?: boolean;
  showClose?: boolean;
  onClose?: () => void;
  rightAction?: React.ReactNode;
  gradient?: boolean;
  className?: string;
}

export default function MobileHeader({
  title,
  showBack = false,
  backTo = "/dashboard",
  showSettings = false,
  showClose = false,
  onClose,
  rightAction,
  gradient = true,
  className = ""
}: MobileHeaderProps) {
  const headerClasses = gradient 
    ? "bg-gradient-paypass text-white"
    : "bg-white text-gray-900 border-b border-gray-200";

  return (
    <div className={`pt-12 pb-6 px-6 ${headerClasses} ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {showBack && (
            <Link href={backTo}>
              <ArrowLeft className="h-6 w-6 mr-3 cursor-pointer" />
            </Link>
          )}
          {showClose && onClose && (
            <button onClick={onClose} className="mr-3">
              <X className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center">
          {rightAction}
          {showSettings && (
            <Link href="/settings">
              <Settings className="h-6 w-6 cursor-pointer" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
