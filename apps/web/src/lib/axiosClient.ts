import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

function retryQueuedRequests() {
  pendingRequests.forEach((resolve) => resolve());
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      throw error;
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      throw error;
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      await new Promise<void>((resolve) => pendingRequests.push(resolve));
      return apiClient(originalRequest);
    }

    isRefreshing = true;
    try {
      await apiClient.post("/auth/refresh");
      retryQueuedRequests();
      return await apiClient(originalRequest);
    } finally {
      isRefreshing = false;
    }
  },
);
