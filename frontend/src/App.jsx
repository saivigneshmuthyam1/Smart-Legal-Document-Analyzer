import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import LandingView from './components/views/LandingView';
import LoginView from './components/views/LoginView';
import DashboardView from './components/views/DashboardView';
import WorkspaceView from './components/views/WorkspaceView';
import LibraryView from './components/views/LibraryView';
import PlaybookView from './components/views/PlaybookView';
import CompareView from './components/views/CompareView';
import GlobalChat from './components/layout/GlobalChat';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PlaybookProvider } from './context/PlaybookContext';

function AppContent() {
  const [route, setRoute] = useState({ view: 'landing', params: {} });
  const [toasts, setToasts] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const navigate = (view, params = {}) => {
    let hash = `#/${view}`;
    const queryStr = new URLSearchParams(params).toString();
    if (queryStr) {
      hash += `?${queryStr}`;
    }
    window.location.hash = hash;
  };

  const showToast = (message) => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Check for OAuth errors returned in the hash by Supabase
      if (hash.includes('error_description=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const errorDesc = params.get('error_description') || 'Authentication failed';
        showToast('Auth Error: ' + decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        // Reset the hash to login so they can try again
        window.location.hash = '#/login';
        return;
      }

      // Allow Supabase to parse access tokens seamlessly
      if (hash.includes('access_token=')) {
        // We stay on the current view until user state updates
        return;
      }

      const hashStr = hash || '#/landing';
      const [path, query] = hashStr.split('?');
      const view = path.replace('#/', '') || 'landing';
      
      const paramsObj = {};
      if (query) {
        new URLSearchParams(query).forEach((val, key) => {
          paramsObj[key] = val;
        });
      }
      
      setRoute({ view, params: paramsObj });
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Protect routes
  useEffect(() => {
    const publicViews = ['landing', 'login', 'signup'];
    if (!user && !publicViews.includes(route.view)) {
      navigate('login');
    } else if (user && (route.view === 'login' || route.view === 'signup' || route.view === 'landing')) {
      navigate('dashboard');
    }
  }, [user, route.view]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const isPublicPage = ['landing', 'login', 'signup'].includes(route.view);

  return (
    <div className="min-h-screen flex bg-surface transition-colors duration-300 overflow-hidden font-body text-left">
      {!isPublicPage && (
        <Sidebar 
          activeView={route.view} 
          navigate={navigate} 
          onNewAnalysis={() => navigate('dashboard', { action: 'upload' })} 
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        {!isPublicPage && (
          <header className="h-16 border-b border-outline-variant bg-surface-container-lowest/80 backdrop-blur-md px-lg flex items-center justify-between shrink-0 select-none z-20">
            {/* Title / Breadcrumbs */}
            <div className="flex items-center gap-sm text-sm font-semibold text-on-surface">
              <span className="capitalize tracking-wide">
                {route.view === 'dashboard' && 'Dashboard Overview'}
                {route.view === 'library' && 'Document Portfolio Library'}
                {route.view === 'playbook' && 'Playbook Policies Compliance'}
                {route.view === 'workspace' && 'Semantic Analysis Workspace'}
                {route.view === 'compare' && 'Compare Contracts Side-by-Side'}
              </span>
            </div>
            
            {/* Toolbar items */}
            <div className="flex items-center gap-md">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              {/* Chat Bot Assistant Icon */}
              <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                title="Lexicon Assistant"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </button>
            </div>
          </header>
        )}

        {/* View Content Frame */}
        <main className="flex-1 overflow-y-auto bg-surface relative">
          {route.view === 'landing' && <LandingView navigate={navigate} />}
          {route.view === 'login' && <LoginView navigate={navigate} />}
          {route.view === 'signup' && <LoginView navigate={navigate} isSignup={true} />}
          {route.view === 'dashboard' && <DashboardView navigate={navigate} showToast={showToast} />}
          {route.view === 'workspace' && <WorkspaceView navigate={navigate} docId={route.params.id} showToast={showToast} />}
          {route.view === 'library' && <LibraryView navigate={navigate} showToast={showToast} />}
          {route.view === 'playbook' && <PlaybookView />}
          {route.view === 'compare' && <CompareView navigate={navigate} showToast={showToast} />}
        </main>
      </div>

      <div className="fixed bottom-lg left-lg z-50 flex flex-col gap-sm pointer-events-none select-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="bg-primary text-on-primary px-lg py-3 rounded-lg shadow-lg flex items-center gap-md border border-outline-variant/30 pointer-events-auto cursor-pointer animate-bounce-short transition-all duration-300 transform translate-y-0 opacity-100"
          >
            <span className="material-symbols-outlined text-[20px] text-on-tertiary-container animate-pulse">done</span>
            <span className="font-body-md font-medium text-xs">{toast.message}</span>
          </div>
        ))}
      </div>

      {!isPublicPage && (
        <GlobalChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlaybookProvider>
          <AppContent />
        </PlaybookProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
