"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Plus, Trash2, User, TrendingUp } from "lucide-react";
import { AlertRule } from "@/lib/types";
import { generateDemoAlerts } from "@/lib/demo-data";

type ScopeType = "org" | "department" | "team";

const SCOPE_LABELS: Record<ScopeType, string> = {
  org: "Org-wide",
  department: "Department",
  team: "Team",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleType, setRuleType] = useState<"user_threshold" | "burn_rate">("user_threshold");
  const [threshold, setThreshold] = useState("");
  const [creating, setCreating] = useState(false);
  const [alertScope, setAlertScope] = useState<ScopeType>("team");

  useEffect(() => {
    const fetchAlerts = async () => {
      const isDemoMode =
        typeof window !== "undefined"
          ? localStorage.getItem("tovi_demo") !== "false"
          : true;

      if (isDemoMode) {
        setAlerts(generateDemoAlerts());
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/alerts");
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleCreate = async () => {
    if (!threshold) return;
    setCreating(true);

    const isDemoMode =
      typeof window !== "undefined"
        ? localStorage.getItem("tovi_demo") !== "false"
        : true;

    if (isDemoMode) {
      const newAlert: AlertRule = {
        id: `demo-${Date.now()}`,
        org_id: "demo-org",
        rule_type: ruleType,
        threshold_value: Number(threshold),
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setAlerts((prev) => [newAlert, ...prev]);
      setThreshold("");
      setCreating(false);
      return;
    }

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule_type: ruleType, threshold_value: Number(threshold) }),
      });
      if (res.ok) {
        const newAlert = await res.json();
        setAlerts((prev) => [newAlert, ...prev]);
        setThreshold("");
      }
    } catch (err) {
      console.error("Failed to create alert:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const isDemoMode =
      typeof window !== "undefined"
        ? localStorage.getItem("tovi_demo") !== "false"
        : true;

    setAlerts((prev) => prev.filter((a) => a.id !== id));

    if (!isDemoMode) {
      await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">Alerts</h1>
        <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
          Set thresholds to get notified about unusual usage
        </p>
      </div>

      {/* Create alert form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Alert Rule
          </CardTitle>
          <CardDescription>
            Configure when you want to be notified via email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label>Rule type</Label>
              <Select value={ruleType} onValueChange={(v: string) => setRuleType(v as "user_threshold" | "burn_rate")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_threshold">
                    User credit threshold
                  </SelectItem>
                  <SelectItem value="burn_rate">
                    Burn rate threshold
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select value={alertScope} onValueChange={(v: string) => setAlertScope(v as ScopeType)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">Org-wide (VP)</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>
                {ruleType === "user_threshold"
                  ? "Credit limit per user"
                  : "Burn rate % by day 20"}
              </Label>
              <Input
                type="number"
                placeholder={ruleType === "user_threshold" ? "3000" : "80"}
                value={threshold}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setThreshold(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate} disabled={creating || !threshold} className="gap-2">
                <Bell className="w-3.5 h-3.5" />
                {creating ? "Creating..." : "Create rule"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active rules */}
      <div>
        <h2 className="text-lg font-semibold text-black mb-4 dark:text-white">Active Rules</h2>
        {loading ? (
          <p className="text-neutral-500 text-sm">Loading...</p>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-3 dark:text-neutral-600" />
              <p className="text-sm text-neutral-500">No alert rules configured yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      alert.rule_type === "user_threshold"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        : "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
                    }`}>
                      {alert.rule_type === "user_threshold" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {alert.rule_type === "user_threshold"
                          ? `Alert when any user exceeds ${alert.threshold_value.toLocaleString()} credits`
                          : `Alert when burn rate exceeds ${alert.threshold_value}% before day 20`}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5 dark:text-neutral-500">
                        Created {alert.created_at ? new Date(alert.created_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">
                      {SCOPE_LABELS[(alert as AlertRule & { scope?: ScopeType }).scope || "team"]}
                    </Badge>
                    <Badge variant={alert.is_active ? "default" : "secondary"} className="text-xs">
                      {alert.is_active ? "Active" : "Paused"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => alert.id && handleDelete(alert.id)}
                      className="text-neutral-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-neutral-400">
            Alerts are sent via email using Resend. Configure your Resend API key in environment variables
            to enable email delivery. In demo mode, alerts are stored locally.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
