import {
  pgTable,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uuid,
  doublePrecision,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "pending",
  "approved",
  "reimbursed",
  "denied",
]);

export const maintenanceCategoryEnum = pgEnum("maintenance_category", [
  "plumbing",
  "electrical",
  "structural",
  "appliance",
  "cleaning",
  "garden",
  "pest-control",
  "other",
]);

// ─── Auth tables (better-auth) ─────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password"),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Properties (migration 001 + 002) ──────────────────

export const properties = pgTable(
  "properties",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    portal: text("portal").notNull(),
    portalId: text("portal_id").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    price: numeric("price").notNull().default("0"),
    currency: text("currency").notNull().default("USD"),

    // Location
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    zip: text("zip"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),

    // Features
    bedrooms: integer("bedrooms").default(0),
    bathrooms: integer("bathrooms").default(0),
    area: numeric("area").default("0"),
    areaUnit: text("area_unit").default("sqft"),
    parkingSpaces: integer("parking_spaces").default(0),
    furnished: boolean("furnished"),
    petFriendly: boolean("pet_friendly"),

    // Media
    images: text("images").array().default([]),

    // Landlord
    landlordName: text("landlord_name"),
    landlordPhone: text("landlord_phone"),
    landlordEmail: text("landlord_email"),

    // Timestamps
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scrapedAt: timestamp("scraped_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Deduplication
    contentHash: text("content_hash").notNull(),

    // Extended fields (migration 002)
    expenses: numeric("expenses").default("0"),
    pricePerSqm: numeric("price_per_sqm").default("0"),
    fullAddress: text("full_address"),
    totalRooms: integer("total_rooms").default(0),
    coveredArea: numeric("covered_area").default("0"),
    landArea: numeric("land_area").default("0"),
    floor: integer("floor"),
    totalFloors: integer("total_floors"),
    yearBuilt: integer("year_built"),
    petTypes: text("pet_types").array().default([]),
    minContractMonths: integer("min_contract_months"),
    allowedForStudents: boolean("allowed_for_students"),
    allowedForPets: boolean("allowed_for_pets"),
    amenities: text("amenities").array().default([]),
    mainImage: text("main_image"),
    landlordType: text("landlord_type").default("owner"),
    parsedAt: timestamp("parsed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_properties_dedup").on(t.portal, t.portalId),
    uniqueIndex("idx_properties_url_dedup").on(t.url),
    index("idx_properties_city").on(t.city),
    index("idx_properties_price").on(t.price),
    index("idx_properties_bedrooms").on(t.bedrooms),
    index("idx_properties_portal").on(t.portal),
    index("idx_properties_country").on(t.country),
    index("idx_properties_created").on(t.createdAt),
    index("idx_properties_location").on(t.lat, t.lng),
  ],
);

// ─── Favorites ─────────────────────────────────────────

export const favorites = pgTable(
  "favorites",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    propertyId: text("property_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_favorites_user_property").on(t.userId, t.propertyId),
    index("idx_favorites_user").on(t.userId),
    index("idx_favorites_property").on(t.propertyId),
  ],
);

// ─── Scraping jobs (migration 001) ─────────────────────

export const scrapingJobs = pgTable(
  "scraping_jobs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    type: text("type").notNull(),
    portal: text("portal"),
    url: text("url"),
    status: text("status").notNull().default("pending"),
    totalProperties: integer("total_properties").default(0),
    newProperties: integer("new_properties").default(0),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_scraping_jobs_status").on(t.status),
    index("idx_scraping_jobs_created").on(t.createdAt),
  ],
);

// ─── User filters (migration 002) ──────────────────────

export const userFilters = pgTable(
  "user_filters",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    isActive: boolean("is_active").default(true),

    // Price range
    priceMin: numeric("price_min"),
    priceMax: numeric("price_max"),
    priceCurrency: text("price_currency"),

    // Expenses
    expensesMax: numeric("expenses_max"),

    // Location
    cities: text("cities").array().default([]),
    states: text("states").array().default([]),
    filterCountry: text("filter_country"),
    radiusKm: numeric("radius_km"),
    centerLat: doublePrecision("center_lat"),
    centerLng: doublePrecision("center_lng"),

    // Features
    minBedrooms: integer("min_bedrooms"),
    maxBedrooms: integer("max_bedrooms"),
    minBathrooms: integer("min_bathrooms"),
    maxBathrooms: integer("max_bathrooms"),
    minArea: numeric("min_area"),
    maxArea: numeric("max_area"),
    areaUnit: text("area_unit"),
    minParkingSpaces: integer("min_parking_spaces"),

    // Restrictions
    petFriendly: boolean("pet_friendly"),
    furnished: boolean("furnished"),
    minContractMonths: integer("min_contract_months"),

    // Portals
    portals: text("portals").array().default([]),

    // Keywords
    keywords: text("keywords").array().default([]),
    excludeKeywords: text("exclude_keywords").array().default([]),

    // Notification settings
    notificationEnabled: boolean("notification_enabled").default(true),
    notificationMethod: text("notification_method").default("push"),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_filters_user").on(t.userId),
    index("idx_filters_active").on(t.isActive),
  ],
);

// ─── Device tokens (migration 002) ─────────────────────

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    token: text("token").notNull().unique(),
    platform: text("platform").default("web"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_tokens_user").on(t.userId),
    index("idx_tokens_active").on(t.isActive),
  ],
);

