import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, BadgeCheck, User, Facebook, Instagram, Twitter, Linkedin, MapPin, Users, Building2, Mail } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, isNationalRole, isStateRole, isDistrictRole } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// Get location display text based on role
const getLocationDisplay = (leader: Leader): string => {
  if (isNationalRole(leader.role)) {
    return "National Level";
  }
  if (isStateRole(leader.role)) {
    return leader.prant || "";
  }
  if (isDistrictRole(leader.role)) {
    if (leader.district && leader.prant) {
      return `${leader.district} (${leader.prant})`;
    }
    return leader.district || leader.prant || "";
  }
  return leader.prant || "";
};

// Get role badge color based on role type
const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
  if (isNationalRole(role)) return "default";
  if (role.includes("CONVENER")) return "secondary";
  return "outline";
};

export default function Leadership() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchLeaders() {
      // Fetch from profiles where is_leadership is true
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_leadership", true); // Using the new flag

      if (!error && data) {
        // Map profile data to Leader interface
        const mappedLeaders: Leader[] = data.map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          // Fallback to MEMBER if role is missing, but usually leadership has roles
          role: p.role || "MEMBER",
          // We need to fetch role from user_roles if it's not in profiles, 
          // BUT for now let's assume valid leadership profiles have roles assigned or we might need a join.
          // Wait, profiles table doesn't have 'role' column in standard schema, it's in user_roles.
          // We need to join or fetch roles.
          prant: p.state,
          district: p.district,
          designation: p.designation,
          photo_url: p.avatar_url,
          instagram_url: p.instagram_url,
          facebook_url: p.facebook_url,
          twitter_url: p.twitter_url,
          linkedin_url: p.linkedin_url,
          display_order: 0 // We might lose specific ordering without a dedicated table, default to 0
        }));

        // We need the proper roles to sort them. 
        // Let's fetch user_roles for these users.
        const userIds = data.map(p => p.user_id);
        if (userIds.length > 0) {
          const { data: rolesData } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);

          if (rolesData) {
            const roleMap = new Map(rolesData.map(r => [r.user_id, r.role]));
            mappedLeaders.forEach(l => {
              // Find the user_id that corresponds to this profile (we need user_id in mapped object or find by index)
              // The 'data' array index matches 'mappedLeaders' index.
              const originalProfile = data.find(p => p.id === l.id);
              if (originalProfile) {
                l.role = roleMap.get(originalProfile.user_id) || "MEMBER";
              }
            });
          }
        }

        // Sort by role hierarchy
        const sorted = mappedLeaders.sort((a, b) => {
          const aIndex = roleOrder.indexOf(a.role);
          const bIndex = roleOrder.indexOf(b.role);
          // If role is not in the list (e.g. MEMBER), put it at the end
          const aRank = aIndex === -1 ? 999 : aIndex;
          const bRank = bIndex === -1 ? 999 : bIndex;

          return aRank - bRank;
        });

        setLeaders(sorted);
      }
      setLoading(false);
    }
    fetchLeaders();
  }, []);

  // Group leaders by category
  const nationalLeaders = leaders.filter(l => isNationalRole(l.role));
  // Combine all state roles
  const stateLeaders = leaders.filter(l => isStateRole(l.role));
  // Combine all district roles
  const districtLeaders = leaders.filter(l => isDistrictRole(l.role));

  // Filter leaders based on active tab
  const getFilteredLeaders = () => {
    switch (activeTab) {
      case "national": return nationalLeaders;
      case "state": return stateLeaders;
      case "district": return districtLeaders;
      default: return leaders;
    }
  };

  const LeaderCard = ({ leader, index }: { leader: Leader; index: number }) => (
    <GlassCard delay={index * 0.05} className="text-center group hover:border-primary/50 transition-all">
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:border-primary/60 transition-colors">
        {leader.photo_url ? (
          <img
            src={leader.photo_url}
            alt={leader.full_name || "Leader"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "";
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <User className={`w-12 h-12 text-muted-foreground ${leader.photo_url ? "hidden" : ""}`} />
      </div>

      <div className="flex items-center justify-center gap-2 mb-2">
        <h3 className="font-display text-xl font-semibold">
          {leader.full_name || "Unknown Leader"}
        </h3>
        <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
      </div>

      {/* Email Display */}
      {leader.email && (
        <a href={`mailto:${leader.email}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-2 px-2 py-0.5 rounded-full bg-primary/10">
          <Mail className="w-3 h-3" />
          {leader.email}
        </a>
      )}

      <div className="mb-2">
        <Badge variant={getRoleBadgeVariant(leader.role)}>
          {ROLE_LABELS[leader.role] || leader.role}
        </Badge>
      </div>

      {/* Location display */}
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
          <a
            href={leader.facebook_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Facebook className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </a>
        )}
        {leader.instagram_url && (
          <a
            href={leader.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Instagram className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </a>
        )}
        {leader.twitter_url && (
          <a
            href={leader.twitter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Twitter className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </a>
        )}
        {leader.linkedin_url && (
          <a
            href={leader.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </a>
        )}
      </div>
    </GlassCard>
  );

  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="glass-panel p-6 animate-pulse">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/50" />
          <div className="h-6 bg-muted/50 rounded mx-auto w-32 mb-2" />
          <div className="h-4 bg-muted/50 rounded mx-auto w-24 mb-2" />
          <div className="h-3 bg-muted/50 rounded mx-auto w-28" />
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
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
            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2 bg-muted/30">
                  <TabsTrigger value="all" className="gap-2">
                    <Users className="w-4 h-4" />
                    <span>All</span>
                  </TabsTrigger>
                  <TabsTrigger value="national" className="gap-2">
                    <Award className="w-4 h-4" />
                    <span>National</span>
                  </TabsTrigger>
                  <TabsTrigger value="state" className="gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>State</span>
                  </TabsTrigger>
                  <TabsTrigger value="district" className="gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>District</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                {getFilteredLeaders().length === 0 ? (
                  <GlassCard className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-display text-lg font-semibold mb-2">No Leaders Found</h3>
                    <p className="text-muted-foreground">No leaders in this category yet.</p>
                  </GlassCard>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {getFilteredLeaders().map((leader, index) => (
                      <LeaderCard key={leader.id} leader={leader} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  );
}