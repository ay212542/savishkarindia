import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Award, BadgeCheck, User, Facebook, Instagram, Twitter, Linkedin, MapPin, Users, Building2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, PRANT_LIST, isNationalRole, isStateRole, isDistrictRole } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Leader {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  prant: string | null;
  district: string | null;
  designation: string | null;
  photo_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  display_order: number;
}

const roleOrder = [
  "NATIONAL_CONVENER",
  "NATIONAL_CO_CONVENER",
  "STATE_CONVENER",
  "STATE_CO_CONVENER",
  "STATE_INCHARGE",
  "STATE_CO_INCHARGE",
  "DISTRICT_CONVENER",
  "DISTRICT_CO_CONVENER",
  "DISTRICT_INCHARGE",
  "DISTRICT_CO_INCHARGE"
];

const getLocationDisplay = (leader: Leader): string => {
  if (isNationalRole(leader.role)) return "National Level";
  if (isStateRole(leader.role)) return leader.prant || "";
  if (isDistrictRole(leader.role)) {
    if (leader.district && leader.prant) return `${leader.district} (${leader.prant})`;
    return leader.district || leader.prant || "";
  }
  return leader.prant || "";
};

const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
  if (isNationalRole(role)) return "default";
  if (role.includes("CONVENER")) return "secondary";
  return "outline";
};

