import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  requested: integer("requested").notNull(),
  inserted: integer("inserted").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  throughput: integer("throughput").notNull().default(0), // leads / sec
  status: text("status").notNull().default("running"), // running | done | failed
  totalAfter: integer("total_after").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  totalLeads: integer("total_leads").notNull().default(0),
  combinedMs: integer("combined_ms").notNull().default(0),
  avgThroughput: integer("avg_throughput").notNull().default(0),
  pipelineValue: integer("pipeline_value").notNull().default(0),
  avgScore: integer("avg_score").notNull().default(0),
  dbSize: text("db_size").notNull().default("—"),
  stepsJson: text("steps_json").notNull().default("[]"),
  probesJson: text("probes_json").notNull().default("{}"),
  checklistJson: text("checklist_json").notNull().default("[]"),
  verdict: text("verdict").notNull().default("READY"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const enrichments = pgTable(
  "enrichments",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull(),
    // IDIQ — identity + soft pull + monitoring
    identityStatus: text("identity_status").notNull().default("Pending"), // Verified | Review | Failed
    identityConfidence: integer("identity_confidence").notNull().default(0),
    idiqRef: text("idiq_ref").notNull().default(""),
    softPullStatus: text("soft_pull_status").notNull().default("Pending"), // Completed | No Hit | Review
    creditScore: integer("credit_score").notNull().default(0),
    creditBand: text("credit_band").notNull().default(""),
    monitoringStatus: text("monitoring_status").notNull().default("Pending"), // Enrolled | Not Enrolled
    monitoringAlerts: integer("monitoring_alerts").notNull().default(0),
    // FinGoal — banking / transaction enrichment
    fingoalStatus: text("fingoal_status").notNull().default("Pending"), // Linked + Enriched | Enriched | Not Linked
    bankAccounts: integer("bank_accounts").notNull().default(0),
    monthlyIncome: integer("monthly_income").notNull().default(0),
    monthlySpend: integer("monthly_spend").notNull().default(0),
    cashflowScore: integer("cashflow_score").notNull().default(0),
    // Scoring + routing
    finalScore: integer("final_score").notNull().default(0),
    scoredStatus: text("scored_status").notNull().default("Pending"), // Scored
    routedToIde: text("routed_to_ide").notNull().default("Pending"), // Pending | Routed
    ideRef: text("ide_ref").notNull().default(""),
    enrichedAt: timestamp("enriched_at").defaultNow().notNull(),
  },
  (t) => [index("enrichments_lead_idx").on(t.leadId), index("enrichments_routed_idx").on(t.routedToIde)]
);

export const integrations = pgTable(
  "integrations",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(), // IDIQ | FinGoal
    kind: text("kind").notNull().default("record"), // record | config
    importBatch: text("import_batch").notNull().default(""),
    leadId: integer("lead_id"),
    externalRef: text("external_ref").notNull().default(""),
    email: text("email").notNull().default(""),
    status: text("status").notNull().default("unmatched"), // matched | unmatched | config
    payload: text("payload").notNull().default("{}"), // raw JSON as provided
    parsedJson: text("parsed_json").notNull().default("{}"), // normalized fields we extracted
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("integrations_provider_idx").on(t.provider), index("integrations_lead_idx").on(t.leadId), index("integrations_email_idx").on(t.email)]
);

