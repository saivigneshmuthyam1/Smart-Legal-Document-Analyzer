import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import DocumentSubmissionPage from "@/pages/DocumentSubmissionPage";
import DocumentLibrary from "@/pages/DocumentLibrary";
import DocumentAnalysisPage from "@/pages/DocumentAnalysisPage";
import ClauseExtractionPage from "@/pages/ClauseExtractionPage";
import RiskAssessmentPage from "@/pages/RiskAssessmentPage";
import LegalAIChatbot from "@/pages/LegalAIChatbot";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import ComparePage from "@/pages/ComparePage";
import DraftingPage from "@/pages/DraftingPage";

export default function App() {
  return (
    <AuthProvider>
      <AnalysisProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><DocumentSubmissionPage /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><DocumentLibrary /></ProtectedRoute>} />
            <Route path="/analysis/:id" element={<ProtectedRoute><DocumentAnalysisPage /></ProtectedRoute>} />
            <Route path="/clauses/:id" element={<ProtectedRoute><ClauseExtractionPage /></ProtectedRoute>} />
            <Route path="/risk-assessment/:id" element={<ProtectedRoute><RiskAssessmentPage /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><LegalAIChatbot /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
            <Route path="/draft" element={<ProtectedRoute><DraftingPage /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AnalysisProvider>
    </AuthProvider>
  );
}

