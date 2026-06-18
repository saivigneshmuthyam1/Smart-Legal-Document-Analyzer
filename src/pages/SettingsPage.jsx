import React, { useState } from "react";
import Shell from "@/components/layout/Shell";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  ShieldCheck, 
  Bell, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Save,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Plus,
  Trash2
} from "lucide-react";

export default function SettingsPage() {
  const { userName, userEmail, userId, isSupabaseConfigured } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [profile, setProfile] = useState({
    name: userName || "User",
    role: "Senior Legal Analyst",
    firm: "Juris Precision Systems",
    email: userEmail || ""
  });

  const [playbookRules, setPlaybookRules] = useState(() => {
    const saved = localStorage.getItem("lexicon_playbook_rules");
    return saved ? JSON.parse(saved) : [
      { id: "1", text: "Governing law must be Delaware or New York.", active: true },
      { id: "2", text: "Payment terms must not exceed Net-30 days.", active: true },
      { id: "3", text: "Limitation of liability must be capped at 1x contract value.", active: true },
      { id: "4", text: "Mutual indemnification is required for all vendor services.", active: true }
    ];
  });
  const [newRuleText, setNewRuleText] = useState("");

  const apiToken = `lex_${userId?.substring(0, 16) || "default"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    
    try {
      localStorage.setItem("lexicon_playbook_rules", JSON.stringify(playbookRules));
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate
      setSaveMsg("Settings saved successfully.");
    } catch (err) {
      setSaveMsg("Failed to save settings.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    const newRule = {
      id: String(Date.now()),
      text: newRuleText.trim(),
      active: true
    };
    setPlaybookRules([...playbookRules, newRule]);
    setNewRuleText("");
  };

  const handleToggleRule = (id) => {
    setPlaybookRules(playbookRules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleDeleteRule = (id) => {
    setPlaybookRules(playbookRules.filter(r => r.id !== id));
  };

  return (
    <Shell>
      <div className="space-y-8 max-w-4xl">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">System Settings</h1>
          <p className="text-[13px] text-text-secondary">
            Manage your legal workspace credentials, system alerts, compliance rules, and developer access keys.
          </p>
        </div>

        {/* Sections Form */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* User Profile */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <User className="w-4.5 h-4.5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-[14px] text-primary">User Profile</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
              <div className="space-y-1.5">
                <label htmlFor="settings-name" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Full Name</label>
                <input
                  id="settings-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                />
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="settings-role" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Institutional Position</label>
                <input
                  id="settings-role"
                  type="text"
                  value={profile.role}
                  onChange={(e) => setProfile({...profile, role: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings-firm" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Organization / Firm</label>
                <input
                  id="settings-firm"
                  type="text"
                  value={profile.firm}
                  onChange={(e) => setProfile({...profile, firm: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-primary focus:outline-none focus:border-primary bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="settings-email" className="font-bold text-text-secondary uppercase text-[10px] tracking-wider">Email Address</label>
                <input
                  id="settings-email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-border rounded text-[13px] text-text-secondary bg-primary-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Security Config */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <ShieldCheck className="w-4.5 h-4.5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-[14px] text-primary">Security Settings</h3>
            </div>
            
            <div className="p-6 space-y-4 text-[12px]">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-[13px] text-primary">Two-Factor Authentication (2FA)</h4>
                  <p className="text-text-secondary text-[11px]">Enforce mobile MFA verification on each institutional sign in attempt.</p>
                </div>
                <span className="px-2 py-0.5 bg-risk-green-light text-risk-green text-[10px] font-bold border border-risk-green/10 rounded uppercase tracking-wider">
                  {isSupabaseConfigured ? "Active Enforced" : "Not Configured"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-[13px] text-primary">Authentication Provider</h4>
                  <p className="text-text-secondary text-[11px]">
                    {isSupabaseConfigured ? "Supabase Auth (Email + Google OAuth)" : "Local mock authentication (configure Supabase for production)"}
                  </p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase tracking-wider ${
                  isSupabaseConfigured 
                    ? "bg-risk-green-light text-risk-green border-risk-green/10" 
                    : "bg-risk-amber-light text-risk-amber border-risk-amber/10"
                }`}>
                  {isSupabaseConfigured ? "Production" : "Development"}
                </span>
              </div>
            </div>
          </div>

          {/* Notification Alert Rules */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <Bell className="w-4.5 h-4.5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-[14px] text-primary">Alert Rules & Notifications</h3>
            </div>
            
            <div className="p-6 space-y-4 text-[12px]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 mt-0.5 text-primary border-border rounded focus:ring-primary/20"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[13px] text-primary block leading-tight">Critical Exposure Warnings</span>
                  <span className="text-text-secondary text-[11px] block">Send instant email notifications when high-severity risks are found during OCR processing.</span>
                </div>
              </label>

              <hr className="border-border/60" />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 mt-0.5 text-primary border-border rounded focus:ring-primary/20"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[13px] text-primary block leading-tight">Weekly Compliance Summary</span>
                  <span className="text-text-secondary text-[11px] block">Receive a weekly spreadsheet export of all documents analyzed, risk levels, and efficiency index scores.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Company Playbook Rules Card */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <BookOpen className="w-4.5 h-4.5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-[14px] text-primary">Company Playbook & Compliance Policy</h3>
            </div>
            
            <div className="p-6 space-y-4 text-[12px]">
              <p className="text-text-secondary text-[11px] mb-2 leading-relaxed">
                Define the corporate compliance playbook rules. Document analyses will be automatically audited against active rules, flagging violations as contract risks.
              </p>
              
              <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                {playbookRules.map((rule) => (
                  <div key={rule.id} className="flex items-start justify-between gap-3 p-3 bg-primary-50/40 border border-border/60 rounded">
                    <label className="flex items-start gap-3 cursor-pointer flex-grow">
                      <input
                        type="checkbox"
                        checked={rule.active}
                        onChange={() => handleToggleRule(rule.id)}
                        className="w-3.5 h-3.5 mt-0.5 text-primary border-border rounded focus:ring-primary/20"
                      />
                      <div className="space-y-0.5">
                        <span className={`text-[12px] leading-tight block ${rule.active ? "text-primary font-medium" : "text-text-muted line-through"}`}>
                          {rule.text}
                        </span>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 text-text-muted hover:text-risk-red rounded transition-colors hover:bg-risk-red-light shrink-0"
                      aria-label="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {playbookRules.length === 0 && (
                  <p className="text-[11px] text-text-muted italic text-center py-4">No playbook rules defined. Add one below!</p>
                )}
              </div>

              {/* Add New Rule Form */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="e.g. Liability cap must not exceed 1x contract value."
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRule(); } }}
                  className="flex-grow px-3 py-2 border border-border rounded text-[12.5px] text-primary focus:outline-none focus:border-primary bg-white placeholder-text-muted"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3.5 py-2 bg-primary text-white text-[12.5px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Rule</span>
                </button>
              </div>
            </div>
          </div>

          {/* API Developer Key Configuration */}
          <div className="bg-white border border-border rounded shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2 bg-primary-50/30">
              <Key className="w-4.5 h-4.5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold text-[14px] text-primary">Developer API Integration</h3>
            </div>
            
            <div className="p-6 space-y-4 text-[12px]">
              <div className="space-y-2">
                <h4 className="font-semibold text-[13px] text-primary">User ID / API Key</h4>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  Use this identifier to query the document analysis API. Keep this secret safe.
                </p>
                
                <div className="flex items-center gap-2 pt-2">
                  <div className="relative flex-grow">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiToken}
                      disabled
                      className="w-full px-3 py-2 border border-border rounded text-[13px] text-text-secondary font-mono bg-primary-50/40 select-all pr-10"
                      aria-label="API key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-2.5 text-text-secondary hover:text-primary transition-colors"
                      aria-label={showKey ? "Hide API key" : "Show API key"}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2.5 border border-border rounded hover:border-primary hover:text-primary transition-colors bg-white flex items-center justify-center cursor-pointer"
                    aria-label="Copy API key"
                  >
                    {copied ? <Check className="w-4 h-4 text-risk-green" /> : <Copy className="w-4 h-4 text-text-secondary" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
          {saveMsg && (
            <div className="flex items-center gap-2 text-[12px] text-risk-green" role="status">
              <Check className="w-4 h-4" />
              <span>{saveMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-primary text-white text-[13px] font-semibold rounded hover:bg-primary-light transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Saving..." : "Save System Settings"}</span>
            </button>
          </div>

        </form>
      </div>
    </Shell>
  );
}
