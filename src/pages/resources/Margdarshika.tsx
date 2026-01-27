import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Download, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function Margdarshika() {
    const [guides, setGuides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchGuides() {
            const { data } = await supabase.from("guides").select("*").eq("visible", true).order("updated_at", { ascending: false });
            if (data) setGuides(data);
            setLoading(false);
        }
        fetchGuides();
    }, []);

    return (
        <Layout>
            <AnimatedBackground />
            <div className="container mx-auto px-4 py-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-display text-4xl font-bold mb-4">Savishkar <span className="text-primary">Margdarshika</span></h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Operational guides, handbooks, and policy documents for Savishkar India members and leaders.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {guides.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <GlassCard className="h-full flex flex-col p-6 hover:border-primary/40 transition-all group">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6 text-orange-500" />
                                </div>

                                <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground mb-6 flex-grow">
                                    Official guide document. Click below to view or download.
                                </p>

                                <Button className="w-full gap-2 glow-button-orange" asChild>
                                    <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                                        <Download className="w-4 h-4" /> Download PDF
                                    </a>
                                </Button>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {!loading && guides.length === 0 && (
                    <GlassCard className="max-w-lg mx-auto text-center py-12">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold">Coming Soon</h3>
                        <p className="text-muted-foreground">The Margdarshika section is currently being updated.</p>
                    </GlassCard>
                )}
            </div>
        </Layout>
    );
}
