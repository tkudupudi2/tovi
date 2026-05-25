"use client";

import { useEffect, useState, useMemo } from "react";
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
  TrendingDown,
  Ghost,
  Users,
  ArrowUpDown,
  Lightbulb,
  Wind,
  Bot,
  GitBranch,
  Building2,
  ChevronRight,
  Target,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  VPDashboardData,
  DirectorDashboardData,
  ManagerDashboardData,
  DepartmentSummary,
  TeamSummary,
  ToolName,
  UserUsageSummary,
  RoleType,
} from "@/lib/types";
import {
  getDemoCurrentRole,
  getDemoCurrentTeamId,
  setDemoRole,
} from "@/lib/demo-org-data";
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

type SortField = "name" | "spend" | "efficiency" | "ghost_seats" | "burn_rate";
type SortDir = "asc" | "desc";

export default function OrgDashboardPage() {
  const [role, setRole] = useState<RoleType>("vp");
  const [_teamId, setTeamId] = useState<string | null>(null);
  const [vpData, setVpData] = useState<VPDashboardData | null>(null);
  const [dirData, setDirData] = useState<DirectorDashboardData | null>(null);
  const [mgrData, setMgrData] = useState<ManagerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("spend");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; role: RoleType; teamId: string | null }[]>([]);

  const fetchData = async (r: RoleType, tid: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: r });
      if (tid) params.set("team_id", tid);
      const res = await fetch(`/api/org-dashboard?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (r === "vp") {
        setVpData(data);
        setDirData(null);
        setMgrData(null);
      } else if (r === "director") {
        setDirData(data);
        setVpData(null);
        setMgrData(null);
      } else if (r === "manager") {
        setMgrData(data);
        setVpData(null);
        setDirData(null);
      }
    } catch (err) {
      console.error("Failed to fetch org dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const r = getDemoCurrentRole();
    const tid = getDemoCurrentTeamId();
    setRole(r);
    setTeamId(tid);
    setBreadcrumbs([{ label: "Organization", role: "vp", teamId: null }]);
    fetchData(r, tid);
  }, []);

  const navigateTo = (r: RoleType, tid: string | null, label: string) => {
    setRole(r);
    setTeamId(tid);
    setDemoRole(r, tid);
    setSortField("spend");
    setSortDir("desc");

    setBreadcrumbs((prev) => {
      const existingIdx = prev.findIndex((b) => b.role === r && b.teamId === tid);
      if (existingIdx >= 0) return prev.slice(0, existingIdx + 1);
      return [...prev, { label, role: r, teamId: tid }];
    });

    fetchData(r, tid);
  };

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

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((bc, i) => (
          <div key={`${bc.role}-${bc.teamId}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-400" />}
            <button
              onClick={() => navigateTo(bc.role, bc.teamId, bc.label)}
              className={`transition-colors ${
                i === breadcrumbs.length - 1
                  ? "font-medium text-black dark:text-white"
                  : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {bc.label}
            </button>
          </div>
        ))}
      </div>

      {/* Role switcher (demo only) */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400 dark:text-neutral-500">View as:</span>
        {(["vp", "director", "manager"] as RoleType[]).map((r) => (
          <Button
            key={r}
            variant={role === r ? "default" : "outline"}
            size="sm"
            className="text-xs h-7 capitalize"
            onClick={() => {
              if (r === "vp") navigateTo("vp", null, "Organization");
              else if (r === "director") navigateTo("director", "dept-engineering", "Engineering");
              else navigateTo("manager", "team-backend", "Backend");
            }}
          >
            {r}
          </Button>
        ))}
      </div>

      {/* VP View */}
      {vpData && <VPView data={vpData} sortField={sortField} sortDir={sortDir} onSort={handleSort} onDrillDept={(dept) => navigateTo("director", dept.team_id, dept.team_name)} />}

      {/* Director View */}
      {dirData && <DirectorView data={dirData} sortField={sortField} sortDir={sortDir} onSort={handleSort} onDrillTeam={(team) => navigateTo("manager", team.team_id, team.team_name)} />}

      {/* Manager View */}
      {mgrData && <ManagerView data={mgrData} />}
    </div>
  );
}

// ============================================
// VP Dashboard View
// ============================================

function VPView({
  data,
  sortField,
  sortDir,
  onSort,
  onDrillDept,
}: {
  data: VPDashboardData;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  onDrillDept: (dept: DepartmentSummary) => void;
}) {
  const budgetPct = data.total_budget > 0 ? (data.total_spend / data.total_budget) * 100 : 0;
  const isOverBudgetPace = budgetPct > (new Date().getDate() / 30) * 100;

  const sortedDepts = useMemo(() => {
    const depts = [...data.departments];
    depts.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.team_name.localeCompare(b.team_name); break;
        case "spend": cmp = a.total_spend - b.total_spend; break;
        case "efficiency": cmp = a.efficiency_score - b.efficiency_score; break;
        case "ghost_seats": cmp = a.ghost_seats - b.ghost_seats; break;
        case "burn_rate": cmp = a.burn_rate_per_day - b.burn_rate_per_day; break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return depts;
  }, [data.departments, sortField, sortDir]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{data.org_name} Overview</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">VP Dashboard — Organization-wide view</p>
        </div>
        <Badge variant={isOverBudgetPace ? "destructive" : "secondary"} className="text-xs">
          {data.spend_vs_last_month >= 0 ? "+" : ""}{data.spend_vs_last_month}% vs last month
        </Badge>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Org Spend</CardTitle>
            <DollarSign className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.total_spend.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={budgetPct} className="h-1.5 flex-1" />
              <span className="text-xs text-neutral-400">{Math.round(budgetPct)}% of budget</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Month Projection</CardTitle>
            <Target className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.projected_monthly_spend.toLocaleString()}</div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">
              vs {data.total_budget.toLocaleString()} budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Active Users</CardTitle>
            <Users className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.total_active_users}</div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">across all departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Ghost Seats</CardTitle>
            <Ghost className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${data.total_ghost_seats > 0 ? "text-rose-600" : ""}`}>
              {data.total_ghost_seats}
            </div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">inactive 14+ days</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.insights.map((insight, i) => (
                <p key={i} className="text-sm text-neutral-600 dark:text-neutral-300">• {insight}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department comparison */}
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Department Comparison</h2>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="name" current={sortField} dir={sortDir} onSort={onSort}>Department</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="spend" current={sortField} dir={sortDir} onSort={onSort}>Total Spend</SortButton>
                  </TableHead>
                  <TableHead>Budget Usage</TableHead>
                  <TableHead>
                    <SortButton field="efficiency" current={sortField} dir={sortDir} onSort={onSort}>Efficiency</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="ghost_seats" current={sortField} dir={sortDir} onSort={onSort}>Ghost Seats</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="burn_rate" current={sortField} dir={sortDir} onSort={onSort}>Burn Rate</SortButton>
                  </TableHead>
                  <TableHead>Teams</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDepts.map((dept) => {
                  const budgetUsage = dept.budget_credits > 0 ? (dept.total_spend / dept.budget_credits) * 100 : 0;
                  return (
                    <TableRow key={dept.team_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-neutral-400" />
                          <span className="font-medium">{dept.team_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{dept.total_spend.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={Math.min(100, budgetUsage)} className="h-1.5 flex-1" />
                          <span className={`text-xs font-mono ${budgetUsage > 80 ? "text-rose-600" : "text-neutral-500"}`}>
                            {Math.round(budgetUsage)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={dept.efficiency_score >= 70 ? "secondary" : "destructive"} className="text-xs font-mono">
                          {dept.efficiency_score}
                        </Badge>
                      </TableCell>
                      <TableCell className={dept.ghost_seats > 0 ? "text-rose-600 font-medium" : "text-neutral-500"}>
                        {dept.ghost_seats}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{dept.burn_rate_per_day.toLocaleString()}/d</TableCell>
                      <TableCell className="text-sm text-neutral-500">{dept.child_teams.length}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => onDrillDept(dept)} className="text-xs gap-1">
                          Drill in <ChevronRight className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Tool breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Tool Breakdown (Org-wide)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.tool_breakdown.map((tool) => {
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
    </>
  );
}

// ============================================
// Director Dashboard View
// ============================================

function DirectorView({
  data,
  sortField,
  sortDir,
  onSort,
  onDrillTeam,
}: {
  data: DirectorDashboardData;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  onDrillTeam: (team: TeamSummary) => void;
}) {
  const budgetPct = data.budget_credits > 0 ? (data.total_spend / data.budget_credits) * 100 : 0;

  const sortedTeams = useMemo(() => {
    const teams = [...data.teams];
    teams.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.team_name.localeCompare(b.team_name); break;
        case "spend": cmp = a.total_spend - b.total_spend; break;
        case "efficiency": cmp = a.efficiency_score - b.efficiency_score; break;
        case "ghost_seats": cmp = a.ghost_seats - b.ghost_seats; break;
        case "burn_rate": cmp = a.burn_rate_per_day - b.burn_rate_per_day; break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return teams;
  }, [data.teams, sortField, sortDir]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">{data.department_name} Department</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Director Dashboard — Department view</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Dept Spend</CardTitle>
            <DollarSign className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.total_spend.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={Math.min(100, budgetPct)} className="h-1.5 flex-1" />
              <span className="text-xs text-neutral-400">{Math.round(budgetPct)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Efficiency</CardTitle>
            <Target className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.efficiency_score}</div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Headcount</CardTitle>
            <Users className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.headcount}</div>
            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">{data.ghost_seats} ghost seats</p>
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
      </div>

      {/* Team comparison */}
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Team Comparison</h2>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="name" current={sortField} dir={sortDir} onSort={onSort}>Team</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="spend" current={sortField} dir={sortDir} onSort={onSort}>Spend</SortButton>
                  </TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>
                    <SortButton field="efficiency" current={sortField} dir={sortDir} onSort={onSort}>Efficiency</SortButton>
                  </TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>
                    <SortButton field="ghost_seats" current={sortField} dir={sortDir} onSort={onSort}>Ghosts</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="burn_rate" current={sortField} dir={sortDir} onSort={onSort}>Burn Rate</SortButton>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTeams.map((team) => {
                  const budgetUsage = team.budget_credits > 0 ? (team.total_spend / team.budget_credits) * 100 : 0;
                  return (
                    <TableRow key={team.team_id}>
                      <TableCell className="font-medium">{team.team_name}</TableCell>
                      <TableCell className="font-mono text-sm">{team.total_spend.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={Math.min(100, budgetUsage)} className="h-1.5 flex-1" />
                          <span className="text-xs font-mono">{Math.round(budgetUsage)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={team.efficiency_score >= 70 ? "secondary" : "destructive"} className="text-xs font-mono">
                          {team.efficiency_score}
                        </Badge>
                      </TableCell>
                      <TableCell>{team.active_users}</TableCell>
                      <TableCell className={team.ghost_seats > 0 ? "text-rose-600 font-medium" : ""}>
                        {team.ghost_seats}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{team.burn_rate_per_day.toLocaleString()}/d</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => onDrillTeam(team)} className="text-xs gap-1">
                          View <ChevronRight className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Budget allocation */}
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Budget vs Actual</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.budget_allocation.map((ba) => {
            const pct = ba.budget > 0 ? (ba.actual / ba.budget) * 100 : 0;
            return (
              <Card key={ba.team_name}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{ba.team_name}</span>
                    <span className={`text-xs font-mono ${pct > 90 ? "text-rose-600" : "text-neutral-500"}`}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <Progress value={Math.min(100, pct)} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
                    <span>{ba.actual.toLocaleString()} used</span>
                    <span>{ba.budget.toLocaleString()} budget</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ============================================
// Manager Dashboard View
// ============================================

function ManagerView({ data }: { data: ManagerDashboardData }) {
  const [sortField, setSortField] = useState<"credits" | "last_active" | "email">("credits");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sortedUsers = useMemo(() => {
    const users = [...data.user_summaries];
    users.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "credits": cmp = a.total_credits_used - b.total_credits_used; break;
        case "last_active": cmp = new Date(a.last_active).getTime() - new Date(b.last_active).getTime(); break;
        case "email": cmp = a.user_email.localeCompare(b.user_email); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return users;
  }, [data.user_summaries, sortField, sortDir]);

  const handleSort = (field: "credits" | "last_active" | "email") => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const efficiencyDelta = data.team_efficiency_score - data.org_avg_efficiency;

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">{data.team_name} Team</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Manager Dashboard — Team view</p>
      </div>

      {/* Team context cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Your Team Efficiency</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold">{data.team_efficiency_score}</span>
              <span className="text-sm text-neutral-400 dark:text-neutral-500 pb-1">/ 100</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {efficiencyDelta >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600" />
              )}
              <span className={`text-xs ${efficiencyDelta >= 0 ? "text-green-600" : "text-rose-600"}`}>
                {efficiencyDelta >= 0 ? "+" : ""}{efficiencyDelta} vs org avg ({data.org_avg_efficiency})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Department Rank</p>
            <div className="flex items-end gap-1 mt-1">
              <span className="text-3xl font-bold">{data.department_rank}</span>
              <span className="text-sm text-neutral-400 dark:text-neutral-500 pb-1">of {data.department_team_count} teams</span>
            </div>
            <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">Ranked by efficiency score</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Team Spend</p>
            <div className="text-3xl font-bold mt-1">{data.total_spend.toLocaleString()}</div>
            <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
              Burn: {data.burn_rate_per_day.toLocaleString()}/day · {data.ghost_seat_count} ghost seats
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tool breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Tool Breakdown</h2>
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
                    <CardTitle className="text-sm">{TOOL_LABELS[tool.tool_name]}</CardTitle>
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
        <h2 className="text-lg font-semibold text-black dark:text-white mb-4">Team Members</h2>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button onClick={() => handleSort("email")} className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors">
                      User <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Windsurf</TableHead>
                  <TableHead className="text-right">Claude</TableHead>
                  <TableHead className="text-right">Copilot</TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("credits")} className="flex items-center gap-1 ml-auto hover:text-black dark:hover:text-white transition-colors">
                      Total <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("last_active")} className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors">
                      Last Active <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <MgrUserRow key={user.user_email} user={user} />
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </>
  );
}

function MgrUserRow({ user }: { user: UserUsageSummary }) {
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
      <TableCell className="text-right font-mono text-sm font-medium">{user.total_credits_used.toLocaleString()}</TableCell>
      <TableCell className="text-sm text-neutral-500 dark:text-neutral-400">
        {formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}
      </TableCell>
      <TableCell>
        {user.is_ghost ? (
          <Badge variant="destructive" className="text-xs">Ghost</Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">Active</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

// ============================================
// Shared sort button
// ============================================

function SortButton({
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
