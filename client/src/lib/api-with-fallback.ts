import { MockAPIService } from "../services/mock-api";

/**
 * Detect if running on GitHub Pages (static hosting)
 * GitHub Pages cannot handle API requests, so we fall back to Mock API
 */
function isGitHubPages(): boolean {
  if (typeof window === "undefined") return false;
  
  const hostname = window.location.hostname;
  const isGHPages = hostname.includes("github.io") || hostname === "paypass.website";
  
  return isGHPages;
}

/**
 * Mock API Service instance for demo/static hosting
 */
const mockApiService = new MockAPIService();

/**
 * Enhanced API request with fallback to Mock API
 * If running on GitHub Pages, automatically uses Mock API
 */
export async function apiRequestWithFallback(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If on GitHub Pages, use Mock API
  if (isGitHubPages()) {
    console.log(`[Demo Mode] Using Mock API for: ${method} ${url}`);
    return handleMockApiRequest(method, url, data);
  }

  // Otherwise, use real API
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

/**
 * Handle Mock API requests
 */
async function handleMockApiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  try {
    let mockResponse: any = null;

    // Parse the request
    const requestData = data as any;

    // Route to appropriate mock handler
    if (url.includes("/auth/login") && method === "POST") {
      mockResponse = await mockApiService.login(
        requestData.phone,
        requestData.pin
      );
      return createMockResponse({
        success: true,
        user: mockResponse.user,
        token: mockResponse.token,
      });
    }

    if (url.includes("/auth/register") && method === "POST") {
      mockResponse = await mockApiService.registerUser(requestData);
      return createMockResponse({
        success: true,
        user: mockResponse,
      });
    }

    if (url.includes("/profile") && method === "GET") {
      mockResponse = await mockApiService.getUserProfile();
      return createMockResponse(mockResponse);
    }

    if (url.includes("/wallet") && method === "GET") {
      // Mock wallet data
      return createMockResponse({
        usdBalance: "1465.00",
        zwlBalance: "25000.00",
        userId: 1
      });
    }

    if (url.includes("/transactions") && method === "GET") {
      mockResponse = await mockApiService.getTransactions();
      return createMockResponse(mockResponse);
    }

    if (url.includes("/topup") && method === "POST") {
      mockResponse = await mockApiService.topup(
        requestData.userId,
        requestData.amount,
        requestData.currency
      );
      return createMockResponse({
        success: mockResponse.success,
        transactionId: mockResponse.transactionId,
      });
    }

    if (url.includes("/transfer") && method === "POST") {
      mockResponse = await mockApiService.transfer(
        requestData.fromUserId,
        requestData.toUserId,
        requestData.amount,
        requestData.currency
      );
      return createMockResponse({
        success: mockResponse.success,
        transactionId: mockResponse.transactionId,
      });
    }

    if (url.includes("/mfa/verify") && method === "POST") {
      mockResponse = await mockApiService.verifyMFA(requestData.code);
      return createMockResponse({
        success: mockResponse.success,
        token: mockResponse.token,
      });
    }

    // Default response for unknown endpoints
    return createMockResponse({
      success: false,
      error: "Endpoint not found in mock API",
    }, 404);
  } catch (error) {
    console.error("[Mock API Error]", error);
    return createMockResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}

/**
 * Create a mock Response object
 */
function createMockResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
