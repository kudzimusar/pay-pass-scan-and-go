'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Camera } from 'lucide-react';

interface KYCFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    countryOfResidence: string;
    phoneNumber: string;
    email: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  identification: {
    idType: string;
    idNumber: string;
    issueDate: string;
    expiryDate: string;
    issuingCountry: string;
  };
  occupation: {
    employmentStatus: string;
    occupation: string;
    employer: string;
    monthlyIncome: string;
    sourceOfIncome: string;
  };
  documents: {
    identityDocument: File | null;
    addressProof: File | null;
    incomeProof: File | null;
    selfie: File | null;
  };
}

interface KYCFormProps {
  onSubmit: (data: KYCFormData) => void;
  onSaveDraft: (data: Partial<KYCFormData>) => void;
  initialData?: Partial<KYCFormData>;
  isLoading?: boolean;
}

export function KYCForm({ onSubmit, onSaveDraft, initialData, isLoading = false }: KYCFormProps) {
  const [formData, setFormData] = useState<KYCFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      countryOfResidence: '',
      phoneNumber: '',
      email: '',
      ...initialData?.personalInfo
    },
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      ...initialData?.address
    },
    identification: {
      idType: '',
      idNumber: '',
      issueDate: '',
      expiryDate: '',
      issuingCountry: '',
      ...initialData?.identification
    },
    occupation: {
      employmentStatus: '',
      occupation: '',
      employer: '',
      monthlyIncome: '',
      sourceOfIncome: '',
      ...initialData?.occupation
    },
    documents: {
      identityDocument: null,
      addressProof: null,
      incomeProof: null,
      selfie: null,
      ...initialData?.documents
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const totalSteps = 5;

  const updatePersonalInfo = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const updateAddress = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const updateIdentification = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      identification: { ...prev.identification, [field]: value }
    }));
  };

  const updateOccupation = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      occupation: { ...prev.occupation, [field]: value }
    }));
  };

  const handleFileUpload = (field: keyof KYCFormData['documents'], file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [field]: file }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.personalInfo.firstName) newErrors.firstName = 'First name is required';
        if (!formData.personalInfo.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.personalInfo.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.personalInfo.nationality) newErrors.nationality = 'Nationality is required';
        break;
      case 2:
        if (!formData.address.street) newErrors.street = 'Street address is required';
        if (!formData.address.city) newErrors.city = 'City is required';
        if (!formData.address.country) newErrors.country = 'Country is required';
        break;
      case 3:
        if (!formData.identification.idType) newErrors.idType = 'ID type is required';
        if (!formData.identification.idNumber) newErrors.idNumber = 'ID number is required';
        break;
      case 4:
        if (!formData.occupation.employmentStatus) newErrors.employmentStatus = 'Employment status is required';
        if (!formData.occupation.sourceOfIncome) newErrors.sourceOfIncome = 'Source of income is required';
        break;
      case 5:
        if (!formData.documents.identityDocument) newErrors.identityDocument = 'Identity document is required';
        if (!formData.documents.addressProof) newErrors.addressProof = 'Address proof is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        onSubmit(formData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft(formData);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            i + 1 <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {i + 1 < currentStep ? <CheckCircle className="w-5 h-5" /> : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`flex-1 h-1 mx-2 ${
              i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderPersonalInfoStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.personalInfo.firstName}
            onChange={(e) => updatePersonalInfo('firstName', e.target.value)}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.personalInfo.lastName}
            onChange={(e) => updatePersonalInfo('lastName', e.target.value)}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>
      
      <div>
        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.personalInfo.dateOfBirth}
          onChange={(e) => updatePersonalInfo('dateOfBirth', e.target.value)}
          className={errors.dateOfBirth ? 'border-red-500' : ''}
        />
        {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nationality">Nationality *</Label>
          <Select onValueChange={(value) => updatePersonalInfo('nationality', value)}>
            <SelectTrigger className={errors.nationality ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="ZW">Zimbabwe</SelectItem>
              <SelectItem value="ZA">South Africa</SelectItem>
              <SelectItem value="NG">Nigeria</SelectItem>
              <SelectItem value="KE">Kenya</SelectItem>
            </SelectContent>
          </Select>
          {errors.nationality && <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>}
        </div>
        <div>
          <Label htmlFor="countryOfResidence">Country of Residence</Label>
          <Select onValueChange={(value) => updatePersonalInfo('countryOfResidence', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="ZW">Zimbabwe</SelectItem>
              <SelectItem value="ZA">South Africa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            value={formData.personalInfo.phoneNumber}
            onChange={(e) => updatePersonalInfo('phoneNumber', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.personalInfo.email}
            onChange={(e) => updatePersonalInfo('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="street">Street Address *</Label>
        <Input
          id="street"
          value={formData.address.street}
          onChange={(e) => updateAddress('street', e.target.value)}
          className={errors.street ? 'border-red-500' : ''}
          placeholder="123 Main Street, Apt 4B"
        />
        {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.address.city}
            onChange={(e) => updateAddress('city', e.target.value)}
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>
        <div>
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            value={formData.address.state}
            onChange={(e) => updateAddress('state', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            value={formData.address.postalCode}
            onChange={(e) => updateAddress('postalCode', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="country">Country *</Label>
          <Select onValueChange={(value) => updateAddress('country', value)}>
            <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="ZW">Zimbabwe</SelectItem>
              <SelectItem value="ZA">South Africa</SelectItem>
            </SelectContent>
          </Select>
          {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
        </div>
      </div>
    </div>
  );

  const renderIdentificationStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="idType">ID Type *</Label>
        <Select onValueChange={(value) => updateIdentification('idType', value)}>
          <SelectTrigger className={errors.idType ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select ID type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="driving_license">Driving License</SelectItem>
            <SelectItem value="national_id">National ID Card</SelectItem>
            <SelectItem value="residence_permit">Residence Permit</SelectItem>
          </SelectContent>
        </Select>
        {errors.idType && <p className="text-red-500 text-sm mt-1">{errors.idType}</p>}
      </div>

      <div>
        <Label htmlFor="idNumber">ID Number *</Label>
        <Input
          id="idNumber"
          value={formData.identification.idNumber}
          onChange={(e) => updateIdentification('idNumber', e.target.value)}
          className={errors.idNumber ? 'border-red-500' : ''}
        />
        {errors.idNumber && <p className="text-red-500 text-sm mt-1">{errors.idNumber}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            value={formData.identification.issueDate}
            onChange={(e) => updateIdentification('issueDate', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.identification.expiryDate}
            onChange={(e) => updateIdentification('expiryDate', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="issuingCountry">Issuing Country</Label>
        <Select onValueChange={(value) => updateIdentification('issuingCountry', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select issuing country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="UK">United Kingdom</SelectItem>
            <SelectItem value="ZW">Zimbabwe</SelectItem>
            <SelectItem value="ZA">South Africa</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderOccupationStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="employmentStatus">Employment Status *</Label>
        <Select onValueChange={(value) => updateOccupation('employmentStatus', value)}>
          <SelectTrigger className={errors.employmentStatus ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select employment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employed">Employed</SelectItem>
            <SelectItem value="self_employed">Self-Employed</SelectItem>
            <SelectItem value="unemployed">Unemployed</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        {errors.employmentStatus && <p className="text-red-500 text-sm mt-1">{errors.employmentStatus}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            value={formData.occupation.occupation}
            onChange={(e) => updateOccupation('occupation', e.target.value)}
            placeholder="Software Engineer"
          />
        </div>
        <div>
          <Label htmlFor="employer">Employer</Label>
          <Input
            id="employer"
            value={formData.occupation.employer}
            onChange={(e) => updateOccupation('employer', e.target.value)}
            placeholder="Company Name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="monthlyIncome">Monthly Income (USD)</Label>
        <Select onValueChange={(value) => updateOccupation('monthlyIncome', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select income range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-1000">$0 - $1,000</SelectItem>
            <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
            <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
            <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
            <SelectItem value="10000+">$10,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sourceOfIncome">Source of Income *</Label>
        <Select onValueChange={(value) => updateOccupation('sourceOfIncome', value)}>
          <SelectTrigger className={errors.sourceOfIncome ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select source of income" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="salary">Salary/Wages</SelectItem>
            <SelectItem value="business">Business Income</SelectItem>
            <SelectItem value="investment">Investment Income</SelectItem>
            <SelectItem value="pension">Pension</SelectItem>
            <SelectItem value="benefits">Government Benefits</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.sourceOfIncome && <p className="text-red-500 text-sm mt-1">{errors.sourceOfIncome}</p>}
      </div>
    </div>
  );

  const renderDocumentUploadStep = () => (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please upload clear, high-quality images or PDFs of your documents. All documents must be valid and not expired.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUpload
          title="Identity Document *"
          description="Passport, Driver's License, or National ID"
          file={formData.documents.identityDocument}
          onFileSelect={(file) => handleFileUpload('identityDocument', file)}
          error={errors.identityDocument}
          icon={<FileText className="w-6 h-6" />}
        />

        <DocumentUpload
          title="Address Proof *"
          description="Utility bill, Bank statement, or Lease agreement"
          file={formData.documents.addressProof}
          onFileSelect={(file) => handleFileUpload('addressProof', file)}
          error={errors.addressProof}
          icon={<FileText className="w-6 h-6" />}
        />

        <DocumentUpload
          title="Income Proof"
          description="Pay stub, Tax return, or Bank statement"
          file={formData.documents.incomeProof}
          onFileSelect={(file) => handleFileUpload('incomeProof', file)}
          icon={<FileText className="w-6 h-6" />}
        />

        <DocumentUpload
          title="Selfie Verification"
          description="Clear selfie photo for identity verification"
          file={formData.documents.selfie}
          onFileSelect={(file) => handleFileUpload('selfie', file)}
          icon={<Camera className="w-6 h-6" />}
          accept="image/*"
        />
      </div>
    </div>
  );

  const stepTitles = [
    'Personal Information',
    'Address Information',
    'Identification',
    'Occupation & Income',
    'Document Upload'
  ];

  const stepDescriptions = [
    'Provide your basic personal details',
    'Enter your current address information',
    'Add your identification document details',
    'Share your employment and income information',
    'Upload required verification documents'
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">KYC Verification</CardTitle>
        <CardDescription>
          Complete your identity verification to unlock all PayPass features
        </CardDescription>
        {renderStepIndicator()}
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-semibold">{stepTitles[currentStep - 1]}</h3>
          <p className="text-gray-600">{stepDescriptions[currentStep - 1]}</p>
        </div>

        {currentStep === 1 && renderPersonalInfoStep()}
        {currentStep === 2 && renderAddressStep()}
        {currentStep === 3 && renderIdentificationStep()}
        {currentStep === 4 && renderOccupationStep()}
        {currentStep === 5 && renderDocumentUploadStep()}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious} disabled={isLoading}>
              Previous
            </Button>
          )}
          <Button variant="ghost" onClick={handleSaveDraft} disabled={isLoading}>
            Save Draft
          </Button>
        </div>

        <Button 
          onClick={handleNext} 
          disabled={isLoading}
          className="min-w-24"
        >
          {isLoading ? 'Processing...' : currentStep === totalSteps ? 'Submit KYC' : 'Next'}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface DocumentUploadProps {
  title: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  error?: string;
  icon: React.ReactNode;
  accept?: string;
}

function DocumentUpload({ 
  title, 
  description, 
  file, 
  onFileSelect, 
  error, 
  icon, 
  accept = "image/*,.pdf" 
}: DocumentUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className={`border-2 border-dashed rounded-lg p-4 ${
      error ? 'border-red-500' : file ? 'border-green-500 bg-green-50' : 'border-gray-300'
    }`}>
      <div className="text-center">
        <div className="flex justify-center mb-2">
          {file ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <div className="text-gray-400">{icon}</div>
          )}
        </div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        
        {file ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600 font-medium">{file.name}</p>
            <label className="inline-block">
              <input
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Replace
              </Button>
            </label>
          </div>
        ) : (
          <label className="block">
            <input
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </label>
        )}
        
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    </div>
  );
}