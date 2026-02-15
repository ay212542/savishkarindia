import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Newspaper, ChevronRight, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
}

export function NewsList() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const { data, error } = await supabase
                .from("news")
                .select("*")
                .eq("is_published", true)
                .order("created_at", { ascending: false })
                .limit(5); // Fetch latest 5 items

            if (error) throw error;
            setNews(data || []);
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (news.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No news updates at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {news.map((item) => (
                <Dialog key={item.id}>
                    <DialogTrigger asChild>
                        <div
                            className="group flex gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-accent"
                            onClick={() => setSelectedNews(item)}
                        >
                            {/* Thumbnail */}
                            <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden bg-muted/30">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Newspaper className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>

                            {/* Content Preview */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                    <h4 className="font-semibold text-base leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {item.content}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                    <span className="text-xs font-medium text-primary flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        Read More <ChevronRight className="w-3 h-3 ml-0.5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </DialogTrigger>

                    <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                        <DialogHeader className="mb-2">
                            {/* Optional: Add a close button or header actions if needed, defaults are fine */}
                        </DialogHeader>
                        <ScrollArea className="flex-1 pr-4 -mr-4">
                            <div className="space-y-4">
                                {item.image_url && (
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full max-h-[400px] object-cover rounded-lg border border-border/50"
                                    />
                                )}

                                <div>
                                    <h2 className="text-2xl font-display font-bold mb-2">{item.title}</h2>
                                    <p className="text-sm text-muted-foreground mb-4 border-b border-border pb-2">
                                        Published on {new Date(item.created_at).toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>

                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <p className="whitespace-pre-line leading-relaxed text-base">
                                            {item.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            ))}
        </div>
    );
}
