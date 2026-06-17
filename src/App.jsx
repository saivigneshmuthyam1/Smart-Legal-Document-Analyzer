import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<DocumentSubmissionPage />} />
        <Route path="/library" element={<DocumentLibrary />} />
        <Route path="/analysis/:id" element={<DocumentAnalysisPage />} />
        <Route path="/clauses/:id" element={<ClauseExtractionPage />} />
        <Route path="/risk-assessment/:id" element={<RiskAssessmentPage />} />
        <Route path="/chat/:id" element={<LegalAIChatbot />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
