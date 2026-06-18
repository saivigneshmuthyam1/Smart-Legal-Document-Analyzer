import React, { useEffect, useRef } from "react";
import { X, SlidersHorizontal, Download } from "lucide-react";

/**
 * ExportSettingsModal - Professional SaaS report configuration modal.
 * Supports focus trap, screen-reader descriptions, and keyboard navigation.
 */
export default function ExportSettingsModal({ 
  isOpen, 
  onClose, 
  onGenerate,
  settings,
  setSettings,
  triggerRef
}) {
  const modalRef = useRef(null);

  // Keyboard navigation & accessibility handlers
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore later
    const previousActive = document.activeElement;

    // Focus the modal content for screen readers
    modalRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || [];
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the trigger button when modal closes
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      } else if (previousActive instanceof HTMLElement) {
        previousActive.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const toggleOption = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCheckboxKeyDown = (e, key) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleOption(key);
    }
  };

  const options = [
    { key: "summary", label: "Summary" },
    { key: "risks", label: "Risks" },
    { key: "clauses", label: "Clauses" },
    { key: "metadata", label: "Metadata" },
  ];

  const optionalSections = [
    { key: "docInfo", label: "Document Information" },
    { key: "stats", label: "Analysis Statistics" },
    { key: "riskScore", label: "Risk Score" },
    { key: "timestamp", label: "Generated Timestamp" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden max-h-[90vh] focus:outline-none animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        aria-describedby="export-modal-subtitle"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-primary" strokeWidth={2.2} />
            <h2 
              id="export-modal-title" 
              className="text-[16px] font-bold text-primary tracking-tight"
            >
              Export Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-primary hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
            aria-label="Close export settings modal"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-2 space-y-5">
          <div>
            <p 
              id="export-modal-subtitle" 
              className="text-[13px] text-text-secondary leading-relaxed"
            >
              Select which sections to include in the final PDF report.
            </p>
          </div>

          {/* Primary Sections Group */}
          <div className="space-y-3" role="group" aria-label="Core report sections">
            {options.map((opt) => {
              const checked = settings[opt.key];
              return (
                <div
                  key={opt.key}
                  onClick={() => toggleOption(opt.key)}
                  onKeyDown={(e) => handleCheckboxKeyDown(e, opt.key)}
                  className="flex items-center group cursor-pointer py-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded px-1"
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  aria-label={`Include ${opt.label} section`}
                >
                  <div 
                    className={`w-5 h-5 rounded border flex items-center justify-center mr-3 shrink-0 transition-all ${
                      checked 
                        ? "border-primary bg-primary text-white" 
                        : "border-border bg-white group-hover:border-text-secondary"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[14px] font-medium text-primary tracking-tight">
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>

          <hr className="border-border/60" />

          {/* Additional Sections Group */}
          <div className="space-y-3" role="group" aria-label="Additional report features">
            <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Additional Optional Sections
            </h3>
            {optionalSections.map((opt) => {
              const checked = settings[opt.key];
              return (
                <div
                  key={opt.key}
                  onClick={() => toggleOption(opt.key)}
                  onKeyDown={(e) => handleCheckboxKeyDown(e, opt.key)}
                  className="flex items-center group cursor-pointer py-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded px-1"
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  aria-label={`Include ${opt.label} data`}
                >
                  <div 
                    className={`w-5 h-5 rounded border flex items-center justify-center mr-3 shrink-0 transition-all ${
                      checked 
                        ? "border-primary bg-primary text-white" 
                        : "border-border bg-white group-hover:border-text-secondary"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[14px] font-medium text-primary tracking-tight">
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-border flex items-center justify-between gap-3 bg-primary-50/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-primary-50 hover:bg-primary-100 border-none text-[13px] font-bold text-primary rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generate PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
