const apiBaseUrl = import.meta.env.VITE_API_URL || "/api/v1";

export async function apiRequest(endpoint, options = {}) {
const isFormData = options.body instanceof FormData;

const headers = {
...(isFormData ? {} : { "Content-Type": "application/json" }),
...(options.headers || {}),
};

const response = await fetch(`${apiBaseUrl}${endpoint}`, {
...options,
headers,
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
