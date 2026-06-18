import React, { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { 
  Scale, 
  FileText, 
  AlertTriangle, 
  MessageSquare, 
  Activity, 
  Folder, 
  History, 
  Settings, 
  HelpCircle, 
  LogOut,
  UploadCloud,
  User,
  Plus,
  Menu,
  X,
  GitCompare,
  BookOpen
} from "lucide-react";
import SupportDrawer from "./SupportDrawer";

export default function Shell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: docId } = useParams();
  const { userName, userEmail, signOut } = useAuth();
  const { currentAnalysis } = useAnalysis();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const isDocActiveView = 
    location.pathname.startsWith("/analysis") || 
    location.pathname.startsWith("/clauses") || 
    location.pathname.startsWith("/risk-assessment") || 
    location.pathname.startsWith("/chat");

  // Get active document info from analysis context
  const activeDocName = currentAnalysis?.metadata?.document_type || "Document";
  const activeDocParties = currentAnalysis?.metadata?.parties?.join(" & ") || "";
  const activeDocLabel = activeDocParties || activeDocName;

  const mainNavLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Library", path: "/library" },
    { label: "Compare Mode", path: "/compare" },
    { label: "Contract Drafting", path: "/draft" },
    { label: "History", path: "/history" }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      // Force navigate even if signOut fails
      navigate("/login", { replace: true });
    }
  };

  const sidebarContent = (
    <>
      <div className="p-4 flex-1 overflow-y-auto">
        {isDocActiveView ? (
          /* Active Document Context Navigation */
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-text-muted mb-1 text-[11px] font-semibold uppercase tracking-wider">
                <FileText className="w-[11px] h-[11px]" aria-hidden="true" />
                <span>Active Document</span>
              </div>
              <h4 className="font-semibold text-[14px] leading-tight truncate text-primary">{activeDocLabel}</h4>
              <p className="text-[11px] text-text-secondary mt-0.5">{activeDocName}</p>
            </div>
            
            <hr className="border-border" />
            
            <nav className="space-y-1" aria-label="Document navigation">
              <Link
                to={`/analysis/${docId || '1'}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname.startsWith("/analysis")
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                <span>Document Overview</span>
              </Link>

              <Link
                to={`/clauses/${docId || '1'}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname.startsWith("/clauses")
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <Activity className="w-4 h-4" aria-hidden="true" />
                <span>Clause Analysis</span>
              </Link>

              <Link
                to={`/risk-assessment/${docId || '1'}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname.startsWith("/risk-assessment")
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                <span>Risk Assessment</span>
              </Link>

              <Link
                to={`/chat/${docId || '1'}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname.startsWith("/chat")
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                <span>AI Assistant</span>
              </Link>
            </nav>
          </div>
        ) : (
          /* Global Context Navigation */
          <div className="space-y-6">
            <div>
              <div className="text-text-muted text-[11px] font-semibold uppercase tracking-wider">
                Workspace
              </div>
              <h4 className="font-semibold text-[14px] mt-1 text-primary">{userName || "Juris Precision"}</h4>
              <p className="text-[11px] text-text-secondary">{userEmail || "Legal Workspace"}</p>
            </div>

            <hr className="border-border" />

            <nav className="space-y-1" aria-label="Main navigation">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname === "/dashboard"
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <Activity className="w-4 h-4" aria-hidden="true" />
                <span>Overview</span>
              </Link>

              <Link
                to="/library"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname === "/library"
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <Folder className="w-4 h-4" aria-hidden="true" />
                <span>All Documents</span>
              </Link>

              <Link
                to="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname === "/compare"
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <GitCompare className="w-4 h-4" aria-hidden="true" />
                <span>Compare Mode</span>
              </Link>

              <Link
                to="/draft"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname === "/draft"
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Contract Drafting</span>
              </Link>

              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname === "/history"
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <History className="w-4 h-4" aria-hidden="true" />
                <span>Analysis History</span>
              </Link>

              <Link
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                  location.pathname === "/upload"
                    ? "bg-primary-100 text-primary font-semibold"
                    : "text-text-secondary hover:bg-primary-50 hover:text-primary"
                }`}
              >
                <UploadCloud className="w-4 h-4" aria-hidden="true" />
                <span>Upload Document</span>
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border bg-primary-50 space-y-3">
        <Link 
          to="/settings" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 text-[13px] text-text-secondary hover:text-primary transition-colors"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
          <span>Settings</span>
        </Link>
        <button 
          onClick={() => { setSupportOpen(true); setMobileMenuOpen(false); }}
          className="flex items-center gap-2.5 text-[13px] text-text-secondary hover:text-primary transition-colors w-full cursor-pointer text-left"
          aria-label="Open support center"
        >
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
          <span>Support Center</span>
        </button>
        <hr className="border-border" />
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2.5 text-[13px] text-risk-red hover:text-risk-red font-medium transition-colors w-full"
          aria-label="Sign out of your account"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col font-sans select-none antialiased">
      {/* Top Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-40 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-text-secondary hover:text-primary transition-colors"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <Scale className="w-[18px] h-[18px] text-primary" strokeWidth={2.2} />
            <span className="font-semibold text-[15px] tracking-tight uppercase hidden sm:inline">Lexicon AI</span>
          </Link>
          
          {/* Main Navigation — hidden on mobile */}
          <nav className="hidden md:flex items-center h-14" aria-label="Top navigation">
            {mainNavLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`h-full px-5 flex items-center text-[13px] font-medium transition-colors border-b-2 relative top-[1px] ${
                    isActive 
                      ? "border-primary text-primary font-semibold" 
                      : "border-transparent text-text-secondary hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <Link 
            to="/settings" 
            className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded text-[13px] text-text-secondary hover:text-primary transition-colors"
            aria-label="Account settings"
          >
            <User className="w-[15px] h-[15px]" />
            <span className="hidden sm:inline">{userName || "Account"}</span>
          </Link>
          <button 
            onClick={() => navigate("/upload")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors"
            aria-label="Start new analysis"
          >
            <Plus className="w-[15px] h-[15px]" />
            <span className="hidden sm:inline">New Analysis</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 pt-14 flex items-stretch">
        
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-20 lg:hidden" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — fixed on desktop, slide-out on mobile */}
        <aside 
          className={`w-64 bg-white border-r border-border fixed left-0 top-14 bottom-0 flex flex-col justify-between z-30 transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          aria-label="Sidebar navigation"
        >
          {sidebarContent}
        </aside>

        {/* Content Body */}
        <main className="flex-1 lg:pl-64 overflow-x-hidden">
          <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full flex flex-col justify-between">
            <div className="page-transition">
              {children}
            </div>
            
            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between text-[11px] text-text-muted gap-4">
              <div>
                <span>© {new Date().getFullYear()} Juris Precision Systems Inc. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="#privacy" className="hover:text-primary">Privacy Policy</a>
                <a href="#terms" className="hover:text-primary">Terms of Service</a>
                <a href="#security" className="hover:text-primary">Security Architecture</a>
              </div>
            </footer>
          </div>
        </main>

      </div>
      {/* Support Center Drawer */}
      <SupportDrawer isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
