const apiBaseUrl = import.meta.env.VITE_API_URL || "/api/v1";

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
    throw new Error(result.message || result.error?.message || "Request failed.");
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
export async function fetchUsers({ role = "", isActive = "", search = "", page = 1, limit = 20 } = {}) {
  const query = new URLSearchParams();
  if (role) query.set("role", role);
  if (isActive !== "") query.set("isActive", isActive);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);

  return request(`/admin/users?${query.toString()}`);
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

// ----------------------------------------------------
// Approval Workflows
// ----------------------------------------------------
export async function fetchWorkflows({ isActive = "" } = {}) {
  const query = new URLSearchParams();
  if (isActive !== "") query.set("isActive", isActive);
  const qStr = query.toString();
  return request(`/admin/workflows${qStr ? `?${qStr}` : ""}`);
}

export async function fetchWorkflowById(id) {
  return request(`/admin/workflows/${id}`);
}

export async function fetchWorkflowByType(type) {
  return request(`/admin/workflows/type/${type}`);
}

export async function createWorkflow(workflowData) {
  return request("/admin/workflows", {
    method: "POST",
    body: JSON.stringify(workflowData),
  });
}

export async function updateWorkflow(id, workflowData) {
  return request(`/admin/workflows/${id}`, {
    method: "PATCH",
    body: JSON.stringify(workflowData),
  });
}

export async function deleteWorkflow(id) {
  return request(`/admin/workflows/${id}`, {
    method: "DELETE",
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
  page = 1,
  limit = 25,
} = {}) {
  const query = new URLSearchParams();
  if (module) query.set("module", module);
  if (action) query.set("action", action);
  if (userId) query.set("userId", userId);
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
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
export async function performGlobalSearch(searchQuery) {
  return request(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
}

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
