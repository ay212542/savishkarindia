
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Loader2, Calendar, Newspaper, ChevronRight, X, PlayCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface MediaItem {
    type: "image" | "video";
    url: string;
}

interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    media: MediaItem[] | null;
    created_at: string;
}

export default function News() {
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
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Transform data to match NewsItem interface
            // The 'media' column from JSONB needs to be cast
            const formattedData: NewsItem[] = (data || []).map(item => ({
                ...item,
                media: item.media ? (item.media as any as MediaItem[]) : null
            }));

            setNews(formattedData);
        } catch (error) {
            console.error("Error fetching news:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-16">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient-gold mb-4">
                            Latest News & Updates
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Stay informed about the latest events, announcements, and achievements from Savishkar India.
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-20 bg-card/30 rounded-2xl border border-border/50">
                            <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="text-xl font-semibold text-muted-foreground">No news updates available.</h3>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {news.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 overflow-hidden flex flex-col">
                                                {/* Thumbnail */}
                                                <div className="aspect-video relative overflow-hidden bg-muted">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Newspaper className="w-12 h-12 text-muted-foreground/30" />
                                                        </div>
                                                    )}

                                                    {/* Media Indicator */}
                                                    {item.media && item.media.length > 0 && (
                                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                            <ImageIcon className="w-3 h-3" />
                                                            {item.media.length + (item.image_url ? 1 : 0)}
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                                    <div className="absolute bottom-3 left-3 right-3">
                                                        <div className="flex items-center text-xs text-white/80 mb-1">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {new Date(item.created_at).toLocaleDateString(undefined, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <CardContent className="p-5 flex-1 flex flex-col">
                                                    <h3 className="font-display font-bold text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                                                        {item.content}
                                                    </p>
                                                    <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center text-sm font-medium text-primary">
                                                        Read Full Story
                                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </DialogTrigger>

                                        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-border">
                                            <div className="relative flex-1 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto">
                                                {/* content Scroll Area */}
                                                <ScrollArea className="flex-1 h-full max-h-[90vh]">
                                                    <div className="p-6 md:p-8 space-y-6">
                                                        <div>
                                                            <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-4">
                                                                {item.title}
                                                            </h2>
                                                            <div className="flex items-center text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
                                                                <Calendar className="w-4 h-4 mr-2" />
                                                                {new Date(item.created_at).toLocaleDateString(undefined, {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </div>

                                                            {/* Content */}
                                                            <div className="prose prose-lg dark:prose-invert max-w-none">
                                                                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                                                                    {item.content}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Media Gallery */}
                                                        <div className="space-y-4 pt-6">
                                                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                                                <ImageIcon className="w-5 h-5 text-primary" />
                                                                Gallery
                                                            </h4>

                                                            <div className="grid grid-cols-1 gap-4">
                                                                {/* Main Image */}
                                                                {item.image_url && (
                                                                    <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm">
                                                                        <img
                                                                            src={item.image_url}
                                                                            alt={item.title}
                                                                            className="w-full h-auto object-contain max-h-[600px] bg-black/5"
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Extra Media */}
                                                                {item.media?.map((media, idx) => (
                                                                    <div key={idx} className="rounded-xl overflow-hidden border border-border/50 shadow-sm bg-black/5">
                                                                        {media.type === 'video' ? (
                                                                            <video
                                                                                src={media.url}
                                                                                controls
                                                                                className="w-full h-auto max-h-[600px]"
                                                                            />
                                                                        ) : (
                                                                            <img
                                                                                src={media.url}
                                                                                alt={`Gallery ${idx + 1}`}
                                                                                className="w-full h-auto object-contain max-h-[600px]"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
