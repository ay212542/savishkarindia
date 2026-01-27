import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Story {
    id: string;
    title: string | null;
    media_url: string;
    media_type: "image" | "video";
    created_at: string;
}

export default function StoryViewer() {
    const [stories, setStories] = useState<Story[]>([]);
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

    useEffect(() => {
        async function fetchStories() {
            const { data } = await supabase
                .from("stories")
                .select("*")
                .eq("visible", true)
                .order("created_at", { ascending: false });

            if (data) setStories(data as any);
        }
        fetchStories();
    }, []);

    const openStory = (index: number) => setActiveStoryIndex(index);
    const closeStory = () => setActiveStoryIndex(null);

    const nextStory = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (activeStoryIndex === null) return;
        if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
        } else {
            closeStory();
        }
    };

    const prevStory = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (activeStoryIndex === null) return;
        if (activeStoryIndex > 0) {
            setActiveStoryIndex(activeStoryIndex - 1);
        }
    };

    if (stories.length === 0) return null;

    const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-4 px-4 min-w-max">
                {stories.map((story, index) => (
                    <button
                        key={story.id}
                        onClick={() => openStory(index)}
                        className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
                    >
                        <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600 group-hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full border-2 border-background overflow-hidden relative bg-muted">
                                {story.media_type === "video" ? (
                                    <video src={story.media_url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={story.media_url} alt="" className="w-full h-full object-cover" />
                                )}
                            </div>
                        </div>
                        <span className="text-xs font-medium max-w-[70px] truncate">
                            {story.title || "Story"}
                        </span>
                    </button>
                ))}
            </div>

            <Dialog open={activeStoryIndex !== null} onOpenChange={(open) => !open && closeStory()}>
                <DialogContent className="max-w-md p-0 border-none bg-black/90 text-white h-[80vh] flex flex-col overflow-hidden sm:rounded-xl">
                    {activeStory && (
                        <div className="relative flex-1 flex items-center justify-center bg-black w-full h-full" onClick={nextStory}>
                            <div className="absolute top-0 left-0 w-full p-2 z-10 flex gap-1">
                                {stories.map((_, i) => (
                                    <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full bg-white transition-all duration-300",
                                                i < (activeStoryIndex || 0) ? "w-full" :
                                                    i === activeStoryIndex ? "w-full animate-progress" : "w-0" // simplified progress
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[1px]">
                                    <img src="/favicon.ico" className="w-full h-full rounded-full bg-black object-cover" alt="" />
                                </div>
                                <span className="font-semibold text-sm">Savishkar India</span>
                                <span className="text-xs text-white/60">
                                    {new Date(activeStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="w-full h-full flex items-center justify-center">
                                {activeStory.media_type === "video" ? (
                                    <video src={activeStory.media_url} autoPlay playsInline className="max-h-full max-w-full" />
                                ) : (
                                    <img src={activeStory.media_url} alt="" className="max-h-full max-w-full object-contain" />
                                )}
                            </div>

                            {activeStory.title && (
                                <div className="absolute bottom-0 w-full p-6 text-center bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-sm font-medium">{activeStory.title}</p>
                                </div>
                            )}

                            {/* Navigation Controls */}
                            <button onClick={prevStory} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white z-20">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button onClick={nextStory} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white z-20">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