// ─── Notification logs (migration 002) ─────────────────

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    filterId: text("filter_id")
      .notNull()
      .references(() => userFilters.id),
    filterName: text("filter_name").notNull(),
    userId: text("user_id").notNull(),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_notifications_property").on(t.propertyId),
    index("idx_notifications_filter").on(t.filterId),
    index("idx_notifications_user").on(t.userId),
    index("idx_notifications_status").on(t.status),
  ],
);

// ─── Tenant profiles (migration 003) ───────────────────

export const tenantProfiles = pgTable(
  "tenant_profiles",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().unique(),

    personalInfo: jsonb("personal_info").default({}),
    employment: jsonb("employment").default({}),
    income: jsonb("income").default({}),
    guarantor: jsonb("guarantor").default({}),
    coHabitants: jsonb("co_habitants").default([]),
    pets: jsonb("pets").default([]),
    referencesList: jsonb("references").default([]),
    rentalHistory: jsonb("rental_history").default([]),
    documents: jsonb("documents").default({}),

    completedAt: timestamp("completed_at", { withTimezone: true }),
    isVerified: boolean("is_verified").default(false),
    verificationScore: integer("verification_score").default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_profiles_user").on(t.userId)],
);

// ─── Contracts (migration 003) ─────────────────────────

export const contracts = pgTable(
  "contracts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    propertyId: text("property_id"),

    landlord: jsonb("landlord").default({}),
    property: jsonb("property").default({}),
    financials: jsonb("financials").default({}),
    terms: jsonb("terms").default({}),
    indexation: jsonb("indexation").default({}),
    adjustments: jsonb("adjustments").default([]),

    status: text("status").default("pending"),

    signedAt: timestamp("signed_at", { withTimezone: true }),
    contractDocumentUrl: text("contract_document_url"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_contracts_user").on(t.userId),
    index("idx_contracts_status").on(t.status),
  ],
);

// ─── Maintenance expenses (migration 003) ──────────────

export const maintenanceExpenses = pgTable(
  "maintenance_expenses",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id),
    userId: text("user_id").notNull(),

    category: text("category").notNull(),
    subcategory: text("subcategory"),
    description: text("description").notNull(),

    amount: numeric("amount").notNull(),
    currency: text("currency").notNull().default("ARS"),
    expenseDate: date("expense_date").notNull(),

    provider: jsonb("provider").default({}),
    photos: text("photos").array().default([]),
    invoiceUrl: text("invoice_url"),

    status: text("status").default("pending"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    reimbursedAt: timestamp("reimbursed_at", { withTimezone: true }),

    isRecurring: boolean("is_recurring").default(false),
    recurringFrequency: text("recurring_frequency"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_maintenance_contract").on(t.contractId),
    index("idx_maintenance_user").on(t.userId),
    index("idx_maintenance_status").on(t.status),
    index("idx_maintenance_category").on(t.category),
    index("idx_maintenance_date").on(t.expenseDate),
  ],
);

// ─── Subscriptions (migration 004) ─────────────────────

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    status: subscriptionStatusEnum("status").default("active"),
    planId: text("plan_id").notNull().default("free"),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAt: timestamp("cancel_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_subscriptions_user_id").on(t.userId),
    index("idx_subscriptions_stripe_customer").on(t.stripeCustomerId),
    index("idx_subscriptions_stripe_subscription").on(t.stripeSubscriptionId),
  ],
);

// ─── User usage (migration 004) ────────────────────────

export const userUsage = pgTable(
  "user_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    searchAlertsUsed: integer("search_alerts_used").default(0),
    filtersCreated: integer("filters_created").default(0),
    tenantProfilesCreated: integer("tenant_profiles_created").default(0),
    pdfExportsUsed: integer("pdf_exports_used").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_user_usage_user_period").on(t.userId, t.periodStart),
  ],
);

// ─── Usage history (migration 004) ─────────────────────

export const usageHistory = pgTable(
  "usage_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    creditsUsed: integer("credits_used").default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_usage_history_user").on(t.userId, t.createdAt)],
);

// ─── Audit logs (migration 005) ────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    meta: jsonb("meta").default({}),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_audit_logs_user_id").on(t.userId),
    index("idx_audit_logs_created_at").on(t.createdAt),
  ],
);

// ─── Input validation rules (migration 005) ────────────

export const inputValidationRules = pgTable("input_validation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  fieldName: text("field_name").notNull(),
  ruleType: text("rule_type").notNull(),
  pattern: text("pattern"),
  minLength: integer("min_length"),
  maxLength: integer("max_length"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Helper types ──────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

export type ScrapingJob = typeof scrapingJobs.$inferSelect;
export type NewScrapingJob = typeof scrapingJobs.$inferInsert;

export type UserFilter = typeof userFilters.$inferSelect;
export type NewUserFilter = typeof userFilters.$inferInsert;

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type NewDeviceToken = typeof deviceTokens.$inferInsert;

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;

export type TenantProfile = typeof tenantProfiles.$inferSelect;
export type NewTenantProfile = typeof tenantProfiles.$inferInsert;

export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;

export type MaintenanceExpense = typeof maintenanceExpenses.$inferSelect;
export type NewMaintenanceExpense = typeof maintenanceExpenses.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type UserUsage = typeof userUsage.$inferSelect;
export type NewUserUsage = typeof userUsage.$inferInsert;

export type UsageHistoryEntry = typeof usageHistory.$inferSelect;
export type NewUsageHistoryEntry = typeof usageHistory.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type InputValidationRule = typeof inputValidationRules.$inferSelect;
export type NewInputValidationRule = typeof inputValidationRules.$inferInsert;