export const integrationEvents = pgTable("integration_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  provider: text("provider").notNull(), // Engine | IDIQ | FinGoal | IDE
  status: text("status").notNull().default("delivered"), // queued | delivered | simulated
  count: integer("count").notNull().default(0),
  payload: text("payload").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const consentRecords = pgTable(
  "consent_records",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull(),
    scope: text("scope").notNull(), // credit_pull | banking_search | monitoring | communications
    status: text("status").notNull().default("Granted"), // Granted | Pending | Revoked | Expired
    basis: text("basis").notNull().default("Purchased-Transferred"), // Purchased-Transferred | Direct Opt-In | None
    vendorName: text("vendor_name").notNull().default(""),
    evidenceRef: text("evidence_ref").notNull().default(""), // vendor consent cert / record id
    consentTextVersion: text("consent_text_version").notNull().default("purchased-v1"),
    capturedAt: timestamp("captured_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("consent_lead_idx").on(t.leadId), index("consent_scope_idx").on(t.scope), index("consent_status_idx").on(t.status)]
);

export const lenders = pgTable("lenders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().default(""),
  tier: text("tier").notNull().default(""),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("Bank"), // Bank | Credit Union | Private Fund | Broker | Marketplace
  products: text("products").notNull().default("Term loans, lines of credit"),
  minFico: integer("min_fico").notNull().default(600),
  maxAmount: integer("max_amount").notNull().default(250000),
  advanceRatePct: integer("advance_rate_pct").notNull().default(80), // % of invoice/AR advanced
  ratePct: integer("rate_pct").notNull().default(0), // default monthly rate *100? store as pct*100? keep simple: pct integer
  contactEmail: text("contact_email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  active: integer("active").notNull().default(1),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investors = pgTable("investors", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().default(""),
  tier: text("tier").notNull().default(""),
  name: text("name").notNull(),
  focus: text("focus").notNull().default("Small business term loans"),
  minTicket: integer("min_ticket").notNull().default(10000),
  maxTicket: integer("max_ticket").notNull().default(500000),
  contactEmail: text("contact_email").notNull().default(""),
  active: integer("active").notNull().default(1),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deals = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull(),
    lenderId: integer("lender_id"),
    title: text("title").notNull().default("New deal"),
    product: text("product").notNull().default("Term Loan"),
    amount: integer("amount").notNull().default(0),
    stage: text("stage").notNull().default("Lead"), // Lead | Application | Term Sheet | Underwriting | Funded | Declined | Dead
    ratePct: integer("rate_pct").notNull().default(0), // store as hundredths? no — plain percent * 100? Use integer percent*100 to allow decimals? keep plain pct integer
    commissionPct: integer("commission_pct").notNull().default(500), // stored as pct*100 (5.00%)
    fundedAt: timestamp("funded_at"),
    closedAt: timestamp("closed_at"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("deals_lead_idx").on(t.leadId), index("deals_stage_idx").on(t.stage), index("deals_lender_idx").on(t.lenderId)]
);

export const termSheets = pgTable(
  "term_sheets",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id").notNull(),
    lenderId: integer("lender_id"),
    ratePct: integer("rate_pct").notNull().default(0),
    advancePct: integer("advance_pct").notNull().default(0), // % advanced
    termMonths: integer("term_months").notNull().default(12),
    feesPct: integer("fees_pct").notNull().default(0),
    conditions: text("conditions").notNull().default(""),
    status: text("status").notNull().default("Draft"), // Draft | Sent | Accepted | Rejected
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("termsheets_deal_idx").on(t.dealId)]
);

export const consentLinks = pgTable(
  "consent_links",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    formVersion: text("form_version").notNull().default("glf-consent-v1"),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    ip: text("ip").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("consent_links_lead_idx").on(t.leadId), index("consent_links_token_idx").on(t.tokenHash)]
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull(),
    channel: text("channel").notNull(), // sms | email
    template: text("template").notNull().default("consent_request"),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("queued"), // queued | sent | delivered | failed | simulated | opted_out
    providerRef: text("provider_ref").notNull().default(""), // Twilio MessageSid / SendGrid id
    error: text("error").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    sentAt: timestamp("sent_at"),
  },
  (t) => [index("messages_lead_idx").on(t.leadId), index("messages_status_idx").on(t.status)]
);

export const idLedger = pgTable("id_ledger", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // Lender | Investor | Lead | Broker
  entityId: integer("entity_id").notNull(),
  fromCode: text("from_code").notNull().default(""),
  toCode: text("to_code").notNull(),
  action: text("action").notNull(), // assign | upgrade | downgrade | revert
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const docs = pgTable(
  "docs",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull(),
    dealId: integer("deal_id"),
    name: text("name").notNull(),
    type: text("type").notNull().default("other"), // application | consent | credit_snapshot | term_sheet | bank_statement | id_doc | other
    status: text("status").notNull().default("missing"), // missing | generated | received
    size: integer("size").notNull().default(0),
    contentHash: text("content_hash").notNull().default(""),
    source: text("source").notNull().default(""), // DPE-generated | client-upload | lender
    storedAt: timestamp("stored_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("docs_lead_idx").on(t.leadId), index("docs_deal_idx").on(t.dealId), index("docs_status_idx").on(t.status)]
);

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    leadId: integer("lead_id").notNull(),
    type: text("type").notNull().default("note"), // note | task | call | email | sms | status | system
    body: text("body").notNull().default(""),
    dueAt: timestamp("due_at"),
    done: integer("done").notNull().default(0), // 0 | 1
    meta: text("meta").notNull().default("{}"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("activities_lead_idx").on(t.leadId), index("activities_created_idx").on(t.createdAt)]
);

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    acquisitionType: text("acquisition_type").notNull().default("Purchased"), // Purchased | Prospected
    vendorName: text("vendor_name").notNull().default("Purchased Lead Vendor"),
    originSystem: text("origin_system").notNull().default("Bank DB — Loan Application"), // where the record lived before purchase
    loanOutcome: text("loan_outcome").notNull().default("Funded"), // Funded | Declined | In System — No Decision Yet
    loanAmount: integer("loan_amount").notNull().default(0),
    applicationDate: timestamp("application_date"),
    // IDIQ pull requirements: SSN + DOB + name (+ address) or the report is rejected
    ssn: text("ssn"),
    dob: timestamp("dob"),
    code: text("code").notNull().default(""),
    tier: text("tier").notNull().default(""),
    address: text("address").notNull().default(""),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    company: text("company").notNull(),
    jobTitle: text("job_title").notNull(),
    source: text("source").notNull(),
    status: text("status").notNull().default("New"),
    score: integer("score").notNull().default(50),
    estimatedValue: integer("estimated_value").notNull().default(0),
    city: text("city").notNull(),
    country: text("country").notNull(),
    batchId: integer("batch_id"),
    batchLabel: text("batch_label").notNull().default("Manual"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("leads_status_idx").on(t.status),
    index("leads_source_idx").on(t.source),
    index("leads_batch_idx").on(t.batchLabel),
    index("leads_created_idx").on(t.createdAt),
    index("leads_email_idx").on(t.email),
  ]
);
