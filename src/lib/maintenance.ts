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

const expensesStore = new Map<string, MaintenanceExpense>();

export function createMaintenanceExpense(
  input: CreateMaintenanceExpenseInput
): MaintenanceExpense {
  const now = new Date().toISOString();
  const expense: MaintenanceExpense = {
    id: `maint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contractId: input.contractId,
    userId: input.userId,
    category: input.category,
    subcategory: input.subcategory,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    date: input.date,
    provider: input.provider,
    photos: input.photos || [],
    invoiceUrl: input.invoiceUrl || "",
    status: "pending",
    approvedBy: null,
    approvedAt: null,
    reimbursedAt: null,
    metadata: {
      createdAt: now,
      updatedAt: now,
      isRecurring: input.isRecurring || false,
      recurringFrequency: input.recurringFrequency || null,
    },
  };

  expensesStore.set(expense.id, expense);
  return expense;
}

export function updateMaintenanceExpense(
  id: string,
  input: UpdateMaintenanceExpenseInput
): MaintenanceExpense | null {
  const existing = expensesStore.get(id);
  if (!existing) return null;

  const updated: MaintenanceExpense = {
    ...existing,
    ...input,
    provider: input.provider || existing.provider,
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  if (input.status === "approved") {
    updated.approvedBy = input.approvedBy || null;
    updated.approvedAt = new Date().toISOString();
  }

  if (input.status === "reimbursed") {
    updated.reimbursedAt = new Date().toISOString();
  }

  expensesStore.set(id, updated);
  return updated;
}

export function getMaintenanceExpense(id: string): MaintenanceExpense | null {
  return expensesStore.get(id) || null;
}

export function getMaintenanceExpensesByContract(
  contractId: string
): MaintenanceExpense[] {
  return Array.from(expensesStore.values())
    .filter((e) => e.contractId === contractId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getMaintenanceExpensesByUser(
  userId: string
): MaintenanceExpense[] {
  return Array.from(expensesStore.values())
    .filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function deleteMaintenanceExpense(id: string): boolean {
  return expensesStore.delete(id);
}

export function addPhotoToExpense(
  expenseId: string,
  photoUrl: string
): MaintenanceExpense | null {
  const expense = expensesStore.get(expenseId);
  if (!expense) return null;

  expense.photos.push(photoUrl);
  expense.metadata.updatedAt = new Date().toISOString();

  return expense;
}

export function removePhotoFromExpense(
  expenseId: string,
  photoUrl: string
): MaintenanceExpense | null {
  const expense = expensesStore.get(expenseId);
  if (!expense) return null;

  expense.photos = expense.photos.filter((p) => p !== photoUrl);
  expense.metadata.updatedAt = new Date().toISOString();

  return expense;
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

export function getExpenseSummary(
  contractId: string
): ExpenseSummary {
  const expenses = getMaintenanceExpensesByContract(contractId);

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
