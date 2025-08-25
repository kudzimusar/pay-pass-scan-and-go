import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "summary";
    const timeRange = searchParams.get("timeRange") || "30d";
    const format = searchParams.get("format") || "json"; // json, csv, pdf

    switch (reportType) {
      case "financial":
        return generateFinancialReport(timeRange, format);
      case "user":
        return generateUserReport(timeRange, format);
      case "performance":
        return generatePerformanceReport(timeRange, format);
      case "security":
        return generateSecurityReport(timeRange, format);
      case "cross-border":
        return generateCrossBorderReport(timeRange, format);
      case "regulatory":
        return generateRegulatoryReport(timeRange, format);
      default:
        return generateSummaryReport(timeRange, format);
    }
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function generateFinancialReport(timeRange: string, format: string) {
  const report = {
    reportType: "financial",
    generatedAt: new Date().toISOString(),
    timeRange,
    
    summary: {
      totalRevenue: 125678.90,
      totalVolume: 2345678.12,
      totalTransactions: 12456,
      averageTransactionValue: 188.42,
    },
    
    revenueBreakdown: {
      transactionFees: {
        amount: 89012.34,
        percentage: 70.8,
        transactions: 11234,
      },
      exchangeFees: {
        amount: 23456.78,
        percentage: 18.7,
        transactions: 3456,
      },
      subscriptionFees: {
        amount: 8901.23,
        percentage: 7.1,
        subscribers: 456,
      },
      partnerCommissions: {
        amount: 4308.55,
        percentage: 3.4,
        partners: 12,
      },
    },
    
    currencyBreakdown: [
      { currency: "USD", volume: 1234567.89, revenue: 67890.12, percentage: 52.6 },
      { currency: "ZWL", volume: 987654321.12, revenue: 34567.89, percentage: 27.5 },
      { currency: "EUR", volume: 123456.78, revenue: 12345.67, percentage: 9.8 },
      { currency: "GBP", volume: 98765.43, revenue: 8901.23, percentage: 7.1 },
      { currency: "ZAR", volume: 54321.09, revenue: 1973.99, percentage: 3.0 },
    ],
    
    monthlyTrends: generateMonthlyFinancialTrends(),
    
    profitabilityAnalysis: {
      grossMargin: 78.5,
      operatingMargin: 34.2,
      netMargin: 23.8,
      customerAcquisitionCost: 45.67,
      customerLifetimeValue: 789.12,
      paybackPeriod: 5.2, // months
    },
  };

  if (format === "csv") {
    return generateCSVResponse(flattenReportData(report), "financial_report");
  }

  return NextResponse.json({ success: true, report });
}

async function generateUserReport(timeRange: string, format: string) {
  const report = {
    reportType: "user",
    generatedAt: new Date().toISOString(),
    timeRange,
    
    userMetrics: {
      totalUsers: 15678,
      activeUsers: 8901,
      newUsers: 1234,
      churned: 234,
      netGrowth: 1000,
    },
    
    userSegmentation: {
      byType: {
        international: { count: 3456, percentage: 22.0 },
        local: { count: 12222, percentage: 78.0 },
      },
      byKYC: {
        verified: { count: 8901, percentage: 56.8 },
        pending: { count: 4567, percentage: 29.1 },
        rejected: { count: 890, percentage: 5.7 },
        notStarted: { count: 1320, percentage: 8.4 },
      },
      byActivity: {
        highly_active: { count: 1567, percentage: 10.0, description: "10+ transactions/month" },
        active: { count: 4701, percentage: 30.0, description: "3-9 transactions/month" },
        occasional: { count: 6271, percentage: 40.0, description: "1-2 transactions/month" },
        dormant: { count: 3139, percentage: 20.0, description: "0 transactions/month" },
      },
    },
    
    geographicDistribution: [
      { country: "Zimbabwe", users: 7145, percentage: 45.6 },
      { country: "United States", users: 2345, percentage: 15.0 },
      { country: "United Kingdom", users: 1567, percentage: 10.0 },
      { country: "South Africa", users: 1234, percentage: 7.9 },
      { country: "Canada", users: 890, percentage: 5.7 },
      { country: "Others", users: 2497, percentage: 15.8 },
    ],
    
    retentionMetrics: {
      day1: 89.2,
      day7: 67.8,
      day30: 45.6,
      day90: 28.9,
      day365: 12.3,
    },
    
    cohortAnalysis: generateCohortAnalysis(),
  };

  if (format === "csv") {
    return generateCSVResponse(flattenReportData(report), "user_report");
  }

  return NextResponse.json({ success: true, report });
}

