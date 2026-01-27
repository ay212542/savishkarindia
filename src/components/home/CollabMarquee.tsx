import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { supabase } from "@/integrations/supabase/client";

interface CollabLogo {
    id: string;
    title: string;
    logo_url: string;
    website_link: string | null;
}

export default function CollabMarquee() {
    const [logos, setLogos] = useState<CollabLogo[]>([]);

    useEffect(() => {
        async function fetchLogos() {
            const { data } = await supabase
                .from("collaboration_logos")
                .select("*")
                .eq("visible", true)
                .order("created_at", { ascending: false });

            if (data) setLogos(data);
        }
        fetchLogos();
    }, []);

    if (logos.length === 0) return null;

    return (
        <div className="py-16 bg-gradient-to-b from-background/50 to-background backdrop-blur-md border-y border-border/40 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="container mx-auto px-4 mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-primary inline-flex items-center gap-2">
                    In Collaboration With
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-2 rounded-full opacity-50" />
            </div>

            <Marquee gradient={true} gradientColor="hsl(var(--background))" speed={30} className="py-6">
                {logos.map((logo) => (
                    <div key={logo.id} className="mx-12 flex items-center justify-center transform transition-all duration-300 hover:scale-110 cursor-pointer">
                        {logo.website_link ? (
                            <a href={logo.website_link} target="_blank" rel="noopener noreferrer" title={logo.title} className="relative group">
                                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <img src={logo.logo_url} alt={logo.title} className="h-32 w-auto object-contain max-w-[250px] relative z-10 drop-shadow-sm hover:drop-shadow-md transition-all" />
                            </a>
                        ) : (
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <img src={logo.logo_url} alt={logo.title} title={logo.title} className="h-32 w-auto object-contain max-w-[250px] relative z-10 drop-shadow-sm" />
                            </div>
                        )}
                    </div>
                ))}
            </Marquee>
        </div>
    );
}
