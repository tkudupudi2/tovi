"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Wind, Bot, GitBranch, Plus, X, Users, Building2 } from "lucide-react";

interface ToolConnection {
  tool_name: string;
  label: string;
  placeholder: string;
  description: string;
  icon: React.ReactNode;
  api_key: string;
}

interface TeamDef {
  id: string;
  name: string;
  level: "department" | "team";
  parentId: string | null;
}

interface InviteMember {
  email: string;
  role: "vp" | "director" | "manager" | "member";
  teamId: string | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [connections, setConnections] = useState<ToolConnection[]>([
    {
      tool_name: "windsurf",
      label: "Windsurf",
      placeholder: "ws_admin_xxxxxxxxxxxxxxxx",
      description: "Enter your Windsurf admin API key",
      icon: <Wind className="w-5 h-5" />,
      api_key: "",
    },
    {
      tool_name: "anthropic",
      label: "Anthropic (Claude)",
      placeholder: "sk-ant-xxxxxxxxxxxxxxxx",
      description: "Enter your Anthropic API key",
      icon: <Bot className="w-5 h-5" />,
      api_key: "",
    },
    {
      tool_name: "copilot",
      label: "GitHub Copilot",
      placeholder: "ghp_xxxxxxxxxxxxxxxx",
      description: "Enter your GitHub org token",
      icon: <GitBranch className="w-5 h-5" />,
      api_key: "",
    },
  ]);

  const [teams, setTeams] = useState<TeamDef[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamParent, setNewTeamParent] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteMember[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRole, setNewInviteRole] = useState<InviteMember["role"]>("member");
  const [newInviteTeam, setNewInviteTeam] = useState<string | null>(null);

  const updateKey = (index: number, value: string) => {
    setConnections((prev) =>
      prev.map((c, i) => (i === index ? { ...c, api_key: value } : c))
    );
  };

  const addDepartment = () => {
    if (!newDeptName.trim()) return;
    const id = `dept-${Date.now()}`;
    setTeams((prev) => [...prev, { id, name: newDeptName.trim(), level: "department", parentId: null }]);
    setNewDeptName("");
  };

  const addTeam = () => {
    if (!newTeamName.trim() || !newTeamParent) return;
    const id = `team-${Date.now()}`;
    setTeams((prev) => [...prev, { id, name: newTeamName.trim(), level: "team", parentId: newTeamParent }]);
    setNewTeamName("");
  };

