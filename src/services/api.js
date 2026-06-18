/**
 * Centralized API service for communicating with the backend.
 * All API calls go through this module for consistent error handling.
 */
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes — LLM calls can be slow
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Response interceptor — normalize errors
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status || 0;
    normalizedError.originalError = error;
    return Promise.reject(normalizedError);
  }
);

// ---------------------------------------------------------------------------
// Document Analysis
// ---------------------------------------------------------------------------

/**
 * Analyze raw text content.
 * @param {string} content - The legal document text.
 * @param {string} userId - The user's ID.
 * @param {Array<string>} playbookRules - Custom playbook rules to audit.
 * @returns {Promise<Object>} FinalAnalysisResponse
 */
export async function analyzeText(content, userId = "default_user", playbookRules = []) {
  const response = await apiClient.post(`/analyze?user_id=${encodeURIComponent(userId)}`, {
    input_type: "text",
    content,
    playbook_rules: playbookRules,
  });
  return response.data;
}

/**
 * Upload and analyze a PDF file.
 * @param {File} file - The PDF file to upload.
 * @param {string} userId - The user's ID.
 * @param {Array<string>} playbookRules - Custom playbook rules to audit.
 * @returns {Promise<Object>} FinalAnalysisResponse
 */
export async function analyzePdf(file, userId = "default_user", playbookRules = []) {
  const formData = new FormData();
  formData.append("file", file);

  const query = `user_id=${encodeURIComponent(userId)}&playbook_rules=${encodeURIComponent(JSON.stringify(playbookRules))}`;
  const response = await apiClient.post(`/analyze/pdf?${query}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Analyze OCR-extracted text from an image.
 * @param {string} content - The OCR-extracted text.
 * @param {string} imageBase64 - Base64 preview data of the original image.
 * @param {string} ocrConfidence - OCR accuracy rate.
 * @param {string} imageQuality - Sharpness quality indicator.
 * @param {string} userId - The user's ID.
 * @param {Array<string>} playbookRules - Custom playbook rules to audit.
 * @returns {Promise<Object>} FinalAnalysisResponse
 */
export async function analyzeImage(content, imageBase64, ocrConfidence, imageQuality, userId = "default_user", playbookRules = []) {
  const response = await apiClient.post(`/analyze/image?user_id=${encodeURIComponent(userId)}`, {
    content,
    playbook_rules: playbookRules,
    image_base64: imageBase64,
    image_quality_score: imageQuality,
    ocr_confidence: ocrConfidence,
  });
  return response.data;
}



// ---------------------------------------------------------------------------
// History & Single Analysis
// ---------------------------------------------------------------------------

/**
 * Fetch all analyses for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export async function getHistory(userId = "default_user") {
  const response = await apiClient.get("/history", {
    params: { user_id: userId },
  });
  return response.data.history || [];
}

/**
 * Fetch a single analysis by document ID.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function getAnalysis(documentId) {
  const response = await apiClient.get(`/analysis/${documentId}`);
  return response.data;
}

/**
 * Delete an analysis.
 * @param {string} documentId
 * @returns {Promise<Object>}
 */
export async function deleteAnalysis(documentId) {
  const response = await apiClient.delete(`/analysis/${documentId}`);
  return response.data;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

/**
 * Send a question about a document to the AI chatbot.
 * @param {string} documentId
 * @param {string} question
 * @param {string} context - Optional document context string
 * @returns {Promise<Object>} { answer, document_id }
 */
export async function chatWithDocument(documentId, question, context = "") {
  const response = await apiClient.post("/chat", {
    document_id: documentId,
    question,
    context,
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// Support & System Status
// ---------------------------------------------------------------------------

/**
 * Fetch the live status of system components.
 * @returns {Promise<Object>} { status, database, ai_service }
 */
export async function getSystemStatus() {
  const response = await apiClient.get("/status");
  return response.data;
}

/**
 * Submit a contact support ticket.
 * @param {Object} data - { name, email, subject, message }
 * @returns {Promise<Object>}
 */
export async function submitSupportTicket(data) {
  const response = await apiClient.post("/support/ticket", data);
  return response.data;
}

/**
 * Submit a bug report.
 * @param {Object} data - { title, description, steps_to_reproduce, severity }
 * @returns {Promise<Object>}
 */
export async function submitBugReport(data) {
  const response = await apiClient.post("/support/bug", data);
  return response.data;
}

/**
 * Submit a feature request.
 * @param {Object} data - { title, description, business_impact }
 * @returns {Promise<Object>}
 */
export async function submitFeatureRequest(data) {
  const response = await apiClient.post("/support/feature", data);
  return response.data;
}

/**
 * Compare two PDF contracts.
 * @param {File} fileOriginal
 * @param {File} fileRevised
 * @returns {Promise<Object>}
 */
export async function compareDocuments(fileOriginal, fileRevised) {
  const formData = new FormData();
  formData.append("file_original", fileOriginal);
  formData.append("file_revised", fileRevised);

  const response = await apiClient.post("/compare", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Generate or refine a contract draft.
 * @param {string} templateType
 * @param {Object} parameters
 * @param {string} userMessage
 * @param {string} currentDraft
 * @returns {Promise<Object>}
 */
export async function draftContract(templateType, parameters, userMessage = "", currentDraft = "") {
  const response = await apiClient.post("/draft", {
    template_type: templateType,
    parameters,
    user_message: userMessage,
    current_draft: currentDraft,
  });
  return response.data;
}

export default apiClient;

