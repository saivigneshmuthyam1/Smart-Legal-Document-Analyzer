import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:5000';

export default function LibraryView({ navigate, initialTab = 'all', showToast }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [pinnedDocs, setPinnedDocs] = useState([]);
  const [filterTag, setFilterTag] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching library docs:", error);
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

        const category = `all ${riskLevel.includes('HIGH') ? 'compliance' : ''}`.trim();

        return {
          id: doc.document_id,
          name: docName,
          filename: `${docName}.pdf`,
          date: new Date(doc.created_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: true
          }).toUpperCase(),
          risk_level: riskLevel,
          category: category,
          metadata: doc.metadata
        };
      });
      
      setDocuments(formattedDocs);
      
      // Load pinned docs
      const storedPins = JSON.parse(localStorage.getItem(`lexicon_pinned_${user.id}`) || '[]');
      setPinnedDocs(storedPins);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  useEffect(() => {
    setFilterTag(initialTab);
  }, [initialTab]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const getFilteredDocs = () => {
    return documents.map(doc => {
      const isPinned = pinnedDocs.includes(doc.id);
      let categories = ['all'];
      if (doc.risk_level.includes('HIGH') || doc.risk_level.includes('CRITICAL')) {
        categories.push('compliance');
      }
      if (isPinned) {
        categories.push('pinned');
      }
      return { ...doc, categoryList: categories, isPinned };
    }).filter(doc => {
      const searchStr = searchQuery.toLowerCase();
      
      const nameMatch = (doc.name || '').toLowerCase().includes(searchStr);
      const filenameMatch = (doc.filename || '').toLowerCase().includes(searchStr);
      const riskMatch = (doc.risk_level || '').toLowerCase().includes(searchStr);
      
      let partyMatch = false;
      if (doc.metadata && Array.isArray(doc.metadata.parties)) {
        partyMatch = doc.metadata.parties.some(p => (p || '').toLowerCase().includes(searchStr));
      }
      
      const matchesSearch = nameMatch || filenameMatch || riskMatch || partyMatch;
      const categoryMatch = doc.categoryList.includes(filterTag);
      
      return matchesSearch && categoryMatch;
    });
  };

  const togglePin = (doc, e) => {
    e.stopPropagation();
    if (!user) return;
    
    let newPins;
    if (pinnedDocs.includes(doc.id)) {
      newPins = pinnedDocs.filter(id => id !== doc.id);
      showToast(`Unpinned "${doc.name}"`);
    } else {
      newPins = [...pinnedDocs, doc.id];
      showToast(`Pinned "${doc.name}"`);
    }
    
    setPinnedDocs(newPins);
    localStorage.setItem(`lexicon_pinned_${user.id}`, JSON.stringify(newPins));
  };

  const triggerDelete = (doc, e) => {
    e.stopPropagation();
    setDocToDelete(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    
    try {
      const { data, error } = await supabase
        .from('analyses')
        .delete()
        .eq('document_id', docToDelete.id)
        .select();
        
      if (error) {
        showToast(`Error deleting document: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        showToast(`Document could not be deleted (Insufficient permissions).`);
        setShowDeleteModal(false);
        setDocToDelete(null);
        return;
      }
      
      const updated = documents.filter(d => d.id !== docToDelete.id);
      setDocuments(updated);
      
      localStorage.removeItem(`analysis_${docToDelete.id}`);
      
      showToast(`"${docToDelete.name}" deleted successfully.`);
      setShowDeleteModal(false);
      setDocToDelete(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
      showToast(`Failed to delete document: ${err.message || 'Unknown error'}`);
    }
  };

  const handleExport = (doc, e) => {
    e.stopPropagation();
    const isStatic = String(doc.id).startsWith('static');
    if (isStatic) {
      showToast(`Generating PDF report for demo "${doc.name}"...`);
      setTimeout(() => {
        showToast("Demo report downloaded successfully.");
      }, 1500);
    } else {
      showToast(`Generating report for "${doc.name}"...`);
      window.open(`${API_BASE}/report/${doc.id}`, '_blank');
    }
  };

  const getBadgeClass = (riskLevel) => {
    if (riskLevel === 'HIGH RISK') {
      return "bg-error-container text-on-error-container border-error";
    } else if (riskLevel === 'MEDIUM RISK') {
      return "bg-secondary-container text-on-secondary-container border-secondary";
    }
    return "bg-surface-container-high text-on-surface-variant border-outline";
  };

  const filteredDocs = getFilteredDocs();

  return (
    <div className="max-w-container-max mx-auto w-full px-side-margin py-[60px] select-none">
      {/* Main Table Content */}
      <main className="space-y-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Document Library</h2>
            <p className="text-on-surface-variant font-body-md text-sm mt-1">Access and manage all analyzed legal documents.</p>
          </div>
          <div className="relative flex items-center border border-outline-variant/60 bg-surface-container-lowest px-md py-2.5 rounded-lg w-full sm:w-80 shadow-sm transition-soft focus-within:ring-2 focus-within:ring-primary/5 focus-within:border-primary/40">
            <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">search</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearch}
              className="bg-transparent border-none outline-none font-body-md text-sm w-full text-on-surface placeholder:text-on-surface-variant"
              placeholder="Search contracts..."
            />
          </div>
        </div>

        {/* Horizontal Segment Filter */}
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 font-semibold text-xs shrink-0 self-start w-fit select-none">
          <button 
            className={`px-5 py-2 rounded-lg transition-soft flex items-center gap-1.5 ${filterTag === 'all' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setFilterTag('all')}
          >
            <span className="material-symbols-outlined text-[16px]">folder</span>
            <span>All Documents</span>
          </button>
          <button 
            className={`px-5 py-2 rounded-lg transition-soft flex items-center gap-1.5 ${filterTag === 'pinned' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setFilterTag('pinned')}
          >
            <span className="material-symbols-outlined text-[16px]">push_pin</span>
            <span>Pinned Contracts</span>
          </button>
          <button 
            className={`px-5 py-2 rounded-lg transition-soft flex items-center gap-1.5 ${filterTag === 'compliance' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setFilterTag('compliance')}
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Compliance Focus</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-2xl overflow-hidden legal-shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface-container-low/20">
                <th className="px-md py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Document Name</th>
                <th className="px-md py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Analysis Date</th>
                <th className="px-md py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Risk Profile</th>
                <th className="px-md py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-[100px] text-on-surface-variant font-body-md text-sm">
                    No matching documents found in this view.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isStatic = String(doc.id).startsWith('static');
                  const viewParams = isStatic ? {} : { id: doc.id };

                  return (
                    <tr 
                      key={doc.id}
                      className="hover:bg-surface-container-low/40 transition-colors group cursor-pointer text-sm"
                      onClick={() => navigate('workspace', viewParams)}
                    >
                      <td className="px-md py-4">
                        <div className="flex items-center gap-md">
                          <span className="material-symbols-outlined text-on-surface-variant">article</span>
                          <div>
                            <p className="font-semibold text-on-surface group-hover:text-primary transition-colors truncate max-w-sm" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="text-caption font-caption text-on-surface-variant text-xs">{doc.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-md py-4 font-label-md text-xs text-on-surface-variant uppercase">
                        {doc.date}
                      </td>
                      <td className="px-md py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 risk-indicator rounded-md font-label-md text-[10px] font-bold ${getBadgeClass(doc.risk_level)}`}>
                          {doc.risk_level}
                        </span>
                      </td>
                      <td className="px-md py-4">
                        <div className="flex justify-end gap-xs md:opacity-40 group-hover:opacity-100 transition-opacity">
                          <button 
                            className={`p-2 rounded-md transition-colors ${doc.isPinned ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'}`} 
                            title={doc.isPinned ? "Unpin Document" : "Pin Document"}
                            onClick={(e) => togglePin(doc, e)}
                          >
                            <span className="material-symbols-outlined text-[18px]">push_pin</span>
                          </button>
                          <button 
                            className="p-2 hover:bg-surface-container-high rounded-md transition-colors text-on-surface-variant hover:text-primary" 
                            title="View Analysis"
                            onClick={() => navigate('workspace', viewParams)}
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button 
                            className="p-2 hover:bg-surface-container-high rounded-md transition-colors text-on-surface-variant hover:text-primary" 
                            title="Export PDF"
                            onClick={(e) => handleExport(doc, e)}
                          >
                            <span className="material-symbols-outlined text-[18px]">ios_share</span>
                          </button>
                          <button 
                            className="p-2 hover:bg-error-container hover:text-error rounded-md transition-colors text-on-surface-variant" 
                            title="Delete"
                            onClick={(e) => triggerDelete(doc, e)}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="text-caption font-caption text-on-surface-variant text-xs text-center sm:text-left">
          Showing {filteredDocs.length} of {documents.length} documents
        </p>
      </main>

      {/* Delete Confirmation Modal (ShadCN-like Custom Dialog) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-xl shadow-2xl space-y-lg text-center">
            <div className="w-14 h-14 bg-error-container/20 rounded-full flex items-center justify-center mx-auto text-error">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <div className="space-y-sm">
              <h3 className="font-title-lg text-title-lg text-on-surface font-semibold">Confirm Deletion</h3>
              <p className="text-on-surface-variant font-body-md text-sm">
                Are you sure you want to permanently delete <strong className="text-on-surface">"{docToDelete?.name}"</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-md pt-md">
              <button 
                className="flex-1 bg-surface-container-low border border-outline-variant/40 hover:bg-surface-container-high font-semibold py-3 rounded-lg text-on-surface transition-soft text-sm"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 bg-error text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-soft text-sm"
                onClick={confirmDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
