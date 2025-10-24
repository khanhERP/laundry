import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { defaultFetcher } from "./utils";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options?: RequestInit,
): Promise<Response> {
  // Get auth token from localStorage as fallback
  const token = localStorage.getItem("authToken");

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include', // Important: Send cookies with request
    ...options,
  };

  if (data) {
    config.body = JSON.stringify(data);

    // Additional logging for payment method requests
    if (url.includes("https://c4a08644-6f82-4c21-bf98-8d382f0008d1-00-2q0r6kl8z7wo.pike.replit.dev/api/orders/") && url.includes("/status") && method === "PUT") {
      console.log("🔍 apiRequest: Final request body for payment:", {
        url,
        requestBodyString: JSON.stringify(data),
        parsedBack: JSON.parse(JSON.stringify(data)),
        timestamp: new Date().toISOString()
      });
    }
  }

  const response = await fetch(url, config);

  // Check for token refresh in response header
  const newToken = response.headers.get('X-New-Token');
  if (newToken) {
    localStorage.setItem("authToken", newToken);
    console.log("🔄 Token automatically refreshed");
  }

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    window.location.href = "/";
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultFetcher, // 👈 set mặc định ở đây
      // queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0, // No cache - always fetch fresh
      gcTime: 0, // Don't keep in memory
      cacheTime: 0, // Disable cache completely
      retry: 1,
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: "online",
    },
    mutations: {
      retry: false,
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});