  const removeTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id && t.parentId !== id));
  };

  const addInvite = () => {
    if (!newInviteEmail.trim()) return;
    setInvites((prev) => [...prev, { email: newInviteEmail.trim(), role: newInviteRole, teamId: newInviteTeam }]);
    setNewInviteEmail("");
    setNewInviteRole("member");
    setNewInviteTeam(null);
  };

  const removeInvite = (idx: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== idx));
  };

  const departments = teams.filter((t) => t.level === "department");

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: orgName,
          connections: connections
            .filter((c) => c.api_key)
            .map((c) => ({ tool_name: c.tool_name, api_key: c.api_key })),
        }),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">ToVi</span>
          </Link>

          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2, 3].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                {i > 0 && <div className="w-8 h-px bg-neutral-200 dark:bg-neutral-700" />}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= s ? "bg-black text-white dark:bg-white dark:text-black" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                }`}>
                  {s}
                </div>
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black">Name your organization</h1>
              <p className="text-sm text-neutral-500 mt-1">
                This is your team&apos;s workspace
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org">Organization name</Label>
              <Input
                id="org"
                placeholder="Acme Inc."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => setStep(2)}
              disabled={!orgName.trim()}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black">Connect your AI tools</h1>
              <p className="text-sm text-neutral-500 mt-1">
                Add API keys for the tools your team uses. You can skip and add later.
              </p>
            </div>

            <div className="space-y-3">
              {connections.map((conn, i) => (
                <Card key={conn.tool_name} className="border-neutral-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
                        {conn.icon}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{conn.label}</CardTitle>
                        <CardDescription className="text-xs">
                          {conn.description}
                        </CardDescription>
                      </div>
                      {conn.api_key && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Input
                      type="password"
                      placeholder={conn.placeholder}
                      value={conn.api_key}
                      onChange={(e) => updateKey(i, e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>

            <p className="text-xs text-neutral-400 text-center">
              API keys are encrypted and stored securely. You can add or remove connections anytime.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black dark:text-white">Set up your org</h1>
              <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
                Define departments, teams, and invite members
              </p>
            </div>

            {/* Department builder */}
            <div>
              <Label className="text-sm font-medium">Departments</Label>
              <p className="text-xs text-neutral-400 mb-2 dark:text-neutral-500">Top-level groups (e.g. Engineering, Product)</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Department name"
                  value={newDeptName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeptName(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && addDepartment()}
                />
                <Button variant="outline" size="sm" onClick={addDepartment} disabled={!newDeptName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {departments.length === 0 && (
                <p className="text-xs text-neutral-400 italic">No departments yet</p>
              )}
              <div className="space-y-1">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-md dark:bg-neutral-900">
                    <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-sm flex-1">{dept.name}</span>
                    <button onClick={() => removeTeam(dept.id)} className="text-neutral-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Team builder */}
            {departments.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Teams</Label>
                <p className="text-xs text-neutral-400 mb-2 dark:text-neutral-500">Teams within departments</p>
                <div className="flex gap-2 mb-2">
                  <select
                    className="flex h-9 w-32 rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm dark:border-neutral-800"
                    value={newTeamParent || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTeamParent(e.target.value || null)}
                  >
                    <option value="">Dept...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Team name"
                    value={newTeamName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamName(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && addTeam()}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addTeam} disabled={!newTeamName.trim() || !newTeamParent}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {teams.filter((t) => t.level === "team").map((team) => {
                    const parent = departments.find((d) => d.id === team.parentId);
                    return (
                      <div key={team.id} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-md ml-6 dark:bg-neutral-900">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-sm flex-1">{team.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{parent?.name}</Badge>
                        <button onClick={() => removeTeam(team.id)} className="text-neutral-400 hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Invite members */}
            <div>
              <Label className="text-sm font-medium">Invite Team Members</Label>
              <p className="text-xs text-neutral-400 mb-2 dark:text-neutral-500">Assign roles: VP, Director, Manager, or Member</p>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="email@company.com"
                  type="email"
                  value={newInviteEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  className="flex h-9 w-28 rounded-md border border-neutral-200 bg-transparent px-2 py-1 text-sm dark:border-neutral-800"
                  value={newInviteRole}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewInviteRole(e.target.value as InviteMember["role"])}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="director">Director</option>
                  <option value="vp">VP</option>
                </select>
                {teams.length > 0 && (
                  <select
                    className="flex h-9 w-28 rounded-md border border-neutral-200 bg-transparent px-2 py-1 text-sm dark:border-neutral-800"
                    value={newInviteTeam || ""}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewInviteTeam(e.target.value || null)}
                  >
                    <option value="">Team...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.level === "department" ? `🏢 ${t.name}` : `  └ ${t.name}`}</option>
                    ))}
                  </select>
                )}
                <Button variant="outline" size="sm" onClick={addInvite} disabled={!newInviteEmail.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {invites.length > 0 && (
                <div className="space-y-1">
                  {invites.map((inv, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-md dark:bg-neutral-900">
                      <span className="text-sm flex-1 font-mono">{inv.email}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">{inv.role}</Badge>
                      {inv.teamId && (
                        <Badge variant="outline" className="text-[10px]">
                          {teams.find((t) => t.id === inv.teamId)?.name}
                        </Badge>
                      )}
                      <button onClick={() => removeInvite(i)} className="text-neutral-400 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? "Setting up..." : "Launch dashboard"}
              </Button>
            </div>

            <p className="text-xs text-neutral-400 text-center dark:text-neutral-500">
              You can always modify your org structure later in Settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
