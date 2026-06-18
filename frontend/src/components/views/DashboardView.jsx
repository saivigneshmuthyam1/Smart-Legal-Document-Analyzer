import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePlaybook } from '../../context/PlaybookContext';
import DashboardAnalytics from './DashboardAnalytics';

const API_BASE = 'http://localhost:5000';

export default function DashboardView({ navigate, showToast }) {
  const { user } = useAuth();
  const { rules, toggleRule, getActiveRules } = usePlaybook();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [recentDocs, setRecentDocs] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Batch Upload Queue
  const [uploadQueue, setUploadQueue] = useState([]);
  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    loadRecentDocs();
  }, []);

  const loadRecentDocs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching recent docs:", error);
        return;
      }
      
      const formattedDocs = data.map(doc => {
        let riskLevel = 'LOW RISK';
        if (doc.risks && doc.risks.length > 0) {
          const topSeverity = doc.risks[0].severity?.toUpperCase() || '';
          if (topSeverity === 'HIGH' || topSeverity === 'CRITICAL') {
            riskLevel = 'HIGH RISK';
          } else if (topSeverity === 'MEDIUM') {
            riskLevel = 'MEDIUM RISK';
          }
        }
        
        let docName = "Document";
        if (doc.metadata && doc.metadata.document_type) {
           docName = doc.metadata.document_type;
        }

        return {
          id: doc.document_id,
          name: docName,
          date: new Date(doc.created_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
          }).toUpperCase(),
          risk_level: riskLevel,
          type: doc.metadata?.document_type?.toUpperCase() || 'CONTRACT'
        };
      });
      
      setRecentDocs(formattedDocs.slice(0, 4)); // Only show top 4 as recent
      
      // Compute analytics from all documents
      const riskCounts = { 'HIGH RISK': 0, 'MEDIUM RISK': 0, 'LOW RISK': 0 };
      const typeCounts = {};
      
      formattedDocs.forEach(doc => {
        if (riskCounts[doc.risk_level] !== undefined) {
          riskCounts[doc.risk_level]++;
        }
        
        const type = doc.type || 'OTHER';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      setAnalyticsData({
        totalDocs: formattedDocs.length,
        riskCounts,
        typeCounts
      });

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // If there is an active item processing, do not start another one
    const activeItem = uploadQueue.find(item => item.status === 'processing');
    if (activeItem) return;

    // Find the first pending item
    const nextPending = uploadQueue.find(item => item.status === 'pending');
    if (nextPending) {
      processQueueItem(nextPending);
    }
  }, [uploadQueue]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const addFilesToQueue = (filesList) => {
    const newItems = Array.from(filesList).map(file => ({
      id: Math.random().toString(36).substring(7) + '_' + Date.now(),
      file: file,
      name: file.name,
      progress: 0,
      status: 'pending',
      error: null
    }));
    setUploadQueue(prev => [...prev, ...newItems]);
  };

  const addPasteTextToQueue = (text) => {
    const newItem = {
      id: Math.random().toString(36).substring(7) + '_' + Date.now(),
      content: text,
      name: `Pasted_Contract_${new Date().toLocaleTimeString().replace(/:/g, '-')}.txt`,
      progress: 0,
      status: 'pending',
      error: null
    };
    setUploadQueue(prev => [...prev, newItem]);
  };

  const updateQueueItem = (id, updates) => {
    setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const retryQueueItem = (id) => {
    setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'pending', error: null, progress: 0 } : item));
  };

  const clearQueue = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setUploadQueue([]);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFilesToQueue(files);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      addFilesToQueue(files);
    }
  };

  const startSubmitAnalysis = () => {
    if (activeTab === 'paste') {
      if (!pasteText.trim()) {
        showToast("Please paste contract text to analyze.");
        return;
      }
      addPasteTextToQueue(pasteText);
      setPasteText('');
    } else {
      if (fileInputRef.current && fileInputRef.current.files.length > 0) {
        addFilesToQueue(fileInputRef.current.files);
        fileInputRef.current.value = '';
      } else {
        fileInputRef.current?.click();
      }
    }
  };

  const processQueueItem = async (item) => {
    updateQueueItem(item.id, { status: 'processing', progress: 10 });

    let currentProgress = 10;
    const intervalId = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 6) + 3;
      if (currentProgress > 90) currentProgress = 90;
      updateQueueItem(item.id, { progress: currentProgress });
    }, 450);

    progressIntervalRef.current = intervalId;

    try {
      const activeRules = getActiveRules();
      let res;
      if (item.content !== undefined) {
        res = await fetch(`${API_BASE}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input_type: 'text',
            content: item.content,
            user_id: user?.id || 'unknown',
            playbook_rules: activeRules
          })
        });
      } else {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('user_id', user?.id || 'unknown');
        formData.append('playbook_rules', JSON.stringify(activeRules));
        res = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData
        });
      }

      clearInterval(intervalId);

      if (!res.ok) {
        const errText = await res.json().then(e => e.detail || 'Analysis failed').catch(() => 'Analysis failed');
        throw new Error(errText);
      }

      const data = await res.json();
      const docId = data.document_id;
      localStorage.setItem(`analysis_${docId}`, JSON.stringify(data));

      await loadRecentDocs();

      setUploadQueue(prev => {
        const updated = prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100, docId } : q);
        if (updated.length === 1) {
          setTimeout(() => {
            navigate('workspace', { id: docId });
            setUploadQueue([]);
          }, 800);
        }
        return updated;
      });

      showToast(`Successfully analyzed ${item.name}`);
    } catch (err) {
      clearInterval(intervalId);
      console.error(err);
      updateQueueItem(item.id, { status: 'error', error: err.message || 'Analysis failed', progress: 0 });
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 py-8 max-w-container-max mx-auto px-side-margin text-left">
      
      {/* Hero Welcome Banner */}
      <section className="mb-md">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-lg border border-outline-variant/30 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-headline-md text-headline-md text-on-surface font-semibold">Welcome to Lexicon AI</h1>
            <p className="text-on-surface-variant font-body-md text-sm">Upload, analyze, and manage your legal documents against customized playbooks.</p>
          </div>
          <div className="hidden lg:flex items-center gap-md text-xs font-semibold text-on-surface-variant bg-surface-container-low/40 p-md rounded-xl border border-outline-variant/20 shadow-sm shrink-0">
            <div className="text-center px-4 border-r border-outline-variant/30">
              <span className="block text-lg font-bold text-primary">{analyticsData?.totalDocs || 0}</span>
              <span className="text-[10px] text-on-surface-variant">Total Audits</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-lg font-bold text-error">{analyticsData?.riskCounts?.['HIGH RISK'] || 0}</span>
              <span className="text-[10px] text-on-surface-variant">High Risks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column (Upload Area + Recent Docs) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Document Submission Interface */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-xl legal-shadow relative overflow-hidden">


            <div className="mb-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-lg">
              <div className="text-left">
                <h2 className="font-title-lg text-title-lg text-on-surface font-semibold">Document Submission</h2>
                <p className="text-on-surface-variant font-body-md text-xs mt-1">Analyze new agreements, NDAs, or master service contracts.</p>
              </div>
              <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 font-semibold text-xs shrink-0">
                <button 
                  className={`px-6 py-2 rounded-lg transition-soft ${activeTab === 'upload' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => setActiveTab('upload')}
                >
                  Upload PDF
                </button>
                <button 
                  className={`px-6 py-2 rounded-lg transition-soft ${activeTab === 'paste' ? 'bg-surface-container-lowest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => setActiveTab('paste')}
                >
                  Paste Raw Text
                </button>
              </div>
            </div>
            
            {/* Interactive Dropzone */}
            <div className="group relative">
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".pdf" 
                multiple
                onChange={handleFileChange}
              />
              {activeTab === 'upload' ? (
                <div 
                  className={`h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-soft cursor-pointer ${isDragOver ? 'bg-surface-container-high border-primary' : 'border-outline-variant/40 bg-surface-container-low/30 hover:bg-surface-container-low hover:border-primary/30'}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-14 h-14 bg-surface-container-lowest rounded-xl border border-outline-variant/20 flex items-center justify-center mb-md shadow-sm group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                  </div>
                  <p className="font-title-lg text-title-lg text-on-surface font-medium">Click to upload or drag and drop</p>
                  <p className="text-on-surface-variant font-caption text-xs mt-2">PDF files only (Max 50MB)</p>
                </div>
              ) : (
                <div>
                  <textarea 
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    className="w-full h-72 bg-surface-container-low/30 border border-outline-variant/40 rounded-2xl p-lg font-label-md text-xs focus:ring-2 focus:ring-primary/5 focus:border-primary/30 outline-none transition-soft resize-none text-left" 
                    placeholder="Paste your contract text here for immediate semantic analysis..."
                  />
                </div>
              )}
            </div>

            {/* Batch Processing Queue */}
            {uploadQueue.length > 0 && (() => {
              const completedCount = uploadQueue.filter(item => item.status === 'completed' || item.status === 'error').length;
              const totalCount = uploadQueue.length;
              const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div className="mt-xl border-t border-outline-variant/30 pt-lg space-y-md select-none text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                        <span>Analysis Queue</span>
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary">
                          {completedCount}/{totalCount}
                        </span>
                      </h3>
                      <p className="text-on-surface-variant font-caption text-xs mt-0.5">
                        Sequential batch analysis running in background
                      </p>
                    </div>
                    <button 
                      onClick={clearQueue}
                      className="text-xs font-semibold text-error hover:bg-error/5 border border-error/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Clear Queue
                    </button>
                  </div>
                  
                  {/* Overall Progress Bar */}
                  <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden relative">
                    <div 
                      className="bg-primary h-full transition-all duration-300" 
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>

                  {/* List of queue items */}
                  <div className="space-y-sm max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {uploadQueue.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-md bg-surface-container-low/40 border border-outline-variant/20 rounded-xl gap-md">
                        <div className="flex items-center gap-md min-w-0 flex-1">
                          <span className="material-symbols-outlined text-on-surface-variant shrink-0">
                            {item.content !== undefined ? 'notes' : 'picture_as_pdf'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-on-surface truncate" title={item.name}>
                              {item.name}
                            </p>
                            {item.status === 'processing' && (
                              <div className="flex items-center gap-sm mt-1">
                                <div className="w-24 bg-surface-container-high h-1 rounded-full overflow-hidden">
                                  <div className="bg-primary h-full" style={{ width: `${item.progress}%` }}></div>
                                </div>
                                <span className="text-[10px] text-primary font-bold">{item.progress}%</span>
                              </div>
                            )}
                            {item.status === 'error' && (
                              <p className="text-[10px] text-error font-medium truncate mt-0.5" title={item.error}>{item.error}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-md shrink-0">
                          {item.status === 'pending' && (
                            <span className="text-[10px] bg-surface-container-high text-on-surface-variant border border-outline-variant/30 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                              Pending
                            </span>
                          )}
                          {item.status === 'processing' && (
                            <div className="flex items-center gap-1.5 text-primary">
                              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider">Analyzing</span>
                            </div>
                          )}
                          {item.status === 'completed' && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                              <button
                                onClick={() => navigate('workspace', { id: item.docId })}
                                className="bg-primary/10 hover:bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                              >
                                Open
                                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                              </button>
                            </div>
                          )}
                          {item.status === 'error' && (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-error text-[18px]">error</span>
                              <button
                                onClick={() => retryQueueItem(item.id)}
                                className="bg-error/10 hover:bg-error/15 text-error text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                              >
                                Retry
                              </button>
                            </div>
                          )}
                          {item.status !== 'processing' && (
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="text-on-surface-variant hover:text-error transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-high"
                              title="Remove"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="mt-xl flex flex-col sm:flex-row justify-between items-center gap-lg pt-lg border-t border-outline-variant/30 select-none">
              <div className="flex items-center gap-xl text-sm font-semibold">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-outline-variant checked:border-primary checked:bg-primary" type="checkbox" defaultChecked />
                    <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 left-0.5 text-[16px] pointer-events-none">check</span>
                  </div>
                  <span className="text-on-surface-variant group-hover:text-on-surface transition-soft">Enable Risk Scoring</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-outline-variant checked:border-primary checked:bg-primary" type="checkbox" defaultChecked />
                    <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 left-0.5 text-[16px] pointer-events-none">check</span>
                  </div>
                  <span className="text-on-surface-variant group-hover:text-on-surface transition-soft">Clause Extraction</span>
                </label>
              </div>
              <button 
                className="w-full sm:w-auto bg-primary text-on-primary px-xl py-4 font-semibold rounded-lg flex items-center justify-center gap-sm hover:opacity-90 active:scale-95 transition-soft text-sm"
                onClick={startSubmitAnalysis}
              >
                <span>Begin Analysis</span>
                <span className="material-symbols-outlined text-[20px]">analytics</span>
              </button>
            </div>
          </div>

          {/* Recent Documents Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-title-lg text-title-lg text-on-surface font-semibold">Recent Documents</h3>
                <p className="text-on-surface-variant font-caption text-xs">Manage and track your latest analysis sessions.</p>
              </div>
              <button 
                className="text-primary font-semibold hover:opacity-70 transition-soft flex items-center gap-2 text-sm"
                onClick={() => navigate('library')}
              >
                View All Library
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              {recentDocs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center p-xl border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/20 text-center min-h-[220px]">
                  <span className="material-symbols-outlined text-outline text-4xl mb-md text-on-surface-variant">folder_open</span>
                  <p className="font-title-lg text-title-lg text-on-surface font-semibold">No recent files</p>
                  <p className="text-on-surface-variant font-body-md text-sm mt-sm">Your recently uploaded and analyzed documents will appear here.</p>
                </div>
              ) : (
                recentDocs.map((doc) => {
                  let badgeClass = "bg-surface-container-high text-on-surface-variant border-outline";
                  if (doc.risk_level === 'HIGH RISK') {
                    badgeClass = "bg-error-container text-on-error-container border-error";
                  } else if (doc.risk_level === 'MEDIUM RISK') {
                    badgeClass = "bg-secondary-container text-on-secondary-container border-secondary";
                  }

                  let docType = doc.type || "CONTRACT";

                  return (
                    <div 
                      key={doc.id}
                      className="bg-surface-container-lowest border border-outline-variant/30 p-lg rounded-2xl hover:border-primary/30 hover:shadow-lg transition-soft cursor-pointer group"
                      onClick={() => navigate('workspace', { id: doc.id })}
                    >
                      <div className="flex items-start justify-between mb-lg">
                        <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center group-hover:bg-primary/5 transition-soft">
                          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">description</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1 risk-indicator rounded-md ${badgeClass}`}>
                          <span className="font-label-md text-[10px] font-bold tracking-wider">{doc.risk_level}</span>
                        </div>
                      </div>
                      <h4 className="font-title-lg text-title-lg text-on-surface mb-2 font-semibold group-hover:text-primary transition-colors truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <p className="text-on-surface-variant font-caption text-xs mb-lg">Uploaded {doc.date}</p>
                      <div className="flex items-center justify-between pt-md border-t border-outline-variant/20">
                        <span className="text-label-md font-label-md text-on-surface-variant group-hover:text-on-surface truncate pr-2 text-xs">
                          {docType}
                        </span>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>

        {/* Right Column (Playbook rules sidebar & audit analytics) */}
        <div className="space-y-8">
          
          {/* Active Playbook rules card */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-lg legal-shadow space-y-md">
            <div className="flex justify-between items-center pb-sm border-b border-outline-variant/20">
              <div>
                <h3 className="font-title-md text-title-md text-on-surface font-semibold">Auditor Playbook</h3>
                <p className="text-on-surface-variant font-caption text-xs">Rules applied on new uploads.</p>
              </div>
              <button 
                onClick={() => navigate('playbook')}
                className="text-primary font-semibold hover:underline text-xs flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">settings</span>
                Configure
              </button>
            </div>
            
            <div className="space-y-xs max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {rules.length === 0 ? (
                <p className="text-on-surface-variant text-xs italic">No rules defined. Click configure to add rules.</p>
              ) : (
                rules.map((rule) => (
                  <label key={rule.id} className="flex items-start gap-2.5 p-2 hover:bg-surface-container-low/40 rounded-lg cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      className="peer h-4 w-4 mt-0.5 cursor-pointer accent-primary rounded shrink-0" 
                      checked={rule.active}
                      onChange={() => toggleRule(rule.id)}
                    />
                    <span className="text-xs font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors peer-checked:text-on-surface">
                      {rule.text}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Quick Portfolio Stats widget */}
          {analyticsData && analyticsData.totalDocs > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-2xl p-lg legal-shadow space-y-md">
              <h3 className="font-title-md text-title-md text-on-surface font-semibold pb-sm border-b border-outline-variant/20">Audit Metrics</h3>
              <div className="grid grid-cols-2 gap-sm text-center">
                <div className="bg-surface-container-low p-md rounded-xl">
                  <span className="text-2xl font-bold text-primary block">{analyticsData.totalDocs}</span>
                  <span className="text-[10px] text-on-surface-variant font-semibold">Total Audits</span>
                </div>
                <div className="bg-surface-container-low p-md rounded-xl">
                  <span className="text-2xl font-bold text-error block">{analyticsData.riskCounts['HIGH RISK'] || 0}</span>
                  <span className="text-[10px] text-on-surface-variant font-semibold">High Risk Docs</span>
                </div>
                <div className="bg-surface-container-low p-md rounded-xl">
                  <span className="text-2xl font-bold text-warning block">{analyticsData.riskCounts['MEDIUM RISK'] || 0}</span>
                  <span className="text-[10px] text-on-surface-variant font-semibold">Medium Risk Docs</span>
                </div>
                <div className="bg-surface-container-low p-md rounded-xl">
                  <span className="text-2xl font-bold text-success block">{analyticsData.riskCounts['LOW RISK'] || 0}</span>
                  <span className="text-[10px] text-on-surface-variant font-semibold">Compliant Docs</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Full-Width Analytics Section at the bottom */}
      {analyticsData && analyticsData.totalDocs > 0 && (
        <section className="pt-8 border-t border-outline-variant/20">
          <DashboardAnalytics analyticsData={analyticsData} />
        </section>
      )}

    </div>
  );
}
