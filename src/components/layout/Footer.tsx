import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import savishkarLogo from "@/assets/logo-savishkar.png";

interface FooterData {
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
}

interface ContactData {
  email?: string;
  phone?: string;
  address?: string;
}

export function Footer() {
  const [footerData, setFooterData] = useState<FooterData>({});
  const [contactData, setContactData] = useState<ContactData>({});

  useEffect(() => {
    async function fetchFooterData() {
      const { data, error } = await supabase
        .from("cms_blocks")
        .select("section, content")
        .in("section", ["footer", "contact"]);

      if (!error && data) {
        data.forEach(block => {
          if (block.section === "footer") {
            setFooterData(block.content as FooterData);
          } else if (block.section === "contact") {
            setContactData(block.content as ContactData);
          }
        });
      }
    }

    fetchFooterData();
  }, []);

  return (
    <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 relative z-10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={savishkarLogo} alt="SAVISHKAR" className="w-12 h-12 object-contain" />
              <span className="font-display font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">SAVISHKAR</span>
            </div>
            <p className="text-slate-300 text-sm">
              National Innovation Command Ecosystem — Empowering India's next generation of innovators and leaders.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {footerData.facebook_url && (
                <a href={footerData.facebook_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Facebook className="w-4 h-4 text-white" />
                </a>
              )}
              {footerData.instagram_url && (
                <a href={footerData.instagram_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Instagram className="w-4 h-4 text-white" />
                </a>
              )}
              {footerData.twitter_url && (
                <a href={footerData.twitter_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Twitter className="w-4 h-4 text-white" />
                </a>
              )}
              {footerData.linkedin_url && (
                <a href={footerData.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <Linkedin className="w-4 h-4 text-white" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-slate-300 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/programs" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Programs
                </Link>
              </li>
              <li>
                <Link to="/leadership" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Leadership
                </Link>
              </li>
              <li>
                <Link to="/join" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Join Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-white">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auth" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Member Login
                </Link>
              </li>
              <li>
                <Link to="/verify" className="text-slate-300 hover:text-white transition-colors text-sm">
                  Verify ID Card
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-slate-300 text-sm">
                <Mail className="w-4 h-4 text-cyan-400" />
                {contactData.email || "savishkarindia@gmail.com"}
              </li>
              <li className="flex items-center gap-2 text-slate-300 text-sm">
                <Phone className="w-4 h-4 text-cyan-400" />
                {contactData.phone || "+91 800 123 4567"}
              </li>
              <li className="flex items-start gap-2 text-slate-300 text-sm">
                <MapPin className="w-4 h-4 text-cyan-400 mt-0.5" />
                {contactData.address || "New Delhi, India"}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-400 text-sm text-center md:text-left">
            <p>© {new Date().getFullYear()} SAVISHKAR India. All rights reserved.</p>
            <p className="text-xs mt-1">Created by Aryan Yadav</p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-slate-400 hover:text-white transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}