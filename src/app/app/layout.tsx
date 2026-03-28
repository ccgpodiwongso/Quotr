import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider } from "@/components/layout/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import type { User, Company } from "@/types/database";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch user profile from the users table
  const { data: profile } = (await supabase
    .from("users")
    .select("id, full_name, email, role, company_id")
    .eq("id", authUser.id)
    .single()) as {
    data: Pick<User, "id" | "full_name" | "email" | "role" | "company_id"> | null;
  };

  // Fetch company info including billing fields
  const { data: company } = profile?.company_id
    ? ((await supabase
        .from("companies")
        .select(
          "id, name, subscription_plan, subscription_status, trial_ends_at"
        )
        .eq("id", profile.company_id)
        .single()) as {
        data: Pick<
          Company,
          | "id"
          | "name"
          | "subscription_plan"
          | "subscription_status"
          | "trial_ends_at"
        > | null;
      })
    : { data: null };

  const layoutUser = {
    name: profile?.full_name ?? authUser.email?.split("@")[0] ?? "User",
    email: profile?.email ?? authUser.email ?? "",
  };

  const companyName = company?.name ?? "Quotr";

  // AuthProvider initial data (pre-fetched on server for instant first render)
  const initialUser = profile
    ? {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        company_id: profile.company_id,
      }
    : null;

  const initialCompany = company
    ? {
        id: company.id,
        name: company.name,
        subscription_plan: company.subscription_plan,
        subscription_status: company.subscription_status,
        trial_ends_at: company.trial_ends_at,
      }
    : null;

  return (
    <ToastProvider>
      <AuthProvider initialUser={initialUser} initialCompany={initialCompany}>
        <AppLayout user={layoutUser} companyName={companyName}>
          {children}
        </AppLayout>
      </AuthProvider>
    </ToastProvider>
  );
}
