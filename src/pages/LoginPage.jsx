import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.02] blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(37,99,235,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] mx-4 animate-scale-in">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-border/60 p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-5 shadow-lg shadow-primary/25">
              <Scale className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-[22px] font-bold text-text tracking-tight">
              Smart Legal Document
            </h1>
            <h1 className="text-[22px] font-bold text-text tracking-tight -mt-0.5">
              Analyzer
            </h1>
            <p className="text-text-secondary text-sm mt-2.5">
              AI-powered contract intelligence platform
            </p>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-center gap-3 h-12 text-[14px] font-medium rounded-xl border-border hover:border-border hover:bg-gray-50/80"
              onClick={() => navigate("/dashboard")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full justify-center gap-3 h-12 text-[14px] font-medium rounded-xl border-border hover:border-border hover:bg-gray-50/80"
              onClick={() => navigate("/dashboard")}
            >
              <Mail className="w-[18px] h-[18px] text-text-secondary" strokeWidth={1.8} />
              Continue with Email
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-text-muted">or</span>
            </div>
          </div>

          {/* Demo Button */}
          <Button
            size="lg"
            className="w-full h-12 text-[14px] font-semibold rounded-xl gap-2 shadow-md shadow-primary/20"
            onClick={() => navigate("/dashboard")}
          >
            Try Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          By continuing, you agree to our{" "}
          <span className="text-text-secondary hover:text-primary cursor-pointer transition-colors">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-text-secondary hover:text-primary cursor-pointer transition-colors">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
}
