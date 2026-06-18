/**
 * Analysis context — caches the currently active document analysis
 * to prevent redundant API calls across Analysis/Clauses/Risk/Chat pages.
 */
import React, { createContext, useContext, useState, useCallback } from "react";
import { getAnalysis } from "@/services/api";

const AnalysisContext = createContext(null);

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within an AnalysisProvider");
  return ctx;
}

export function AnalysisProvider({ children }) {
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load an analysis — uses cache if same document_id is already loaded.
   */
  const loadAnalysis = useCallback(async (documentId) => {
    // Return cached if same document
    if (documentId === currentDocumentId && currentAnalysis) {
      return currentAnalysis;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAnalysis(documentId);
      setCurrentAnalysis(data);
      setCurrentDocumentId(documentId);
      return data;
    } catch (err) {
      const message = err.message || "Failed to load analysis.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentDocumentId, currentAnalysis]);

  /**
   * Store a fresh analysis result (e.g., right after submission).
   */
  const setAnalysis = useCallback((data) => {
    setCurrentAnalysis(data);
    setCurrentDocumentId(data?.document_id || null);
    setError(null);
  }, []);

  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setCurrentDocumentId(null);
    setError(null);
  }, []);

  return (
    <AnalysisContext.Provider value={{
      currentAnalysis,
      currentDocumentId,
      loading,
      error,
      loadAnalysis,
      setAnalysis,
      clearAnalysis,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export default AnalysisContext;
