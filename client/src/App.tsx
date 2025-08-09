import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import { useAuthState } from "@/hooks/use-auth";

// Pages
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
import Settings from "@/pages/settings";
import OperatorDashboard from "@/pages/operator-dashboard";
import OperatorLogin from "@/pages/operator-login";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/qr-scanner" component={QRScanner} />
      <Route path="/payment-confirmation" component={PaymentConfirmation} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/top-up" component={TopUp} />
      <Route path="/transactions" component={TransactionHistory} />
      <Route path="/send-money" component={SendMoney} />
      <Route path="/pay-bills" component={PayBills} />
      <Route path="/settings" component={Settings} />
      <Route path="/operator" component={OperatorDashboard} />
      <Route path="/operator-login" component={OperatorLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const authState = useAuthState();

  return (
    <AuthProvider value={authState}>
      <TooltipProvider>
        <div className="mobile-container">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
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
