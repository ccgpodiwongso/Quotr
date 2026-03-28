"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { TrialGate } from "./trial-gate";
import type { Company, User } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthUser = Pick<User, "id" | "email" | "full_name" | "role" | "company_id">;

type AuthCompany = Pick<
  Company,
  | "id"
  | "name"
  | "subscription_plan"
  | "subscription_status"
  | "trial_ends_at"
>;

interface AuthContextValue {
  user: AuthUser | null;
  company: AuthCompany | null;
  loading: boolean;
  /** Re-fetch user/company data (e.g. after plan change) */
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue>({
  user: null,
  company: null,
  loading: true,
  refresh: async () => {},
});

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
  /** Pre-fetched on the server so the first render is instant */
  initialUser: AuthUser | null;
  initialCompany: AuthCompany | null;
}

export function AuthProvider({
  children,
  initialUser,
  initialCompany,
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [company, setCompany] = useState<AuthCompany | null>(initialCompany);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function refresh() {
    setLoading(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setCompany(null);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("id, email, full_name, role, company_id")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        const typedProfile = profile as unknown as AuthUser;
        setUser(typedProfile);

        const { data: companyData } = await supabase
          .from("companies")
          .select(
            "id, name, subscription_plan, subscription_status, trial_ends_at"
          )
          .eq("id", typedProfile.company_id)
          .single();

        if (companyData) {
          setCompany(companyData as AuthCompany);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // Listen for auth state changes (e.g. token refresh, sign-out in another tab)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setCompany(null);
      }
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        refresh();
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gateCompany = company ?? {
    subscription_plan: "trial",
    subscription_status: "active",
    trial_ends_at: null,
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, refresh }}>
      <TrialGate company={gateCompany}>{children}</TrialGate>
    </AuthContext.Provider>
  );
}
