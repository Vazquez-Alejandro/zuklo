import { db } from "@/lib/db";
import { auditLogs } from "@/lib/schema";

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
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      meta: meta ?? {},
    });
  } catch (error) {
    console.error("[audit-log] Failed to insert:", error instanceof Error ? error.message : error);
  }
}
