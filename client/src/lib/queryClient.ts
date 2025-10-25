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
  body?: any,
): Promise<Response> {
  const headers = new Headers();

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Always include auth token if available
  const token = localStorage.getItem("authToken");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("✅ Auth token included in request to:", url);
  } else {
    console.warn("⚠️ No auth token available for request to:", url);
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "include", // Always send cookies
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  // Handle token expiration
  if (response.status === 401) {
    console.warn("⚠️ Token expired or invalid, redirecting to login...");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    window.location.href = "/";
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultFetcher,
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0, // No cache - always fetch fresh
      gcTime: 0, // Don't keep in memory
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
