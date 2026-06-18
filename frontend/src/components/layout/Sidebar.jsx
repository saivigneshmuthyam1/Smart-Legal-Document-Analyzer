import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeView, navigate, onNewAnalysis, onToggleChat }) {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lexicon_sidebar_collapsed') || 'false');
    } catch {
      return false;
    }
  });

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('lexicon_sidebar_collapsed', JSON.stringify(nextState));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('login');
  };

  const getLinkClass = (view) => {
    const baseClass = "flex items-center gap-md px-md py-3.5 rounded-xl transition-soft cursor-pointer font-semibold text-sm select-none";
    if (activeView === view) {
      return `${baseClass} bg-primary text-on-primary shadow-sm`;
    }
    return `${baseClass} text-on-surface-variant hover:text-primary hover:bg-surface-container-high`;
  };

  return (
    <aside 
      className={`h-screen bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out z-30 relative ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex flex-col flex-1">
        {/* Brand Header */}
        <div className="h-20 border-b border-outline-variant/30 flex items-center justify-between px-md select-none">
          {!isCollapsed ? (
            <span 
              className="font-display-lg text-2xl text-primary tracking-tight font-bold cursor-pointer" 
              onClick={() => navigate('dashboard')}
            >
              Lexicon AI
            </span>
          ) : (
            <span 
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary font-bold text-lg cursor-pointer mx-auto shadow-sm"
              onClick={() => navigate('dashboard')}
            >
              L
            </span>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="p-md">
          <button 
            onClick={onNewAnalysis}
            className={`w-full bg-primary/10 text-primary hover:bg-primary/15 transition-soft flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl shadow-sm hover:shadow active:scale-[0.98] ${isCollapsed ? 'px-2' : 'px-4'}`}
            title="New Analysis"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {!isCollapsed && <span className="text-xs">New Audit</span>}
          </button>
        </div>

        {/* Tab links */}
        <nav className="flex-1 px-md py-sm space-y-1">
          <a className={getLinkClass('dashboard')} onClick={() => navigate('dashboard')} title="Dashboard">
            <span className="material-symbols-outlined">dashboard</span>
            {!isCollapsed && <span>Dashboard</span>}
          </a>
          <a className={getLinkClass('library')} onClick={() => navigate('library')} title="Library">
            <span className="material-symbols-outlined">folder_special</span>
            {!isCollapsed && <span>Library</span>}
          </a>
          <a className={getLinkClass('playbook')} onClick={() => navigate('playbook')} title="Playbook">
            <span className="material-symbols-outlined">gavel</span>
            {!isCollapsed && <span>Playbook</span>}
          </a>
          <a className={getLinkClass('compare')} onClick={() => navigate('compare')} title="Compare Docs">
            <span className="material-symbols-outlined">compare_arrows</span>
            {!isCollapsed && <span>Compare Docs</span>}
          </a>
          <a 
            className="flex items-center gap-md px-md py-3.5 rounded-xl transition-soft cursor-pointer font-semibold text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high select-none"
            onClick={onToggleChat}
            title="AI Chatbot Assistant"
          >
            <span className="material-symbols-outlined">chat</span>
            {!isCollapsed && <span>Global Assistant</span>}
          </a>
        </nav>
      </div>

      {/* Footer / User Profile section */}
      <div className="border-t border-outline-variant/30 bg-surface-container-lowest p-md space-y-md shrink-0">
        
        {/* User profile banner */}
        <div className="flex items-center gap-md select-none overflow-hidden">
          <div className="w-9 h-9 bg-secondary/15 text-secondary border border-secondary/20 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <div className="text-left truncate">
              <p className="text-xs font-bold text-on-surface truncate">{user?.email || 'User Session'}</p>
              <button 
                onClick={handleSignOut}
                className="text-[11px] text-error hover:underline font-semibold flex items-center gap-0.5 mt-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Collapse Toggle and copyright */}
        <div className="flex items-center justify-between gap-md pt-base border-t border-outline-variant/20">
          {!isCollapsed && (
            <span className="text-[10px] text-on-surface-variant font-medium select-none">
              © 2024 Juris Precision
            </span>
          )}
          <button 
            onClick={handleToggleCollapse}
            className={`w-8 h-8 rounded-full border border-outline-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
