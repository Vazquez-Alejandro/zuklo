-- Zuklo Database Schema
-- Tenant Profiles, Contracts, Maintenance Expenses

-- =============================================
-- TENANT PROFILES TABLE (JSONB structure)
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  
  -- Personal Info (JSONB)
  personal_info JSONB NOT NULL DEFAULT '{}',
  -- { firstName, lastName, dni, cuil, dateOfBirth, nationality, maritalStatus, phone, email, currentAddress }
  
  -- Employment (JSONB)
  employment JSONB DEFAULT '{}',
  -- { situation, companyName, position, seniority, monthlyIncome, payslipAvailable, contractType, workAddress, workPhone }
  
  -- Income (JSONB)
  income JSONB DEFAULT '{}',
  -- { primaryIncome, secondaryIncome, totalIncome, incomeSource, bankStatements, taxReturns }
  
  -- Guarantor (JSONB)
  guarantor JSONB DEFAULT '{}',
  -- { hasGuarantor, name, dni, phone, email, relationship, address, companyName, monthlyIncome, isCorporate, corporateName, corporateCuit }
  
  -- Co-habitants (JSON array)
  co_habitants JSONB DEFAULT '[]',
  
  -- Pets (JSON array)
  pets JSONB DEFAULT '[]',
  
  -- References (JSON array)
  references JSONB DEFAULT '[]',
  
  -- Rental History (JSON array)
  rental_history JSONB DEFAULT '[]',
  
  -- Documents (JSONB)
  documents JSONB DEFAULT '{}',
  -- { dniFront, dniBack, proofOfIncome, proofOfAddress, criminalRecord, creditReport }
  
  -- Metadata
  completed_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  verification_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON tenant_profiles (user_id);

-- =============================================
-- CONTRACTS TABLE (JSONB structure)
-- =============================================
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  property_id TEXT,
  
  -- Landlord (JSONB)
  landlord JSONB NOT NULL DEFAULT '{}',
  -- { name, dni, phone, email }
  
  -- Property (JSONB)
  property JSONB DEFAULT '{}',
  -- { address, city, province, country, surface, rooms }
  
  -- Financials (JSONB)
  financials JSONB DEFAULT '{}',
  -- { monthlyRent, currency, deposit, expenses, expensesDueDay, rentDueDay, paymentMethod, bankAccount }
  
  -- Terms (JSONB)
  terms JSONB DEFAULT '{}',
  -- { startDate, endDate, durationMonths, renewalType, noticePeriodDays, earlyTerminationPenalty }
  
  -- Indexation (JSONB)
  indexation JSONB DEFAULT '{}',
  -- { type, customPercentage, baseIndexValue, baseIndexDate, lastAdjustmentDate, nextAdjustmentDate }
  
  -- Adjustments (JSON array)
  adjustments JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- Metadata
  signed_at TIMESTAMPTZ,
  contract_document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts (user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts (status);

-- =============================================
-- MAINTENANCE EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_expenses (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id),
  user_id TEXT NOT NULL,
  
  -- Category
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT NOT NULL,
  
  -- Amount
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  expense_date DATE NOT NULL,
  
  -- Provider (JSONB)
  provider JSONB DEFAULT '{}',
  -- { name, phone, email, company, invoiceNumber }
  
  -- Photos (text array of URLs)
  photos TEXT[] DEFAULT '{}',
  invoice_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  reimbursed_at TIMESTAMPTZ,
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_contract ON maintenance_expenses (contract_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_user ON maintenance_expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_expenses (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_category ON maintenance_expenses (category);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_expenses (expense_date DESC);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON tenant_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_maintenance_updated_at
  BEFORE UPDATE ON maintenance_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
