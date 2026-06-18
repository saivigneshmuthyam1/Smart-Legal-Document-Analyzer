import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginView({ navigate }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const { signInWithEmail, signUp, signInWithGoogle } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setMsg('Sign up successful! Please check your email for confirmation (if enabled).');
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        // Navigation is handled by App.jsx route protection logic automatically once user is set
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    }
  };

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

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] space-y-xl bg-surface-container-lowest border border-outline-variant/50 p-xl rounded-2xl legal-shadow">
          {/* Brand Logo */}
          <div className="space-y-sm text-center">
            <h2 className="font-display-lg text-[40px] tracking-tight font-bold text-primary">
              Lexicon AI
            </h2>
            <div className="inline-flex items-center px-2.5 py-0.5 bg-secondary-container text-on-secondary-container rounded-md border-l border-secondary">
              <span className="font-label-md text-[9px] tracking-widest uppercase">
                Enterprise Precision
              </span>
            </div>
            <p className="font-body-md text-on-surface-variant mt-2 text-xs">
              Legal-Grade Intelligence for Complex Contracts
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-lg">
            {error && (
              <div className="p-md bg-error-container text-on-error-container text-xs rounded-lg border-l-2 border-error">
                {error}
              </div>
            )}
            {msg && (
              <div className="p-md bg-secondary-container text-on-secondary-container text-xs rounded-lg border-l-2 border-secondary">
                {msg}
              </div>
            )}

            <div className="space-y-sm text-left">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Authorized Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-surface-container-low/40 border border-outline-variant/60 rounded-lg px-md font-body-md text-sm outline-none transition-soft focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="email@jurisprecision.com"
                required
              />
            </div>

            <div className="space-y-sm text-left">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                System Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-surface-container-low/40 border border-outline-variant/60 rounded-lg px-md font-body-md text-sm outline-none transition-soft focus:border-primary focus:ring-1 focus:ring-primary/20"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-on-primary font-semibold rounded-lg hover:opacity-90 active:scale-98 transition-soft flex items-center justify-center gap-sm mt-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSignUp ? 'Create Account' : 'Authenticate Session'}</span>
              {!isSignUp && <span className="material-symbols-outlined text-[18px]">vpn_key</span>}
            </button>
          </form>

          <div className="relative flex items-center justify-center border-t border-outline-variant/50 pt-lg mt-lg">
            <span className="absolute -top-3 bg-surface-container-lowest px-2 text-xs text-on-surface-variant font-medium">
              OR
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-12 bg-surface-container-low border border-outline-variant/60 text-on-surface font-semibold rounded-lg hover:bg-surface-container hover:border-outline transition-soft flex items-center justify-center gap-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="text-center mt-6">
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline text-xs font-semibold"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-outline-variant/30 text-center text-caption font-caption text-on-surface-variant bg-surface-container-lowest">
        © 2024 Juris Precision Systems Inc. All rights reserved.
      </footer>
    </div>
  );
}
