
import { useEffect, useState } from "react";
import { MessageSquare, Calendar, User, Search, Trash2, Bot } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatLog {
    id: string;
    user_name: string | null;
    message: string;
    ai_response: string;
    created_at: string;
}

export default function ChatHistory() {
    const [logs, setLogs] = useState<ChatLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        const { data, error } = await supabase
            .from("ai_chat_logs")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching logs:", error);
        } else {
            setLogs(data || []);
        }
        setLoading(false);
    }

    const filteredLogs = logs.filter(
        (log) =>
            log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
            log.message.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-display text-2xl font-bold">AI Chat History</h1>
                    <p className="text-muted-foreground">Monitor conversations with the AI Assistant</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search chats..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <p className="text-center text-muted-foreground">Loading history...</p>
                ) : filteredLogs.length === 0 ? (
                    <GlassCard className="text-center py-10">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p>No chat history found.</p>
                    </GlassCard>
                ) : (
                    filteredLogs.map((log) => (
                        <GlassCard key={log.id} className="p-4">
                            <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="gap-1">
                                                <User className="w-3 h-3" />
                                                {log.user_name || "Guest"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-3 rounded-lg rounded-tl-none">
                                        <p className="text-sm font-medium text-foreground">{log.message}</p>
                                    </div>

                                    <div className="flex gap-2 items-start">
                                        <Bot className="w-4 h-4 text-primary mt-1" />
                                        <div className="bg-primary/10 p-3 rounded-lg rounded-tl-none flex-1">
                                            <p className="text-sm text-foreground/90">{log.ai_response}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
}
