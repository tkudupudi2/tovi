"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wind, Bot, GitBranch, CheckCircle2, Key } from "lucide-react";

interface Connection {
  tool: string;
  label: string;
  icon: React.ReactNode;
  connected: boolean;
  placeholder: string;
  key: string;
}

export default function SettingsPage() {
  const [connections, setConnections] = useState<Connection[]>([
    {
      tool: "windsurf",
      label: "Windsurf",
      icon: <Wind className="w-5 h-5" />,
      connected: true,
      placeholder: "ws_admin_xxxxxxxxxxxxxxxx",
      key: "",
    },
    {
      tool: "anthropic",
      label: "Anthropic (Claude)",
      icon: <Bot className="w-5 h-5" />,
      connected: true,
      placeholder: "sk-ant-xxxxxxxxxxxxxxxx",
      key: "",
    },
    {
      tool: "copilot",
      label: "GitHub Copilot",
      icon: <GitBranch className="w-5 h-5" />,
      connected: false,
      placeholder: "ghp_xxxxxxxxxxxxxxxx",
      key: "",
    },
  ]);

  const [saving, setSaving] = useState(false);

  const updateKey = (index: number, value: string) => {
    setConnections((prev) =>
      prev.map((c, i) => (i === index ? { ...c, key: value } : c))
    );
  };

  const handleSave = async (index: number) => {
    setSaving(true);
    // In production, this would call the API to update the connection
    setTimeout(() => {
      setConnections((prev) =>
        prev.map((c, i) => (i === index ? { ...c, connected: true, key: "" } : c))
      );
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
          Manage your tool connections and organization settings
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-black mb-4 dark:text-white">Connected Tools</h2>
        <div className="space-y-3">
          {connections.map((conn, i) => (
            <Card key={conn.tool}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {conn.icon}
                    </div>
                    <div>
                      <CardTitle className="text-sm">{conn.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {conn.connected ? "Connected and syncing" : "Not connected"}
                      </CardDescription>
                    </div>
                  </div>
                  {conn.connected ? (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-neutral-400 dark:text-neutral-500">
                      Disconnected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="sr-only">API Key</Label>
                    <Input
                      type="password"
                      placeholder={conn.connected ? "••••••••••••" : conn.placeholder}
                      value={conn.key}
                      onChange={(e) => updateKey(i, e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    disabled={!conn.key || saving}
                    onClick={() => handleSave(i)}
                    className="gap-2"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {conn.connected ? "Update" : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-neutral-400">
            API keys are encrypted before storage. In demo mode, connections are simulated.
            Windsurf integration uses mock data — no public API is available yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
