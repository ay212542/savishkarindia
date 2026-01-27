import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, Lightbulb, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SupportInbox() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [ideas, setIdeas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const { data: t } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
        const { data: i } = await supabase.from("ideas").select("*").order("created_at", { ascending: false });

        if (t) setTickets(t);
        if (i) setIdeas(i);
        setLoading(false);
    }

    async function updateStatus(table: "support_tickets" | "ideas", id: string, status: string) {
        const { error } = await supabase.from(table).update({ status }).eq("id", id);
        if (!error) {
            toast({ title: "Status Updated" });
            fetchData();
        }
    }

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold">Support & Innovation Inbox</h1>
                    <p className="text-muted-foreground">Manage help requests and idea submissions</p>
                </div>
            </div>

            <Tabs defaultValue="tickets" className="w-full">
                <TabsList>
                    <TabsTrigger value="tickets" className="gap-2">
                        <MessageSquare className="w-4 h-4" /> Support Tickets ({tickets.filter(t => t.status === 'open').length})
                    </TabsTrigger>
                    <TabsTrigger value="ideas" className="gap-2">
                        <Lightbulb className="w-4 h-4" /> Ideas ({ideas.filter(i => i.status === 'new').length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tickets" className="space-y-4 mt-6">
                    {tickets.length === 0 && <p className="text-center text-muted-foreground">No tickets yet.</p>}
                    {tickets.map(ticket => (
                        <GlassCard key={ticket.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                                    <p className="text-sm text-muted-foreground">From: {ticket.full_name}</p>
                                </div>
                                <Badge variant={ticket.status === 'open' ? "destructive" : "outline"}>{ticket.status}</Badge>
                            </div>
                            <p className="text-sm bg-muted/30 p-3 rounded-lg my-3">{ticket.message}</p>
                            <div className="flex gap-2">
                                {ticket.status === 'open' && (
                                    <Button size="sm" onClick={() => updateStatus("support_tickets", ticket.id, "resolved")}>
                                        Mark Resolved
                                    </Button>
                                )}
                                <span className="text-xs text-muted-foreground mt-2 ml-auto">
                                    {new Date(ticket.created_at).toLocaleString()}
                                </span>
                            </div>
                        </GlassCard>
                    ))}
                </TabsContent>

                <TabsContent value="ideas" className="space-y-4 mt-6">
                    {ideas.length === 0 && <p className="text-center text-muted-foreground">No ideas yet.</p>}
                    {ideas.map(idea => (
                        <GlassCard key={idea.id} className="p-4 border-l-4 border-l-primary">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-lg">{idea.title}</h3>
                                    <p className="text-sm text-muted-foreground">By: {idea.full_name}</p>
                                </div>
                                <Badge variant={idea.status === 'new' ? "default" : "secondary"}>{idea.status}</Badge>
                            </div>
                            <p className="text-sm bg-muted/30 p-3 rounded-lg my-3 whitespace-pre-wrap">{idea.description}</p>
                            <div className="flex gap-2">
                                {idea.status === 'new' && (
                                    <Button size="sm" onClick={() => updateStatus("ideas", idea.id, "reviewed")}>
                                        Mark Reviewed
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => updateStatus("ideas", idea.id, "shortlisted")}>
                                    Shortlist
                                </Button>
                                <span className="text-xs text-muted-foreground mt-2 ml-auto">
                                    {new Date(idea.created_at).toLocaleString()}
                                </span>
                            </div>
                        </GlassCard>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
