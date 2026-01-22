import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "./lib/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import { useAuthState } from "@/hooks/use-auth";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import QRScanner from "@/pages/qr-scanner";
import PaymentConfirmation from "@/pages/payment-confirmation";
import PaymentSuccess from "@/pages/payment-success";
import TopUp from "@/pages/top-up";
import TransactionHistory from "@/pages/transaction-history";
import SendMoney from "@/pages/send-money";
import PayBills from "@/pages/pay-bills";
import PayForFriend from "@/pages/pay-for-friend";
import Settings from "@/pages/settings";
import OperatorDashboard from "@/pages/operator-dashboard";
import OperatorLogin from "@/pages/operator-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLogin from "@/pages/admin-login";
import MerchantLogin from "@/pages/merchant-login";
import MerchantDashboard from "@/pages/merchant-dashboard";
import PartnerLogin from "@/pages/partner-login";
import PartnerDashboard from "@/pages/partner-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/qr-scanner" component={QRScanner} />
      <Route path="/payment-confirmation" component={PaymentConfirmation} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/top-up" component={TopUp} />
      <Route path="/transactions" component={TransactionHistory} />
      <Route path="/send-money" component={SendMoney} />
      <Route path="/pay-bills" component={PayBills} />
      <Route path="/pay-for-friend" component={PayForFriend} />
      <Route path="/settings" component={Settings} />
      <Route path="/operator" component={OperatorDashboard} />
      <Route path="/operator-login" component={OperatorLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/merchant-login" component={MerchantLogin} />
      <Route path="/merchant" component={MerchantDashboard} />
      <Route path="/partner-login" component={PartnerLogin} />
      <Route path="/partner" component={PartnerDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const authState = useAuthState();
  const [location] = useHashLocation();

  return (
    <AuthProvider value={authState}>
      <WouterRouter hook={useHashLocation}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WouterRouter>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
