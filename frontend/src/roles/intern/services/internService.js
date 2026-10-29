import { apiRequest } from "../../../api.js";

function getAuthHeaders() {
  const token = localStorage.getItem("hr-auth-token");

  if (!token) {
    throw new Error("Please log in again.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export function getMyInternProfile() {
  return apiRequest("/intern/profile", {
    headers: getAuthHeaders(),
  });
}

export function getMyOnboarding() {
  return apiRequest("/intern/onboarding", {
    headers: getAuthHeaders(),
  });
}

export function completeOnboardingTask(taskId) {
  return apiRequest(
    `/intern/onboarding/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );
}

export function getMyDocuments() {
  return apiRequest("/intern/documents", {
    headers: getAuthHeaders(),
  });
}

export function uploadInternDocument({
  documentType,
  documentName,
  file,
}) {
  if (!documentType || !documentName?.trim() || !file) {
    throw new Error("Document type, name and file are required.");
  }

  const formData = new FormData();

  formData.append("documentType", documentType);
  formData.append("documentName", documentName.trim());
  formData.append("document", file);

  return apiRequest("/intern/documents", {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
}

export function updateInternDocument(documentId, file) {
  if (!documentId || !file) {
    throw new Error("Document ID and replacement file are required.");
  }

  const formData = new FormData();
  formData.append("document", file);

  return apiRequest(
    `/intern/documents/${encodeURIComponent(documentId)}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: formData,
    }
  );
}