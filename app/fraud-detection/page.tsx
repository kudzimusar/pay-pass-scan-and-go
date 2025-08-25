'use client';

import React from 'react';
import FraudDashboard from '@/components/fraud-detection/fraud-dashboard';

export default function FraudDetectionPage() {
  return (
    <div className="container mx-auto p-6">
      <FraudDashboard />
    </div>
  );
}