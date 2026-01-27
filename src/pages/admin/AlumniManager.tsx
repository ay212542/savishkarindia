import { useEffect, useState } from "react";
import { User, Loader2, ArrowRight, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AlumniProfile {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    achievements_list: string | null;
    journey_text: string | null;
}

export default function AlumniManager() {
    const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAlumni();
    }, [user]);

    async function fetchAlumni() {
        setLoading(true);
        // Fetch profiles where is_alumni is true
        const { data: profiles, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("is_alumni", true)
            .order("created_at", { ascending: false });

        if (profiles) {
            const mappedAlumni = profiles.map(p => ({
                id: p.id,
                user_id: p.user_id,
                full_name: p.full_name,
                email: p.email,
                avatar_url: p.avatar_url,
                achievements_list: p.achievements_list,
                journey_text: p.journey_text
            }));
            setAlumni(mappedAlumni);
        }
        setLoading(false);
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold">Alumni Directory</h1>
                    <p className="text-muted-foreground">
                        Members marked as "Alumni" appear here.
                    </p>
                </div>
                <Button onClick={() => navigate("/admin/members")} variant="outline" className="gap-2">
                    Go to Registry <ArrowRight className="w-4 h-4" />
                </Button>
            </div>

            <GlassCard className="bg-purple-500/10 border-purple-500/20 p-4">
                <p className="text-sm text-purple-600 dark:text-purple-400">
                    <strong>How to add alumni:</strong> Go to <strong>Member Registry</strong>, edit a member's profile, and toggle the <strong>"Alumni"</strong> switch.
                </p>
            </GlassCard>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : alumni.length === 0 ? (
                <GlassCard className="text-center py-12">
                    <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-display text-xl font-semibold mb-2">No Alumni Found</h3>
                    <p className="text-muted-foreground mb-4">Mark members as alumni in their profile settings.</p>
                    <Button onClick={() => navigate("/admin/members")}>Go to Members</Button>
                </GlassCard>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alumni.map((alum) => (
                        <GlassCard key={alum.id} className="relative">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                                    {alum.avatar_url ? (
                                        <img src={alum.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{alum.full_name}</h3>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">Alumni</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{alum.email}</p>
                                </div>
                            </div>

                            {(alum.achievements_list || alum.journey_text) && (
                                <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                                    {alum.achievements_list ? (
                                        <p className="line-clamp-2"><strong>Achievements:</strong> {alum.achievements_list}</p>
                                    ) : (
                                        <p className="line-clamp-2 italic">"{alum.journey_text}"</p>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/admin/profile/${alum.user_id}`)}>
                                    <Edit className="w-4 h-4 mr-2" /> Manage Profile
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
