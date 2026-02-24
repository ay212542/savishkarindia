import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, MapPin, Calendar, Award, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { StatsCard } from "@/components/ui/StatsCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StoryViewer from "@/components/home/StoryViewer";
import CollabMarquee from "@/components/home/CollabMarquee";
import AlumniCarousel from "@/components/home/AlumniCarousel";
import { ShieldCheck, User } from "lucide-react";

export default function Index() {
  return (
    <Layout>
      <AnimatedBackground />

      {/* Stories Section (Instagram-like) */}
      <div className="pt-20 lg:pt-24 pb-4 container mx-auto">
        <StoryViewer />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4 -mt-10 lg:-mt-20">
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">National Innovation Command Ecosystem</span>
            </div>

            <div className="overflow-hidden mb-6">
              <motion.h1
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                className="font-display text-5xl md:text-7xl lg:text-8xl font-bold"
              >
                <span className="text-gradient-hero inline-block p-1">SAVISHKAR</span>
              </motion.h1>
            </div>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Empowering the next generation of innovators and leaders across India.
              Join a nationwide network transforming ideas into impact.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/join">
                <Button size="lg" className="glow-button-teal text-lg px-8 py-6 gap-2">
                  Join the Movement
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard icon={Users} value="10,000+" label="Active Members" delay={0} />
            <StatsCard icon={MapPin} value="28" label="States Covered" delay={0.1} />
            <StatsCard icon={Calendar} value="150+" label="Programs Conducted" delay={0.2} />
            <StatsCard icon={Award} value="50+" label="Partner Organizations" delay={0.3} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Why Join <span className="text-primary">SAVISHKAR</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Be part of India's premier youth innovation ecosystem
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard delay={0}>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">National Network</h3>
              <p className="text-muted-foreground">Connect with innovators across all 28 states and territories of India.</p>
            </GlassCard>

            <GlassCard delay={0.1}>
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Award className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Leadership Programs</h3>
              <p className="text-muted-foreground">Develop skills through workshops, bootcamps, and mentorship programs.</p>
            </GlassCard>

            <GlassCard delay={0.2}>
              <div className="w-14 h-14 rounded-2xl bg-savishkar-cyan/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-savishkar-cyan" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Digital Identity</h3>
              <p className="text-muted-foreground">Get your verified digital ID card as a recognized innovator.</p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Leadership Preview Section */}
      <section className="py-20 px-4 relative z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Visionary <span className="text-primary">Leadership</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the national team driving SAVISHKAR's mission across India
            </p>
          </motion.div>

          <IndexLeadershipPreview />

          <div className="mt-12 text-center">
            <Link to="/leadership">
              <Button variant="outline" size="lg" className="border-primary/50 text-primary hover:bg-primary/10 gap-2">
                View Full Team Directory
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Alumni Carousel */}
      <AlumniCarousel />

      {/* Collaborations Marquee */}
      <CollabMarquee />

      {/* CTA Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <GlassCard className="text-center py-16 px-8 hover-glow border-primary/20">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to Shape the Future?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of young innovators building India's tomorrow.
            </p>
            <Link to="/join">
              <Button size="lg" className="glow-button-teal text-lg px-8 py-6 gap-2">
                Apply Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </GlassCard>
        </div>
      </section>
    </Layout>
  );
}

// Sub-component for dynamic leadership preview on home page
function IndexLeadershipPreview() {
  const [topLeaders, setTopLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopLeaders() {
      try {
        const { data, error } = await supabase.rpc("get_public_leaders" as any);
        if (!error && data && data.length > 0) {
          // Take top 3 National Conveners or highest display order
          setTopLeaders(data.slice(0, 3));
        }
      } catch (err) {
        console.error("Home leadership fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopLeaders();
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-panel h-64 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (topLeaders.length === 0) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl mx-auto">
        <GlassCard className="text-center group overflow-hidden border-primary/10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold">National Team</h3>
          <p className="text-sm text-muted-foreground mt-2">Strategic oversight and nationwide mission execution.</p>
        </GlassCard>

        <GlassCard className="text-center group overflow-hidden border-accent/10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
            <MapPin className="w-10 h-10 text-accent" />
          </div>
          <h3 className="font-display text-xl font-bold">Regional Network</h3>
          <p className="text-sm text-muted-foreground mt-2">Connecting innovation hubs across every Indian state.</p>
        </GlassCard>

        <GlassCard className="text-center group overflow-hidden border-savishkar-cyan/10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-savishkar-cyan/10 flex items-center justify-center border border-savishkar-cyan/20">
            <Award className="w-10 h-10 text-savishkar-cyan" />
          </div>
          <h3 className="font-display text-xl font-bold">Distinguished Advisors</h3>
          <p className="text-sm text-muted-foreground mt-2">Expert guidance from industry leaders.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl mx-auto">
      {topLeaders.map((leader, i) => (
        <motion.div
          key={leader.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          viewport={{ once: true }}
        >
          <GlassCard className="text-center group hover:border-primary/50 transition-all p-8 h-full flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:border-primary/60 transition-colors">
                {leader.avatar_url ? (
                  <img src={leader.avatar_url} alt={leader.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background border border-primary/30 rounded-full p-1.5 shadow-lg">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
            </div>

            <h3 className="font-display text-xl font-bold mb-1">{leader.full_name}</h3>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              {leader.role.replace(/_/g, " ")}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2 italic">
              {leader.designation || "Dedicated to National Innovation"}
            </p>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
