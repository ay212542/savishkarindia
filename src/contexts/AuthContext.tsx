import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/constants";
import { PRANT_CODES } from "@/lib/constants";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  state: string | null;
  division: string | null;
  district: string | null;
  prant: string | null;
  avatar_url: string | null;
  membership_id: string | null;
  designation: string | null;
  profession?: string | null; // Added profession
  joined_year?: string | null; // Added joined_year
  id_card_issued_at: string | null;
  is_temporary_password?: boolean;
  current_session_id?: string; // Added for session enforcement
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateMembershipId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `SAV-MBR-${year}-${random}`;
}

import { useToast } from "@/hooks/use-toast";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    console.log("fetchProfile called for:", userId);
    if (!userId) return;
    try {
      console.log("Fetching profile from DB...");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) {
        console.error("Profile DB Error:", profileError);
      } else {
        console.log("Profile data received:", profileData ? "Found" : "Null");
      }

      if (profileData) {
        setProfile(profileData as Profile);
      }

      console.log("Fetching user role...");
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleError) {
        console.warn("Role DB Error (might be empty):", roleError);
      } else {
        console.log("Role data received:", roleData);
      }

      let finalRole = roleData?.role as AppRole | null;

      // Role determined completely by DB now (Zero Trust)
      if (profileData?.email === "savishkarindia@gmail.com" && !finalRole) {
        // Fallback logging only
        console.warn("Owner logged in but no role found in DB. Please run security migration.");
      }

      if (finalRole) {
        setRole(finalRole);
      } else {
        console.log("DEBUG: No role found in user_roles table");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    console.log("fetchProfile completed");
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // 1. Setup Auth Listener (Run once)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth event: ${event}`, session?.user?.id);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            // Fetch profile without triggering this effect again
            console.log("Fetching profile for user:", session.user.id);
            try {
              await fetchProfile(session.user.id);
              console.log("Profile fetch complete");
            } catch (err) {
              console.error("Profile fetch failed in listener:", err);
            }

            // --- SINGLE SESSION ENFORCEMENT START ---
            let currentBrowserSessionId = sessionStorage.getItem('savishkar_session_id');
            if (!currentBrowserSessionId) {
              currentBrowserSessionId = crypto.randomUUID();
              sessionStorage.setItem('savishkar_session_id', currentBrowserSessionId);
            }

            // Update DB with this session ID
            // Run this in background, don't await blocking loading state
            supabase.from("profiles").update({
              current_session_id: currentBrowserSessionId
            } as any).eq("user_id", session.user.id).then(({ error }) => {
              if (error) console.error("Error updating session ID:", error);
            });
            // --- SINGLE SESSION ENFORCEMENT END ---

          } else {
            setProfile(null);
            setRole(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
          sessionStorage.removeItem('savishkar_session_id');
        }
        setLoading(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial getSession:", session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          await fetchProfile(session.user.id);
        } catch (err) {
          console.error("Profile fetch failed in initial check:", err);
        }
      }
      setLoading(false);
    });

    // Safety timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setLoading((currentLoading) => {
        if (currentLoading) {
          console.warn("Auth check timed out, forcing loading false");
          return false;
        }
        return currentLoading;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // 2. Realtime Session Monitoring (Runs when user changes)
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`session_monitor_${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newProfile = payload.new as Profile;
          const localSessionId = sessionStorage.getItem('savishkar_session_id');

          if (newProfile.current_session_id && newProfile.current_session_id !== localSessionId) {
            console.warn("Session invalidated by new login elsewhere.");
            toast({
              title: "Session Expired",
              description: "You have been logged in on another device.",
              variant: "destructive"
            });
            signOut();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]); // Only re-subscribe if user ID changes

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (!error && data.user) {
      // Generate membership ID for direct signups
      const membershipId = generateMembershipId();

      // Create profile with membership ID
      await supabase.from("profiles").insert({
        user_id: data.user.id,
        email,
        full_name: fullName,
        membership_id: membershipId,
        designation: "MEMBER"
      });

      // Assign default MEMBER role
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "MEMBER"
      });

      // Log the signup
      await supabase.from("audit_logs").insert({
        action: "USER_SIGNUP",
        user_id: data.user.id,
        target_type: "user",
        target_id: data.user.id,
        details: {
          email,
          membership_id: membershipId,
          method: "direct_signup"
        }
      });
    }

    return { error };
  };

  const signOut = async () => {
    console.log("AuthContext: signOut called"); // DEBUG
    try {
      // 1. Attempt standard sign out
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Supabase signOut error:", error);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // 2. Clear Context State - This should trigger re-renders
      setProfile(null);
      setRole(null);
      setUser(null);
      setSession(null);

      // 3. Clear Local Storage (Supabase tokens)
      localStorage.clear();

      // We don't force reload anymore, let the router handle it
    }
  };

  const isAdmin = role === "ADMIN" || role === "SUPER_CONTROLLER" || role === "STATE_CONVENER" || role === "STATE_CO_CONVENER";

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      loading,
      isAdmin,
      signIn,
      signUp,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
