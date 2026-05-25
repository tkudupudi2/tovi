"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Ghost,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  Wind,
  Bot,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardData, ToolName, UserUsageSummary } from "@/lib/types";
import { generateDemoData } from "@/lib/demo-data";
import { formatDistanceToNow } from "date-fns";

const TOOL_COLORS: Record<ToolName, string> = {
  windsurf: "bg-blue-500",
  anthropic: "bg-orange-500",
  copilot: "bg-purple-500",
};

const TOOL_LABELS: Record<ToolName, string> = {
  windsurf: "Windsurf",
  anthropic: "Claude",
  copilot: "Copilot",
};

const TOOL_ICONS: Record<ToolName, React.ReactNode> = {
  windsurf: <Wind className="w-4 h-4" />,
  anthropic: <Bot className="w-4 h-4" />,
  copilot: <GitBranch className="w-4 h-4" />,
};

type SortField = "credits" | "last_active" | "email";
type SortDir = "asc" | "desc";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sortField, setSortField] = useState<SortField>("credits");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const isDemoMode =
        typeof window !== "undefined"
          ? localStorage.getItem("tovi_demo") !== "false"
          : true;

      if (isDemoMode) {
        setData(generateDemoData());
        setLastSynced(new Date());
        setLoading(false);
        return;
      }

      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const dashData = await res.json();
        setData(dashData);
        setLastSynced(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await fetchDashboard();
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const sortedUsers = useMemo(() => {
    if (!data) return [];
    const users = [...data.user_summaries];
    users.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "credits":
          cmp = a.total_credits_used - b.total_credits_used;
          break;
        case "last_active":
          cmp = new Date(a.last_active).getTime() - new Date(b.last_active).getTime();
          break;
        case "email":
          cmp = a.user_email.localeCompare(b.user_email);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return users;
  }, [data, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
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
        <p className="text-neutral-500">No data available. Connect your tools to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {lastSynced && `Last synced ${formatDistanceToNow(lastSynced, { addSuffix: true })}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
          className="gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync now"}
        </Button>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Spend</CardTitle>
            <DollarSign className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.total_spend.toLocaleString()}</div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">credits this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Burn Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.burn_rate_per_day.toLocaleString()}</div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">credits / day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Ghost Seats</CardTitle>
            <Ghost className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.ghost_seat_count > 0 ? "text-rose-600" : ""}`}>
              {data.ghost_seat_count}
            </div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">inactive 14+ days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Credit Exhaustion</CardTitle>
            <Calendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.projected_exhaustion_date || "—"}
            </div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">at current burn rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-tool breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-black mb-4 dark:text-white">Tool Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.tool_summaries.map((tool) => {
            const total = tool.total_used + tool.total_remaining;
            const pct = total > 0 ? (tool.total_used / total) * 100 : 0;
            return (
              <Card key={tool.tool_name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white ${TOOL_COLORS[tool.tool_name]}`}>
                      {TOOL_ICONS[tool.tool_name]}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{TOOL_LABELS[tool.tool_name]}</CardTitle>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {tool.active_users} active · {tool.ghost_seats} ghost
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Used</span>
                    <span className="font-medium">{tool.total_used.toLocaleString()}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
                    <span>{Math.round(pct)}% used</span>
                    <span>{tool.total_remaining.toLocaleString()} remaining</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* User table */}
      <div>
        <h2 className="text-lg font-semibold text-black mb-4 dark:text-white">Team Usage</h2>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center gap-1 hover:text-black transition-colors dark:hover:text-white"
                    >
                      User
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Windsurf</TableHead>
                  <TableHead className="text-right">Claude</TableHead>
                  <TableHead className="text-right">Copilot</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("credits")}
                      className="flex items-center gap-1 ml-auto hover:text-black transition-colors dark:hover:text-white"
                    >
                      Total
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("last_active")}
                      className="flex items-center gap-1 hover:text-black transition-colors dark:hover:text-white"
                    >
                      Last Active
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <UserRow key={user.user_email} user={user} />
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: UserUsageSummary }) {
  const getToolCredits = (toolName: ToolName) => {
    const tool = user.tools.find((t) => t.tool_name === toolName);
    return tool ? tool.credits_used.toLocaleString() : "—";
  };

  return (
    <TableRow className={user.is_ghost ? "bg-rose-50/50 dark:bg-rose-950/20" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${user.is_ghost ? "bg-rose-400" : "bg-green-400"}`} />
          <span className="font-mono text-sm">{user.user_email}</span>
        </div>
      </TableCell>
      <TableCell className="text-right font-mono text-sm">{getToolCredits("windsurf")}</TableCell>
      <TableCell className="text-right font-mono text-sm">{getToolCredits("anthropic")}</TableCell>
      <TableCell className="text-right font-mono text-sm">{getToolCredits("copilot")}</TableCell>
      <TableCell className="text-right font-mono text-sm font-medium">
        {user.total_credits_used.toLocaleString()}
      </TableCell>
      <TableCell className="text-sm text-neutral-500 dark:text-neutral-400">
        {formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}
      </TableCell>
      <TableCell>
        {user.is_ghost ? (
          <Badge variant="destructive" className="text-xs">
            Ghost
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
