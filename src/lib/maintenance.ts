import { db } from "@/lib/db";
import { maintenanceExpenses } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

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
  contractId: string;
  userId: string;
  category: string;
  subcategory: string | null;
  description: string;
  amount: string;
  currency: string;
  expenseDate: string;
  provider: MaintenanceExpense["provider"];
  photos: string[] | null;
  invoiceUrl: string | null;
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  reimbursedAt: Date | null;
  isRecurring: boolean | null;
  recurringFrequency: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function rowToExpense(row: DBRow): MaintenanceExpense {
  return {
    id: row.id,
    contractId: row.contractId,
    userId: row.userId,
    category: row.category as MaintenanceExpense["category"],
    subcategory: row.subcategory ?? "",
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    date: row.expenseDate,
    provider: row.provider,
    photos: row.photos ?? [],
    invoiceUrl: row.invoiceUrl ?? "",
    status: row.status as MaintenanceExpense["status"],
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt ? (row.approvedAt as Date).toISOString() : null,
    reimbursedAt: row.reimbursedAt ? (row.reimbursedAt as Date).toISOString() : null,
    metadata: {
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
      isRecurring: row.isRecurring ?? false,
      recurringFrequency: row.recurringFrequency as MaintenanceExpense["metadata"]["recurringFrequency"],
    },
  };
}

function inputToRow(input: CreateMaintenanceExpenseInput, now: Date) {
  return {
    contractId: input.contractId,
    userId: input.userId,
    category: input.category,
    subcategory: input.subcategory,
    description: input.description,
    amount: String(input.amount),
    currency: input.currency,
    expenseDate: input.date,
    provider: input.provider,
    photos: input.photos ?? [],
    invoiceUrl: input.invoiceUrl ?? "",
    status: "pending" as const,
    approvedBy: null,
    approvedAt: null,
    reimbursedAt: null,
    isRecurring: input.isRecurring ?? false,
    recurringFrequency: input.recurringFrequency ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function createMaintenanceExpense(
  input: CreateMaintenanceExpenseInput
): Promise<MaintenanceExpense> {
  const now = new Date();
  const id = `maint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const row = {
    id,
    ...inputToRow(input, now),
  };

  const [result] = await db.insert(maintenanceExpenses).values(row).returning();

  return rowToExpense(result as DBRow);
}

export async function updateMaintenanceExpense(
  id: string,
  input: UpdateMaintenanceExpenseInput
): Promise<MaintenanceExpense | null> {
  const now = new Date();

  const updateData: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.contractId !== undefined) updateData.contractId = input.contractId;
  if (input.userId !== undefined) updateData.userId = input.userId;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.subcategory !== undefined) updateData.subcategory = input.subcategory;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.amount !== undefined) updateData.amount = String(input.amount);
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.date !== undefined) updateData.expenseDate = input.date;
  if (input.provider !== undefined) updateData.provider = input.provider;
  if (input.photos !== undefined) updateData.photos = input.photos;
  if (input.invoiceUrl !== undefined) updateData.invoiceUrl = input.invoiceUrl;
  if (input.isRecurring !== undefined) updateData.isRecurring = input.isRecurring;
  if (input.recurringFrequency !== undefined) updateData.recurringFrequency = input.recurringFrequency;

  if (input.status !== undefined) {
    updateData.status = input.status;

    if (input.status === "approved") {
      updateData.approvedBy = input.approvedBy ?? null;
      updateData.approvedAt = now;
    }

    if (input.status === "reimbursed") {
      updateData.reimbursedAt = now;
    }
  }

  const [result] = await db.update(maintenanceExpenses)
    .set(updateData)
    .where(eq(maintenanceExpenses.id, id))
    .returning();

  if (!result) return null;
  return rowToExpense(result as DBRow);
}

export async function getMaintenanceExpense(id: string): Promise<MaintenanceExpense | null> {
  const [row] = await db.select().from(maintenanceExpenses)
    .where(eq(maintenanceExpenses.id, id))
    .limit(1);

  if (!row) return null;
  return rowToExpense(row as DBRow);
}

export async function getMaintenanceExpensesByContract(
  contractId: string
): Promise<MaintenanceExpense[]> {
  const rows = await db.select().from(maintenanceExpenses)
    .where(eq(maintenanceExpenses.contractId, contractId))
    .orderBy(desc(maintenanceExpenses.expenseDate));

  return (rows as DBRow[]).map(rowToExpense);
}

export async function getMaintenanceExpensesByUser(
  userId: string
): Promise<MaintenanceExpense[]> {
  const rows = await db.select().from(maintenanceExpenses)
    .where(eq(maintenanceExpenses.userId, userId))
    .orderBy(desc(maintenanceExpenses.expenseDate));

  return (rows as DBRow[]).map(rowToExpense);
}

export async function deleteMaintenanceExpense(id: string): Promise<boolean> {
  try {
    await db.delete(maintenanceExpenses).where(eq(maintenanceExpenses.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function addPhotoToExpense(
  expenseId: string,
  photoUrl: string
): Promise<MaintenanceExpense | null> {
  const now = new Date();

  const [existing] = await db.select({ photos: maintenanceExpenses.photos })
    .from(maintenanceExpenses)
    .where(eq(maintenanceExpenses.id, expenseId))
    .limit(1);

  if (!existing) return null;

  const currentPhotos: string[] = existing.photos ?? [];
  const updatedPhotos = [...currentPhotos, photoUrl];

  const [result] = await db.update(maintenanceExpenses)
    .set({
      photos: updatedPhotos,
      updatedAt: now,
    })
    .where(eq(maintenanceExpenses.id, expenseId))
    .returning();

  if (!result) return null;
  return rowToExpense(result as DBRow);
}

export async function removePhotoFromExpense(
  expenseId: string,
  photoUrl: string
): Promise<MaintenanceExpense | null> {
  const now = new Date();

  const [existing] = await db.select({ photos: maintenanceExpenses.photos })
    .from(maintenanceExpenses)
    .where(eq(maintenanceExpenses.id, expenseId))
    .limit(1);

  if (!existing) return null;

  const currentPhotos: string[] = existing.photos ?? [];
  const updatedPhotos = currentPhotos.filter((p) => p !== photoUrl);

  const [result] = await db.update(maintenanceExpenses)
    .set({
      photos: updatedPhotos,
      updatedAt: now,
    })
    .where(eq(maintenanceExpenses.id, expenseId))
    .returning();

  if (!result) return null;
  return rowToExpense(result as DBRow);
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
