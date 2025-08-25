"use client";
// AML Screening component for compliance checks
// AML Screening

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertTriangle, CheckCircle, Clock, User, Building, Globe } from 'lucide-react';

interface AMLScreeningResult {
  id: string;
  entityName: string;
  entityType: 'individual' | 'business';
  riskScore: number;
  matches: Array<{
    source: string;
    confidence: number;
    details: string;
    category: 'PEP' | 'Sanctions' | 'Watchlist' | 'Adverse Media';
  }>;
  status: 'clear' | 'review' | 'blocked';
  screenedAt: string;
}

interface AMLScreeningProps {
  onScreeningComplete?: (result: AMLScreeningResult) => void;
}

const AMLScreening: React.FC<AMLScreeningProps> = ({ onScreeningComplete }) => {
  const [screeningData, setScreeningData] = useState({
    entityName: '',
    entityType: 'individual' as const,
    dateOfBirth: '',
    nationality: '',
    businessId: '',
    address: ''
  });
  
  const [isScreening, setIsScreening] = useState(false);
  const [screeningResults, setScreeningResults] = useState<AMLScreeningResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AMLScreeningResult | null>(null);

  const mockScreeningData: AMLScreeningResult[] = [
    {
      id: '1',
      entityName: 'John Smith',
      entityType: 'individual',
      riskScore: 85,
      matches: [
        {
          source: 'OFAC SDN List',
          confidence: 95,
          details: 'Exact name match with known sanctions target',
          category: 'Sanctions'
        },
        {
          source: 'EU Consolidated List',
          confidence: 80,
          details: 'Similar name with different DOB',
          category: 'Sanctions'
        }
      ],
      status: 'blocked',
      screenedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      entityName: 'Jane Doe',
      entityType: 'individual',
      riskScore: 25,
      matches: [
        {
          source: 'PEP Database',
          confidence: 40,
          details: 'Possible relative of PEP',
          category: 'PEP'
        }
      ],
      status: 'review',
      screenedAt: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      entityName: 'ABC Corporation',
      entityType: 'business',
      riskScore: 5,
      matches: [],
      status: 'clear',
      screenedAt: '2024-01-15T08:45:00Z'
    }
  ];

  useEffect(() => {
    setScreeningResults(mockScreeningData);
  }, []);

  const handleScreening = async () => {
    if (!screeningData.entityName.trim()) return;

    setIsScreening(true);

    // Simulate API call
    setTimeout(() => {
      const newResult: AMLScreeningResult = {
        id: Date.now().toString(),
        entityName: screeningData.entityName,
        entityType: screeningData.entityType,
        riskScore: Math.floor(Math.random() * 100),
        matches: Math.random() > 0.7 ? [
          {
            source: 'Watchlist Database',
            confidence: Math.floor(Math.random() * 100),
            details: 'Potential match requiring manual review',
            category: 'Watchlist'
          }
        ] : [],
        status: Math.random() > 0.8 ? 'blocked' : Math.random() > 0.5 ? 'review' : 'clear',
        screenedAt: new Date().toISOString()
      };

      setScreeningResults(prev => [newResult, ...prev]);
      setSelectedResult(newResult);
      setIsScreening(false);
      
      if (onScreeningComplete) {
        onScreeningComplete(newResult);
      }
    }, 2000);
  };

  const getRiskBadgeVariant = (score: number): "default" | "destructive" | "secondary" | "outline" => {
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'secondary';
    return 'outline';
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'blocked': return 'destructive';
      case 'review': return 'secondary';
      case 'clear': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            AML Screening
          </CardTitle>
          <CardDescription>
            Screen individuals and businesses against sanctions lists, PEP databases, and watchlists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
            </TabsList>
            
            <TabsContent value="individual" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="individual-name">Full Name</Label>
                  <Input
                    id="individual-name"
                    placeholder="Enter full name"
                    value={screeningData.entityName}
                    onChange={(e) => setScreeningData(prev => ({ 
                      ...prev, 
                      entityName: e.target.value,
                      entityType: 'individual'
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={screeningData.dateOfBirth}
                    onChange={(e) => setScreeningData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="Enter nationality"
                    value={screeningData.nationality}
                    onChange={(e) => setScreeningData(prev => ({ ...prev, nationality: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    value={screeningData.address}
                    onChange={(e) => setScreeningData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="business" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    placeholder="Enter business name"
                    value={screeningData.entityName}
                    onChange={(e) => setScreeningData(prev => ({ 
                      ...prev, 
                      entityName: e.target.value,
                      entityType: 'business'
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-id">Business ID</Label>
                  <Input
                    id="business-id"
                    placeholder="Registration number"
                    value={screeningData.businessId}
                    onChange={(e) => setScreeningData(prev => ({ ...prev, businessId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-address">Business Address</Label>
                  <Input
                    id="business-address"
                    placeholder="Enter business address"
                    value={screeningData.address}
                    onChange={(e) => setScreeningData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex gap-2">
            <Button 
              onClick={handleScreening} 
              disabled={!screeningData.entityName.trim() || isScreening}
              className="flex items-center gap-2"
            >
              {isScreening ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Screening...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Run Screening
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {screeningResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Screening Results</CardTitle>
            <CardDescription>
              Recent AML screening results and risk assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {screeningResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedResult?.id === result.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.entityType === 'individual' ? (
                        <User className="h-5 w-5 text-gray-500" />
                      ) : (
                        <Building className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <h4 className="font-medium">{result.entityName}</h4>
                        <p className="text-sm text-gray-500">
                          Screened on {new Date(result.screenedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRiskBadgeVariant(result.riskScore)}>
                        Risk: {result.riskScore}%
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedResult.status === 'blocked' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {selectedResult.status === 'review' && <Clock className="h-5 w-5 text-yellow-500" />}
              {selectedResult.status === 'clear' && <CheckCircle className="h-5 w-5 text-green-500" />}
              Screening Details: {selectedResult.entityName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Risk Score</Label>
                  <div className="mt-1">
                    <Badge variant={getRiskBadgeVariant(selectedResult.riskScore)} className="text-sm">
                      {selectedResult.riskScore}% Risk
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedResult.status)} className="text-sm">
                      {selectedResult.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Matches Found</Label>
                  <div className="mt-1 text-sm font-medium">
                    {selectedResult.matches.length} matches
                  </div>
                </div>
              </div>

              {selectedResult.matches.length > 0 && (
                <div className="space-y-3">
                  <Label>Match Details</Label>
                  {selectedResult.matches.map((match, index) => (
                    <Alert key={index}>
                      <Globe className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{match.source}</span>
                            <Badge variant="outline" className="text-xs">
                              {match.confidence}% confidence
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {match.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{match.details}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {selectedResult.status === 'review' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    Approve
                  </Button>
                  <Button variant="destructive" size="sm">
                    Block
                  </Button>
                  <Button variant="secondary" size="sm">
                    Request Additional Info
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AMLScreening;
