"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Provider } from "@supabase/supabase-js";

const oauthProviders: { name: string; provider: Provider; icon: React.ReactNode }[] = [
  {
    name: "Google",
    provider: "google",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    name: "Microsoft",
    provider: "azure",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
      </svg>
    ),
  },
  {
    name: "GitHub",
    provider: "github",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
  },
];

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const authError = searchParams.get("error");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (isDemoMode) {
      router.push("/dashboard");
      return;
    }

    const supabase = createClient();
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleOAuthLogin = async (provider: Provider) => {
    setOauthLoading(provider);
    setError("");

    const supabase = createClient();
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthErr) {
      setError(oauthErr.message);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center dark:bg-white">
              <span className="text-white font-bold text-sm dark:text-black">T</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">ToVi</span>
          </Link>
          <h1 className="text-2xl font-bold text-black dark:text-white">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
            Sign in to your account
          </p>
        </div>

        {/* OAuth providers */}
        <div className="space-y-2 mb-6">
          {oauthProviders.map(({ name, provider, icon }) => (
            <Button
              key={provider}
              variant="outline"
              className="w-full gap-3 h-10"
              onClick={() => handleOAuthLogin(provider)}
              disabled={oauthLoading !== null}
            >
              {oauthLoading === provider ? (
                <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin dark:border-neutral-600 dark:border-t-neutral-100" />
              ) : (
                icon
              )}
              Continue with {name}
            </Button>
          ))}
        </div>

        <div className="relative mb-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-950 px-3 text-xs text-neutral-400">
            or
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {(error || authError) && (
            <p className="text-sm text-red-600">
              {error || (authError === "auth_failed" ? "Authentication failed. Please try again." : authError)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in with email"}
          </Button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6 dark:text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-black font-medium hover:underline dark:text-white">
            Sign up
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link
            href="/dashboard"
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors dark:hover:text-neutral-300"
          >
            Or view demo dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center"><div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
