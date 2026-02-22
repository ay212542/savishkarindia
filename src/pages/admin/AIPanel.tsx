import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Sparkles, Wand2, Languages, FileText, AlertTriangle,
  CheckCircle, Loader2, RefreshCw, Lightbulb, Send, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiagnosticResult {
  type: "success" | "warning" | "error";
  title: string;
  description: string;
  action?: string;
}

export default function AIPanel() {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");
  const [action, setAction] = useState("generate_content");
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const { toast } = useToast();

  async function runAI() {
    if ((!prompt.trim() && action.includes("generate")) || (!content.trim() && !action.includes("generate") && action !== "diagnostics")) {
      toast({ title: "Error", description: "Please provide input", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({ action, prompt, content })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI request failed");
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error("AI error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "AI request failed",
        variant: "destructive"
      });
    }

    setLoading(false);
  }

  async function runDiagnostics() {
    setRunningDiagnostics(true);
    setDiagnostics([]);

    const results: DiagnosticResult[] = [];

    try {
      // Check for pending applications
      const { count: pendingApps } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (pendingApps && pendingApps > 0) {
        results.push({
          type: "warning",
          title: `${pendingApps} Pending Applications`,
          description: "There are membership applications waiting for review.",
          action: "Go to Approval Center"
        });
      } else {
        results.push({
          type: "success",
          title: "No Pending Applications",
          description: "All applications have been processed."
        });
      }

      // Check for draft events
      const { count: draftEvents } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_published", false);

      if (draftEvents && draftEvents > 0) {
        results.push({
          type: "warning",
          title: `${draftEvents} Unpublished Programs`,
          description: "Some programs are still in draft mode.",
          action: "Review Programs"
        });
      }

      // Check for inactive announcements
      const { count: inactiveAnnouncements } = await supabase
        .from("announcements")
        .select("*", { count: "exact", head: true })
        .eq("is_active", false);

      if (inactiveAnnouncements && inactiveAnnouncements > 0) {
        results.push({
          type: "warning",
          title: `${inactiveAnnouncements} Inactive Announcements`,
          description: "Some announcements are currently hidden from members."
        });
      }

      // Check member count
      const { count: memberCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      results.push({
        type: "success",
        title: `${memberCount || 0} Registered Members`,
        description: "Total members in the system."
      });

      // Check CMS blocks
      const { data: cmsBlocks } = await supabase
        .from("cms_blocks")
        .select("section");

      const sections = ["hero", "about", "mission", "vision", "contact"];
      const missingSections = sections.filter(s => !cmsBlocks?.some(b => b.section === s));

      if (missingSections.length > 0) {
        results.push({
          type: "warning",
          title: "Missing CMS Content",
          description: `Sections without content: ${missingSections.join(", ")}`,
          action: "Update CMS"
        });
      } else {
        results.push({
          type: "success",
          title: "CMS Content Complete",
          description: "All website sections have content configured."
        });
      }

      // Use AI for additional insights
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            action: "diagnostics",
            prompt: {
              pendingApps,
              draftEvents,
              memberCount,
              inactiveAnnouncements,
              missingSections
            }
          })
        }
      );

      if (response.ok) {
        const aiData = await response.json();
        results.push({
          type: "success",
          title: "AI Insights",
          description: aiData.result.substring(0, 200) + "..."
        });
      }

    } catch (error) {
      console.error("Diagnostics error:", error);
      results.push({
        type: "error",
        title: "Diagnostics Error",
        description: "Failed to complete system diagnostics"
      });
    }

    setDiagnostics(results);
    setRunningDiagnostics(false);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(result);
    toast({ title: "Copied to clipboard" });
  }

  const aiTools = [
    { value: "generate_content", label: "Generate Content", icon: Sparkles },
    { value: "rewrite_professional", label: "Rewrite Professional", icon: Wand2 },
    { value: "translate", label: "Translate", icon: Languages },
    { value: "generate_announcement", label: "Generate Announcement", icon: FileText },
    { value: "generate_event_description", label: "Event Description", icon: FileText },
    { value: "fix_grammar", label: "Fix Grammar", icon: CheckCircle },
    { value: "suggest_layout", label: "Layout Suggestions", icon: Lightbulb },
    { value: "generate_insights", label: "Program Insights", icon: Lightbulb },
    { value: "generate_dashboard", label: "Refresh Member Dashboard", icon: Sparkles },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Bot className="w-7 h-7 text-primary" />
          AI Maintenance Panel
        </h1>
        <p className="text-muted-foreground">System diagnostics, content analysis, and AI-powered tools</p>
      </div>

      <Tabs defaultValue="diagnostics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
          <TabsTrigger value="tools">AI Tools</TabsTrigger>
        </TabsList>

        {/* Diagnostics Tab */}
        <TabsContent value="diagnostics" className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-semibold text-lg">System Health Check</h3>
                <p className="text-sm text-muted-foreground">Run diagnostics to identify issues and improvements</p>
              </div>
              <Button onClick={runDiagnostics} disabled={runningDiagnostics} className="gap-2">
                {runningDiagnostics ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Run Diagnostics
              </Button>
            </div>

            {diagnostics.length === 0 && !runningDiagnostics ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Click "Run Diagnostics" to analyze your system</p>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnostics.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 rounded-lg border ${result.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : result.type === "warning"
                        ? "bg-amber-500/10 border-amber-500/20"
                        : "bg-destructive/10 border-destructive/20"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.type === "success" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                      ) : result.type === "warning" ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{result.title}</h4>
                        <p className="text-sm text-muted-foreground">{result.description}</p>
                        {result.action && (
                          <Button variant="link" className="p-0 h-auto text-primary mt-1">
                            {result.action} →
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* AI Tools Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <GlassCard>
              <h3 className="font-display font-semibold text-lg mb-4">AI Assistant</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Select Tool</label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiTools.map(tool => (
                        <SelectItem key={tool.value} value={tool.value}>
                          <div className="flex items-center gap-2">
                            <tool.icon className="w-4 h-4" />
                            {tool.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {action.includes("generate") || action === "suggest_layout" ? (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Prompt</label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what you want to generate..."
                      rows={5}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Content</label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste content to process..."
                      rows={5}
                    />
                  </div>
                )}

                <Button onClick={runAI} disabled={loading} className="w-full gap-2">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loading ? "Processing..." : "Run AI"}
                </Button>
              </div>
            </GlassCard>

            {/* Output Section */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg">Result</h3>
                {result && (
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="gap-2">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                )}
              </div>

              {result ? (
                <div className="p-4 rounded-lg bg-muted/30 min-h-[200px] whitespace-pre-wrap text-sm">
                  {result}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>AI-generated content will appear here</p>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Quick Actions */}
          <GlassCard>
            <h3 className="font-display font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAction("generate_content");
                  setPrompt("Write an engaging hero section headline and subtitle for SAVISHKAR, emphasizing youth innovation and national leadership");
                }}
              >
                Generate Hero Content
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAction("generate_announcement");
                  setPrompt("Create an announcement about an upcoming national youth innovation summit");
                }}
              >
                Draft Summit Announcement
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAction("generate_event_description");
                  setPrompt("Write a description for a weekend startup bootcamp for college students");
                }}
              >
                Bootcamp Description
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAction("generate_insights");
                  setPrompt("Generate impact analysis for a hackathon with 500 participants across 50 teams");
                }}
              >
                Hackathon Insights
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={() => {
                  setAction("generate_dashboard");
                  setPrompt("Generate a welcoming dashboard update for National Science Day, featuring an upcoming science fair");
                }}
              >
                Refresh Member Dashboard
              </Button>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
