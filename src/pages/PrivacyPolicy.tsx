import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PolicyContent {
  title: string;
  content: string;
  last_updated: string;
}

export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState<PolicyContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPolicy() {
      const { data } = await supabase
        .from("cms_blocks")
        .select("content")
        .eq("section", "privacy_policy")
        .single();

      if (data?.content) {
        const content = data.content as Record<string, any>;
        setPolicy({
          title: content.title || "Privacy Policy",
          content: content.content || "",
          last_updated: content.last_updated || ""
        });
      }
      setLoading(false);
    }

    fetchPolicy();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <GlassCard className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-4">{policy?.title || "Privacy Policy"}</h1>
          {policy?.last_updated && (
            <p className="text-muted-foreground text-sm mb-6">
              Last updated: {new Date(policy.last_updated).toLocaleDateString("en-IN")}
            </p>
          )}
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {policy?.content || "Privacy policy content will be available soon."}
            </p>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
