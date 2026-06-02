export interface TenantProfile {
  id: string;
  userId: string;

  personalInfo: {
    firstName: string;
    lastName: string;
    dni: string;
    cuil: string;
    dateOfBirth: string;
    nationality: string;
    maritalStatus: string;
    phone: string;
    email: string;
    currentAddress: string;
  };

  employment: {
    situation: "employed" | "self-employed" | "retired" | "student" | "unemployed";
    companyName: string;
    position: string;
    seniority: string;
    monthlyIncome: number;
    payslipAvailable: boolean;
    contractType: string;
    workAddress: string;
    workPhone: string;
  };

  income: {
    primaryIncome: number;
    secondaryIncome: number;
    totalIncome: number;
    incomeSource: string;
    bankStatements: boolean;
    taxReturns: boolean;
  };

  guarantor: {
    hasGuarantor: boolean;
    name: string;
    dni: string;
    phone: string;
    email: string;
    relationship: string;
    address: string;
    companyName: string;
    monthlyIncome: number;
    isCorporate: boolean;
    corporateName: string;
    corporateCuit: string;
  };

  coHabitants: Array<{
    name: string;
    dni: string;
    relationship: string;
    age: number;
    occupation: string;
  }>;

  pets: Array<{
    type: "dog" | "cat" | "bird" | "other";
    breed: string;
    name: string;
    weight: number;
    vaccinated: boolean;
    sterilized: boolean;
  }>;

  references: Array<{
    name: string;
    relationship: string;
    phone: string;
    email: string;
    knownSince: string;
  }>;

  rentalHistory: Array<{
    address: string;
    landlord: string;
    landlordPhone: string;
    duration: string;
    rentAmount: number;
    reasonForLeaving: string;
  }>;

  documents: {
    dniFront: string;
    dniBack: string;
    proofOfIncome: string;
    proofOfAddress: string;
    criminalRecord: string;
    creditReport: string;
  };

  metadata: {
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    isVerified: boolean;
    verificationScore: number;
  };
}

export interface CreateTenantProfileInput {
  userId: string;
  personalInfo: TenantProfile["personalInfo"];
  employment: TenantProfile["employment"];
  income: TenantProfile["income"];
  guarantor: TenantProfile["guarantor"];
  coHabitants?: TenantProfile["coHabitants"];
  pets?: TenantProfile["pets"];
  references?: TenantProfile["references"];
  rentalHistory?: TenantProfile["rentalHistory"];
  documents?: TenantProfile["documents"];
}

export interface UpdateTenantProfileInput extends Partial<CreateTenantProfileInput> {}

const profilesStore = new Map<string, TenantProfile>();

export function createTenantProfile(input: CreateTenantProfileInput): TenantProfile {
  const now = new Date().toISOString();
  const profile: TenantProfile = {
    id: `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    personalInfo: input.personalInfo,
    employment: input.employment,
    income: input.income,
    guarantor: input.guarantor,
    coHabitants: input.coHabitants || [],
    pets: input.pets || [],
    references: input.references || [],
    rentalHistory: input.rentalHistory || [],
    documents: input.documents || {
      dniFront: "",
      dniBack: "",
      proofOfIncome: "",
      proofOfAddress: "",
      criminalRecord: "",
      creditReport: "",
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      isVerified: false,
      verificationScore: calculateVerificationScore(input),
    },
  };

  profilesStore.set(profile.id, profile);
  return profile;
}

export function updateTenantProfile(
  id: string,
  input: UpdateTenantProfileInput
): TenantProfile | null {
  const existing = profilesStore.get(id);
  if (!existing) return null;

  const updated: TenantProfile = {
    ...existing,
    ...input,
    personalInfo: input.personalInfo || existing.personalInfo,
    employment: input.employment || existing.employment,
    income: input.income || existing.income,
    guarantor: input.guarantor || existing.guarantor,
    coHabitants: input.coHabitants || existing.coHabitants,
    pets: input.pets || existing.pets,
    references: input.references || existing.references,
    rentalHistory: input.rentalHistory || existing.rentalHistory,
    documents: input.documents || existing.documents,
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
      verificationScore: calculateVerificationScore({
        ...existing,
        ...input,
      } as CreateTenantProfileInput),
    },
  };

  profilesStore.set(id, updated);
  return updated;
}

export function getTenantProfile(id: string): TenantProfile | null {
  return profilesStore.get(id) || null;
}

export function getTenantProfileByUser(userId: string): TenantProfile | null {
  return Array.from(profilesStore.values()).find((p) => p.userId === userId) || null;
}

export function getAllTenantProfiles(): TenantProfile[] {
  return Array.from(profilesStore.values());
}

export function deleteTenantProfile(id: string): boolean {
  return profilesStore.delete(id);
}

function calculateVerificationScore(profile: CreateTenantProfileInput | TenantProfile): number {
  let score = 0;

  if (profile.personalInfo?.dni) score += 15;
  if (profile.personalInfo?.cuil) score += 5;
  if (profile.employment?.companyName) score += 10;
  if (profile.employment?.monthlyIncome > 0) score += 15;
  if (profile.income?.primaryIncome > 0) score += 10;
  if (profile.guarantor?.hasGuarantor && profile.guarantor?.name) score += 15;
  if (profile.coHabitants && profile.coHabitants.length > 0) score += 5;
  if (profile.references && profile.references.length >= 2) score += 10;
  if (profile.rentalHistory && profile.rentalHistory.length > 0) score += 10;
  if (profile.documents?.dniFront) score += 5;

  return Math.min(score, 100);
}

export function generateProfileSummary(profile: TenantProfile): {
  displayName: string;
  verificationLevel: "basic" | "standard" | "premium" | "verified";
  monthlyIncomeFormatted: string;
  guarantorStatus: string;
  petCount: number;
  coHabitantCount: number;
  completeness: number;
} {
  const score = profile.metadata.verificationScore;
  let level: "basic" | "standard" | "premium" | "verified" = "basic";
  if (score >= 90) level = "verified";
  else if (score >= 70) level = "premium";
  else if (score >= 50) level = "standard";

  const income = profile.income.primaryIncome + profile.income.secondaryIncome;

  return {
    displayName: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
    verificationLevel: level,
    monthlyIncomeFormatted: new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(income),
    guarantorStatus: profile.guarantor.hasGuarantor
      ? profile.guarantor.isCorporate
        ? `Garantía corporativa: ${profile.guarantor.corporateName}`
        : `Garantía personal: ${profile.guarantor.name}`
      : "Sin garantía",
    petCount: profile.pets.length,
    coHabitantCount: profile.coHabitants.length,
    completeness: score,
  };
}
