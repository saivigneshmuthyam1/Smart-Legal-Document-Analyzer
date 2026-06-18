import React from 'react';

export default function Footer() {
  return (
    <footer className="py-12 border-t border-outline-variant bg-surface-container-lowest select-none mt-auto">
      <div className="max-w-container-max mx-auto px-side-margin">
        <div className="flex flex-col md:flex-row justify-between items-center gap-lg">
          <div className="flex flex-col md:flex-row items-center gap-lg text-center md:text-left">
            <span className="font-display-lg text-[24px] text-primary tracking-tight font-bold">Lexicon AI</span>
            <span className="hidden md:block w-px h-6 bg-outline-variant"></span>
            <span className="text-on-surface-variant font-caption text-xs">
              © 2024 Juris Precision Systems Inc. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-xl text-on-surface-variant font-medium text-[13px]">
            <a className="hover:text-primary transition-soft cursor-pointer" onClick={() => alert('Privacy Policy is currently under legal review.')}>Privacy Policy</a>
            <a className="hover:text-primary transition-soft cursor-pointer" onClick={() => alert('Terms of Service Agreement v1.9 active.')}>Terms of Service</a>
            <a className="hover:text-primary transition-soft cursor-pointer" onClick={() => alert('System Architecture: FIPS 140-2 Compliant.')}>Security Architecture</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
