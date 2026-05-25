"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  Gauge,
  DollarSign,
  Users,
  Lightbulb,
  AlertTriangle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import {
  EfficiencyDashboardData,
  UserEfficiencyRow,
  ModelTier,
  MODEL_TIER_LABELS,
} from "@/lib/types";

const TIER_COLORS: Record<ModelTier, string> = {
  premium: "bg-rose-500",
  mid: "bg-amber-500",
  efficient: "bg-emerald-500",
};

const RATING_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", label: "Efficient" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", label: "Review" },
  red: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", label: "High Waste Risk" },
};

type SortField = "email" | "score" | "avg_tokens" | "premium_pct" | "requests" | "saving";
type SortDir = "asc" | "desc";

export default function EfficiencyPage() {
  const [data, setData] = useState<EfficiencyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/efficiency");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch efficiency data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sortedUsers = useMemo(() => {
    if (!data) return [];
    const users = [...data.users];
    users.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "email": cmp = a.user_email.localeCompare(b.user_email); break;
        case "score": cmp = a.efficiency_score - b.efficiency_score; break;
        case "avg_tokens": cmp = a.avg_tokens_per_request - b.avg_tokens_per_request; break;
        case "premium_pct": cmp = a.premium_usage_pct - b.premium_usage_pct; break;
        case "requests": cmp = a.total_requests - b.total_requests; break;
        case "saving": cmp = a.potential_saving - b.potential_saving; break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return users;
  }, [data, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500">No efficiency data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">Model Efficiency</h1>
        <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
          Understand model usage patterns — are the right models being used for the right tasks?
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Team Avg Score</CardTitle>
            <Gauge className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              data.team_avg_score >= 75 ? "text-emerald-600" : data.team_avg_score >= 50 ? "text-amber-600" : "text-rose-600"
            }`}>
              {data.team_avg_score}
            </div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Potential Savings</CardTitle>
            <DollarSign className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.total_potential_saving.toFixed(2)}</div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">if premium short-requests used Sonnet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Team Members</CardTitle>
            <Users className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.users.length}</div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-emerald-600">{data.users.filter((u) => u.efficiency_rating === "green").length} green</span>
              <span className="text-xs text-amber-600">{data.users.filter((u) => u.efficiency_rating === "amber").length} amber</span>
              <span className="text-xs text-rose-600">{data.users.filter((u) => u.efficiency_rating === "red").length} red</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Recommendations</CardTitle>
            <Lightbulb className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.recommendations.length}</div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
              {data.recommendations.filter((r) => r.severity === "warning").length} warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score formula — transparent */}
      <Card className="border-dashed">
        <CardContent className="py-3">
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors w-full"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How is the efficiency score calculated?</span>
            {showFormula ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
          </button>
          {showFormula && (
            <p className="text-xs text-neutral-400 mt-2 font-mono leading-relaxed dark:text-neutral-500">
              {data.score_formula}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Team Efficiency Leaderboard */}
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Team Efficiency Overview</h2>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>
                    <SortBtn field="email" current={sortField} dir={sortDir} onSort={handleSort}>User</SortBtn>
                  </TableHead>
                  <TableHead>Most Used Model</TableHead>
                  <TableHead>
                    <SortBtn field="avg_tokens" current={sortField} dir={sortDir} onSort={handleSort}>Avg Tokens</SortBtn>
                  </TableHead>
                  <TableHead>
                    <SortBtn field="requests" current={sortField} dir={sortDir} onSort={handleSort}>Requests</SortBtn>
                  </TableHead>
                  <TableHead>
                    <SortBtn field="premium_pct" current={sortField} dir={sortDir} onSort={handleSort}>Premium %</SortBtn>
                  </TableHead>
                  <TableHead>
                    <SortBtn field="score" current={sortField} dir={sortDir} onSort={handleSort}>Score</SortBtn>
                  </TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>
                    <SortBtn field="saving" current={sortField} dir={sortDir} onSort={handleSort}>Est. Saving</SortBtn>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <UserEfficiencyRowView
                    key={user.user_email}
                    user={user}
                    expanded={expandedUser === user.user_email}
                    onToggle={() => setExpandedUser(expandedUser === user.user_email ? null : user.user_email)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Model Usage Breakdown — Team Aggregate */}
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Model Usage Breakdown (Team)</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Stacked bar */}
              <div className="flex h-8 rounded-md overflow-hidden">
                {data.team_aggregate.map((model) => (
                  <div
                    key={model.model_name}
                    className={`${TIER_COLORS[model.tier]} flex items-center justify-center transition-all`}
                    style={{ width: `${Math.max(model.pct_of_requests, 2)}%` }}
                    title={`${model.model_name}: ${model.pct_of_requests}%`}
                  >
                    {model.pct_of_requests >= 8 && (
                      <span className="text-[10px] text-white font-medium truncate px-1">
                        {model.pct_of_requests}%
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.team_aggregate.map((model) => (
                  <div key={model.model_name} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${TIER_COLORS[model.tier]}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{model.model_name}</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {model.total_requests.toLocaleString()} req · {MODEL_TIER_LABELS[model.tier]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost comparison callout */}
              {data.total_potential_saving > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-md border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30">
                  <DollarSign className="w-4 h-4 text-amber-600 mt-0.5 shrink-0 dark:text-amber-400" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    If premium model requests with under 500 tokens had used Sonnet instead, estimated saving: <strong>${data.total_potential_saving.toFixed(2)}/month</strong>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Panel */}
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Recommendations</h2>
        <div className="space-y-3">
          {data.recommendations.map((rec, i) => (
            <Card key={i}>
              <CardContent className="py-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  rec.severity === "warning"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                    : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                }`}>
                  {rec.severity === "warning" ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] capitalize">{rec.type}</Badge>
                    {rec.severity === "warning" && <Badge variant="destructive" className="text-[10px]">Warning</Badge>}
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{rec.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info footer */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Efficiency insights are based on usage patterns, not individual request quality.
            All thresholds are configurable — adjust them in Settings if defaults don&apos;t fit your team.
            Model data availability depends on each tool&apos;s API; unavailable data will be noted rather than estimated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// User Row with expandable model breakdown
// ============================================

function UserEfficiencyRowView({
  user,
  expanded,
  onToggle,
}: {
  user: UserEfficiencyRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rating = RATING_STYLES[user.efficiency_rating];

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900" onClick={onToggle}>
        <TableCell className="w-8 px-2">
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
        </TableCell>
        <TableCell>
          <span className="font-mono text-sm">{user.user_email}</span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${TIER_COLORS[user.model_breakdown[0]?.tier || "mid"]}`} />
            <span className="text-xs font-mono">{user.most_used_model}</span>
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm">{user.avg_tokens_per_request.toLocaleString()}</TableCell>
        <TableCell className="font-mono text-sm">{user.total_requests.toLocaleString()}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-neutral-100 rounded-full h-1.5 dark:bg-neutral-800">
              <div
                className={`h-1.5 rounded-full ${user.premium_usage_pct > 60 ? "bg-rose-500" : user.premium_usage_pct > 35 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${user.premium_usage_pct}%` }}
              />
            </div>
            <span className="text-xs font-mono">{user.premium_usage_pct}%</span>
          </div>
        </TableCell>
        <TableCell>
          <span className={`text-sm font-bold ${
            user.efficiency_score >= 75 ? "text-emerald-600" : user.efficiency_score >= 50 ? "text-amber-600" : "text-rose-600"
          }`}>
            {user.efficiency_score}
          </span>
        </TableCell>
        <TableCell>
          <Badge className={`text-[10px] ${rating.bg} ${rating.text} border-0`}>
            {rating.label}
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-sm">
          {user.potential_saving > 0 ? `$${user.potential_saving.toFixed(2)}` : "—"}
        </TableCell>
      </TableRow>

      {/* Expanded: per-user model breakdown */}
      {expanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-neutral-50/50 dark:bg-neutral-900/50 p-0">
            <div className="px-8 py-4">
              <p className="text-xs font-medium text-neutral-500 mb-3 dark:text-neutral-400">Model breakdown for {user.user_email}</p>

              {/* Mini stacked bar */}
              <div className="flex h-5 rounded-md overflow-hidden mb-3">
                {user.model_breakdown.map((b) => (
                  <div
                    key={b.model_name}
                    className={`${TIER_COLORS[b.tier]} flex items-center justify-center`}
                    style={{ width: `${Math.max(b.pct_of_requests, 3)}%` }}
                  >
                    {b.pct_of_requests >= 10 && (
                      <span className="text-[9px] text-white font-medium">{b.pct_of_requests}%</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {user.model_breakdown.map((b) => (
                  <div key={b.model_name} className="flex items-center gap-2 text-xs">
                    <div className={`w-2.5 h-2.5 rounded-sm ${TIER_COLORS[b.tier]}`} />
                    <div>
                      <span className="font-medium">{b.model_name}</span>
                      <span className="text-neutral-400 ml-1 dark:text-neutral-500">
                        {b.request_count} req · avg {b.avg_tokens.toLocaleString()} tok
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ============================================
// Sort button helper
// ============================================

function SortBtn({
  field,
  current,
  dir: _dir,
  onSort,
  children,
}: {
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${current === field ? "text-black dark:text-white" : ""}`} />
    </button>
  );
}
