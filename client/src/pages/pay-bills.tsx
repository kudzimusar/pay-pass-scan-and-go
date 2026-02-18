import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import MobileHeader from "@/components/mobile-header";
import { 
  Zap, 
  Droplet, 
  Smartphone, 
  Wifi, 
  Tv, 
  GraduationCap
} from "lucide-react";

export default function PayBills() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const billCategories = [
    {
      id: 'electricity',
      title: 'Electricity',
      description: 'ZESA & ZETDC',
      icon: <Zap className="h-8 w-8" />,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      amount: '45.00',
      currency: 'USD'
    },
    {
      id: 'water',
      title: 'Water',
      description: 'City Council',
      icon: <Droplet className="h-8 w-8" />,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      amount: '25.00',
      currency: 'USD'
    },
    {
      id: 'airtime',
      title: 'Airtime',
      description: 'All networks',
      icon: <Smartphone className="h-8 w-8" />,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      amount: '10.00',
      currency: 'USD'
    },
    {
      id: 'internet',
      title: 'Internet',
      description: 'Data bundles',
      icon: <Wifi className="h-8 w-8" />,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      amount: '30.00',
      currency: 'USD'
    },
    {
      id: 'dstv',
      title: 'DStv',
      description: 'Subscription',
      icon: <Tv className="h-8 w-8" />,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      amount: '35.00',
      currency: 'USD'
    },
    {
      id: 'school',
      title: 'School Fees',
      description: 'Education',
      icon: <GraduationCap className="h-8 w-8" />,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      amount: '150.00',
      currency: 'USD'
    }
  ];

  const handleBillPayment = async (category: typeof billCategories[0]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to pay bills.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/payment/process', {
        userId: user.id,
        amount: parseFloat(category.amount),
        merchant: category.title,
        description: `Bill Payment: ${category.description}`,
        type: 'bill_payment'
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Bill Payment Successful!",
          description: `${category.title} bill of ${category.currency} ${category.amount} has been paid.`,
        });
      } else {
         toast({
          title: "Payment Failed",
          description: result.error || "Unable to process bill payment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Unable to process bill payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const BillCategory = ({ category }: { category: typeof billCategories[0] }) => (
    <Button
      variant="outline"
      onClick={() => handleBillPayment(category)}
      disabled={isLoading}
      className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left h-auto"
    >
      <div className="text-center w-full">
        <div className={`w-16 h-16 ${category.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
          <div className={category.iconColor}>
            {category.icon}
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{category.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{category.description}</p>
        <p className="text-sm font-medium text-paypass-blue">
          {category.currency} {category.amount}
        </p>
      </div>
    </Button>
  );

  return (
    <div className="flex flex-col h-screen">
      <MobileHeader title="Pay Bills" showBack />
      
      <div className="flex-1 px-6 py-6 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {billCategories.map((category) => (
            <BillCategory key={category.id} category={category} />
          ))}
        </div>

        {/* Recent Bills Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bills</h2>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <Zap className="text-yellow-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Electricity Bill</p>
                    <p className="text-xs text-gray-500">Last month • Paid</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">$42.50</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Droplet className="text-blue-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Water Bill</p>
                    <p className="text-xs text-gray-500">Last month • Paid</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">$28.75</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
