export const apiBaseUrl = import.meta.env.VITE_API_URL || "/api/v1";

export async function apiRequest(endpoint, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(options.headers || {});
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("hr-auth-token")
      : null;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const responseText = await response.text();
  let result = {};

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error("The server returned an invalid response.");
    }
  }

  if (!response.ok || result.success === false) {
    const error = new Error(
      result.message || result.error?.message || result.error || "The request failed."
    );
    error.status = response.status;
    throw error;
  }

  return result;
}

export async function apiDownload(endpoint, options = {}) {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, options);

  if (!response.ok) {
    const body = await response.text();
    let message = body || "The download request failed.";

    try {
      const result = JSON.parse(body);
      message = result.message || message;
    } catch {
      // Keep the response text when the server does not return JSON.
    }

    throw new Error(message);
  }

  const disposition = response.headers.get("Content-Disposition") || "";
  const filename =
    disposition.match(/filename="?([^";]+)"?/i)?.[1] || "employee-letter.pdf";

  return {
    blob: await response.blob(),
    filename,
  };
}
