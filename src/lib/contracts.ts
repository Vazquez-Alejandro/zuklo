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

const contractsStore = new Map<string, Contract>();

export function createContract(input: CreateContractInput): Contract {
  const now = new Date().toISOString();
  const contract: Contract = {
    id: `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    propertyId: input.propertyId,
    landlord: input.landlord,
    property: input.property,
    financials: input.financials,
    terms: input.terms,
    indexation: input.indexation,
    adjustments: [],
    status: "pending",
    metadata: {
      createdAt: now,
      updatedAt: now,
      signedAt: null,
      contractDocumentUrl: null,
    },
  };

  contractsStore.set(contract.id, contract);
  return contract;
}

export function updateContract(
  id: string,
  input: UpdateContractInput
): Contract | null {
  const existing = contractsStore.get(id);
  if (!existing) return null;

  const updated: Contract = {
    ...existing,
    ...input,
    landlord: input.landlord || existing.landlord,
    property: input.property || existing.property,
    financials: input.financials || existing.financials,
    terms: input.terms || existing.terms,
    indexation: input.indexation || existing.indexation,
    metadata: {
      ...existing.metadata,
      ...input.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  contractsStore.set(id, updated);
  return updated;
}

export function getContract(id: string): Contract | null {
  return contractsStore.get(id) || null;
}

export function getContractsByUser(userId: string): Contract[] {
  return Array.from(contractsStore.values()).filter((c) => c.userId === userId);
}

export function getActiveContracts(): Contract[] {
  return Array.from(contractsStore.values()).filter(
    (c) => c.status === "active"
  );
}

export function deleteContract(id: string): boolean {
  return contractsStore.delete(id);
}

export function activateContract(id: string): Contract | null {
  const contract = contractsStore.get(id);
  if (!contract) return null;

  contract.status = "active";
  contract.metadata.signedAt = new Date().toISOString();
  contract.metadata.updatedAt = new Date().toISOString();

  return contract;
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
