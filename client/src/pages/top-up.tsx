import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import MobileHeader from "@/components/mobile-header";
import { 
  Smartphone, 
  Globe, 
  MapPin, 
  ChevronRight 
} from "lucide-react";

export default function TopUp() {
  const { toast } = useToast();
  const { token } = useAuth();

  const handleTopUp = async (method: string, currency: 'USD' | 'ZWL', amount: string) => {
    try {
      const response = await apiRequest('POST', '/api/wallet/topup', {
        amount,
        currency,
        method
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Top-up Successful!",
          description: `${currency} ${amount} has been added to your wallet.`,
        });
      }
    } catch (error) {
      toast({
        title: "Top-up Failed",
        description: "Unable to process top-up. Please try again.",
        variant: "destructive",
      });
    }
  };

  const TopUpOption = ({ 
    icon, 
    title, 
    description, 
    bgColor, 
    iconColor,
    onClick 
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    bgColor: string;
    iconColor: string;
    onClick: () => void;
  }) => (
    <Button
      variant="outline"
      onClick={onClick}
      className="w-full p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left h-auto"
    >
      <div className="flex items-center w-full">
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center mr-4`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <ChevronRight className="text-gray-400 h-5 w-5" />
      </div>
    </Button>
  );

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Top Up Wallet" showBack />
      
      <div className="flex-1 px-6 py-6 overflow-y-auto bg-gray-50">
        <div className="space-y-6">
          {/* Mobile Money */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mobile Money</h2>
            <div className="space-y-3">
              <TopUpOption
                icon={<Smartphone className="h-6 w-6" />}
                title="EcoCash"
                description="Top up from your EcoCash wallet"
                bgColor="bg-green-100"
                iconColor="text-green-600"
                onClick={() => handleTopUp('EcoCash', 'USD', '25.00')}
              />
              
              <TopUpOption
                icon={<Smartphone className="h-6 w-6" />}
                title="TeleCash"
                description="Top up from your TeleCash wallet"
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
                onClick={() => handleTopUp('TeleCash', 'USD', '20.00')}
              />
            </div>
          </div>
          
          {/* International Remittance */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">International Remittance</h2>
            <div className="space-y-3">
              <TopUpOption
                icon={<Globe className="h-6 w-6" />}
                title="Mukuru"
                description="Receive money from abroad"
                bgColor="bg-orange-100"
                iconColor="text-orange-600"
                onClick={() => handleTopUp('Mukuru', 'USD', '50.00')}
              />
              
              <TopUpOption
                icon={<Globe className="h-6 w-6" />}
                title="WorldRemit"
                description="Instant transfers from overseas"
                bgColor="bg-purple-100"
                iconColor="text-purple-600"
                onClick={() => handleTopUp('WorldRemit', 'USD', '100.00')}
              />
            </div>
          </div>
          
          {/* Cash Agents */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cash Agents</h2>
            <TopUpOption
              icon={<MapPin className="h-6 w-6" />}
              title="Find Cash Agent"
              description="Deposit cash at nearby agents"
              bgColor="bg-gray-100"
              iconColor="text-gray-600"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Cash agent locations will be available soon.",
                });
              }}
            />
          </div>

          {/* Demo Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-paypass-blue mb-2">Demo Mode</h3>
            <p className="text-sm text-gray-700">
              In this demo, tapping any top-up option will simulate adding funds to your wallet. 
              In the real app, you would be redirected to the respective payment provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
