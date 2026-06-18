import React, { useState } from 'react';
import { usePlaybook } from '../../context/PlaybookContext';

export default function PlaybookView() {
  const { rules, addRule, removeRule, toggleRule } = usePlaybook();
  const [newRule, setNewRule] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newRule.trim()) {
      addRule(newRule.trim());
      setNewRule('');
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto p-xl py-2xl space-y-xl">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display-lg font-bold text-on-surface mb-2">Company Playbook</h1>
          <p className="text-on-surface-variant font-body-md">
            Define your internal legal rules. The AI will strictly audit all future documents against these rules and generate auto-redlines for violations.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl legal-shadow overflow-hidden">
        <div className="p-lg bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="font-semibold text-on-surface flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">rule</span>
            Active Rules
          </h2>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
            {rules.filter(r => r.active).length} Active
          </span>
        </div>
        
        <div className="divide-y divide-outline-variant/20">
          {rules.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant">
              No rules defined. Add a rule below to start enforcing policies.
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className={`p-md flex items-start gap-md transition-colors hover:bg-surface-container-low/20 ${!rule.active ? 'opacity-60' : ''}`}>
                <button 
                  onClick={() => toggleRule(rule.id)}
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${rule.active ? 'bg-primary border-primary text-on-primary' : 'bg-transparent border-outline text-transparent hover:border-primary'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </button>
                <p className="flex-1 text-sm font-body-md text-on-surface leading-relaxed pt-0.5">
                  {rule.text}
                </p>
                <button 
                  onClick={() => removeRule(rule.id)}
                  className="text-outline hover:text-error transition-colors p-1"
                  title="Delete Rule"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-lg bg-surface-container border-t border-outline-variant/30">
          <form onSubmit={handleAdd} className="flex gap-md relative">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">add_circle</span>
              <input 
                type="text" 
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="e.g. Governing law must be California"
                className="w-full bg-surface-container-lowest border border-outline/30 rounded-lg py-2.5 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
              />
            </div>
            <button 
              type="submit"
              disabled={!newRule.trim()}
              className="bg-primary text-on-primary px-6 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-soft disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              Add Rule
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
