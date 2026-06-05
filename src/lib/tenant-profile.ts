import { db } from "@/lib/db";
import { tenantProfiles } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

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

export type UpdateTenantProfileInput = Partial<CreateTenantProfileInput>;

function rowToProfile(row: Record<string, unknown>): TenantProfile {
  return {
    id: row.id as string,
    userId: row.userId as string,
    personalInfo: row.personalInfo as TenantProfile["personalInfo"],
    employment: row.employment as TenantProfile["employment"],
    income: row.income as TenantProfile["income"],
    guarantor: row.guarantor as TenantProfile["guarantor"],
    coHabitants: (row.coHabitants as TenantProfile["coHabitants"]) || [],
    pets: (row.pets as TenantProfile["pets"]) || [],
    references: (row.referencesList as TenantProfile["references"]) || [],
    rentalHistory: (row.rentalHistory as TenantProfile["rentalHistory"]) || [],
    documents: row.documents as TenantProfile["documents"],
    metadata: {
      createdAt: (row.createdAt as Date).toISOString(),
      updatedAt: (row.updatedAt as Date).toISOString(),
      completedAt: row.completedAt ? (row.completedAt as Date).toISOString() : null,
      isVerified: (row.isVerified as boolean) || false,
      verificationScore: (row.verificationScore as number) || 0,
    },
  };
}

export async function createTenantProfile(input: CreateTenantProfileInput): Promise<TenantProfile> {
  const now = new Date();
  const id = `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const row = {
    id,
    userId: input.userId,
    personalInfo: input.personalInfo,
    employment: input.employment,
    income: input.income,
    guarantor: input.guarantor,
    coHabitants: input.coHabitants || [],
    pets: input.pets || [],
    referencesList: input.references || [],
    rentalHistory: input.rentalHistory || [],
    documents: input.documents || {
      dniFront: "",
      dniBack: "",
      proofOfIncome: "",
      proofOfAddress: "",
      criminalRecord: "",
      creditReport: "",
    },
    isVerified: false,
    verificationScore: calculateVerificationScore(input),
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const [result] = await db.insert(tenantProfiles).values(row).returning();

  return rowToProfile(result);
}

export async function updateTenantProfile(
  id: string,
  input: UpdateTenantProfileInput
): Promise<TenantProfile | null> {
  const [existing] = await db.select().from(tenantProfiles)
    .where(eq(tenantProfiles.id, id))
    .limit(1);

  if (!existing) return null;

  const merged = {
    personalInfo: input.personalInfo || existing.personalInfo,
    employment: input.employment || existing.employment,
    income: input.income || existing.income,
    guarantor: input.guarantor || existing.guarantor,
    coHabitants: input.coHabitants || existing.coHabitants,
    pets: input.pets || existing.pets,
    referencesList: input.references || existing.referencesList,
    rentalHistory: input.rentalHistory || existing.rentalHistory,
    documents: input.documents || existing.documents,
    updatedAt: new Date(),
    verificationScore: calculateVerificationScore({
      userId: existing.userId,
      personalInfo: input.personalInfo || existing.personalInfo,
      employment: input.employment || existing.employment,
      income: input.income || existing.income,
      guarantor: input.guarantor || existing.guarantor,
      coHabitants: input.coHabitants || existing.coHabitants,
      pets: input.pets || existing.pets,
      references: input.references || existing.referencesList,
      rentalHistory: input.rentalHistory || existing.rentalHistory,
      documents: input.documents || existing.documents,
    } as CreateTenantProfileInput),
  };

  const [result] = await db.update(tenantProfiles)
    .set(merged)
    .where(eq(tenantProfiles.id, id))
    .returning();

  if (!result) {
    throw new Error("Failed to update tenant profile");
  }

  return rowToProfile(result);
}

export async function getTenantProfile(id: string): Promise<TenantProfile | null> {
  const [row] = await db.select().from(tenantProfiles)
    .where(eq(tenantProfiles.id, id))
    .limit(1);

  if (!row) return null;

  return rowToProfile(row);
}

export async function getTenantProfileByUser(userId: string): Promise<TenantProfile | null> {
  const [row] = await db.select().from(tenantProfiles)
    .where(eq(tenantProfiles.userId, userId))
    .limit(1);

  if (!row) return null;

  return rowToProfile(row);
}

export async function getAllTenantProfiles(): Promise<TenantProfile[]> {
  const rows = await db.select().from(tenantProfiles)
    .orderBy(desc(tenantProfiles.createdAt));

  return rows.map(rowToProfile);
}

export async function deleteTenantProfile(id: string): Promise<boolean> {
  try {
    await db.delete(tenantProfiles).where(eq(tenantProfiles.id, id));
    return true;
  } catch {
    return false;
  }
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
