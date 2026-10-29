import { apiRequest } from "../../../api.js";

function getAuthHeaders() {
const token = localStorage.getItem("hr-auth-token");

if (!token) {
throw new Error("Your session has expired. Please log in again.");
}

return {
Authorization: `Bearer ${token}`,
};
}

// Employee Profile
export function getMyEmployeeProfile() {
return apiRequest("/employees/profile", {
headers: getAuthHeaders(),
});
}

// Employment History
export function getMyEmploymentHistory() {
return apiRequest("/employees/profile/history", {
headers: getAuthHeaders(),
});
}

// Salary Breakdown
export function getMySalaryBreakdown() {
return apiRequest("/employees/profile/salary", {
headers: getAuthHeaders(),
});
}

// Employee Documents
export function getMyEmployeeDocuments() {
return apiRequest("/employees/documents", {
headers: getAuthHeaders(),
});
}

// Upload Employee Document
export function uploadEmployeeDocument(formData) {
return apiRequest("/employees/documents", {
method: "POST",
headers: getAuthHeaders(),
body: formData,
});
}

// Re-upload Rejected Document
export function updateEmployeeDocument(documentId, formData) {
return apiRequest(`/employees/documents/${documentId}`, {
method: "PATCH",
headers: getAuthHeaders(),
body: formData,
});
}

// Employee Letters
export function getMyEmployeeLetters() {
return apiRequest("/employees/letters", {
headers: getAuthHeaders(),
});
}

// Resignation
export function getMyResignation() {
return apiRequest("/employees/resignation", {
headers: getAuthHeaders(),
});
}

// Submit Resignation
export function submitResignation(data) {
return apiRequest("/employees/resignation", {
method: "POST",
headers: getAuthHeaders(),
body: JSON.stringify(data),
});
}

// Withdraw Resignation
export function withdrawResignation() {
return apiRequest("/employees/resignation", {
method: "DELETE",
headers: getAuthHeaders(),
});
}
