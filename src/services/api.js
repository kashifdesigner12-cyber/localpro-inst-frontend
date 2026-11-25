const resolveApiBaseUrl = () => {
  // 1. Check Vite or CRA environment variable if explicitly provided
  const envUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_API_URL);

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  // 2. Automatically use local backend when running on localhost / 127.0.0.1
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000/api";
    }
  }

  // 3. Default to live production API subdomain
  return "https://apinstitute.localpro1.net/api";
};

export const API_BASE_URL = resolveApiBaseUrl();

const getActiveToken = () => {
  if (typeof window === "undefined") return "";
  const pathname = window.location.pathname || "";

  if (pathname.startsWith("/student")) {
    return (
      localStorage.getItem("studentToken") ||
      localStorage.getItem("teacherToken") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  }

  return (
    localStorage.getItem("adminToken") ||
    localStorage.getItem("teacherToken") ||
    localStorage.getItem("studentToken") ||
    ""
  );
};

export const apiCall = async (
  endpoint,
  method = "GET",
  data = null
) => {
  // Normalize endpoint to prevent accidental double /api/api/... or missing leading slash
  let normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (API_BASE_URL.endsWith("/api") && normalizedEndpoint.startsWith("/api/")) {
    normalizedEndpoint = normalizedEndpoint.replace(/^\/api/, "");
  }

  const token = getActiveToken();

  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data instanceof FormData) {
    config.body = data;
  } else if (data !== null && data !== undefined) {
    headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(data);
  }

  try {
    const requestUrl = `${API_BASE_URL}${normalizedEndpoint}`;
    console.log(`${method} ${requestUrl}`);

    const response = await fetch(requestUrl, config);

    let result;

    try {
      result = await response.json();
    } catch {
      result = {
        success: false,
        message: "Server returned an invalid response.",
      };
    }

    console.log("API response:", response.status, result);

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message:
          result?.message ||
          `Request failed with status ${response.status}`,
        data: result,
      };
    }

    return {
      success: true,
      status: response.status,
      data: result,
    };
  } catch (error) {
    console.error("API connection error:", error);

    return {
      success: false,
      status: 0,
      message:
        error?.message || "Network error. Please check your connection.",
      error,
    };
  }
};