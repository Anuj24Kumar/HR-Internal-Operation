
const apiBaseUrl = import.meta.env.VITE_API_URL || "/api/v1";

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("hr-auth-token");

  const headers = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let result;

  if (contentType.includes("application/json")) {
    result = await response.json();
  } else if (response.ok) {
    // PDF, CSV and other file responses
    return response;
  } else {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (!response.ok || result?.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result;
}
