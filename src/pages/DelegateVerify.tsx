import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Users, Calendar, MapPin, CheckCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Badge } from "@/components/ui/badge";

interface DelegateData {
    id: string;
    event_id: string;
    name: string;
    role_in_event: string | null;
    delegation: string | null;
    created_at: string;
    events: {
        title: string;
        date: string | null;
        city: string | null;
    } | null;
    event_name: string | null;
    custom_data: Record<string, any> | null;
}

export default function DelegateVerify() {
    const { delegateId } = useParams();
    const [delegate, setDelegate] = useState<DelegateData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!delegateId) {
            setError("Invalid Delegate ID");
            setLoading(false);
            return;
        }

        async function fetchDelegate() {
            try {
                // Fetch delegate info + join events table for event details
                const { data, error } = await (supabase as any)
                    .from("event_delegates")
                    .select("*, events(title, date, city)")
                    .eq("id", delegateId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Delegate not found");

                setDelegate(data as DelegateData);
            } catch (err: any) {
                console.error("Verification error:", err);
                setError(err.message || "Delegate not found or validation failed");
            } finally {
                setLoading(false);
            }
        }

        fetchDelegate();
    }, [delegateId]);

    return (
        <div className="min-h-screen bg-background text-foreground relative flex items-center justify-center p-4 selection:bg-primary/30">
            <AnimatedBackground />

            <div className="absolute top-6 left-6 z-10 hidden sm:block">
                <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <img src="/lovable-uploads/e8caec3c-ba3d-4c3e-bbc6-bd07b48cefb7.png" alt="Savishkar Logo" className="w-16 h-16 mx-auto mb-4" />
                    <h1 className="font-display text-2xl font-bold">Event Registration</h1>
                    <p className="text-muted-foreground">Official Verification Portal</p>
                </div>

                <GlassCard className="relative overflow-hidden backdrop-blur-xl border-t border-l border-white/10 shadow-2xl">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Verifying credentials...</p>
                        </div>
                    ) : error || !delegate ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
                            <p className="text-muted-foreground mb-6">{error}</p>
                            <Link to="/">
                                <button className="px-6 py-2 bg-muted/50 hover:bg-muted text-foreground rounded-lg transition-colors border border-white/10">
                                    Return Home
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute top-0 right-0 p-4">
                                <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 gap-1.5 px-3 py-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Valid
                                </Badge>
                            </div>

                            <div className="p-6 md:p-8 space-y-8">
                                <div className="text-center space-y-2 pt-6">
                                    <h2 className="text-3xl font-display font-bold leading-tight">{delegate.name}</h2>
                                    <p className="text-lg text-primary">{delegate.role_in_event || "Delegate"}</p>
                                    {delegate.delegation && (
                                        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground mt-2 bg-muted/30 px-3 py-1 rounded-full">
                                            <Users className="w-3.5 h-3.5" /> From {delegate.delegation}
                                        </p>
                                    )}
                                </div>

                                <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

                                <div className="space-y-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Details</h3>

                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                                <Shield className="w-5 h-5 text-orange-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{delegate.event_name || delegate.events?.title || "Savishkar Event"}</p>
                                                <p className="text-xs text-muted-foreground">Registered Event</p>
                                            </div>
                                        </div>

                                        {delegate.events?.date && (
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <Calendar className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{new Date(delegate.events.date).toLocaleDateString("en-IN", {
                                                        day: "numeric", month: "long", year: "numeric"
                                                    })}</p>
                                                    <p className="text-xs text-muted-foreground">Event Date</p>
                                                </div>
                                            </div>
                                        )}

                                        {delegate.events?.city && (
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-5 h-5 text-rose-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{delegate.events.city}</p>
                                                    <p className="text-xs text-muted-foreground">Location</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {delegate.custom_data && Object.keys(delegate.custom_data).length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-t border-white/5 pt-4">Registration Details</h3>
                                        <div className="grid gap-3">
                                            {Object.entries(delegate.custom_data).map(([key, value]) => {
                                                // Skip fields that are already shown above if they exist in custom_data
                                                if (["Name", "Full Name", "Email", "Phone", "Mobile", "Delegation", "Role"].includes(key)) return null;
                                                if (!value) return null;

                                                return (
                                                    <div key={key} className="p-3 rounded-lg bg-white/5 border border-white/5">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{key}</p>
                                                        <p className="text-sm font-medium">{String(value)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex flex-col items-center">
                                    <p className="text-[10px] text-muted-foreground font-mono mb-2">ID: {delegate.id}</p>
                                    <p className="text-xs font-semibold text-primary opacity-60 tracking-[0.2em] uppercase">SAVISHKAR VERIFIED</p>
                                </div>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    );
}
