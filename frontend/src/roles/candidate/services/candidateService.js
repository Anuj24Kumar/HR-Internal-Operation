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

// Get Candidate Application
export function getMyApplication() {
  return apiRequest("/candidates/application", {
    headers: getAuthHeaders(),
  });
}

// Get Candidate Profile
export function getMyProfile() {
  return apiRequest("/candidates/profile", {
    headers: getAuthHeaders(),
  });
}

// Get Candidate Documents
export function getMyDocuments() {
  return apiRequest("/candidates/documents", {
    headers: getAuthHeaders(),
  });
}

// Get Candidate Offer
export function getMyOffer() {
  return apiRequest("/candidates/offer", {
    headers: getAuthHeaders(),
  });
}

// Upload Candidate Document
export function uploadMyDocument(formData) {
  return apiRequest("/candidates/documents", {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
}

// Delete Candidate Document
export function deleteMyDocument(documentId) {
  return apiRequest(`/candidates/documents/${documentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}