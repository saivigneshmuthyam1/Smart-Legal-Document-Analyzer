import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const PlaybookContext = createContext();

export function PlaybookProvider({ children }) {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);

  useEffect(() => {
    if (user) {
      const savedRules = localStorage.getItem(`lexicon_playbook_${user.id}`);
      if (savedRules) {
        setRules(JSON.parse(savedRules));
      } else {
        // Default rule
        const defaultRules = [
          { id: '1', text: "Governing law must be Delaware.", active: true },
          { id: '2', text: "Liability must be capped at total contract value.", active: true },
          { id: '3', text: "Payment terms must be Net-30 or faster.", active: true }
        ];
        setRules(defaultRules);
        localStorage.setItem(`lexicon_playbook_${user.id}`, JSON.stringify(defaultRules));
      }
    } else {
      setRules([]);
    }
  }, [user]);

  const addRule = (text) => {
    const newRule = { id: Date.now().toString(), text, active: true };
    const updated = [...rules, newRule];
    setRules(updated);
    if (user) localStorage.setItem(`lexicon_playbook_${user.id}`, JSON.stringify(updated));
  };

  const removeRule = (id) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    if (user) localStorage.setItem(`lexicon_playbook_${user.id}`, JSON.stringify(updated));
  };

  const toggleRule = (id) => {
    const updated = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setRules(updated);
    if (user) localStorage.setItem(`lexicon_playbook_${user.id}`, JSON.stringify(updated));
  };

  const getActiveRules = () => rules.filter(r => r.active).map(r => r.text);

  return (
    <PlaybookContext.Provider value={{ rules, addRule, removeRule, toggleRule, getActiveRules }}>
      {children}
    </PlaybookContext.Provider>
  );
}

export function usePlaybook() {
  const context = useContext(PlaybookContext);
  if (context === undefined) {
    throw new Error('usePlaybook must be used within a PlaybookProvider');
  }
  return context;
}
