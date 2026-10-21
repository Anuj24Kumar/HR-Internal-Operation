export const apiBaseUrl = import.meta.env.VITE_API_URL || "/api/v1";

export async function apiRequest(endpoint, options = {}) {
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "The request failed.");
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
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || "employee-letter.pdf";

  return {
    blob: await response.blob(),
    filename,
  };
}
