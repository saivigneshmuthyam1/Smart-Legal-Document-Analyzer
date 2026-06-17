import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Lock, AtSign, ArrowRight, HelpCircle, Globe } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 font-sans select-none antialiased py-12">
      {/* Title & Subtitle */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Scale className="w-5 h-5 text-primary" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight uppercase text-primary">Juris Precision</span>
        </div>
        <p className="text-xs text-text-secondary font-medium tracking-wide uppercase">Legal Intelligence & Analysis</p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-[420px] bg-white rounded border border-border p-8 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-primary tracking-tight">Secure Sign In</h2>
            <p className="text-[13px] text-text-secondary">
              Access your legal workspace and analysis history.
            </p>
          </div>

          {/* Continue with Google */}
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center justify-center gap-2.5 py-2 px-4 border border-border rounded text-[13px] font-medium text-text-secondary hover:text-primary hover:border-primary hover:bg-primary-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-3 text-[10px] text-text-muted font-bold tracking-wider uppercase bg-white px-2">
              Or use email
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                Institutional Email
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="name@firm-name.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#forgot"
                  className="text-[11px] font-medium text-text-secondary hover:text-primary transition-colors"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-border rounded text-[13px] text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 py-1">
              <input
                id="remember"
                type="checkbox"
                className="w-3.5 h-3.5 text-primary border-border rounded focus:ring-primary/20 focus:ring-1 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-text-secondary cursor-pointer select-none">
                Remember this device for 30 days
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-primary text-white text-[13px] font-medium rounded hover:bg-primary-light transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Sign In to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <hr className="border-border" />

          {/* Footer Card Notice */}
          <p className="text-[10px] text-text-muted text-center leading-relaxed">
            Authorized personnel only. Use of this system is subject to the{" "}
            <a href="#terms" className="text-text-secondary hover:text-primary font-semibold transition-colors">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#privacy" className="text-text-secondary hover:text-primary font-semibold transition-colors">
              Data Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Outer Card Links */}
      <div className="flex items-center gap-6 mt-6 text-xs text-text-secondary">
        <a href="#support" className="flex items-center gap-1 hover:text-primary transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Support Center</span>
        </a>
        <a href="#lang" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Globe className="w-3.5 h-3.5" />
          <span>Language: EN-US</span>
        </a>
      </div>
    </div>
  );
}
