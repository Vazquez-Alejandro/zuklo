import { supabaseAdmin } from "./supabase";

export interface MaintenanceExpense {
  id: string;
  contractId: string;
  userId: string;

  category: "plumbing" | "electrical" | "structural" | "appliance" | "cleaning" | "garden" | "pest-control" | "other";
  subcategory: string;
  description: string;

  amount: number;
  currency: string;
  date: string;

  provider: {
    name: string;
    phone: string;
    email: string;
    company: string;
    invoiceNumber: string;
  };

  photos: string[];
  invoiceUrl: string;

  status: "pending" | "approved" | "reimbursed" | "denied";

  approvedBy: string | null;
  approvedAt: string | null;
  reimbursedAt: string | null;

  metadata: {
    createdAt: string;
    updatedAt: string;
    isRecurring: boolean;
    recurringFrequency: "monthly" | "quarterly" | "annual" | null;
  };
}

export interface CreateMaintenanceExpenseInput {
  contractId: string;
  userId: string;
  category: MaintenanceExpense["category"];
  subcategory: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  provider: MaintenanceExpense["provider"];
  photos?: string[];
  invoiceUrl?: string;
  isRecurring?: boolean;
  recurringFrequency?: MaintenanceExpense["metadata"]["recurringFrequency"];
}

export interface UpdateMaintenanceExpenseInput extends Partial<CreateMaintenanceExpenseInput> {
  status?: MaintenanceExpense["status"];
  approvedBy?: string;
}

interface DBRow {
  id: string;
  contract_id: string;
  user_id: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  provider: MaintenanceExpense["provider"];
  photos: string[];
  invoice_url: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  reimbursed_at: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  created_at: string;
  updated_at: string;
}

function rowToExpense(row: DBRow): MaintenanceExpense {
  return {
    id: row.id,
    contractId: row.contract_id,
    userId: row.user_id,
    category: row.category as MaintenanceExpense["category"],
    subcategory: row.subcategory,
    description: row.description,
    amount: row.amount,
    currency: row.currency,
    date: row.expense_date,
    provider: row.provider,
    photos: row.photos ?? [],
    invoiceUrl: row.invoice_url,
    status: row.status as MaintenanceExpense["status"],
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    reimbursedAt: row.reimbursed_at,
    metadata: {
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isRecurring: row.is_recurring,
      recurringFrequency: row.recurring_frequency as MaintenanceExpense["metadata"]["recurringFrequency"],
    },
  };
}

function inputToRow(input: CreateMaintenanceExpenseInput, now: string) {
  return {
    contract_id: input.contractId,
    user_id: input.userId,
    category: input.category,
    subcategory: input.subcategory,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    expense_date: input.date,
    provider: input.provider,
    photos: input.photos ?? [],
    invoice_url: input.invoiceUrl ?? "",
    status: "pending" as const,
    is_recurring: input.isRecurring ?? false,
    recurring_frequency: input.recurringFrequency ?? null,
    created_at: now,
    updated_at: now,
  };
}

