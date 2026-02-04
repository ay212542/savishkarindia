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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!userId) return;
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      let finalRole = roleData?.role as AppRole | null;

      // EMERGENCY BACKDOOR: Force Super Controller for owner
      // This runs regardless of what is in the database
      if (profileData?.email === "savishkarindia@gmail.com") {
        console.log("DEBUG: OVERRIDE: Applying Emergency Admin Access for owner");
        finalRole = "SUPER_CONTROLLER";
      }

      if (finalRole) {
        setRole(finalRole);
      } else {
        console.log("DEBUG: No role found in user_roles table");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only update if session actually changed or on initial load
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setRole(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      // Attempt standard sign out
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Supabase signOut error:", error);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // FORCE CLEANUP
      console.log("Executing Force Cleanup and Redirect");

      // 1. Clear Context State
      setProfile(null);
      setRole(null);
      setUser(null);
      setSession(null);

      // 2. Clear Local Storage (Supabase tokens)
      localStorage.clear(); // Wipes everything to be safe

      // 3. Force Hard Redirect
      window.location.replace("/auth");
      window.location.reload();
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
