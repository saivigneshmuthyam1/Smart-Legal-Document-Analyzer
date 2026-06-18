import React from 'react';

export default function LandingView({ navigate }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background select-none">
      {/* Top Banner */}
      <div className="flex h-12 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-side-margin">
        <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">
          JURIS PRECISION SYSTEMS INC.
        </span>
        <span className="font-label-md text-[10px] uppercase tracking-widest text-on-surface-variant">
          SECURE PROTOCOL V.4.1
        </span>
      </div>

      <div className="flex-1 flex items-center max-w-container-max mx-auto px-side-margin py-12">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-lg text-left">
            <div className="inline-flex items-center px-3 py-1 bg-secondary-container text-on-secondary-container rounded-md border-l-2 border-secondary select-none">
              <span className="font-label-md text-[10px] tracking-widest uppercase">Enterprise Precision</span>
            </div>
            <h1 className="font-display-lg text-[52px] leading-[1.1] text-on-surface font-semibold tracking-tight">
              Legal-Grade Intelligence <br/>for Complex Contracts.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
              Lexicon AI automates the tedious manual review of legal documents, highlighting risks, mapping definitions, and extracting key clauses with 99.8% semantic accuracy. Built for the modern legal professional.
            </p>
            <div className="flex items-center gap-md pt-lg">
              <button 
                className="bg-primary text-on-primary px-xl py-4 font-semibold rounded-lg hover:opacity-90 transition-soft text-sm shadow-sm"
                onClick={() => navigate('login')}
              >
                Get Started
              </button>
              <button 
                className="bg-surface-container-lowest border border-outline-variant px-xl py-4 font-semibold text-on-surface rounded-lg hover:bg-surface-container-low transition-soft text-sm"
                onClick={() => navigate('login')}
              >
                View Demo MSA
              </button>
            </div>
          </div>
          <div className="relative h-[440px] rounded-2xl overflow-hidden legal-shadow border border-outline-variant/30 select-none">
            <img 
              className="w-full h-full object-cover" 
              alt="Corporate Legal Workspace Visual" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8GuHHZbYZ56UDmtcoF1MtwqjeS7EsFBxV2zxxFLQ7olUAJDZML7BG0F1hXPQiWZhf62xH6oA8KZ8Q1CGX4t-2qd35yO2Q8O7ZRmkWcgVgmKPg4-p3v7CdPtanaaNDY0PiYhqQjQq9Zapyq-2Hsh8S_n7fENj9afAs6YSCSQB1XGNcuaGOMqkW-7sO91baW3l-f0ZUEY8xY9dE8nz0dEfEV88R-Y2TqPbCdYZQmPOv43VZstobtEWIZUkvg935udBHDzZ5fupbLA"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-outline-variant/30 text-center text-caption font-caption text-on-surface-variant bg-surface-container-lowest">
        © 2024 Juris Precision Systems Inc. All rights reserved.
      </footer>
    </div>
  );
}