export async function createMaintenanceExpense(
  input: CreateMaintenanceExpenseInput
): Promise<MaintenanceExpense> {
  const now = new Date().toISOString();
  const id = `maint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const row = {
    id,
    ...inputToRow(input, now),
  };

  const { data, error } = await supabaseAdmin
    .from("maintenance_expenses")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToExpense(data as DBRow);
}

export async function updateMaintenanceExpense(
  id: string,
  input: UpdateMaintenanceExpenseInput
): Promise<MaintenanceExpense | null> {
  const now = new Date().toISOString();

  const updateData: Record<string, unknown> = {
    updated_at: now,
  };

  if (input.contractId !== undefined) updateData.contract_id = input.contractId;
  if (input.userId !== undefined) updateData.user_id = input.userId;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.subcategory !== undefined) updateData.subcategory = input.subcategory;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.date !== undefined) updateData.expense_date = input.date;
  if (input.provider !== undefined) updateData.provider = input.provider;
  if (input.photos !== undefined) updateData.photos = input.photos;
  if (input.invoiceUrl !== undefined) updateData.invoice_url = input.invoiceUrl;
  if (input.isRecurring !== undefined) updateData.is_recurring = input.isRecurring;
  if (input.recurringFrequency !== undefined) updateData.recurring_frequency = input.recurringFrequency;

  if (input.status !== undefined) {
    updateData.status = input.status;

    if (input.status === "approved") {
      updateData.approved_by = input.approvedBy ?? null;
      updateData.approved_at = now;
    }

    if (input.status === "reimbursed") {
      updateData.reimbursed_at = now;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("maintenance_expenses")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return rowToExpense(data as DBRow);
}

export async function getMaintenanceExpense(id: string): Promise<MaintenanceExpense | null> {
  const { data, error } = await supabaseAdmin
    .from("maintenance_expenses")
    .select()
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToExpense(data as DBRow);
}

export async function getMaintenanceExpensesByContract(
  contractId: string
): Promise<MaintenanceExpense[]> {
  const { data, error } = await supabaseAdmin
    .from("maintenance_expenses")
    .select()
    .eq("contract_id", contractId)
    .order("expense_date", { ascending: false });

  if (error || !data) return [];
  return (data as DBRow[]).map(rowToExpense);
}

export async function getMaintenanceExpensesByUser(
  userId: string
): Promise<MaintenanceExpense[]> {
  const { data, error } = await supabaseAdmin
    .from("maintenance_expenses")
    .select()
    .eq("user_id", userId)
    .order("expense_date", { ascending: false });

  if (error || !data) return [];
  return (data as DBRow[]).map(rowToExpense);
}

export async function deleteMaintenanceExpense(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("maintenance_expenses")
    .delete()
    .eq("id", id);

  return !error;
}

export async function addPhotoToExpense(
  expenseId: string,
  photoUrl: string
): Promise<MaintenanceExpense | null> {
  const now = new Date().toISOString();

  const { data, error: fetchError } = await supabaseAdmin
    .from("maintenance_expenses")
    .select("photos")
    .eq("id", expenseId)
    .single();

  if (fetchError || !data) return null;

  const currentPhotos: string[] = data.photos ?? [];
  const updatedPhotos = [...currentPhotos, photoUrl];

  const { data: updated, error } = await supabaseAdmin
    .from("maintenance_expenses")
    .update({
      photos: updatedPhotos,
      updated_at: now,
    })
    .eq("id", expenseId)
    .select()
    .single();

  if (error) return null;
  return rowToExpense(updated as DBRow);
}

export async function removePhotoFromExpense(
  expenseId: string,
  photoUrl: string
): Promise<MaintenanceExpense | null> {
  const now = new Date().toISOString();

  const { data, error: fetchError } = await supabaseAdmin
    .from("maintenance_expenses")
    .select("photos")
    .eq("id", expenseId)
    .single();

  if (fetchError || !data) return null;

  const currentPhotos: string[] = data.photos ?? [];
  const updatedPhotos = currentPhotos.filter((p) => p !== photoUrl);

  const { data: updated, error } = await supabaseAdmin
    .from("maintenance_expenses")
    .update({
      photos: updatedPhotos,
      updated_at: now,
    })
    .eq("id", expenseId)
    .select()
    .single();

  if (error) return null;
  return rowToExpense(updated as DBRow);
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  reimbursedAmount: number;
  byCategory: Record<string, { count: number; amount: number }>;
  monthlyAverage: number;
}

export async function getExpenseSummary(
  contractId: string
): Promise<ExpenseSummary> {
  const expenses = await getMaintenanceExpensesByContract(contractId);

  const summary: ExpenseSummary = {
    totalExpenses: expenses.length,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    reimbursedAmount: 0,
    byCategory: {},
    monthlyAverage: 0,
  };

  for (const expense of expenses) {
    summary.totalAmount += expense.amount;

    if (expense.status === "pending") summary.pendingAmount += expense.amount;
    if (expense.status === "approved") summary.approvedAmount += expense.amount;
    if (expense.status === "reimbursed") summary.reimbursedAmount += expense.amount;

    if (!summary.byCategory[expense.category]) {
      summary.byCategory[expense.category] = { count: 0, amount: 0 };
    }
    summary.byCategory[expense.category].count++;
    summary.byCategory[expense.category].amount += expense.amount;
  }

  if (expenses.length > 0) {
    const dates = expenses.map((e) => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const monthsDiff = Math.max(
      1,
      (maxDate - minDate) / (1000 * 60 * 60 * 24 * 30)
    );
    summary.monthlyAverage = summary.totalAmount / monthsDiff;
  }

  return summary;
}

export const EXPENSE_CATEGORIES = {
  plumbing: {
    label: "Plomería",
    icon: "🔧",
    subcategories: ["Reparación de grifos", "Desatasco", "Reparación de cañerías", "Calentador de agua", "Otro"],
  },
  electrical: {
    label: "Electricidad",
    icon: "⚡",
    subcategories: ["Cortocircuito", "Instalación", "Reparación de llaves", "Tablero eléctrico", "Otro"],
  },
  structural: {
    label: "Estructural",
    icon: "🏗️",
    subcategories: ["Grietas", "Humedad", "Revoque", "Pintura", "Techo", "Otro"],
  },
  appliance: {
    label: "Electrodomésticos",
    icon: "🔌",
    subcategories: ["Heladera", "Lavarropas", "Horno", "Aire acondicionado", "Calefacción", "Otro"],
  },
  cleaning: {
    label: "Limpieza",
    icon: "🧹",
    subcategories: ["Limpieza profunda", "Desinfección", "Limpieza de vidrios", "Otro"],
  },
  garden: {
    label: "Jardín",
    icon: "🌿",
    subcategories: ["Poda", "Riego", "Plagas", "Césped", "Otro"],
  },
  "pest-control": {
    label: "Plagas",
    icon: "🐛",
    subcategories: ["Cucarachas", "Termitas", "Roedores", "Hormigas", "Otro"],
  },
  other: {
    label: "Otro",
    icon: "📋",
    subcategories: ["Otro"],
  },
};