async function generateCrossBorderReport(timeRange: string, format: string) {
  const report = {
    reportType: "cross-border",
    generatedAt: new Date().toISOString(),
    timeRange,
    
    summary: {
      totalPayments: 3456,
      totalVolume: 567890.12,
      averageAmount: 164.25,
      successRate: 96.8,
      averageProcessingTime: 8.7, // hours
    },
    
    corridors: [
      { 
        from: "United States", 
        to: "Zimbabwe", 
        volume: 234567.89, 
        payments: 1456, 
        averageAmount: 161.12,
        growthRate: 23.4 
      },
      { 
        from: "United Kingdom", 
        to: "Zimbabwe", 
        volume: 156789.34, 
        payments: 890, 
        averageAmount: 176.28,
        growthRate: 34.7 
      },
      { 
        from: "South Africa", 
        to: "Zimbabwe", 
        volume: 98765.43, 
        payments: 567, 
        averageAmount: 174.23,
        growthRate: 12.8 
      },
      { 
        from: "Canada", 
        to: "Zimbabwe", 
        volume: 77767.46, 
        payments: 543, 
        averageAmount: 143.22,
        growthRate: 45.2 
      },
    ],
    
    paymentPurposes: [
      { purpose: "Family Support", percentage: 45.6, volume: 259049.87 },
      { purpose: "Education", percentage: 23.4, volume: 132926.35 },
      { purpose: "Medical", percentage: 12.8, percentage: 72690.34 },
      { purpose: "Business", percentage: 8.9, volume: 50533.12 },
      { purpose: "Investment", percentage: 5.2, volume: 29523.44 },
      { purpose: "Other", percentage: 4.1, volume: 23266.00 },
    ],
    
    complianceMetrics: {
      kycComplianceRate: 98.7,
      amlFlagsRaised: 23,
      amlFlagsResolved: 21,
      regulatoryReports: 456,
      averageComplianceTime: 2.3, // hours
    },
    
    fraudDetection: {
      transactionsAssessed: 3456,
      flaggedForReview: 123,
      confirmedFraud: 7,
      falsePositives: 16,
      accuracy: 97.8,
    },
    
    partnerPerformance: [
      { 
        partner: "Zimbabwe Central Bank", 
        volume: 234567.89, 
        successRate: 98.9, 
        averageTime: 2.1 
      },
      { 
        partner: "Standard Chartered", 
        volume: 156789.34, 
        successRate: 96.7, 
        averageTime: 4.5 
      },
      { 
        partner: "CABS", 
        volume: 89012.34, 
        successRate: 94.2, 
        averageTime: 6.8 
      },
    ],
  };

  if (format === "csv") {
    return generateCSVResponse(flattenReportData(report), "cross_border_report");
  }

  return NextResponse.json({ success: true, report });
}

async function generateRegulatoryReport(timeRange: string, format: string) {
  const report = {
    reportType: "regulatory",
    generatedAt: new Date().toISOString(),
    timeRange,
    confidential: true,
    
    complianceOverview: {
      totalTransactions: 12456,
      crossBorderTransactions: 3456,
      highValueTransactions: 567, // Over $10,000
      suspiciousActivities: 23,
      reportedActivities: 12,
    },
    
    kycAmlCompliance: {
      totalUsersRequiringKYC: 8901,
      kycVerified: 7890,
      kycPending: 789,
      kycRejected: 222,
      complianceRate: 88.6,
      
      amlScreening: {
        transactionsScreened: 12456,
        flaggedTransactions: 234,
        reportedToAuthorities: 12,
        falsePositives: 210,
      },
    },
    
    transactionReporting: {
      currencyTransactionReports: 45, // CTRs
      suspiciousActivityReports: 12, // SARs
      internationalTransferReports: 456,
      
      reportingThresholds: {
        domesticCash: 10000,
        internationalTransfer: 3000,
        aggregateDaily: 10000,
      },
    },
    
    riskAssessment: {
      highRiskCountries: ["Country A", "Country B"],
      sanctionedEntities: 0,
      pepScreening: {
        screened: 8901,
        matches: 12,
        falsePositives: 8,
        confirmed: 4,
      },
    },
    
    auditTrail: {
      totalLogEntries: 1234567,
      securityEvents: 89,
      accessViolations: 3,
      dataBreaches: 0,
      systemDowntime: 0.2, // percentage
    },
    
    regulatoryUpdates: [
      {
        date: "2024-01-15",
        regulation: "Zimbabwe AML Guidelines Update",
        impact: "Updated transaction monitoring thresholds",
        implemented: true,
      },
      {
        date: "2024-01-10",
        regulation: "US OFAC Sanctions Update",
        impact: "Added new sanctioned entities to screening",
        implemented: true,
      },
    ],
  };

  if (format === "csv") {
    return generateCSVResponse(flattenReportData(report), "regulatory_report");
  }

  return NextResponse.json({ success: true, report });
}

