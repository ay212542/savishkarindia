import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Lightbulb, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function Support() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Ticket Form
    const [ticketSubject, setTicketSubject] = useState("");
    const [ticketMessage, setTicketMessage] = useState("");

    // Idea Form
    const [ideaTitle, setIdeaTitle] = useState("");
    const [ideaDesc, setIdeaDesc] = useState("");

    async function handleSubmitTicket(e: React.FormEvent) {
        e.preventDefault();
        if (!ticketSubject || !ticketMessage) return;

        setLoading(true);
        try {
            const { error } = await supabase.from("support_tickets").insert({
                user_id: user?.id,
                full_name: profile?.full_name || "Guest",
                email: profile?.email || "No Email",
                subject: ticketSubject,
                message: ticketMessage
            });

            if (error) throw error;

            setSuccess(true);
            toast({ title: "Ticket Submitted", description: "Assessment team will review your query." });
            setTicketSubject("");
            setTicketMessage("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        setLoading(false);
    }

    async function handleSubmitIdea(e: React.FormEvent) {
        e.preventDefault();
        if (!ideaTitle || !ideaDesc) return;

        setLoading(true);
        try {
            const { error } = await supabase.from("ideas").insert({
                user_id: user?.id,
                full_name: profile?.full_name || "Guest",
                title: ideaTitle,
                description: ideaDesc
            });

            if (error) throw error;

            setSuccess(true);
            toast({ title: "Idea Submitted", description: "Thank you for your innovation!" });
            setIdeaTitle("");
            setIdeaDesc("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        setLoading(false);
    }

    if (success) {
        return (
            <Layout>
                <div className="min-h-[80vh] flex items-center justify-center container mx-auto px-4">
                    <GlassCard className="max-w-md w-full text-center py-12">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Submission Received</h2>
                        <p className="text-muted-foreground mb-6">
                            Our team has received your request and will get back to you soon.
                        </p>
                        <Button onClick={() => setSuccess(false)}>Submit Another</Button>
                    </GlassCard>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-24">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                            Help Center & Innovation Hub
                        </h1>
                        <p className="text-muted-foreground">
                            Need assistance or have a brilliant idea? We're here to listen.
                        </p>
                    </div>

                    <GlassCard>
                        <Tabs defaultValue="help" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-8">
                                <TabsTrigger value="help" className="gap-2">
                                    <MessageSquare className="w-4 h-4" /> Need Help
                                </TabsTrigger>
                                <TabsTrigger value="idea" className="gap-2">
                                    <Lightbulb className="w-4 h-4" /> Submit Idea
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="help">
                                <form onSubmit={handleSubmitTicket} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Subject</label>
                                        <Input
                                            placeholder="Login Issue, Membership Question..."
                                            value={ticketSubject}
                                            onChange={e => setTicketSubject(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Message</label>
                                        <Textarea
                                            placeholder="Describe your issue in detail..."
                                            rows={5}
                                            value={ticketMessage}
                                            onChange={e => setTicketMessage(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                        Submit Request
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="idea">
                                <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                    <h3 className="font-semibold flex items-center gap-2 mb-1">
                                        <Lightbulb className="w-4 h-4 text-primary" />
                                        Share Your Innovation
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Directly reach the Super Controller. Pitch your startup idea, community project, or platform improvement.
                                    </p>
                                </div>
                                <form onSubmit={handleSubmitIdea} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Title</label>
                                        <Input
                                            placeholder="Project Name / Idea Title"
                                            value={ideaTitle}
                                            onChange={e => setIdeaTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block">Description</label>
                                        <Textarea
                                            placeholder="Explain your idea, impact, and requirements..."
                                            rows={6}
                                            value={ideaDesc}
                                            onChange={e => setIdeaDesc(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full glow-button-teal" disabled={loading}>
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                        Submit Idea to Super Controller
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </GlassCard>
                </div>
            </div>
        </Layout>
    );
}
