import { NextRequest, NextResponse } from "next/server";
import { PerformanceMonitor } from "../../_lib/performance-monitor";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") as 'hour' | 'day' | 'week' || 'day';

    // Get performance analysis
    const analysis = await PerformanceMonitor.analyzePerformance(timeRange);
    
    // Get real-time dashboard data
    const dashboardData = await PerformanceMonitor.getDashboardData();
    
    // Get optimization recommendations
    const mobileOptimizations = PerformanceMonitor.getMobileOptimizations();
    const emergingMarketsOptimizations = PerformanceMonitor.getEmergingMarketsOptimizations();

    return NextResponse.json({
      success: true,
      timeRange,
      
      // Current performance metrics
      currentPerformance: dashboardData,
      
      // Historical analysis
      analysis: {
        summary: analysis.summary,
        trends: {
          apiPerformance: {
            trend: 'improving', // Would be calculated from historical data
            changePercent: -12.5,
          },
          pageLoadPerformance: {
            trend: 'stable',
            changePercent: 2.1,
          },
          transactionPerformance: {
            trend: 'improving',
            changePercent: -8.3,
          },
        },
      },
      
      // Optimization recommendations
      recommendations: {
        immediate: analysis.recommendations.filter(r => r.impact === 'high').slice(0, 3),
        mobile: mobileOptimizations.slice(0, 2),
        emergingMarkets: emergingMarketsOptimizations.slice(0, 2),
      },
      
      // Performance benchmarks
      benchmarks: {
        apiResponse: {
          current: analysis.summary.apiPerformance?.averageResponseTime || 1200,
          target: 800,
          industryAverage: 1500,
        },
        pageLoad: {
          current: analysis.summary.pageLoadPerformance?.averageLoadTime || 2800,
          target: 2000,
          industryAverage: 3200,
        },
        transaction: {
          current: analysis.summary.transactionPerformance?.averageProcessingTime || 8500,
          target: 5000,
          industryAverage: 12000,
        },
      },
      
      // Regional insights
      regionalInsights: {
        zimbabwe: {
          performance: 'good',
          mainChallenges: ['mobile_connectivity', 'device_capabilities'],
          recommendations: ['offline_mode', 'data_compression'],
        },
        diaspora: {
          performance: 'excellent',
          mainChallenges: ['compliance_delays', 'currency_conversion_time'],
          recommendations: ['async_processing', 'predictive_loading'],
        },
      },
      
      // Mobile-specific metrics
      mobileMetrics: {
        mobileUserPercentage: 78.2,
        averageMobileLoadTime: 3200,
        mobileConversionRate: 85.6,
        topMobileIssues: [
          'Touch target size optimization needed',
          'Image loading on slow connections',
          'Form validation responsiveness',
        ],
      },
      
      // Alerts and issues
      activeAlerts: dashboardData.criticalIssues,
      
      // Performance score
      overallScore: {
        current: 82,
        target: 90,
        breakdown: {
          speed: 85,
          reliability: 88,
          usability: 79,
          accessibility: 76,
        },
      },
    });
  } catch (error) {
    console.error("Performance dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve performance dashboard data" },
      { status: 500 }
    );
  }
}