async function generateSummaryReport(timeRange: string, format: string) {
  const report = {
    reportType: "summary",
    generatedAt: new Date().toISOString(),
    timeRange,
    
    executiveSummary: {
      totalUsers: 15678,
      totalTransactions: 12456,
      totalVolume: 2345678.90,
      totalRevenue: 125678.90,
      growthRate: 23.4,
      systemUptime: 99.87,
    },
    
    keyMetrics: {
      userGrowth: "+15.6%",
      transactionGrowth: "+23.4%",
      volumeGrowth: "+34.2%",
      revenueGrowth: "+28.9%",
      customerSatisfaction: 8.7,
      fraudRate: "0.06%",
    },
    
    achievements: [
      "Launched 'Pay for your Friend' feature with 23% adoption rate",
      "Integrated 3 mobile money providers with 94.6% success rate",
      "Achieved 99.2% fraud detection accuracy",
      "Processed $2.3M in cross-border payments",
      "Maintained 99.87% system uptime",
    ],
    
    challenges: [
      "OneMoney integration showing 12% decline in success rate",
      "Cross-border processing time above 8-hour target",
      "KYC verification backlog of 789 applications",
    ],
    
    recommendations: [
      "Investigate and resolve OneMoney integration issues",
      "Optimize cross-border payment processing workflow",
      "Scale KYC verification team to reduce backlog",
      "Expand marketing in high-performing diaspora corridors",
    ],
    
    financialHighlights: {
      revenue: 125678.90,
      expenses: 89012.34,
      profit: 36666.56,
      profitMargin: 29.2,
    },
  };

  if (format === "csv") {
    return generateCSVResponse(flattenReportData(report), "summary_report");
  }

  return NextResponse.json({ success: true, report });
}

// Helper functions

function generateMonthlyFinancialTrends() {
  const months = [];
  const currentDate = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const baseRevenue = 100000 + (11 - i) * 5000; // Growing trend
    const randomVariation = Math.random() * 10000 - 5000;
    
    months.push({
      month: date.toISOString().slice(0, 7), // YYYY-MM format
      revenue: Math.round((baseRevenue + randomVariation) * 100) / 100,
      volume: Math.round((baseRevenue * 18 + randomVariation * 20) * 100) / 100,
      transactions: Math.round(baseRevenue / 150 + randomVariation / 50),
    });
  }
  
  return months;
}

function generateCohortAnalysis() {
  const cohorts = [];
  const currentDate = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const cohortDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const cohortSize = 100 + Math.random() * 100;
    
    cohorts.push({
      cohort: cohortDate.toISOString().slice(0, 7),
      size: Math.round(cohortSize),
      month0: 100, // Always 100% in first month
      month1: Math.round(cohortSize * 0.6 + Math.random() * 10),
      month2: Math.round(cohortSize * 0.4 + Math.random() * 10),
      month3: Math.round(cohortSize * 0.25 + Math.random() * 5),
      month6: Math.round(cohortSize * 0.15 + Math.random() * 3),
      month12: Math.round(cohortSize * 0.08 + Math.random() * 2),
    });
  }
  
  return cohorts;
}

function flattenReportData(report: any): any[] {
  // Flatten complex nested objects for CSV export
  const flattened = [];
  
  function flattenObject(obj: any, prefix = '') {
    const result: any = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, flattenObject(obj[key], newKey));
        } else if (Array.isArray(obj[key])) {
          result[newKey] = JSON.stringify(obj[key]);
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    
    return result;
  }
  
  flattened.push(flattenObject(report));
  return flattened;
}

function generateCSVResponse(data: any[], filename: string) {
  if (data.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 400 });
  }
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Generate CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}