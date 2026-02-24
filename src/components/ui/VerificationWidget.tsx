import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, QrCode, Mail, Phone, Shield, X,
    CheckCircle2, AlertCircle, Loader2, ScanLine, User
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { supabase } from "@/integrations/supabase/client";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ROLE_LABELS } from "@/lib/constants";

type LookupType = "membership_id" | "email" | "phone";

interface SearchResult {
    full_name: string;
    membership_id: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    state: string | null;
    status: "ACTIVE" | "PENDING" | "REJECTED";
    avatar_url: string | null;
}

export function VerificationWidget() {
    const [lookupType, setLookupType] = useState<LookupType>("membership_id");
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize QR Scanner
    useEffect(() => {
        if (showScanner) {
            const scanner = new Html5QrcodeScanner(
                "widget-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(
                (decodedText) => {
                    scanner.clear();
                    setShowScanner(false);
                    const id = decodedText.split('/').pop() || decodedText;
                    handleVerify(id, "membership_id");
                },
                (err) => console.log(err)
            );

            return () => {
                scanner.clear().catch(console.error);
            };
        }
    }, [showScanner]);

    const handleVerify = async (val: string = inputValue, type: LookupType = lookupType) => {
        if (!val.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            if (type === "membership_id") {
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc("get_member_public_profile" as any, { lookup_id: val.trim() });

                if (rpcData && !rpcError && (rpcData as any).length > 0) {
                    const profile = (rpcData as any)[0];
                    setResult({
                        full_name: profile.full_name,
                        membership_id: profile.membership_id,
                        email: profile.allow_email_sharing !== false ? profile.email : null,
                        phone: profile.allow_mobile_sharing !== false ? profile.phone : null,
                        role: profile.role || "MEMBER",
                        state: profile.state,
                        status: "ACTIVE",
                        avatar_url: profile.avatar_url
                    });
                    return;
                }
            }

            // First try public profiles with role join
            let query = supabase
                .from("profiles")
                .select("*");

            if (type === "membership_id") query = query.eq("membership_id", val.trim());
            else if (type === "email") query = query.ilike("email", val.trim());
            else if (type === "phone") query = query.eq("phone", val.trim());

            const { data: profileData, error: profileError } = await query.maybeSingle();

            if (profileData) {
                const profile = profileData as any;
                let userRole = "MEMBER";

                if (profile.user_id) {
                    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", profile.user_id).maybeSingle();
                    if (roleData?.role) userRole = roleData.role;
                }

                setResult({
                    full_name: profile.full_name,
                    membership_id: profile.membership_id,
                    email: profile.email,
                    phone: profile.phone,
                    role: userRole,
                    state: profile.state,
                    status: "ACTIVE",
                    avatar_url: profile.avatar_url
                });
            } else {
                // Check applications table for pending/rejected
                // Only if searching by email or phone, since applications don't have membership_id yet
                if (type === "membership_id") {
                    setError("No record found for this ID");
                    return;
                }

                let appQuery = supabase.from("applications").select("*");

                if (type === "email") appQuery = appQuery.ilike("email", val.trim());
                else if (type === "phone") appQuery = appQuery.eq("phone", val.trim());

                const { data: appData } = await appQuery.maybeSingle();

                if (appData) {
                    setResult({
                        full_name: appData.full_name,
                        membership_id: "PENDING",
                        email: appData.email,
                        phone: appData.phone,
                        role: "MEMBER", // Default for applicants
                        state: appData.state,
                        status: appData.status.toUpperCase() as any,
                        avatar_url: appData.photo_url
                    });
                } else {
                    setError("No record found for this " + type.replace("_", " "));
                }
            }
        } catch (err) {
            console.error("Verification error", err);
            setError("Search failed. Check your network.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard className="border-primary/20 bg-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Shield className="w-20 h-20 text-primary" />
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-display font-bold text-lg">Instant Verification</h3>
                    <p className="text-xs text-muted-foreground">Verify identity by ID, Email, or Phone</p>
                </div>
            </div>

            {/* Verification Toggles */}
            <div className="flex p-1 bg-muted/30 rounded-lg mb-4 gap-1">
                {(["membership_id", "email", "phone"] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => setLookupType(type)}
                        className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${lookupType === type
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "text-muted-foreground hover:bg-white/5"
                            }`}
                    >
                        {type === "membership_id" ? "ID" : type}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={`Enter ${lookupType.replace("_", " ")}...`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                        className="pl-9 bg-black/20 border-white/10"
                    />
                </div>
                <Button size="icon" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleVerify()}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20" onClick={() => setShowScanner(true)}>
                    <QrCode className="w-4 h-4" />
                </Button>
            </div>

            <AnimatePresence>
                {showScanner && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden rounded-xl bg-black/40 p-4 border border-white/10"
                    >
                        <div id="widget-reader" className="w-full"></div>
                        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setShowScanner(false)}>
                            Cancel Scan
                        </Button>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-xs mb-4"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {error}
                        <button className="ml-auto" onClick={() => setError(null)}><X className="w-3 h-3" /></button>
                    </motion.div>
                )}

                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-primary/10 border border-primary/20 rounded-xl relative group/result"
                    >
                        <button
                            className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full"
                            onClick={() => setResult(null)}
                        >
                            <X className="w-3 h-3 text-muted-foreground" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                                {result.avatar_url ? (
                                    <img src={result.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <User className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 pr-6">
                                <h4 className="font-bold text-sm truncate">{result.full_name}</h4>
                                <div className="flex items-center gap-2">
                                    <Badge className={`text-[10px] px-1.5 h-4 ${result.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                        result.status === "PENDING" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                                            "bg-red-500/20 text-red-400 border-red-500/30"
                                        }`}>
                                        {result.status}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground font-mono">{result.membership_id}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{result.email || "No Email"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{result.phone || "No Phone"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Search className="w-3 h-3" />
                                <span>{result.role ? ROLE_LABELS[result.role as keyof typeof ROLE_LABELS] || result.role : "Member"}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard>
    );
}

function ArrowRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
