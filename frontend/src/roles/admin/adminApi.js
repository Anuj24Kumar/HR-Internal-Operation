import { apiBaseUrl } from "../../api.js";

function getAuthToken() {
  return localStorage.getItem("hr-auth-token") || "";
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle binary / file download responses
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/csv") || contentType.includes("application/octet-stream")) {
    if (!response.ok) throw new Error("File export failed.");
    return await response.blob();
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    const error = new Error(result.message || result.error?.message || "Request failed.");
    error.status = response.status;
    error.data = result.data;
    throw error;
  }

  return result;
}

// ----------------------------------------------------
// Admin Dashboard
// ----------------------------------------------------
export async function fetchAdminDashboard() {
  return request("/admin/dashboard");
}

export async function fetchPipelineDistribution() {
  return request("/admin/dashboard/pipeline");
}

// ----------------------------------------------------
// Users Management
// ----------------------------------------------------
export async function fetchUsers({ role = "", status = "", hasOffer = "", isActive = "", search = "", page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams();
  if (role) query.set("role", role);
  if (status) query.set("status", status);
  if (hasOffer !== "") query.set("hasOffer", hasOffer);
  if (isActive !== "") query.set("isActive", isActive);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);

  return request(`/admin/users?${query.toString()}`);
}

export async function fetchOverview() {
  return request("/admin/overview");
}

export async function fetchPipeline({ status = "", search = "", page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);
  return request(`/admin/pipeline?${query.toString()}`);
}

export async function fetchConversions({ page = 1, limit = 5 } = {}) {
  return request(`/admin/conversions?page=${page}&limit=${limit}`);
}

export async function fetchUserById(id) {
  return request(`/admin/users/${id}`);
}

export async function createUser(userData) {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id, updateData) {
  return request(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updateData),
  });
}

export async function activateUser(id) {
  return request(`/admin/users/${id}/activate`, {
    method: "PATCH",
  });
}

export async function deactivateUser(id) {
  return request(`/admin/users/${id}/deactivate`, {
    method: "PATCH",
  });
}

export async function deleteUser(id) {
  return request(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export async function resetUserPassword(id, newPassword) {
  return request(`/admin/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export async function setUserStatus(id, status) {
  return request(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function overrideApplicationStatus(id, newStatus, reason) {
  return request(`/admin/applications/${id}/override-status`, {
    method: "POST",
    body: JSON.stringify({ newStatus, reason }),
  });
}

// ----------------------------------------------------
// Letter Templates
// ----------------------------------------------------
export async function fetchLetterTemplates({ type = "", isActive = "" } = {}) {
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  if (isActive !== "") query.set("isActive", isActive);
  const qStr = query.toString();
  return request(`/admin/letter-templates${qStr ? `?${qStr}` : ""}`);
}

export async function fetchLetterTemplateById(id) {
  return request(`/admin/letter-templates/${id}`);
}

export async function createLetterTemplate(templateData) {
  return request("/admin/letter-templates", {
    method: "POST",
    body: JSON.stringify(templateData),
  });
}

export async function updateLetterTemplate(id, templateData) {
  return request(`/admin/letter-templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(templateData),
  });
}

export async function deactivateLetterTemplate(id) {
  return request(`/admin/letter-templates/${id}/deactivate`, {
    method: "PATCH",
  });
}

export async function deleteLetterTemplate(id) {
  return request(`/admin/letter-templates/${id}`, {
    method: "DELETE",
  });
}

// ----------------------------------------------------
// Audit Logs
// ----------------------------------------------------
export async function fetchAuditLogs({
  module = "",
  action = "",
  userId = "",
  startDate = "",
  endDate = "",
  from = "",
  to = "",
  search = "",
  page = 1,
  limit = 25,
} = {}) {
  const query = new URLSearchParams();
  if (module) query.set("module", module);
  if (action) query.set("action", action);
  if (userId) query.set("userId", userId);
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);

  return request(`/admin/audit?${query.toString()}`);
}

export async function fetchAuditLogById(id) {
  return request(`/admin/audit/${id}`);
}

export async function downloadAuditLogsExport(format = "csv", filters = {}) {
  const query = new URLSearchParams();
  query.set("format", format);
  if (filters.module) query.set("module", filters.module);
  if (filters.action) query.set("action", filters.action);
  if (filters.startDate) query.set("startDate", filters.startDate);
  if (filters.endDate) query.set("endDate", filters.endDate);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.search) query.set("search", filters.search);

  const token = getAuthToken();
  const response = await fetch(`${apiBaseUrl}/admin/audit/export?${query.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error("Failed to export audit logs");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// Global Search
// ----------------------------------------------------
export async function performGlobalSearch(searchQuery, limit = 10) {
  return request(`/admin/search?q=${encodeURIComponent(searchQuery)}&limit=${limit}`);
}

export const globalSearch = performGlobalSearch;

export async function downloadSearchExport(searchQuery, format = "csv") {
  const token = getAuthToken();
  const response = await fetch(
    `${apiBaseUrl}/admin/search/export?q=${encodeURIComponent(searchQuery)}&format=${format}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) throw new Error("Failed to export search results");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `search-results-${searchQuery}-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
