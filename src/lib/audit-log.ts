import { supabaseAdmin } from "@/lib/supabase";

type AuditAction =
  | "user.signup"
  | "user.login"
  | "user.delete_account"
  | "subscription.change_plan"
  | "subscription.cancel"
  | "filter.create"
  | "filter.delete"
  | "contract.create"
  | "contract.delete"
  | "maintenance.create"
  | "profile.update";

export async function logAuditAction(
  action: AuditAction,
  userId: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    meta: meta ?? {},
  });

  if (error) {
    console.error("[audit-log] Failed to insert:", error.message);
  }
}
