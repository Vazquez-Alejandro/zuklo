import { supabaseAdmin } from "./supabase";

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
    userId: row.user_id as string,
    personalInfo: row.personal_info as TenantProfile["personalInfo"],
    employment: row.employment as TenantProfile["employment"],
    income: row.income as TenantProfile["income"],
    guarantor: row.guarantor as TenantProfile["guarantor"],
    coHabitants: (row.co_habitants as TenantProfile["coHabitants"]) || [],
    pets: (row.pets as TenantProfile["pets"]) || [],
    references: (row.references_data as TenantProfile["references"]) || [],
    rentalHistory: (row.rental_history as TenantProfile["rentalHistory"]) || [],
    documents: row.documents as TenantProfile["documents"],
    metadata: {
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      completedAt: (row.completed_at as string) || null,
      isVerified: (row.is_verified as boolean) || false,
      verificationScore: (row.verification_score as number) || 0,
    },
  };
}

export async function createTenantProfile(input: CreateTenantProfileInput): Promise<TenantProfile> {
  const now = new Date().toISOString();
  const id = `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const row = {
    id,
    user_id: input.userId,
    personal_info: input.personalInfo,
    employment: input.employment,
    income: input.income,
    guarantor: input.guarantor,
    co_habitants: input.coHabitants || [],
    pets: input.pets || [],
    references_data: input.references || [],
    rental_history: input.rentalHistory || [],
    documents: input.documents || {
      dniFront: "",
      dniBack: "",
      proofOfIncome: "",
      proofOfAddress: "",
      criminalRecord: "",
      creditReport: "",
    },
    is_verified: false,
    verification_score: calculateVerificationScore(input),
    completed_at: null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("tenant_profiles")
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create tenant profile: ${error.message}`);
  }

  return rowToProfile(data);
}

export async function updateTenantProfile(
  id: string,
  input: UpdateTenantProfileInput
): Promise<TenantProfile | null> {
  const { data: existing } = await supabaseAdmin
    .from("tenant_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) return null;

  const merged = {
    personal_info: input.personalInfo || existing.personal_info,
    employment: input.employment || existing.employment,
    income: input.income || existing.income,
    guarantor: input.guarantor || existing.guarantor,
    co_habitants: input.coHabitants || existing.co_habitants,
    pets: input.pets || existing.pets,
    references_data: input.references || existing.references_data,
    rental_history: input.rentalHistory || existing.rental_history,
    documents: input.documents || existing.documents,
    updated_at: new Date().toISOString(),
    verification_score: calculateVerificationScore({
      userId: existing.user_id,
      personalInfo: input.personalInfo || existing.personal_info,
      employment: input.employment || existing.employment,
      income: input.income || existing.income,
      guarantor: input.guarantor || existing.guarantor,
      coHabitants: input.coHabitants || existing.co_habitants,
      pets: input.pets || existing.pets,
      references: input.references || existing.references_data,
      rentalHistory: input.rentalHistory || existing.rental_history,
      documents: input.documents || existing.documents,
    } as CreateTenantProfileInput),
  };

  const { data, error } = await supabaseAdmin
    .from("tenant_profiles")
    .update(merged)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update tenant profile: ${error.message}`);
  }

  return rowToProfile(data);
}

export async function getTenantProfile(id: string): Promise<TenantProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("tenant_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return rowToProfile(data);
}

export async function getTenantProfileByUser(userId: string): Promise<TenantProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("tenant_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return rowToProfile(data);
}

export async function getAllTenantProfiles(): Promise<TenantProfile[]> {
  const { data, error } = await supabaseAdmin
    .from("tenant_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map(rowToProfile);
}

export async function deleteTenantProfile(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("tenant_profiles")
    .delete()
    .eq("id", id);

  return !error;
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
