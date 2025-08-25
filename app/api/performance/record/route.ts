import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PerformanceMonitor } from "../../_lib/performance-monitor";

const recordMetricSchema = z.object({
  metricType: z.enum(['api_response', 'page_load', 'transaction_time', 'database_query', 'network_latency']),
  endpoint: z.string().optional(),
  userId: z.string().uuid().optional(),
  duration: z.number().positive("Duration must be positive"),
  status: z.enum(['success', 'error', 'timeout']),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const metricData = recordMetricSchema.parse(body);

    // Extract device information from headers
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const deviceInfo = extractDeviceInfo(userAgent);

    // Record the performance metric
    await PerformanceMonitor.recordMetric(metricData, deviceInfo);

    return NextResponse.json({
      success: true,
      message: "Performance metric recorded successfully",
    });
  } catch (error) {
    console.error("Record performance metric error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid metric data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to record performance metric" },
      { status: 500 }
    );
  }
}

function extractDeviceInfo(userAgent: string) {
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/Mobile|Android|iPhone/i.test(userAgent)) deviceType = 'mobile';
  else if (/iPad|Tablet/i.test(userAgent)) deviceType = 'tablet';

  let os = 'unknown';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac/i.test(userAgent)) os = 'macOS';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  let browser = 'unknown';
  if (/Chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Safari/i.test(userAgent)) browser = 'Safari';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';

  return {
    type: deviceType,
    os,
    browser,
    connectionType: 'unknown' as const,
    connectionSpeed: 'unknown' as const,
  };
}