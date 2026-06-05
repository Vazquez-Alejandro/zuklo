import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { eq } from "drizzle-orm";

export interface Contract {
  id: string;
  userId: string;
  propertyId: string;

  landlord: {
    name: string;
    dni: string;
    phone: string;
    email: string;
  };

  property: {
    address: string;
    city: string;
    province: string;
    country: string;
    surface: number;
    rooms: number;
  };

  financials: {
    monthlyRent: number;
    currency: string;
    deposit: number;
    expenses: number;
    expensesDueDay: number;
    rentDueDay: number;
    paymentMethod: string;
    bankAccount: string;
  };

  terms: {
    startDate: string;
    endDate: string;
    durationMonths: number;
    renewalType: "automatic" | "manual";
    noticePeriodDays: number;
    earlyTerminationPenalty: number;
  };

  indexation: {
    type: "icl" | "ipc" | "fixed" | "custom";
    customPercentage: number | null;
    baseIndexValue: number | null;
    baseIndexDate: string | null;
    lastAdjustmentDate: string | null;
    nextAdjustmentDate: string | null;
  };

  adjustments: Array<{
    date: string;
    previousRent: number;
    newRent: number;
    indexUsed: string;
    indexValue: number;
    percentage: number;
  }>;

  status: "active" | "pending" | "expired" | "terminated";

  metadata: {
    createdAt: string;
    updatedAt: string;
    signedAt: string | null;
    contractDocumentUrl: string | null;
  };
}

export interface CreateContractInput {
  userId: string;
  propertyId: string;
  landlord: Contract["landlord"];
  property: Contract["property"];
  financials: Contract["financials"];
  terms: Contract["terms"];
  indexation: Contract["indexation"];
}

export type UpdateContractInput = Partial<CreateContractInput> & {
  metadata?: Partial<Contract["metadata"]>;
};

function mapRowToContract(row: Record<string, unknown>): Contract {
  return {
    id: row.id as string,
    userId: row.userId as string,
    propertyId: row.propertyId as string,
    landlord: row.landlord as Contract["landlord"],
    property: row.property as Contract["property"],
    financials: row.financials as Contract["financials"],
    terms: row.terms as Contract["terms"],
    indexation: row.indexation as Contract["indexation"],
    adjustments: (row.adjustments as Contract["adjustments"]) ?? [],
    status: row.status as Contract["status"],
    metadata: {
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
      signedAt: row.signedAt ? (row.signedAt as Date).toISOString() : null,
      contractDocumentUrl: (row.contractDocumentUrl as string) ?? null,
    },
  };
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const [row] = await db.insert(contracts).values({
    userId: input.userId,
    propertyId: input.propertyId,
    landlord: input.landlord,
    property: input.property,
    financials: input.financials,
    terms: input.terms,
    indexation: input.indexation,
    adjustments: [],
    status: "pending",
  }).returning();

  return mapRowToContract(row);
}

export async function updateContract(
  id: string,
  input: UpdateContractInput
): Promise<Contract | null> {
  const updateFields: Record<string, unknown> = {};

  if (input.userId !== undefined) updateFields.userId = input.userId;
  if (input.propertyId !== undefined) updateFields.propertyId = input.propertyId;
  if (input.landlord !== undefined) updateFields.landlord = input.landlord;
  if (input.property !== undefined) updateFields.property = input.property;
  if (input.financials !== undefined) updateFields.financials = input.financials;
  if (input.terms !== undefined) updateFields.terms = input.terms;
  if (input.indexation !== undefined) updateFields.indexation = input.indexation;
  if (input.metadata?.signedAt !== undefined) updateFields.signedAt = input.metadata.signedAt;
  if (input.metadata?.contractDocumentUrl !== undefined) updateFields.contractDocumentUrl = input.metadata.contractDocumentUrl;

  if (Object.keys(updateFields).length === 0) {
    return getContract(id);
  }

  updateFields.updatedAt = new Date();

  const [row] = await db.update(contracts)
    .set(updateFields)
    .where(eq(contracts.id, id))
    .returning();

  if (!row) return null;
  return mapRowToContract(row);
}

export async function getContract(id: string): Promise<Contract | null> {
  const [row] = await db.select().from(contracts)
    .where(eq(contracts.id, id))
    .limit(1);

  if (!row) return null;
  return mapRowToContract(row);
}

export async function getContractsByUser(userId: string): Promise<Contract[]> {
  const rows = await db.select().from(contracts)
    .where(eq(contracts.userId, userId));

  return rows.map(mapRowToContract);
}

export async function getActiveContracts(): Promise<Contract[]> {
  const rows = await db.select().from(contracts)
    .where(eq(contracts.status, "active"));

  return rows.map(mapRowToContract);
}

export async function deleteContract(id: string): Promise<boolean> {
  try {
    await db.delete(contracts).where(eq(contracts.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function activateContract(id: string): Promise<Contract | null> {
  const now = new Date();
  const [row] = await db.update(contracts)
    .set({
      status: "active",
      signedAt: now,
      updatedAt: now,
    })
    .where(eq(contracts.id, id))
    .returning();

  if (!row) return null;
  return mapRowToContract(row);
}

export function getContractSummary(contract: Contract): {
  daysUntilEnd: number;
  daysUntilNextPayment: number;
  daysUntilRentDue: number;
  daysUntilExpensesDue: number;
  totalMonthlyCost: number;
  currentRentFormatted: string;
  nextAdjustmentDate: string | null;
  statusLabel: string;
} {
  const now = new Date();
  const endDate = new Date(contract.terms.endDate);
  const daysUntilEnd = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const today = now.getDate();
  const rentDue = contract.financials.rentDueDay;
  const expensesDue = contract.financials.expensesDueDay;

  let daysUntilRentDue = rentDue - today;
  if (daysUntilRentDue < 0) daysUntilRentDue += 30;

  let daysUntilExpensesDue = expensesDue - today;
  if (daysUntilExpensesDue < 0) daysUntilExpensesDue += 30;

  const daysUntilNextPayment = Math.min(daysUntilRentDue, daysUntilExpensesDue);

  const totalMonthlyCost =
    contract.financials.monthlyRent + contract.financials.expenses;

  const currentRent = contract.adjustments.length > 0
    ? contract.adjustments[contract.adjustments.length - 1].newRent
    : contract.financials.monthlyRent;

  const currentRentFormatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: contract.financials.currency,
    maximumFractionDigits: 0,
  }).format(currentRent);

  const statusLabels: Record<string, string> = {
    active: "Activo",
    pending: "Pendiente de firma",
    expired: "Vencido",
    terminated: "Rescindido",
  };

  return {
    daysUntilEnd,
    daysUntilNextPayment,
    daysUntilRentDue,
    daysUntilExpensesDue,
    totalMonthlyCost,
    currentRentFormatted,
    nextAdjustmentDate: contract.indexation.nextAdjustmentDate,
    statusLabel: statusLabels[contract.status] || contract.status,
  };
}
