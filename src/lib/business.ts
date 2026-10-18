// Shared helpers for loading the signed-in user's business and formatting values.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Business = Tables<"businesses">;

/** Loads the first business the signed-in user belongs to. */
export function useBusiness() {
  return useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("business_members")
        .select("role, businesses(*)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data?.businesses) throw new Error("No business found for this account");
      return { business: data.businesses as Business, role: data.role, user };
    },
  });
}

/** Convenience: returns the business id once loaded (or undefined). */
export function useBusinessId() {
  return useBusiness().data?.business.id;
}

export function formatMoney(value: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}