export default function Leadership() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPrant, setSelectedPrant] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    async function fetchLeaders() {
      try {
        // Try bypass RPC first so public users don't get blocked by RLS
        const { data, error } = await supabase.rpc('get_public_leaders' as any);

        if (cancelled) return;

        if (!error && data && (data as any[]).length > 0) {
          const mapped: Leader[] = (data as any[]).map((p: any) => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            role: p.role || "MEMBER",
            prant: p.state,
            district: p.district,
            designation: p.designation,
            photo_url: p.avatar_url,
            instagram_url: p.instagram_url,
            facebook_url: p.facebook_url,
            twitter_url: p.twitter_url,
            linkedin_url: p.linkedin_url,
            display_order: p.display_order ?? 999
          }));

          const sorted = mapped.sort((a, b) => {
            if (a.display_order !== b.display_order) return a.display_order - b.display_order;
            const aRank = roleOrder.indexOf(a.role);
            const bRank = roleOrder.indexOf(b.role);
            return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
          });

          setLeaders(sorted);
        } else {
          // Fallback: query user_roles for leadership roles, then fetch profiles
          // Only use roles that exist in the current DB enum
          // (new roles like STATE_INCHARGE etc. only exist after SQL migration)
          const KNOWN_LEADER_ROLES = [
            "NATIONAL_CONVENER", "NATIONAL_CO_CONVENER",
            "STATE_CONVENER", "STATE_CO_CONVENER",
          ] as any[];

          const EXTENDED_LEADER_ROLES = [
            "STATE_INCHARGE", "STATE_CO_INCHARGE",
            "DISTRICT_CONVENER", "DISTRICT_CO_CONVENER",
            "DISTRICT_INCHARGE", "DISTRICT_CO_INCHARGE"
          ] as any[];

          // Fetch known roles first (always works)
          const { data: knownRolesData } = await supabase
            .from("user_roles")
            .select("user_id, role")
            .in("role", KNOWN_LEADER_ROLES);

          // Try extended roles — may fail if SQL migration not yet run
          let extendedRolesData: any[] = [];
          try {
            const { data } = await supabase
              .from("user_roles")
              .select("user_id, role")
              .in("role", EXTENDED_LEADER_ROLES);
            extendedRolesData = data || [];
          } catch { /* ignore if these roles don't exist yet */ }

          if (cancelled) return;

          const rolesData = [...(knownRolesData || []), ...extendedRolesData];

          if (rolesData && rolesData.length > 0) {
            const userIds = rolesData.map(r => r.user_id);
            const roleMap = new Map(rolesData.map(r => [r.user_id, r.role]));

            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, user_id, full_name, avatar_url, state, district, designation, instagram_url, facebook_url, twitter_url, linkedin_url")
              .in("user_id", userIds);

            if (cancelled) return;

            if (profileData) {
              const mapped: Leader[] = profileData.map((p: any) => ({
                id: p.id,
                full_name: p.full_name,
                email: null,
                role: roleMap.get(p.user_id) || "MEMBER",
                prant: p.state,
                district: p.district,
                designation: p.designation,
                photo_url: p.avatar_url,
                instagram_url: p.instagram_url,
                facebook_url: p.facebook_url,
                twitter_url: p.twitter_url,
                linkedin_url: p.linkedin_url,
                display_order: 999
              }));

              const sorted = mapped.sort((a, b) => {
                const aRank = roleOrder.indexOf(a.role);
                const bRank = roleOrder.indexOf(b.role);
                return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
              });

              setLeaders(sorted);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching leaders:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLeaders();
    return () => { cancelled = true; };
  }, []);

  // Inline role arrays — more reliable than imported helper functions
  const NATIONAL_ROLES = ["NATIONAL_CONVENER", "NATIONAL_CO_CONVENER"];
  const STATE_ROLES = ["STATE_CONVENER", "STATE_CO_CONVENER", "STATE_INCHARGE", "STATE_CO_INCHARGE"];
  const DISTRICT_ROLES = ["DISTRICT_CONVENER", "DISTRICT_CO_CONVENER", "DISTRICT_INCHARGE", "DISTRICT_CO_INCHARGE"];

  // Memoized filtered lists — avoids recomputing on every render
  const nationalLeaders = useMemo(() =>
    leaders.filter(l => NATIONAL_ROLES.includes(l.role)),
    [leaders]);

  const stateLeaders = useMemo(() =>
    leaders.filter(l =>
      STATE_ROLES.includes(l.role) && (selectedPrant === "all" || l.prant === selectedPrant)
    ), [leaders, selectedPrant]);

  const districtLeaders = useMemo(() =>
    leaders.filter(l =>
      DISTRICT_ROLES.includes(l.role) && (selectedPrant === "all" || l.prant === selectedPrant)
    ), [leaders, selectedPrant]);

  const allFiltered = useMemo(() =>
    leaders.filter(l => selectedPrant === "all" || l.prant === selectedPrant),
    [leaders, selectedPrant]);

  const LeaderCard = ({ leader, index }: { leader: Leader; index: number }) => (
    <motion.div
      key={leader.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      <GlassCard className="text-center group hover:border-primary/50 transition-all h-full">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:border-primary/60 transition-colors">
          {leader.photo_url ? (
            <img
              src={leader.photo_url}
              alt={leader.full_name || "Leader"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <User className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="font-display text-xl font-semibold">{leader.full_name || "Unknown Leader"}</h3>
          <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
        </div>

        <div className="mb-2">
          <Badge variant={getRoleBadgeVariant(leader.role)}>
            {ROLE_LABELS[leader.role] || leader.role}
          </Badge>
        </div>

        {getLocationDisplay(leader) && (
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3 h-3" />
            <span>{getLocationDisplay(leader)}</span>
          </div>
        )}

        {leader.designation && (
          <p className="text-sm text-muted-foreground mb-3">{leader.designation}</p>
        )}

        {/* Social Links */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {leader.facebook_url && (
            <a href={leader.facebook_url} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Facebook className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          )}
          {leader.instagram_url && (
            <a href={leader.instagram_url} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Instagram className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          )}
          {leader.twitter_url && (
            <a href={leader.twitter_url} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Twitter className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          )}
          {leader.linkedin_url && (
            <a href={leader.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );

  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="glass-panel p-6 animate-pulse rounded-xl">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/50" />
          <div className="h-6 bg-muted/50 rounded mx-auto w-32 mb-2" />
          <div className="h-4 bg-muted/50 rounded mx-auto w-24 mb-2" />
          <div className="h-3 bg-muted/50 rounded mx-auto w-28" />
        </div>
      ))}
    </div>
  );

  const GridView = ({ items }: { items: Leader[] }) => (
    items.length === 0 ? (
      <GlassCard className="text-center py-12">
        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-display text-lg font-semibold mb-2">No Leaders Found</h3>
        <p className="text-muted-foreground">No leaders in this category{selectedPrant !== "all" ? ` for ${selectedPrant}` : ""} yet.</p>
      </GlassCard>
    ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((leader, index) => (
          <LeaderCard key={leader.id} leader={leader} index={index} />
        ))}
      </div>
    )
  );

  return (
    <Layout>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-primary">Leadership</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet the visionaries driving SAVISHKAR's mission across India
          </p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : leaders.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold mb-2">Leadership Directory Coming Soon</h3>
            <p className="text-muted-foreground">Our leadership team details will be updated shortly.</p>
          </GlassCard>
        ) : (
          <div className="space-y-8">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedPrant("all"); }} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2 bg-muted/30">
                  <TabsTrigger value="all" className="gap-2">
                    <Users className="w-4 h-4" /><span>All</span>
                  </TabsTrigger>
                  <TabsTrigger value="national" className="gap-2">
                    <Award className="w-4 h-4" /><span>National</span>
                  </TabsTrigger>
                  <TabsTrigger value="state" className="gap-2">
                    <Building2 className="w-4 h-4" /><span>State (Prant)</span>
                  </TabsTrigger>
                  <TabsTrigger value="district" className="gap-2">
                    <MapPin className="w-4 h-4" /><span>District</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Prant filter — shown on state, district and all tabs */}
              {activeTab !== "national" && (
                <div className="flex justify-center mb-8">
                  <div className="w-full max-w-xs">
                    <Select value={selectedPrant} onValueChange={setSelectedPrant}>
                      <SelectTrigger className="bg-background/50 backdrop-blur-sm border-white/10">
                        <SelectValue placeholder="Filter by Prant / State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prants (States)</SelectItem>
                        {PRANT_LIST.map((prant) => (
                          <SelectItem key={prant} value={prant}>{prant}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <TabsContent value="all" className="mt-0">
                <GridView items={allFiltered} />
              </TabsContent>
              <TabsContent value="national" className="mt-0">
                <GridView items={nationalLeaders} />
              </TabsContent>
              <TabsContent value="state" className="mt-0">
                <GridView items={stateLeaders} />
              </TabsContent>
              <TabsContent value="district" className="mt-0">
                <GridView items={districtLeaders} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  );
}