import { motion } from "framer-motion";
import { Target, Eye, Rocket } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";

export default function About() {
  return (
    <Layout>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            About <span className="text-primary">SAVISHKAR</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            India's premier youth innovation ecosystem, connecting minds and transforming ideas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <GlassCard>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              To cultivate a nationwide network of young innovators, fostering creativity, 
              leadership, and entrepreneurial spirit across every state of India. We believe 
              in empowering youth with the skills and connections needed to drive national progress.
            </p>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Eye className="w-7 h-7 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold">Our Vision</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              To become India's premier youth innovation ecosystem, connecting minds and 
              transforming ideas into impactful solutions for national progress. We envision 
              a future where every young Indian has the opportunity to innovate and lead.
            </p>
          </GlassCard>
        </div>

        <GlassCard className="text-center py-12">
          <Rocket className="w-12 h-12 mx-auto mb-4 text-savishkar-cyan" />
          <h2 className="font-display text-2xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Since our inception, SAVISHKAR has grown to become a nationwide movement 
            with over 10,000 members across 28 states, conducting 150+ programs annually.
          </p>
        </GlassCard>
      </div>
    </Layout>
  );
}
