import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, CheckCircle2, QrCode, ArrowRight, ShieldCheck, Mail, Phone, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

interface FormField {
    id: string;
    label: string;
    type: "text" | "number" | "email" | "tel" | "select";
    required: boolean;
    options?: string[];
}

export default function DynamicRegistration() {
    const { managerId } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formConfig, setFormConfig] = useState<any>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const { data, error } = await (supabase
                    .from("event_forms" as any)
                    .select("*")
                    .eq("manager_id", managerId)
                    .eq("is_active", true) as any)
                    .maybeSingle();

                if (error) throw error;
                if (!data) {
                    toast({ title: "Form Not Found", description: "This registration form is either inactive or doesn't exist.", variant: "destructive" });
                    return;
                }
                setFormConfig(data);

                const initial: Record<string, any> = {};
                (data.fields as any[]).forEach(f => {
                    initial[f.label] = "";
                });
                setFormData(initial);
            } catch (e) {
                console.error("Error fetching form", e);
            } finally {
                setLoading(false);
            }
        };

        if (managerId) fetchForm();
    }, [managerId]);

    const handleChange = (label: string, value: string) => {
        setFormData(prev => ({ ...prev, [label]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fields = formConfig.fields as any[];
            for (const field of fields) {
                if (field.required && !formData[field.label]) {
                    throw new Error(`${field.label} is required.`);
                }
            }

            const { error } = await supabase.from("event_delegates" as any).insert({
                manager_id: managerId,
                user_id: user?.id || null,
                event_name: formConfig.event_name,
                name: formData["Full Name"] || formData["Name"] || user?.user_metadata?.full_name || "Guest",
                email: formData["Email"] || user?.email || null,
                phone: formData["Phone"] || formData["Mobile"] || null,
                custom_data: formData,
                role_in_event: "Delegate"
            });

            if (error) throw error;

            setSubmitted(true);
            toast({ title: "Success", description: "Registration completed successfully." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
                <AnimatedBackground />
                <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
            </div>
        );
    }

    if (!formConfig) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
                <AnimatedBackground />
                <div className="max-w-md w-full bg-card border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative z-10">
                    <ShieldCheck className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-display font-bold text-white mb-2">Form Not Accessible</h1>
                    <p className="text-gray-400 text-sm mb-6">This form might be closed or the link is incorrect.</p>
                    <Button onClick={() => navigate("/")} variant="outline" className="w-full">Return Home</Button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
                <AnimatedBackground />
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-card border border-primary/20 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(34,211,238,0.1)] relative z-10">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white mb-3">All Set!</h1>
                    <p className="text-gray-400 mb-8">Your registration for <b>{formConfig.event_name}</b> is confirmed. Verification will be done via your QR code.</p>
                    <div className="space-y-3">
                        <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl gap-2" onClick={() => navigate("/dashboard")}>
                            Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Button>
                        <p className="text-[10px] text-gray-500">View ID card and status in your member portal.</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-hidden">
            <AnimatedBackground />

            {/* Background elements to match Deep Space Navy */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary z-20" />
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full z-0" />

            <div className="max-w-2xl mx-auto relative z-10 space-y-6">
                {/* Google Form Style Header Card */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                    <div className="h-24 bg-gradient-to-r from-card via-secondary/20 to-card relative flex items-center justify-center px-8 border-b border-white/5">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        <h2 className="text-xl font-display font-bold text-primary tracking-tight relative z-10">SAVISHKAR EVENT ECOSYSTEM</h2>
                    </div>
                    <div className="p-8">
                        <h1 className="text-3xl font-display font-bold text-white mb-3">{formConfig.event_name}</h1>
                        <p className="text-gray-400 text-sm leading-relaxed flex items-center gap-2">
                            <Info className="w-4 h-4 text-accent shrink-0" />
                            Official registration for the event. Please ensure all details are accurate for ID generation.
                        </p>
                        <div className="mt-6 flex items-center gap-4 text-[11px] font-medium uppercase tracking-widest text-primary/60">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secure Portal</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>Verification Enabled</span>
                        </div>
                    </div>
                </motion.div>

                {/* Form Sections */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {(formConfig.fields as any[]).map((field, idx) => (
                        <motion.div key={field.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                            className="bg-card p-6 sm:p-8 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-md group">
                            <div className="space-y-4">
                                <Label className="text-base font-semibold text-gray-200 flex items-center gap-2">
                                    {field.label} {field.required && <span className="text-red-400">*</span>}
                                </Label>

                                {field.type === "select" ? (
                                    <div className="relative">
                                        <select
                                            value={formData[field.label] || ""}
                                            onChange={(e) => handleChange(field.label, e.target.value)}
                                            required={field.required}
                                            className="w-full h-12 bg-background border border-white/10 rounded-xl px-4 text-gray-300 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none appearance-none"
                                        >
                                            <option value="" className="bg-card">Choose...</option>
                                            {field.options?.map(opt => (
                                                <option key={opt} value={opt} className="bg-card">{opt}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Input
                                            type={field.type}
                                            required={field.required}
                                            value={formData[field.label] || ""}
                                            onChange={(e) => handleChange(field.label, e.target.value)}
                                            placeholder="Your answer"
                                            className="h-12 bg-transparent border-0 border-b border-white/10 rounded-none px-0 text-gray-200 text-base focus:border-primary focus:ring-0 transition-all placeholder:text-gray-600"
                                        />
                                        <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-focus-within:w-full transition-all duration-300" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    <div className="pt-6">
                        <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-2xl gap-3 shadow-[0_10px_30px_rgba(34,211,238,0.2)] transition-all hover:-translate-y-1 active:scale-[0.98]" disabled={submitting}>
                            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <QrCode className="w-6 h-6" />}
                            Submit Registration
                        </Button>
                        <p className="text-center mt-6 text-[11px] text-gray-500 uppercase tracking-widest font-medium opacity-60">
                            Savishkar India National Innovation Ecosystem • Secure Forms
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
