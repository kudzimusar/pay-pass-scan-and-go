import { Link } from "wouter";
import { QrCode, Users, Building2, Store, Handshake, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <QrCode className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">PayPass</h1>
            <p className="text-xl text-blue-100">Unified Payment Platform</p>
            <p className="text-blue-200 mt-2">Scan, Pay, Go - For Everyone</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Access</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            PayPass serves different stakeholders with tailored experiences. Select your role to access the appropriate dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Regular Users */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Regular Users</CardTitle>
              <CardDescription>
                Individual customers for payments, transfers, and bill payments
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/login">
                <Button className="w-full mb-4">Sign In</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Bus/Taxi Operators */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Bus/Taxi Operators</CardTitle>
              <CardDescription>
                Transport operators for fare collection and route management
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/operator-login">
                <Button className="w-full mb-4 bg-green-600 hover:bg-green-700">Operator Login</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Retailers/Merchants */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Store className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Retailers & Merchants</CardTitle>
              <CardDescription>
                Businesses, utilities, and service providers for payment collection
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/merchant-login">
                <Button className="w-full mb-4 bg-orange-600 hover:bg-orange-700">Merchant Login</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Mobile Money/Bank Partners */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Handshake className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Partners</CardTitle>
              <CardDescription>
                Mobile money providers, banks, and fintech partners for integration monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/partner-login">
                <Button className="w-full mb-4 bg-red-600 hover:bg-red-700">Partner Login</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Platform Admins */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Platform Admins</CardTitle>
              <CardDescription>
                System administrators for platform oversight and management
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/admin-login">
                <Button className="w-full mb-4 bg-purple-600 hover:bg-purple-700">Admin Login</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle className="text-xl">New User?</CardTitle>
              <CardDescription>
                Create a new account to start using PayPass
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/signup">
                <Button className="w-full mb-4 bg-gray-600 hover:bg-gray-700">Create Account</Button>
              </Link>
              <div className="text-sm text-gray-600">
                <p className="text-xs">
                  Join thousands of users already using PayPass for seamless payments
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">QR Payments</h4>
              <p className="text-sm text-gray-600">Quick and secure payments using QR codes</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <Building2 className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Transport Integration</h4>
              <p className="text-sm text-gray-600">Seamless fare collection for transport operators</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <Store className="h-8 w-8 text-orange-600 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Business Solutions</h4>
              <p className="text-sm text-gray-600">Complete payment solutions for businesses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}