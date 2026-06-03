import { supabaseAdmin } from "./supabase";

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
    userId: row.user_id as string,
    propertyId: row.property_id as string,
    landlord: row.landlord as Contract["landlord"],
    property: row.property as Contract["property"],
    financials: row.financials as Contract["financials"],
    terms: row.terms as Contract["terms"],
    indexation: row.indexation as Contract["indexation"],
    adjustments: (row.adjustments as Contract["adjustments"]) ?? [],
    status: row.status as Contract["status"],
    metadata: {
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      signedAt: (row.signed_at as string) ?? null,
      contractDocumentUrl: (row.contract_document_url as string) ?? null,
    },
  };
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const { data, error } = await supabaseAdmin
    .from("contracts")
    .insert({
      user_id: input.userId,
      property_id: input.propertyId,
      landlord: input.landlord,
      property: input.property,
      financials: input.financials,
      terms: input.terms,
      indexation: input.indexation,
      adjustments: [],
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToContract(data);
}

export async function updateContract(
  id: string,
  input: UpdateContractInput
): Promise<Contract | null> {
  const updateFields: Record<string, unknown> = {};

  if (input.userId !== undefined) updateFields.user_id = input.userId;
  if (input.propertyId !== undefined) updateFields.property_id = input.propertyId;
  if (input.landlord !== undefined) updateFields.landlord = input.landlord;
  if (input.property !== undefined) updateFields.property = input.property;
  if (input.financials !== undefined) updateFields.financials = input.financials;
  if (input.terms !== undefined) updateFields.terms = input.terms;
  if (input.indexation !== undefined) updateFields.indexation = input.indexation;
  if (input.metadata?.signedAt !== undefined) updateFields.signed_at = input.metadata.signedAt;
  if (input.metadata?.contractDocumentUrl !== undefined) updateFields.contract_document_url = input.metadata.contractDocumentUrl;

  if (Object.keys(updateFields).length === 0) {
    return getContract(id);
  }

  updateFields.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("contracts")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return mapRowToContract(data);
}

export async function getContract(id: string): Promise<Contract | null> {
  const { data, error } = await supabaseAdmin
    .from("contracts")
    .select()
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return mapRowToContract(data);
}

export async function getContractsByUser(userId: string): Promise<Contract[]> {
  const { data, error } = await supabaseAdmin
    .from("contracts")
    .select()
    .eq("user_id", userId);

  if (error || !data) return [];
  return data.map(mapRowToContract);
}

export async function getActiveContracts(): Promise<Contract[]> {
  const { data, error } = await supabaseAdmin
    .from("contracts")
    .select()
    .eq("status", "active");

  if (error || !data) return [];
  return data.map(mapRowToContract);
}

export async function deleteContract(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("contracts")
    .delete()
    .eq("id", id);

  return !error;
}

export async function activateContract(id: string): Promise<Contract | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("contracts")
    .update({
      status: "active",
      signed_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return null;
  return mapRowToContract(data);
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
