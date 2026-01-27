import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Image as ImageIcon, Filter, Users } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRANT_LIST } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  event_type: string | null;
  image_urls: string[] | null;
  collab_states: string[] | null;
  is_joint_initiative: boolean | null;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop";

export default function Programs() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"national" | "state">("national");
  const [selectedState, setSelectedState] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "joint">("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  }

  const getFeaturedImage = (event: Event) => {
    if (event.image_urls && event.image_urls.length > 0) {
      return event.image_urls[0];
    }
    return FALLBACK_IMAGE;
  };

  const filteredEvents = events.filter(event => {
    // 1. Filter by Tab (Joint Initiatives)
    if (activeTab === "joint" && !event.is_joint_initiative) return false;

    // 2. Filter by View Mode
    if (viewMode === "national") {
      return true; // Show all in national view
    } else {
      if (!selectedState) return true; // Show all if no state selected yet

      // Check if event belongs to this state OR is a collaborative event including this state
      // Note: We need to check if we have a direct 'state' column on events or inferred from location/description
      // For now, relies on collab_states check + explicit state logic if added later. 
      // Assuming 'collab_states' covers the state association.

      const isCollab = event.collab_states?.includes(selectedState);
      // Fallback: Check if location string contains the state name (simple heuristic)
      const isLocationMatch = event.location?.includes(selectedState);

      return isCollab || isLocationMatch;
    }
  });

  return (
    <Layout>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Programs & <span className="text-primary">Activities</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Discover our nationwide initiatives, workshops, and events
          </p>

          {/* Controls */}
          <GlassCard className="max-w-3xl mx-auto p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex bg-muted/30 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("national")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "national"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                National View
              </button>
              <button
                onClick={() => setViewMode("state")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "state"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                State-wise View
              </button>
            </div>

            {viewMode === "state" && (
              <div className="w-full md:w-64">
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State / Prant" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRANT_LIST.map(prant => (
                      <SelectItem key={prant} value={prant}>{prant}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant={activeTab === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("all")}
              >
                All Types
              </Button>
              <Button
                variant={activeTab === "joint" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("joint")}
                className="gap-2"
              >
                <Users className="w-4 h-4" /> Joint Initiatives
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-panel overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted/50" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted/50 rounded w-3/4" />
                  <div className="h-4 bg-muted/50 rounded w-1/2" />
                  <div className="h-4 bg-muted/50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold mb-2">No programs found</h3>
            <p className="text-muted-foreground">
              {viewMode === "state" && !selectedState
                ? "Please select a state to view programs."
                : "Try adjusting your filters or check back later."}
            </p>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel overflow-hidden group hover:border-primary/50 transition-all"
              >
                {/* Featured Image */}
                <div className="aspect-video relative overflow-hidden bg-muted/30">
                  <img
                    src={getFeaturedImage(event)}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

                  {/* Event type badge */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {event.event_type && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/80 text-primary-foreground backdrop-blur-sm self-start">
                        {event.event_type}
                      </span>
                    )}
                    {event.is_joint_initiative && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/80 text-white backdrop-blur-sm self-start flex items-center gap-1">
                        <Users className="w-3 h-3" /> Joint Initiative
                      </span>
                    )}
                  </div>

                  {/* Date badge */}
                  {event.event_date && (
                    <div className="absolute bottom-3 left-3">
                      <div className="px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50">
                        <p className="text-xs font-medium text-primary">
                          {new Date(event.event_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-display text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}

                    {event.collab_states && event.collab_states.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.collab_states.slice(0, 3).map(state => (
                          <Badge key={state} variant="outline" className="text-[10px] h-5">
                            {state}
                          </Badge>
                        ))}
                        {event.collab_states.length > 3 && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            +{event.collab_states.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
