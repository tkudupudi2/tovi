"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bell, Settings, LogOut, Moon, Sun, Building2, Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/efficiency", label: "Efficiency", icon: Gauge },
  { href: "/org", label: "Organization", icon: Building2 },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [demoMode, setDemoMode] = useState(
    typeof window !== "undefined" ? localStorage.getItem("tovi_demo") !== "false" : true
  );

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const toggleDemo = () => {
    const newVal = !demoMode;
    setDemoMode(newVal);
    localStorage.setItem("tovi_demo", String(newVal));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top bar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50 dark:bg-neutral-900 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center dark:bg-white">
                <span className="text-white font-bold text-xs dark:text-black">T</span>
              </div>
              <span className="font-semibold text-sm tracking-tight">ToVi</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-neutral-100 text-black font-medium dark:bg-neutral-800 dark:text-white"
                        : "text-neutral-500 hover:text-black hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="demo-mode"
                checked={demoMode}
                onCheckedChange={toggleDemo}
              />
              <Label htmlFor="demo-mode" className="text-xs text-neutral-500 cursor-pointer dark:text-neutral-400">
                Demo
              </Label>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
