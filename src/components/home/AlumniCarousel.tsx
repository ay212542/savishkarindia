import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Alumni {
    id: string;
    full_name: string;
    photo_url: string | null;
    journey_text: string | null;
    achievements: string | null;
    linkedin_url: string | null;
    instagram_url: string | null;
}

export default function AlumniCarousel() {
    const [alumni, setAlumni] = useState<Alumni[]>([]);

    useEffect(() => {
        async function fetchAlumni() {
            // Fetch from profiles where is_alumni is true
            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("is_alumni", true)
                .order("created_at", { ascending: false });

            if (data && data.length > 0) {
                // Map to Alumni interface
                const mappedAlumni: Alumni[] = data.map((p: any) => ({
                    id: p.id,
                    full_name: p.full_name,
                    photo_url: p.avatar_url, // Map avatar_url to photo_url
                    journey_text: p.journey_text || p.bio || "Inspiring journey...", // Fallback
                    achievements: p.achievements_list || p.designation, // Fallback
                    linkedin_url: p.linkedin_url,
                    instagram_url: p.instagram_url
                }));
                setAlumni(mappedAlumni);
            }
        }
        fetchAlumni();
    }, []);

    if (alumni.length === 0) return null;

    return (
        <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-display font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-3">Our Alumni Network</h2>
                    <p className="text-lg text-cyan-300 font-medium">Stories of impact and leadership from Savishkar India alumni</p>
                </div>

                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full max-w-5xl mx-auto"
                >
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {alumni.map((alum) => (
                            <CarouselItem key={alum.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                                <div className="p-1 h-full">
                                    <Card className="h-full border-none shadow-md hover:shadow-lg transition-all duration-300">
                                        <CardContent className="flex flex-col items-center text-center p-6 h-full">
                                            <div className="relative w-24 h-24 mb-4">
                                                <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse-slow" />
                                                <img
                                                    src={alum.photo_url || "/placeholder.svg"}
                                                    alt={alum.full_name}
                                                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-sm"
                                                />
                                                <div className="absolute -bottom-2 right-0 bg-white rounded-full p-1 shadow-sm">
                                                    <Quote className="w-4 h-4 text-primary fill-primary/20" />
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-lg mb-1">{alum.full_name}</h3>
                                            {alum.achievements && (
                                                <p className="text-xs font-medium text-primary mb-3 bg-primary/5 px-2 py-1 rounded-full">{alum.achievements.split(',')[0]}</p>
                                            )}

                                            <p className="text-sm text-muted-foreground line-clamp-4 mb-4 flex-grow italic">
                                                "{alum.journey_text}"
                                            </p>

                                            <div className="flex gap-2 mt-auto">
                                                {alum.linkedin_url && (
                                                    <a href={alum.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                            <Linkedin className="w-4 h-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                                {alum.instagram_url && (
                                                    <a href={alum.instagram_url} target="_blank" rel="noopener noreferrer">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-pink-600 hover:text-pink-700 hover:bg-pink-50">
                                                            <Instagram className="w-4 h-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex -left-12" />
                    <CarouselNext className="hidden md:flex -right-12" />
                </Carousel>
            </div>
        </section>
    );
}
