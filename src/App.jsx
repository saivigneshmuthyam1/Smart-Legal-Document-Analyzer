import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardInput from "@/pages/DashboardInput";
import LoadingState from "@/pages/LoadingState";
import ResultsDashboard from "@/pages/ResultsDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardInput />} />
        <Route path="/loading" element={<LoadingState />} />
        <Route path="/results" element={<ResultsDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
