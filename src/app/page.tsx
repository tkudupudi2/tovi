"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

/* ================================================================
   ToVi Landing Page — Sections 1–8
   ================================================================ */

export default function Home() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [annual, setAnnual] = useState(false);

  /* Calculator state */
  const [teamSize, setTeamSize] = useState(25);
  const [monthlySpend, setMonthlySpend] = useState(2000);
  const [selectedTools, setSelectedTools] = useState<string[]>(["Windsurf", "Claude", "Copilot"]);

  /* Animated calculator display values */
  const [dispGhost, setDispGhost] = useState(0);
  const [dispModel, setDispModel] = useState(0);
  const [dispTotal, setDispTotal] = useState(0);

  /* Scroll dashboard frame */
  const [activeFrame, setActiveFrame] = useState(0);
  const showcaseRef = useRef<HTMLDivElement>(null);

  /* Metrics counting */
  const metricsRef = useRef<HTMLDivElement>(null);
  const [metricsCounted, setMetricsCounted] = useState(false);
  const [metricVals, setMetricVals] = useState([0, 0, 0, 0]);

  /* --- Nav scroll handler --- */
  useEffect(() => {
    const h = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* --- Hero stagger-in --- */
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  /* --- Intersection Observer for scroll animations --- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lp-visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".lp-anim").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* --- Metrics counting animation --- */
  useEffect(() => {
    const el = metricsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !metricsCounted) {
          setMetricsCounted(true);
          const targets = [32, 6.2, 28, 1840];
          const durations = [1800, 1800, 1800, 2200];
          targets.forEach((target, i) => {
            const start = performance.now();
            const animate = (now: number) => {
              const progress = Math.min((now - start) / durations[i], 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setMetricVals((prev) => {
                const next = [...prev];
                next[i] = target * eased;
                return next;
              });
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          });
          obs.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [metricsCounted]);

  /* --- Calculator lerp --- */
  const calcGhost = useCallback(() => {
    const numTools = selectedTools.length || 1;
    const toolMul = 0.8 + numTools * 0.1;
    return monthlySpend * 0.28 * 0.85 * toolMul;
  }, [selectedTools, monthlySpend]);

  const calcModel = useCallback(() => {
    const numTools = selectedTools.length || 1;
    const toolMul = 0.8 + numTools * 0.1;
    return monthlySpend * 0.22 * 0.70 * toolMul;
  }, [selectedTools, monthlySpend]);

  useEffect(() => {
    const ghost = calcGhost();
    const model = calcModel();
    const total = ghost + model;
    let raf: number;
    const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
    const start = performance.now();
    const dur = 500;
    const fromG = dispGhost, fromM = dispModel, fromT = dispTotal;
    const animate = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDispGhost(lerp(fromG, ghost, e));
      setDispModel(lerp(fromM, model, e));
      setDispTotal(lerp(fromT, total, e));
      if (p < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTools, monthlySpend, teamSize]);

  /* --- Scroll-driven showcase --- */
  useEffect(() => {
    const handleScroll = () => {
      const el = showcaseRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollH = el.offsetHeight - window.innerHeight;
      if (scrollH <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / scrollH));
      const frame = Math.min(3, Math.floor(progress * 4));
      setActiveFrame(frame);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const totalSavings = dispTotal;
  const annualSavings = totalSavings * 12;
  const daysToROI = totalSavings > 0 ? 49 / (totalSavings / 30) : 999;

  return (
    <>
      {/* --- Global keyframes + styles --- */}
      <style jsx global>{`
        /* Dashboard float */
        @keyframes dashFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        /* Badge shimmer */
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        /* Scroll animations */
        .lp-anim { opacity:0; transform:translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .lp-anim.lp-visible { opacity:1; transform:translateY(0); }
        .lp-anim.lp-delay-1 { transition-delay: 150ms; }
        .lp-anim.lp-delay-2 { transition-delay: 300ms; }

        /* Hero stagger */
        .hero-el { opacity:0; transform:translateY(16px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .hero-visible .hero-el { opacity:1; transform:translateY(0); }
        .hero-visible .hero-el:nth-child(1) { transition-delay: 0ms; }
        .hero-visible .hero-el:nth-child(2) { transition-delay: 100ms; }
        .hero-visible .hero-el:nth-child(3) { transition-delay: 200ms; }
        .hero-visible .hero-el:nth-child(4) { transition-delay: 300ms; }
        .hero-visible .hero-el:nth-child(5) { transition-delay: 400ms; }

        /* Showcase frames */
        .showcase-frame { position:absolute;inset:0;opacity:0;transform:translateY(20px);transition:opacity 0.4s ease, transform 0.4s ease;pointer-events:none; }
        .showcase-frame.active { opacity:1;transform:translateY(0);pointer-events:auto; }

        /* Line draw */
        @keyframes drawLine { to { stroke-dashoffset: 0; } }

        /* Slider styling */
        .lp-slider { -webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;background:#e5e5e5;outline:none; }
        .lp-slider::-webkit-slider-thumb { -webkit-appearance:none;appearance:none;width:20px;height:20px;border-radius:50%;background:black;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.2); }
        .lp-slider::-moz-range-thumb { width:20px;height:20px;border-radius:50%;background:black;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.2);border:none; }

        /* Pricing card hover */
        .pricing-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .pricing-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }

        @media (max-width: 768px) {
          .showcase-sticky { position: relative !important; top: auto !important; height: auto !important; }
          .showcase-frame { position: relative; opacity: 1; transform: none; margin-bottom: 2rem; pointer-events: auto; }
        }
      `}</style>

      <div className="bg-white text-black min-h-screen overflow-x-hidden">

        {/* ================================================================
           SECTION 1 — HERO
           ================================================================ */}

        {/* Nav */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            backgroundColor: navScrolled ? "rgba(255,255,255,0.85)" : "transparent",
            backdropFilter: navScrolled ? "blur(12px)" : "none",
            borderBottom: navScrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          }}
        >
          <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">ToVi</span>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm text-neutral-500">
              <a href="#product" className="hover:text-black transition-colors">Product</a>
              <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
              <a href="#calculator" className="hover:text-black transition-colors">Calculator</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-neutral-600 hover:text-black transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <main className="max-w-6xl mx-auto px-6">
          <div className={`${heroVisible ? "hero-visible" : ""}`}>
            <div className="pt-32 pb-16 text-center">
              {/* Badge with shimmer */}
              <div className="hero-el">
                <div
                  className="inline-flex items-center gap-2 bg-neutral-100 text-neutral-600 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
                  style={{
                    backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.03) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 4s ease-in-out infinite",
                  }}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Now tracking Windsurf, Claude &amp; Copilot
                </div>
              </div>

              <h1 className="hero-el text-5xl sm:text-6xl font-bold tracking-tight text-black max-w-3xl mx-auto leading-[1.1]">
                A lighthouse guiding you through AI spend
              </h1>

              <p className="hero-el mt-6 text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
                Track and manage AI tool credit usage across your engineering team.
                See who&apos;s using what, spot ghost seats, and never overspend again.
              </p>

              <div className="hero-el mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
                >
                  Start for free
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-neutral-600 px-6 py-3 rounded-lg text-sm font-medium border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                >
                  View demo
                </Link>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="hero-el relative mx-auto max-w-4xl" style={{ animation: heroVisible ? "dashFloat 6s ease-in-out infinite" : "none" }}>
            <div className="bg-neutral-950 rounded-xl p-1 shadow-2xl shadow-black/20">
              <div className="bg-neutral-900 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-neutral-500 text-xs font-mono">tovi.dev/dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
                    <p className="text-neutral-400 text-xs">Total Spend</p>
                    <p className="text-white text-2xl font-semibold mt-1">24,831</p>
                    <p className="text-neutral-500 text-xs mt-1">credits this month</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
                    <p className="text-neutral-400 text-xs">Burn Rate</p>
                    <p className="text-white text-2xl font-semibold mt-1">1,072/day</p>
                    <p className="text-neutral-500 text-xs mt-1">exhaustion: Jul 14</p>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700/50">
                    <p className="text-neutral-400 text-xs">Ghost Seats</p>
                    <p className="text-rose-400 text-2xl font-semibold mt-1">2</p>
                    <p className="text-neutral-500 text-xs mt-1">inactive 14+ days</p>
                  </div>
                </div>
                <div className="bg-neutral-800/30 rounded-lg p-4 border border-neutral-700/30">
                  <div className="flex items-center gap-8 text-xs text-neutral-400">
                    <span className="w-40">User</span>
                    <span className="w-20 text-right">Windsurf</span>
                    <span className="w-20 text-right">Claude</span>
                    <span className="w-20 text-right">Copilot</span>
                    <span className="w-20 text-right">Total</span>
                  </div>
                  {[
                    { name: "sarah.chen", w: 1420, c: 3210, g: 890, ghost: false },
                    { name: "marcus.j", w: 980, c: 2850, g: 1100, ghost: false },
                    { name: "emma.w", w: 45, c: 120, g: 12, ghost: true },
                  ].map((u) => (
                    <div
                      key={u.name}
                      className={`flex items-center gap-8 text-xs mt-2 py-1.5 ${u.ghost ? "text-rose-400" : "text-neutral-300"}`}
                    >
                      <span className="w-40 font-mono">{u.name}</span>
                      <span className="w-20 text-right">{u.w.toLocaleString()}</span>
                      <span className="w-20 text-right">{u.c.toLocaleString()}</span>
                      <span className="w-20 text-right">{u.g.toLocaleString()}</span>
                      <span className="w-20 text-right font-medium">{(u.w + u.c + u.g).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-neutral-100 to-transparent rounded-3xl blur-3xl scale-110 opacity-50" />
          </div>

          {/* ================================================================
             SECTION 2 — THE PROBLEM
             ================================================================ */}
          <section className="py-24">
            <h2 className="lp-anim text-3xl sm:text-4xl font-bold text-center max-w-3xl mx-auto leading-tight text-black">
              Most engineering teams are{" "}
              <span className="text-rose-500">bleeding AI budget</span>.
              <br />They just don&apos;t know it yet.
            </h2>

            <div className="mt-16 grid sm:grid-cols-3 gap-6">
              <div className="lp-anim rounded-xl p-6 border border-rose-200 bg-rose-50/50">
                <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="5" cy="15" r="2"/>
                    <path d="M7 5h10M5 7v6M14 17l5-10" strokeDasharray="3 3"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-black">4 tools. Zero visibility.</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Your team uses Windsurf, Claude, Copilot, and Cursor. You have no idea who&apos;s using what, or whether it&apos;s worth it.
                </p>
              </div>

              <div className="lp-anim lp-delay-1 rounded-xl p-6 border border-rose-200 bg-rose-50/50">
                <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5-2 8H7c0-3-2-5-2-8a7 7 0 0 1 7-7z"/>
                    <path d="M9 17v1a3 3 0 0 0 6 0v-1" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-black">30% of your seats go unused.</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Developers leave. Tools stay active. You keep paying. Ghost seats are silently draining your budget every month.
                </p>
              </div>

              <div className="lp-anim lp-delay-2 rounded-xl p-6 border border-rose-200 bg-rose-50/50">
                <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" strokeDasharray="4 2"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-black">Expensive models. Simple tasks.</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Your team defaults to the most powerful model for everything — including tasks a 95% cheaper model handles just as well.
                </p>
              </div>
            </div>
          </section>
          </div>
        </main>

        {/* ================================================================
           SECTION 3 — PRODUCT SHOWCASE (scroll-driven)
           ================================================================ */}
        <section id="product" ref={showcaseRef} className="relative bg-neutral-50" style={{ height: "250vh" }}>
          <div className="showcase-sticky sticky top-0 h-screen flex flex-col justify-center">
            <div className="lp-anim text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-black">Everything you need. <span className="text-neutral-400">One place.</span></h2>
            </div>
            <div className="max-w-5xl mx-auto px-6 w-full relative">
              {/* Progress dots */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3 z-10">
                {["Dashboard", "Efficiency", "VP View", "Alerts"].map((label, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (!showcaseRef.current) return;
                      const h = showcaseRef.current.offsetHeight - window.innerHeight;
                      const top = showcaseRef.current.offsetTop + (i / 4) * h + 10;
                      window.scrollTo({ top, behavior: "smooth" });
                    }}
                    className="flex items-center gap-2 group"
                  >
                    <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${activeFrame === i ? "text-black" : "text-neutral-400"}`}>{label}</span>
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${activeFrame === i ? "bg-black" : "bg-neutral-300"}`} />
                  </button>
                ))}
              </div>

              {/* Frame 1 — Main Dashboard */}
              <div className={`showcase-frame ${activeFrame === 0 ? "active" : ""}`}>
                <div className="bg-neutral-950 rounded-xl p-1 shadow-2xl shadow-black/10">
                  <div className="bg-neutral-900 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-green-500/80" />
                      <span className="ml-3 text-neutral-500 text-xs font-mono">tovi.dev/dashboard</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4 mt-4">
                      <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50"><p className="text-neutral-400 text-[10px]">Total Spend</p><p className="text-white text-xl font-semibold mt-0.5">24,831</p><p className="text-neutral-500 text-[10px]">credits this month</p></div>
                      <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50"><p className="text-neutral-400 text-[10px]">Burn Rate</p><p className="text-white text-xl font-semibold mt-0.5">1,072/day</p><p className="text-neutral-500 text-[10px]">exhaustion: Jul 14</p></div>
                      <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/50"><p className="text-neutral-400 text-[10px]">Ghost Seats</p><p className="text-rose-400 text-xl font-semibold mt-0.5">2</p><p className="text-neutral-500 text-[10px]">inactive 14+ days</p></div>
                    </div>
                    <div className="bg-neutral-800/30 rounded-lg p-3 border border-neutral-700/30">
                      <div className="flex items-center gap-6 text-[10px] text-neutral-400 mb-1"><span className="w-32">User</span><span className="w-16 text-right">Windsurf</span><span className="w-16 text-right">Claude</span><span className="w-16 text-right">Copilot</span><span className="w-16 text-right">Total</span></div>
                      {[{n:"sarah.chen",w:1420,c:3210,g:890,gh:false},{n:"marcus.j",w:980,c:2850,g:1100,gh:false},{n:"emma.w",w:45,c:120,g:12,gh:true}].map(u=>(
                        <div key={u.n} className={`flex items-center gap-6 text-[11px] py-1 ${u.gh?"text-rose-400":"text-neutral-300"}`}>
                          <span className="w-32 font-mono">{u.n}</span><span className="w-16 text-right">{u.w.toLocaleString()}</span><span className="w-16 text-right">{u.c.toLocaleString()}</span><span className="w-16 text-right">{u.g.toLocaleString()}</span><span className="w-16 text-right font-medium">{(u.w+u.c+u.g).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-neutral-500 font-medium mt-4">Complete cross-tool visibility</p>
              </div>

              {/* Frame 2 — Efficiency */}
              <div className={`showcase-frame ${activeFrame === 1 ? "active" : ""}`}>
                <div className="bg-neutral-950 rounded-xl p-1 shadow-2xl shadow-black/10">
                  <div className="bg-neutral-900 rounded-lg p-6">
                    <p className="text-neutral-400 text-xs mb-4">Model Efficiency Tracker</p>
                    <div className="bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                      <div className="grid grid-cols-6 gap-2 text-[10px] text-neutral-400 px-3 py-2 border-b border-neutral-700/30">
                        <span className="col-span-1">User</span><span>Primary Model</span><span className="text-right">Avg Tokens</span><span className="text-right">Premium %</span><span className="text-right">Score</span><span>Breakdown</span>
                      </div>
                      {[
                        {n:"priya.patel",m:"Claude Sonnet",t:920,p:18,s:94,c:"text-emerald-400",bars:[10,55,35]},
                        {n:"sarah.chen",m:"Claude Opus",t:380,p:84,s:42,c:"text-amber-400",bars:[84,12,4]},
                        {n:"ethan.clark",m:"GPT-4o-mini",t:750,p:12,s:91,c:"text-emerald-400",bars:[8,52,40]},
                      ].map(u=>(
                        <div key={u.n} className="grid grid-cols-6 gap-2 items-center text-[11px] px-3 py-2.5 border-b border-neutral-800/30">
                          <span className="font-mono text-neutral-300">{u.n}</span>
                          <span className="text-neutral-400">{u.m}</span>
                          <span className="text-right font-mono text-neutral-300">{u.t}</span>
                          <span className="text-right font-mono text-neutral-300">{u.p}%</span>
                          <span className={`text-right font-semibold font-mono ${u.c}`}>{u.s}</span>
                          <div className="flex h-2 rounded-full overflow-hidden gap-[1px]">
                            <div className="bg-rose-500 rounded-l" style={{width:`${u.bars[0]}%`}} />
                            <div className="bg-amber-500" style={{width:`${u.bars[1]}%`}} />
                            <div className="bg-emerald-500 rounded-r" style={{width:`${u.bars[2]}%`}} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Tooltip */}
                    <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-300">
                      💡 84% of Sarah&apos;s requests used Opus. Tasks under 500 tokens rarely need it. Estimated overspend: <span className="font-semibold">$34/mo</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-neutral-500 font-medium mt-4">Model efficiency tracking</p>
              </div>

              {/* Frame 3 — VP Dashboard */}
              <div className={`showcase-frame ${activeFrame === 2 ? "active" : ""}`}>
                <div className="bg-neutral-950 rounded-xl p-1 shadow-2xl shadow-black/10">
                  <div className="bg-neutral-900 rounded-lg p-6">
                    <p className="text-neutral-400 text-xs mb-4">VP Organization Dashboard</p>
                    <div className="bg-neutral-800/30 rounded-lg border border-neutral-700/30">
                      <div className="grid grid-cols-6 gap-2 text-[10px] text-neutral-400 px-3 py-2 border-b border-neutral-700/30">
                        <span>Team</span><span className="text-right">Spend</span><span className="text-right">Budget</span><span className="text-right">Efficiency</span><span className="text-right">Ghost Seats</span><span>Status</span>
                      </div>
                      {[
                        {t:"Engineering",sp:"$8,400",b:"$10,000",e:78,g:1,st:"On track to exceed budget by $1,200",sc:"text-amber-400",bg:"bg-amber-500/10"},
                        {t:"Product",sp:"$3,200",b:"$5,000",e:91,g:0,st:"Under budget",sc:"text-emerald-400",bg:"bg-emerald-500/10"},
                        {t:"Design",sp:"$4,200",b:"$3,000",e:52,g:3,st:"3 ghost seats, 140% of budget",sc:"text-rose-400",bg:"bg-rose-500/10"},
                      ].map(r=>(
                        <div key={r.t} className="grid grid-cols-6 gap-2 items-center text-[11px] px-3 py-2.5 border-b border-neutral-800/30">
                          <span className="text-neutral-300 font-medium">{r.t}</span>
                          <span className="text-right font-mono text-neutral-300">{r.sp}</span>
                          <span className="text-right font-mono text-neutral-400">{r.b}</span>
                          <span className={`text-right font-semibold font-mono ${r.sc}`}>{r.e}</span>
                          <span className="text-right font-mono text-neutral-300">{r.g}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.bg} ${r.sc}`}>{r.st}</span>
                        </div>
                      ))}
                    </div>
                    {/* Donut placeholder */}
                    <div className="mt-4 flex items-center gap-6">
                      <div className="relative w-20 h-20">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="4" strokeDasharray="37 63" strokeDashoffset="0"/>
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(124,58,237,0.4)" strokeWidth="4" strokeDasharray="31 69" strokeDashoffset="-37"/>
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="-68"/>
                        </svg>
                      </div>
                      <div className="text-xs space-y-1.5">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#00D4FF]/50" /><span className="text-neutral-400">Windsurf 42%</span></div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]/60" /><span className="text-neutral-400">Claude 35%</span></div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500/50" /><span className="text-neutral-400">Copilot 23%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-neutral-500 font-medium mt-4">Org-level visibility for VPs and Directors</p>
              </div>

              {/* Frame 4 — Slack Alert */}
              <div className={`showcase-frame ${activeFrame === 3 ? "active" : ""}`}>
                <div className="flex flex-col items-center gap-4">
                  {/* Alert 1 */}
                  <div className="bg-[#1A1D21] rounded-xl p-5 max-w-lg w-full border border-white/[0.06]" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] text-xs font-bold">T</div>
                      <span className="font-semibold text-sm">ToVi</span>
                      <span className="text-neutral-500 text-[10px] ml-2">11:42 AM</span>
                    </div>
                    <p className="text-sm text-neutral-200 leading-relaxed">
                      🚨 <strong>Alert:</strong> Frontend team will exhaust Windsurf credits by Friday. Backend team has 340 credits unused. Reassign?
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30">Approve reallocation ✓</button>
                      <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.05] text-neutral-400 border border-white/10">Dismiss</button>
                    </div>
                  </div>
                  {/* Alert 2 */}
                  <div className="bg-[#1A1D21] rounded-xl p-5 max-w-lg w-full border border-white/[0.06] -mt-2 ml-6" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center text-[#00D4FF] text-xs font-bold">T</div>
                      <span className="font-semibold text-sm">ToVi</span>
                      <span className="text-neutral-500 text-[10px] ml-2">Monday 9:00 AM</span>
                    </div>
                    <p className="text-sm text-neutral-200">
                      📊 Weekly digest ready — your team saved <span className="text-[#00D4FF] font-semibold">$420</span> this month
                    </p>
                  </div>
                </div>
                <p className="text-center text-sm text-neutral-500 font-medium mt-6">Proactive alerts before problems hit</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
           SECTION 4 — METRICS BAR
           ================================================================ */}
        <section ref={metricsRef} className="border-y border-neutral-200 bg-neutral-50 py-20">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { val: `${Math.round(metricVals[0])}%`, label: "Average reduction in AI spend after 30 days" },
              { val: `${metricVals[1].toFixed(1)} hrs`, label: "Saved per manager per month" },
              { val: `${Math.round(metricVals[2])}%`, label: "Of seats flagged as ghost seats on average" },
              { val: `$${Math.round(metricVals[3]).toLocaleString()}`, label: "Average monthly savings for a 30-person team" },
            ].map((m, i) => (
              <div key={i} className={`text-center ${i > 0 ? "sm:border-l sm:border-neutral-200" : ""}`}>
                <p className="text-5xl sm:text-6xl font-bold text-black">{m.val}</p>
                <p className="text-xs text-neutral-500 mt-2 max-w-[180px] mx-auto">{m.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================
           SECTION 5 — SAVINGS CALCULATOR
           ================================================================ */}
        <section id="calculator" className="py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="lp-anim text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-black">See how much ToVi <span className="text-neutral-400">saves your team</span></h2>
              <p className="text-neutral-500 mt-3">Adjust the sliders — results update instantly</p>
            </div>

            <div className="lp-anim max-w-[680px] mx-auto">
              <div className="relative rounded-2xl p-8 border border-neutral-200 bg-white shadow-lg">

                {/* Team size */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-neutral-600">Developers on your team</label>
                    <span className="text-xs font-mono bg-neutral-100 text-black px-2 py-0.5 rounded-full">{teamSize}</span>
                  </div>
                  <input type="range" min={1} max={200} value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value))} className="lp-slider" />
                </div>

                {/* Tool toggles */}
                <div className="mb-8">
                  <label className="text-sm text-neutral-600 mb-3 block">Tools your team uses</label>
                  <div className="flex flex-wrap gap-2">
                    {["Windsurf", "Claude", "Copilot", "Cursor", "ChatGPT"].map((tool) => (
                      <button
                        key={tool}
                        onClick={() => toggleTool(tool)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                          selectedTools.includes(tool)
                            ? "bg-black text-white border border-black"
                            : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly spend */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-neutral-600">Estimated monthly AI spend</label>
                    <span className="text-xs font-mono bg-neutral-100 text-black px-2 py-0.5 rounded-full">${monthlySpend.toLocaleString()}</span>
                  </div>
                  <input type="range" min={100} max={50000} step={100} value={monthlySpend} onChange={(e) => setMonthlySpend(Number(e.target.value))} className="lp-slider" />
                </div>

                {/* Divider */}
                <div className="h-px bg-neutral-200 mb-8" />

                {/* Results */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 3-2 5-2 8H7c0-3-2-5-2-8a7 7 0 0 1 7-7zM9 17v1a3 3 0 0 0 6 0v-1"/></svg>
                      <span className="text-sm text-neutral-600">Ghost seat waste:</span>
                    </div>
                    <span className="text-rose-500 font-semibold font-mono">${Math.round(dispGhost).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zM12 6v6l4 2"/></svg>
                      <span className="text-sm text-neutral-600">Model inefficiency waste:</span>
                    </div>
                    <span className="text-amber-500 font-semibold font-mono">${Math.round(dispModel).toLocaleString()}/mo</span>
                  </div>
                  <div className="h-px bg-neutral-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-black font-medium">Potential monthly savings:</span>
                    <span className="text-black text-4xl font-bold font-mono">${Math.round(dispTotal).toLocaleString()}/mo</span>
                  </div>
                  <p className="text-neutral-500 text-sm text-right">That&apos;s <span className="text-black font-medium">${Math.round(annualSavings).toLocaleString()}</span> saved per year</p>
                  <p className="text-neutral-400 text-xs text-right italic">ToVi pays for itself in {daysToROI.toFixed(1)} days</p>
                </div>
              </div>

              {/* CTA below calculator */}
              <div className="text-center mt-10">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Start saving — free to try
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <p className="text-xs text-neutral-500 mt-4">No credit card required. Connect your first tool in 3 minutes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
           SECTION 6 — HOW IT WORKS
           ================================================================ */}
        <section className="py-28 bg-neutral-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="lp-anim text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-black">How it works</h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 relative">
              {/* Connecting line — SVG */}
              <svg className="hidden sm:block absolute top-12 left-[20%] right-[20%] h-[2px] overflow-visible" style={{ width: "60%", left: "20%" }}>
                <line className="lp-anim" x1="0" y1="1" x2="100%" y2="1" stroke="#d4d4d4" strokeWidth="2" strokeDasharray="400" strokeDashoffset="400" style={{ animation: "drawLine 1.5s ease forwards 0.5s" }} />
              </svg>

              {/* Step 1 */}
              <div className="lp-anim text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101"/><path d="M10.172 13.828a4 4 0 0 0 5.656 0l4-4a4 4 0 1 0-5.656-5.656l-1.102 1.101"/></svg>
                </div>
                <span className="inline-block text-[10px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full mb-3">~3 minutes</span>
                <h3 className="font-semibold text-lg mb-2 text-black">Connect in minutes</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">OAuth with Windsurf, Anthropic, and GitHub. No code, no config files, no engineering time.</p>
              </div>

              {/* Step 2 */}
              <div className="lp-anim lp-delay-1 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </div>
                <span className="inline-block text-[10px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full mb-3">Instant</span>
                <h3 className="font-semibold text-lg mb-2 text-black">Full visibility instantly</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">Your entire team&apos;s AI usage populates immediately. Per-user, per-tool, per-model — all in one view.</p>
              </div>

              {/* Step 3 */}
              <div className="lp-anim lp-delay-2 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-neutral-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <span className="inline-block text-[10px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full mb-3">Ongoing</span>
                <h3 className="font-semibold text-lg mb-2 text-black">Save from day one</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">Approve reallocations, kill ghost seats, set budget alerts. ToVi tells you exactly what to do.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
           SECTION 7 — PRICING
           ================================================================ */}
        <section id="pricing" className="py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="lp-anim text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-black">Simple, transparent pricing</h2>
              <div className="flex items-center justify-center gap-3 mt-6">
                <span className={`text-sm ${!annual ? "text-black" : "text-neutral-400"}`}>Monthly</span>
                <button
                  onClick={() => setAnnual(!annual)}
                  className="relative w-12 h-6 rounded-full border border-neutral-300 transition-colors"
                  style={{ backgroundColor: annual ? "black" : "#e5e5e5" }}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${annual ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
                <span className={`text-sm ${annual ? "text-black" : "text-neutral-400"}`}>Annual</span>
                {annual && <span className="text-[10px] bg-neutral-100 text-black px-2 py-0.5 rounded-full font-medium">Save 20%</span>}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  name: "Starter", price: 49, desc: "For small teams and individual managers", pop: false,
                  features: ["Up to 15 users", "3 tool integrations", "Ghost seat detection", "Burn rate alerts", "Weekly email digest"],
                  cta: "Start free trial"
                },
                {
                  name: "Growth", price: 149, desc: "For engineering leads managing multiple teams", pop: true,
                  features: ["Up to 75 users", "All tool integrations", "Everything in Starter", "Model efficiency tracking", "Director-level dashboard", "Slack alerts", "Priority support"],
                  cta: "Start free trial"
                },
                {
                  name: "Enterprise", price: 499, desc: "For VPs managing org-wide AI spend", pop: false,
                  features: ["Unlimited users", "Everything in Growth", "VP org dashboard", "SSO / SAML", "Audit logs", "API access", "Dedicated onboarding"],
                  cta: "Contact us"
                },
              ].map((plan) => {
                const displayPrice = annual ? Math.round(plan.price * 0.8) : plan.price;
                return (
                  <div
                    key={plan.name}
                    className={`lp-anim pricing-card rounded-2xl p-8 border ${
                      plan.pop
                        ? "border-black bg-white shadow-lg"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {plan.pop && <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-medium">Most popular</span>}
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">{plan.desc}</p>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold text-black">${displayPrice}</span>
                      <span className="text-neutral-500 text-sm">/mo</span>
                    </div>
                    <Link
                      href={plan.cta === "Contact us" ? "/contact" : "/signup"}
                      className={`block text-center px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                        plan.pop
                          ? "bg-black text-white hover:bg-neutral-800"
                          : "bg-neutral-100 text-black border border-neutral-200 hover:bg-neutral-200"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                    <ul className="mt-6 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-neutral-500">
                          <svg className="w-4 h-4 text-black shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
           SECTION 8 — FINAL CTA
           ================================================================ */}
        <section className="py-32 bg-neutral-50">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="lp-anim text-4xl sm:text-5xl font-bold leading-tight text-black">
              Your team is spending on AI right now.
            </h2>
            <p className="lp-anim text-xl text-neutral-500 mt-4">Do you know where it&apos;s going?</p>

            <div className="lp-anim mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-black text-white px-10 py-4 rounded-lg text-base font-semibold hover:bg-neutral-800 transition-colors"
              >
                Start for free →
              </Link>
            </div>

            <div className="lp-anim mt-8">
              <div className="flex items-center justify-center gap-1 mb-2">
                {["SC", "MJ", "PP", "AR", "JK"].map((initials, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-medium -ml-1 first:ml-0 border-2 border-white bg-neutral-100 text-neutral-600"
                  >
                    {initials}
                  </div>
                ))}
                <span className="text-xs text-neutral-500 ml-2">+500 teams</span>
              </div>
              <p className="text-sm text-neutral-500">Join 500+ engineering teams saving on AI spend</p>
            </div>

            <p className="lp-anim text-xs text-neutral-400 mt-10">ToVi — Token Visualizer. A lighthouse guiding you through AI spend.</p>
          </div>
        </section>

        {/* ================================================================
           FOOTER
           ================================================================ */}
        <footer className="border-t border-neutral-100 py-8 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-neutral-400">
            <span>&copy; {new Date().getFullYear()} ToVi</span>
            <span>Token Visualizer for Engineering Teams</span>
          </div>
        </footer>
      </div>
    </>
  );
}
