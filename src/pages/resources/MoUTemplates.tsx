import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Download, FileText, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function MoUTemplates() {
    const [educational, setEducational] = useState<any[]>([]);
    const [nonEducational, setNonEducational] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const { data } = await supabase.from("mou_templates").select("*").eq("visible", true);
            if (data) {
                setEducational(data.filter(d => d.category === 'educational'));
                setNonEducational(data.filter(d => d.category === 'non-educational'));
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    return (
        <Layout>
            <AnimatedBackground />
            <div className="container mx-auto px-4 py-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="font-display text-4xl font-bold mb-4">MoU Templates</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Standardized Memorandum of Understanding templates for chapters and partners.
                    </p>
                </motion.div>

                <Tabs defaultValue="educational" className="max-w-4xl mx-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="educational">Educational Institutions</TabsTrigger>
                        <TabsTrigger value="others">Other Organizations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="educational" className="mt-8 grid md:grid-cols-2 gap-4">
                        {educational.map((item, i) => (
                            <GlassCard key={item.id} className="p-6 flex items-start gap-4 hover:border-primary/50 transition-colors">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <FileText className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-4">Educational Partnership</p>
                                    <Button size="sm" variant="outline" className="w-full gap-2" asChild>
                                        <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                                            <Download className="w-4 h-4" /> Download Template
                                        </a>
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                        {educational.length === 0 && !loading && (
                            <div className="col-span-2 text-center py-12 text-muted-foreground">No templates available yet.</div>
                        )}
                    </TabsContent>

                    <TabsContent value="others" className="mt-8 grid md:grid-cols-2 gap-4">
                        {nonEducational.map((item, i) => (
                            <GlassCard key={item.id} className="p-6 flex items-start gap-4 hover:border-accent/50 transition-colors">
                                <div className="p-3 bg-accent/10 rounded-xl">
                                    <Globe className="w-6 h-6 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-4">Organization Partnership</p>
                                    <Button size="sm" variant="outline" className="w-full gap-2" asChild>
                                        <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                                            <Download className="w-4 h-4" /> Download Template
                                        </a>
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                        {nonEducational.length === 0 && !loading && (
                            <div className="col-span-2 text-center py-12 text-muted-foreground">No templates available yet.</div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}
