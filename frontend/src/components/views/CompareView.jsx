import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ReactDiffViewer from 'react-diff-viewer-continued';

const API_BASE = 'http://localhost:5000';

export default function CompareView({ navigate, showToast }) {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [documents, setDocuments] = useState([]);
  const [selectedDocIdA, setSelectedDocIdA] = useState('');
  const [selectedDocIdB, setSelectedDocIdB] = useState('');
  const [selectedClause, setSelectedClause] = useState('__overview__'); // '__overview__' or clause title
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching compare docs:", error);
        showToast("Error loading document list: " + error.message);
        return;
      }

      setDocuments(data || []);

      // Pre-select first two documents if they exist
      if (data && data.length >= 2) {
        setSelectedDocIdA(data[0].document_id);
        setSelectedDocIdB(data[1].document_id);
      } else if (data && data.length === 1) {
        setSelectedDocIdA(data[0].document_id);
      }
    } catch (err) {
      console.error(err);
      showToast("Error fetching documents");
    } finally {
      setIsLoading(false);
    }
  };

  const docA = documents.find(d => d.document_id === selectedDocIdA);
  const docB = documents.find(d => d.document_id === selectedDocIdB);

  const getClauses = (doc) => {
    if (!doc || !doc.clauses) return [];
    return [
      ...(doc.clauses.standard_clauses || []).map(c => ({ ...c, isStandard: true })),
      ...(doc.clauses.non_standard_clauses || []).map(c => ({ ...c, isStandard: false }))
    ];
  };

  const clausesA = getClauses(docA);
  const clausesB = getClauses(docB);

  // Compute unique clause titles across both documents
  const getUniqueClauseTitles = () => {
    const titles = new Set();
    clausesA.forEach(c => { if (c.title) titles.add(c.title); });
    clausesB.forEach(c => { if (c.title) titles.add(c.title); });
    return Array.from(titles).sort();
  };

  const clauseTitles = getUniqueClauseTitles();

  const computeRiskMetrics = (doc) => {
    if (!doc || !doc.risks) return { score: "0.0", high: 0, medium: 0, low: 0, level: 'LOW RISK' };
    const risks = doc.risks;
    const high = risks.filter(r => (r.severity || '').toLowerCase() === 'high' || (r.severity || '').toLowerCase() === 'critical').length;
    const medium = risks.filter(r => (r.severity || '').toLowerCase() === 'medium').length;
    const low = risks.filter(r => (r.severity || '').toLowerCase() === 'low').length;
    const score = Math.min(10, (high * 3 + medium * 1.5 + low * 0.5)).toFixed(1);
    
    let level = 'LOW RISK';
    if (high > 0) level = 'HIGH RISK';
    else if (medium > 0) level = 'MEDIUM RISK';

    return { score, high, medium, low, level };
  };

  const metricsA = computeRiskMetrics(docA);
  const metricsB = computeRiskMetrics(docB);

  const getBadgeClass = (level) => {
    if (level === 'HIGH RISK') {
      return "bg-error-container text-on-error-container border-error border-l-2 pl-2";
    }
    if (level === 'MEDIUM RISK') {
      return "bg-secondary-container text-on-secondary-container border-secondary border-l-2 pl-2";
    }
    return "bg-surface-container-high text-on-surface-variant border-outline border-l-2 pl-2";
  };

  // Diff styles configuration matching Lexicon AI themes
  const diffStyles = {
    variables: {
      light: {
        diffViewerBackground: 'transparent',
        addedBackground: 'rgba(76, 175, 80, 0.12)',
        addedColor: '#1b5e20',
        removedBackground: 'rgba(244, 67, 54, 0.12)',
        removedColor: '#b71c1c',
        wordAddedBackground: 'rgba(76, 175, 80, 0.3)',
        wordRemovedBackground: 'rgba(244, 67, 54, 0.3)',
        emptyLineBackground: 'transparent'
      },
      dark: {
        diffViewerBackground: 'transparent',
        addedBackground: 'rgba(76, 175, 80, 0.2)',
        addedColor: '#a5d6a7',
        removedBackground: 'rgba(244, 67, 54, 0.2)',
        removedColor: '#ef9a9a',
        wordAddedBackground: 'rgba(76, 175, 80, 0.45)',
        wordRemovedBackground: 'rgba(244, 67, 54, 0.45)',
        emptyLineBackground: 'transparent'
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-md select-none">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
        <p className="text-on-surface-variant font-semibold text-sm">Loading contract portfolio details...</p>
      </div>
    );
  }

  if (documents.length < 2) {
    return (
      <div className="max-w-2xl mx-auto py-[120px] px-side-margin text-center select-none space-y-lg">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
          <span className="material-symbols-outlined text-4xl">compare_arrows</span>
        </div>
        <div className="space-y-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Side-by-Side Comparison</h2>
          <p className="text-on-surface-variant font-body-md text-sm">
            To compare policies, risk scores, and clause differences side-by-side, you must upload at least two documents to your library.
          </p>
        </div>
        <button
          onClick={() => navigate('dashboard')}
          className="bg-primary text-on-primary px-lg py-3.5 rounded-xl font-bold shadow hover:opacity-90 active:scale-[0.98] transition-soft text-sm inline-flex items-center gap-sm"
        >
          <span className="material-symbols-outlined">upload_file</span>
          <span>Upload Contracts</span>
        </button>
      </div>
    );
  }

  const selectedClauseA = clausesA.find(c => c.title === selectedClause);
  const selectedClauseB = clausesB.find(c => c.title === selectedClause);

  return (
    <div className="flex-1 flex max-w-container-max mx-auto w-full px-side-margin py-8 text-left select-none overflow-hidden h-[calc(100vh-64px)]">
      
      {/* Main View Area */}
      <main className="flex-1 flex flex-col gap-lg h-full overflow-hidden min-w-0">
        
        {/* Document Selectors Header */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-md bg-surface-container-lowest border border-outline-variant/30 p-lg rounded-2xl legal-shadow shrink-0">
          
          {/* Document A Selector */}
          <div className="space-y-sm">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Document A (Base)
            </label>
            <select
              value={selectedDocIdA}
              onChange={(e) => {
                setSelectedDocIdA(e.target.value);
                if (e.target.value === selectedDocIdB) {
                  // Swap or clear to prevent comparing a document to itself
                  const alt = documents.find(d => d.document_id !== e.target.value);
                  if (alt) setSelectedDocIdB(alt.document_id);
                }
              }}
              className="w-full bg-surface-container-low border border-outline-variant/50 px-md py-3 rounded-xl font-semibold text-xs text-on-surface focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10 transition-soft"
            >
              {documents.map(d => (
                <option key={d.document_id} value={d.document_id}>
                  {d.metadata?.document_type || "Contract Review"} ({(d.metadata?.parties || []).slice(0,1).join("") || "Unknown"})
                </option>
              ))}
            </select>
            
            {docA && (
              <div className="flex items-center justify-between gap-sm pt-xs font-semibold text-[11px] text-on-surface-variant">
                <span className="truncate max-w-[130px]" title={(docA.metadata?.parties || []).join(" & ")}>
                  {(docA.metadata?.parties || []).join(" & ") || "Offline Session"}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(metricsA.level)}`}>
                  {metricsA.score} Severity Score
                </span>
              </div>
            )}
          </div>

          {/* Document B Selector */}
          <div className="space-y-sm">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 select-none">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Document B (Compare)
            </label>
            <select
              value={selectedDocIdB}
              onChange={(e) => {
                setSelectedDocIdB(e.target.value);
                if (e.target.value === selectedDocIdA) {
                  const alt = documents.find(d => d.document_id !== e.target.value);
                  if (alt) setSelectedDocIdA(alt.document_id);
                }
              }}
              className="w-full bg-surface-container-low border border-outline-variant/50 px-md py-3 rounded-xl font-semibold text-xs text-on-surface focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10 transition-soft"
            >
              {documents.map(d => (
                <option key={d.document_id} value={d.document_id}>
                  {d.metadata?.document_type || "Contract Review"} ({(d.metadata?.parties || []).slice(0,1).join("") || "Unknown"})
                </option>
              ))}
            </select>

            {docB && (
              <div className="flex items-center justify-between gap-sm pt-xs font-semibold text-[11px] text-on-surface-variant">
                <span className="truncate max-w-[130px]" title={(docB.metadata?.parties || []).join(" & ")}>
                  {(docB.metadata?.parties || []).join(" & ") || "Offline Session"}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(metricsB.level)}`}>
                  {metricsB.score} Severity Score
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Content Viewer Panel */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant/35 rounded-2xl overflow-hidden legal-shadow flex flex-col h-full min-h-0 relative select-none">
          
          {/* Tabs Selector Bar */}
          <div className="shrink-0 h-14 border-b border-outline-variant/30 bg-surface-container-low/20 flex items-center gap-sm select-none overflow-x-auto custom-scrollbar px-lg">
            <button 
              className={`h-full px-md border-b-2 transition-soft flex items-center gap-2 text-xs shrink-0 ${selectedClause === '__overview__' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
              onClick={() => setSelectedClause('__overview__')}
            >
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              <span>Overview Contrast</span>
            </button>

            {clauseTitles.length > 0 && <span className="h-4 w-[1px] bg-outline-variant/40 shrink-0"></span>}

            {clauseTitles.map((title) => {
              const hasA = clausesA.some(c => c.title === title);
              const hasB = clausesB.some(c => c.title === title);
              
              let badgeText = "";
              let badgeClass = "";
              
              if (hasA && !hasB) {
                badgeText = "Doc A Only";
                badgeClass = "bg-red-500/10 text-red-500";
              } else if (!hasA && hasB) {
                badgeText = "Doc B Only";
                badgeClass = "bg-blue-500/10 text-blue-500";
              }

              return (
                <button 
                  key={title}
                  className={`h-full px-md border-b-2 transition-soft flex items-center gap-2 text-xs shrink-0 ${selectedClause === title ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
                  onClick={() => setSelectedClause(title)}
                >
                  <span>{title}</span>
                  {badgeText && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${badgeClass}`}>
                      {badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedClause === '__overview__' ? (
            /* OVERVIEW CONTRAST */
            <div className="flex-1 overflow-y-auto p-lg space-y-lg scrollbar-thin">
              
              {/* Row 1: Document Basics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg pb-lg border-b border-outline-variant/20">
                {/* Doc A Basics */}
                <div className="space-y-md">
                  <h4 className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-sm">
                    <span className="material-symbols-outlined text-red-500">article</span>
                    Document A (Base)
                  </h4>
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-2.5 text-on-surface-variant font-semibold w-1/3">Type</td>
                        <td className="py-2.5 text-on-surface font-bold capitalize">{docA?.metadata?.document_type || "Unknown"}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-2.5 text-on-surface-variant font-semibold">Parties</td>
                        <td className="py-2.5 text-on-surface font-bold">{(docA?.metadata?.parties || []).join(" vs ") || "None"}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-2.5 text-on-surface-variant font-semibold">Effective Date</td>
                        <td className="py-2.5 text-on-surface font-bold">{docA?.metadata?.effective_date || "Not set"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Doc B Basics */}
                <div className="space-y-md">
                  <h4 className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-sm">
                    <span className="material-symbols-outlined text-blue-500">article</span>
                    Document B (Compare)
                  </h4>
                  <table className="w-full text-xs text-left border-collapse">
                    <tbody>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-2.5 text-on-surface-variant font-semibold w-1/3">Type</td>
                        <td className="py-2.5 text-on-surface font-bold capitalize">{docB?.metadata?.document_type || "Unknown"}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-2.5 text-on-surface-variant font-semibold">Parties</td>
                        <td className="py-2.5 text-on-surface font-bold">{(docB?.metadata?.parties || []).join(" vs ") || "None"}</td>
                      </tr>
                      <tr className="border-b border-outline-variant/10">
                        <td className="py-2.5 text-on-surface-variant font-semibold">Effective Date</td>
                        <td className="py-2.5 text-on-surface font-bold">{docB?.metadata?.effective_date || "Not set"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Row 2: Risk Profile Contrast */}
              <div className="pb-lg border-b border-outline-variant/20 space-y-md">
                <h4 className="font-title-md text-title-md text-on-surface font-semibold">Risk Profiles Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                  {/* Doc A Risks */}
                  <div className="bg-surface-container-low/40 border border-outline-variant/20 p-md rounded-xl space-y-sm">
                    <div className="flex justify-between items-center pb-sm border-b border-outline-variant/10">
                      <span className="text-xs font-bold text-on-surface">Document A</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeClass(metricsA.level)}`}>
                        {metricsA.score} Score
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-xs text-center text-[10px] font-bold">
                      <div className="bg-error-container/30 border border-error/20 p-sm rounded-lg text-error">
                        <span className="block text-lg">{metricsA.high}</span>
                        Critical
                      </div>
                      <div className="bg-secondary-container/40 border border-secondary/20 p-sm rounded-lg text-on-secondary-container">
                        <span className="block text-lg">{metricsA.medium}</span>
                        Medium
                      </div>
                      <div className="bg-surface-container-high/60 border border-outline-variant/20 p-sm rounded-lg text-on-surface-variant">
                        <span className="block text-lg">{metricsA.low}</span>
                        Low
                      </div>
                    </div>
                  </div>

                  {/* Doc B Risks */}
                  <div className="bg-surface-container-low/40 border border-outline-variant/20 p-md rounded-xl space-y-sm">
                    <div className="flex justify-between items-center pb-sm border-b border-outline-variant/10">
                      <span className="text-xs font-bold text-on-surface">Document B</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getBadgeClass(metricsB.level)}`}>
                        {metricsB.score} Score
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-xs text-center text-[10px] font-bold">
                      <div className="bg-error-container/30 border border-error/20 p-sm rounded-lg text-error">
                        <span className="block text-lg">{metricsB.high}</span>
                        Critical
                      </div>
                      <div className="bg-secondary-container/40 border border-secondary/20 p-sm rounded-lg text-on-secondary-container">
                        <span className="block text-lg">{metricsB.medium}</span>
                        Medium
                      </div>
                      <div className="bg-surface-container-high/60 border border-outline-variant/20 p-sm rounded-lg text-on-surface-variant">
                        <span className="block text-lg">{metricsB.low}</span>
                        Low
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Summaries Contrast */}
              <div className="space-y-md">
                <h4 className="font-title-md text-title-md text-on-surface font-semibold">Executive Summaries Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  {/* Doc A Summary */}
                  <div className="bg-surface-container-low/20 border border-outline-variant/10 p-md rounded-xl space-y-sm">
                    <h5 className="font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Document A Summary</h5>
                    <p className="text-xs text-on-surface leading-relaxed font-normal whitespace-pre-wrap">
                      {docA?.summary?.main_summary || "No summary available."}
                    </p>
                  </div>

                  {/* Doc B Summary */}
                  <div className="bg-surface-container-low/20 border border-outline-variant/10 p-md rounded-xl space-y-sm">
                    <h5 className="font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Document B Summary</h5>
                    <p className="text-xs text-on-surface leading-relaxed font-normal whitespace-pre-wrap">
                      {docB?.summary?.main_summary || "No summary available."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* CLAUSE DIFF COMPARISON */
            <div className="flex-1 flex flex-col h-full min-h-0">
              
              {/* Clause Header & standard comparison */}
              <div className="shrink-0 p-lg border-b border-outline-variant/30 bg-surface-container-low/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
                <div>
                  <h4 className="font-title-md text-title-md text-on-surface font-bold flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary text-[20px]">compare_arrows</span>
                    Comparing: {selectedClause}
                  </h4>
                  <p className="text-on-surface-variant font-caption text-xs mt-0.5">
                    Analyzing clause phrasing side-by-side
                  </p>
                </div>
                <div className="flex items-center gap-xl select-none font-semibold text-[10px]">
                  {/* Doc A status */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span className="text-on-surface-variant">Doc A:</span>
                    {selectedClauseA ? (
                      <span className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider ${selectedClauseA.isStandard ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedClauseA.isStandard ? 'Standard' : 'Non-Standard'}
                      </span>
                    ) : (
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-bold uppercase tracking-wider">Missing</span>
                    )}
                  </div>
                  {/* Doc B status */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span className="text-on-surface-variant">Doc B:</span>
                    {selectedClauseB ? (
                      <span className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider ${selectedClauseB.isStandard ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedClauseB.isStandard ? 'Standard' : 'Non-Standard'}
                      </span>
                    ) : (
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-bold uppercase tracking-wider">Missing</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Side-by-Side Diff Viewer */}
              <div className="flex-1 overflow-y-auto font-mono text-xs select-text scrollbar-thin">
                <ReactDiffViewer 
                  oldValue={selectedClauseA?.content || "[This clause is not present in Document A]"}
                  newValue={selectedClauseB?.content || "[This clause is not present in Document B]"}
                  splitView={true}
                  useDarkTheme={isDarkMode}
                  leftTitle="Document A Phrasing"
                  rightTitle="Document B Phrasing"
                  styles={diffStyles}
                />
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
