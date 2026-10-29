
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

export function getMyApplication() {
  return apiRequest("/candidates/application", {
    headers: getAuthHeaders(),
  });
}

export function getMyProfile() {
  return apiRequest("/candidates/profile", {
    headers: getAuthHeaders(),
  });
}

export function getMyDocuments() {
  return apiRequest("/candidates/documents", {
    headers: getAuthHeaders(),
  });
}

export function getMyOffer() {
  return apiRequest("/candidates/offer", {
    headers: getAuthHeaders(),
  });
}

