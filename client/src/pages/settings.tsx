import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/mobile-header";
import { 
  User, 
  Key, 
  Fingerprint, 
  Bell, 
  DollarSign, 
  HelpCircle, 
  FileText,
  ChevronRight,
  LogOut,
  Trash2
} from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [biometricEnabled, setBiometricEnabled] = useState(user?.biometricEnabled || false);

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleLogout = () => {
    logout();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    setLocation("/");
  };

  const handleBiometricToggle = (enabled: boolean) => {
    setBiometricEnabled(enabled);
    toast({
      title: enabled ? "Biometric Enabled" : "Biometric Disabled",
      description: enabled 
        ? "Fingerprint authentication is now enabled."
        : "Fingerprint authentication is now disabled.",
    });
  };

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-3">{title}</h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle,
    onClick,
    rightElement
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center">
        <div className="text-gray-400 mr-3">
          {icon}
        </div>
        <div>
          <span className="font-medium text-gray-900 block">{title}</span>
          {subtitle && (
            <span className="text-sm text-gray-500">{subtitle}</span>
          )}
        </div>
      </div>
      {rightElement || <ChevronRight className="text-gray-400 h-5 w-5" />}
    </button>
  );

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Settings" showBack />
      
      <div className="flex-1 px-6 py-6 bg-gray-50 overflow-y-auto">
        {/* Profile Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 bg-paypass-blue/10 rounded-full flex items-center justify-center mr-4">
              <User className="text-paypass-blue h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.fullName}</h2>
              <p className="text-gray-600">{user.phone}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="outline"
            size="sm"
            className="text-paypass-blue border-paypass-blue hover:bg-paypass-blue hover:text-white"
          >
            Edit Profile
          </Button>
        </div>
        
        {/* Settings Menu */}
        <div className="space-y-6">
          {/* Security */}
          <SettingsSection title="Security">
            <SettingsItem
              icon={<Key className="h-5 w-5" />}
              title="Change PIN"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "PIN change functionality will be available soon.",
                });
              }}
            />
            <SettingsItem
              icon={<Fingerprint className="h-5 w-5" />}
              title="Biometric Authentication"
              subtitle={biometricEnabled ? "Enabled" : "Disabled"}
              rightElement={
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={handleBiometricToggle}
                />
              }
            />
          </SettingsSection>
          
          {/* Preferences */}
          <SettingsSection title="Preferences">
            <SettingsItem
              icon={<Bell className="h-5 w-5" />}
              title="Notifications"
              subtitle="Push notifications, SMS alerts"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Notification settings will be available soon.",
                });
              }}
            />
            <SettingsItem
              icon={<DollarSign className="h-5 w-5" />}
              title="Default Currency"
              subtitle="USD"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Currency preferences will be available soon.",
                });
              }}
            />
          </SettingsSection>
          
          {/* Support */}
          <SettingsSection title="Support">
            <SettingsItem
              icon={<HelpCircle className="h-5 w-5" />}
              title="Help & Support"
              subtitle="FAQs, Contact us"
              onClick={() => {
                toast({
                  title: "Help Center",
                  description: "For support, please contact support@paypass.zw",
                });
              }}
            />
            <SettingsItem
              icon={<FileText className="h-5 w-5" />}
              title="Terms & Privacy"
              subtitle="Legal documents"
              onClick={() => {
                toast({
                  title: "Legal Documents",
                  description: "Terms and privacy policy will open soon.",
                });
              }}
            />
          </SettingsSection>
          
          {/* Account Actions */}
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium mb-3 hover:bg-gray-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <Button
              variant="ghost"
              className="w-full text-paypass-red font-medium hover:bg-red-50"
              onClick={() => {
                toast({
                  title: "Account Deletion",
                  description: "Please contact support to delete your account.",
                  variant: "destructive",
                });
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
