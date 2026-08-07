import { db } from "@workspace/db";
import {
  users,
  listings,
  leadHistory,
  paymentOptions,
  financingRequests,
  financingIntermediaries,
  financingBranches,
  financingSeats,
  fiLifecycleEvents,
} from "@workspace/db/schema";
import { and, asc, desc, eq, ilike, inArray, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { writeAudit } from "./AbuseService";
import { createNotification } from "./NotificationService";

/* ── Types ─────────────────────────────────────────────── */

type FinancingStatus = "new" | "forwarded" | "contacted" | "closed" | "rejected";
type ListingCategory = "car" | "real_estate" | "industrial";

type FiWorkspaceStatus = "draft" | "pending_review" | "active" | "suspended";

const FI_WORKSPACE_TRANSITIONS: Record<FiWorkspaceStatus, ReadonlySet<FiWorkspaceStatus>> = {
  draft: new Set(["pending_review"]),
  pending_review: new Set(["active", "suspended"]),
  active: new Set(["suspended"]),
  suspended: new Set(["active"]),
};

export interface FinancingRequestRow {
  lead_id: string;
  status: FinancingStatus;
  branch_id: string | null;
  listing_id: string;
  listing_title: string;
  category: ListingCategory;
  buyer_name: string | null;
  buyer_phone: string | null;
  asset_price: string | null;
  down_payment: string | null;
  monthly_payment: string | null;
  duration_months: number | null;
  provider_name: string | null;
  intermediary_id: string | null;
  intermediary_name: string | null;
  notes: string | null;
  assigned_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FinancingIntermediaryRow {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  /** FI phase 2 — the bank's own marketplace account (null = admin-only row). */
  owner_user_id: string | null;
  is_active: boolean;
  created_at: string | null;
  workspace_status: FiWorkspaceStatus;
  workspace_owner_user_id: string | null;
}

interface ListFilters {
  category?: ListingCategory;
  status?: FinancingStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/* ── Shared query building ─────────────────────────────── */

// The effective CRM status: the sidecar value when a row exists, otherwise the
// implicit "new" state for a finance-request lead nobody has touched yet.
const effectiveStatus = sql<FinancingStatus>`coalesce(${financingRequests.status}, 'new')`;

// Deterministically pick ONE bank-finance payment option for the listing so the
// down-payment / monthly / duration / provider all come from the SAME plan
// (cheapest monthly first, then a stable id tiebreak).
function bankFinanceField<T>(column: string): SQL<T | null> {
  return sql<T | null>`(
    select po.${sql.raw(column)}
    from payment_options po
    where po.listing_id = ${listings.id} and po.mode = 'bank_finance'
    order by po.monthly_payment asc nulls last, po.id asc
    limit 1
  )`;
}

const rowSelection = {
  leadId: leadHistory.id,
  status: effectiveStatus,
  listingId: leadHistory.listingId,
  listingTitle: listings.title,
  category: listings.category,
  buyerName: sql<string | null>`coalesce(${leadHistory.buyerName}, ${users.name})`,
  buyerPhone: sql<string | null>`coalesce(${leadHistory.buyerPhone}, ${users.phone})`,
  assetPrice: listings.basePriceCash,
  downPayment: bankFinanceField<string>("down_payment"),
  monthlyPayment: bankFinanceField<string>("monthly_payment"),
  durationMonths: bankFinanceField<number>("duration_months"),
  providerName: bankFinanceField<string>("provider_name"),
  intermediaryId: financingRequests.intermediaryId,
  intermediaryName: financingIntermediaries.name,
  branchId: financingRequests.branchId,
  notes: financingRequests.notes,
  assignedAt: financingRequests.assignedAt,
  createdAt: leadHistory.createdAt,
  updatedAt: financingRequests.updatedAt,
} as const;

type RawRow = {
  leadId: string;
  status: FinancingStatus;
  listingId: string;
  listingTitle: string | null;
  category: ListingCategory | null;
  buyerName: string | null;
  buyerPhone: string | null;
  assetPrice: string | null;
  downPayment: string | null;
  monthlyPayment: string | null;
  durationMonths: number | null;
  providerName: string | null;
  intermediaryId: string | null;
  intermediaryName: string | null;
  branchId: string | null;
  notes: string | null;
  assignedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function buildConditions(filters: ListFilters, cursor?: string): SQL[] {
  const conditions: SQL[] = [eq(leadHistory.actionType, "finance_request")];

  if (filters.category) conditions.push(eq(listings.category, filters.category));
  if (filters.status) conditions.push(sql`${effectiveStatus} = ${filters.status}`);

  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    const match = or(
      ilike(listings.title, term),
      ilike(leadHistory.buyerName, term),
      ilike(leadHistory.buyerPhone, term),
      ilike(users.name, term),
      ilike(users.phone, term),
    );
    if (match) conditions.push(match);
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    if (!Number.isNaN(from.getTime())) {
      conditions.push(sql`${leadHistory.createdAt} >= ${from}`);
    }
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    if (!Number.isNaN(to.getTime())) {
      // Treat a bare date as inclusive of the whole day.
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.dateTo.trim())) {
        to.setHours(23, 59, 59, 999);
      }
      conditions.push(sql`${leadHistory.createdAt} <= ${to}`);
    }
  }

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      conditions.push(lt(leadHistory.createdAt, cursorDate));
    }
  }

  return conditions;
}

function baseQuery(conditions: SQL[]) {
  return db
    .select(rowSelection)
    .from(leadHistory)
    .leftJoin(listings, eq(leadHistory.listingId, listings.id))
    .leftJoin(users, eq(leadHistory.buyerId, users.id))
    .leftJoin(financingRequests, eq(financingRequests.leadId, leadHistory.id))
    .leftJoin(
      financingIntermediaries,
      eq(financingRequests.intermediaryId, financingIntermediaries.id),
    )
    .where(and(...conditions))
    .orderBy(desc(leadHistory.createdAt));
}

function mapRow(r: RawRow): FinancingRequestRow {
  return {
    lead_id: r.leadId,
    status: r.status ?? "new",
    listing_id: r.listingId,
    listing_title: r.listingTitle ?? "—",
    category: r.category ?? "car",
    buyer_name: r.buyerName,
    buyer_phone: r.buyerPhone,
    asset_price: r.assetPrice,
    down_payment: r.downPayment,
    monthly_payment: r.monthlyPayment,
    duration_months: r.durationMonths,
    provider_name: r.providerName,
    intermediary_id: r.intermediaryId,
    intermediary_name: r.intermediaryName,
    branch_id: r.branchId,
    notes: r.notes,
    assigned_at: r.assignedAt ? r.assignedAt.toISOString() : null,
    created_at: r.createdAt ? r.createdAt.toISOString() : null,
    updated_at: r.updatedAt ? r.updatedAt.toISOString() : null,
  };
}

/* ── Requests: list / get / export ─────────────────────── */

export async function listFinancingRequests(params: {
  category?: ListingCategory;
  status?: FinancingStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit: number;
}): Promise<{ items: FinancingRequestRow[]; cursor?: string; has_next: boolean }> {
  const conditions = buildConditions(params, params.cursor);
  const rows = (await baseQuery(conditions).limit(params.limit + 1)) as RawRow[];

  const has_next = rows.length > params.limit;
  const page = rows.slice(0, params.limit);
  const last = page[page.length - 1];

  return {
    items: page.map(mapRow),
    cursor: has_next && last?.createdAt ? last.createdAt.toISOString() : undefined,
    has_next,
  };
}

async function getFinancingRequestByLeadId(
  leadId: string,
): Promise<FinancingRequestRow | null> {
  const rows = (await baseQuery([
    eq(leadHistory.actionType, "finance_request"),
    eq(leadHistory.id, leadId),
  ]).limit(1)) as RawRow[];
  const row = rows[0];
  return row ? mapRow(row) : null;
}

// Export the FULL filtered set (no pagination) for CSV download. Capped to keep
// a single export bounded.
const EXPORT_CAP = 5000;

const CSV_COLUMNS: { header: string; key: keyof FinancingRequestRow }[] = [
  { header: "Lead ID", key: "lead_id" },
  { header: "Status", key: "status" },
  { header: "Category", key: "category" },
  { header: "Listing", key: "listing_title" },
  { header: "Listing ID", key: "listing_id" },
  { header: "Buyer", key: "buyer_name" },
  { header: "Buyer Phone", key: "buyer_phone" },
  { header: "Asset Price", key: "asset_price" },
  { header: "Down Payment", key: "down_payment" },
  { header: "Monthly Payment", key: "monthly_payment" },
  { header: "Duration (months)", key: "duration_months" },
  { header: "Plan Provider", key: "provider_name" },
  { header: "Intermediary", key: "intermediary_name" },
  { header: "Notes", key: "notes" },
  { header: "Assigned At", key: "assigned_at" },
  { header: "Requested At", key: "created_at" },
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function exportFinancingRequestsCsv(params: {
  category?: ListingCategory;
  status?: FinancingStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<string> {
  const conditions = buildConditions(params);
  const rows = (await baseQuery(conditions).limit(EXPORT_CAP)) as RawRow[];
  const items = rows.map(mapRow);

  const lines = [CSV_COLUMNS.map((c) => csvCell(c.header)).join(",")];
  for (const item of items) {
    lines.push(CSV_COLUMNS.map((c) => csvCell(item[c.key])).join(","));
  }
  // Prepend a BOM so Excel opens UTF-8 (Arabic listing titles) correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/* ── Requests: update (upsert sidecar) ─────────────────── */

export async function updateFinancingRequest(params: {
  leadId: string;
  status?: FinancingStatus;
  // undefined = leave unchanged; null = clear assignment; string = assign.
  intermediaryId?: string | null;
  notes?: string | null;
  adminUserId: string;
}): Promise<FinancingRequestRow> {
  const { leadId, adminUserId } = params;

  // The lead must exist AND be a finance request — we never invent CRM rows for
  // non-finance leads.
  const [lead] = await db
    .select({ id: leadHistory.id, actionType: leadHistory.actionType })
    .from(leadHistory)
    .where(eq(leadHistory.id, leadId))
    .limit(1);

  if (!lead || lead.actionType !== "finance_request") {
    throw Object.assign(new Error("Finance request not found"), { code: "NOT_FOUND" });
  }

  // Validate the intermediary exists (and is active) when assigning one.
  // F-SEC-05: forwarding to an inactive institution creates a dead handoff —
  // membership resolve rejects inactive rows, so the bank never sees the request.
  if (params.intermediaryId) {
    const [im] = await db
      .select({
        id: financingIntermediaries.id,
        isActive: financingIntermediaries.isActive,
      })
      .from(financingIntermediaries)
      .where(eq(financingIntermediaries.id, params.intermediaryId))
      .limit(1);
    if (!im) {
      throw Object.assign(new Error("Intermediary not found"), { code: "NOT_FOUND" });
    }
    if (!im.isActive) {
      throw Object.assign(new Error("Intermediary is not active"), {
        code: "INVALID_DATA",
      });
    }
  }

  const now = new Date();

  // Build the partial update set — only touch the fields the caller provided.
  const set: Partial<typeof financingRequests.$inferInsert> = { updatedAt: now };
  if (params.status !== undefined) set.status = params.status;
  if (params.notes !== undefined) set.notes = params.notes;
  if (params.intermediaryId !== undefined) {
    set.intermediaryId = params.intermediaryId;
    set.assignedAt = params.intermediaryId ? now : null;
  }

  await db
    .insert(financingRequests)
    .values({
      leadId,
      status: params.status ?? "new",
      intermediaryId: params.intermediaryId ?? null,
      assignedAt: params.intermediaryId ? now : null,
      notes: params.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({ target: financingRequests.leadId, set });

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: adminUserId,
    reason: "financing_request_update",
    metadata: {
      lead_id: leadId,
      status: params.status ?? null,
      intermediary_id: params.intermediaryId ?? null,
    },
  });

  const updated = await getFinancingRequestByLeadId(leadId);
  if (!updated) {
    throw Object.assign(new Error("Finance request not found"), { code: "NOT_FOUND" });
  }

  // FI phase 2 — AUTO-handoff: notify the bank when the request is (or stays)
  // forwarded AND an institution is assigned. Cover both admin orderings:
  // status→forwarded with intermediary already set, OR intermediary assigned
  // while status is already forwarded. Fire-and-forget.
  const effectiveIntermediary = params.intermediaryId ?? updated.intermediary_id;
  const isForwarded =
    (params.status ?? updated.status) === "forwarded" && !!effectiveIntermediary;
  const handoffTouched =
    params.status === "forwarded" || params.intermediaryId !== undefined;
  if (isForwarded && handoffTouched && effectiveIntermediary) {
    void notifyInstitutionHandoff(leadId, effectiveIntermediary, updated.listing_title).catch(
      () => {},
    );
  }

  return updated;
}

/* ── Intermediaries ────────────────────────────────────── */

function mapIntermediary(r: {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  ownerUserId: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  workspaceStatus: string | null;
  workspaceOwnerUserId: string | null;
}): FinancingIntermediaryRow {
  return {
    id: r.id,
    name: r.name,
    contact_email: r.contactEmail,
    contact_phone: r.contactPhone,
    notes: r.notes,
    owner_user_id: r.ownerUserId,
    is_active: r.isActive ?? true,
    created_at: r.createdAt ? r.createdAt.toISOString() : null,
    workspace_status: (r.workspaceStatus as FiWorkspaceStatus) ?? "draft",
    workspace_owner_user_id: r.workspaceOwnerUserId,
  };
}

const intermediarySelection = {
  id: financingIntermediaries.id,
  name: financingIntermediaries.name,
  contactEmail: financingIntermediaries.contactEmail,
  contactPhone: financingIntermediaries.contactPhone,
  notes: financingIntermediaries.notes,
  ownerUserId: financingIntermediaries.ownerUserId,
  isActive: financingIntermediaries.isActive,
  createdAt: financingIntermediaries.createdAt,
  workspaceStatus: financingIntermediaries.workspaceStatus,
  workspaceOwnerUserId: financingIntermediaries.workspaceOwnerUserId,
} as const;

export async function listIntermediaries(): Promise<FinancingIntermediaryRow[]> {
  const rows = await db
    .select(intermediarySelection)
    .from(financingIntermediaries)
    .orderBy(desc(financingIntermediaries.isActive), asc(financingIntermediaries.name));
  return rows.map(mapIntermediary);
}

export async function createIntermediary(params: {
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  adminUserId: string;
}): Promise<FinancingIntermediaryRow> {
  const [row] = await db
    .insert(financingIntermediaries)
    .values({
      name: params.name,
      contactEmail: params.contactEmail ?? null,
      contactPhone: params.contactPhone ?? null,
      notes: params.notes ?? null,
    })
    .returning(intermediarySelection);

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: params.adminUserId,
    reason: "financing_intermediary_create",
    metadata: { intermediary_id: row!.id, name: params.name },
  });

  return mapIntermediary(row!);
}

export async function updateIntermediary(params: {
  id: string;
  name?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  isActive?: boolean;
  // FI phase 2: link (or unlink with null) the bank's own marketplace account
  // to this intermediary — this is what turns forwarded requests into an
  // auto-handoff to the bank's people instead of an admin-only CRM row.
  ownerUserId?: string | null;
  adminUserId: string;
}): Promise<FinancingIntermediaryRow> {
  const set: Partial<typeof financingIntermediaries.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (params.name !== undefined) set.name = params.name;
  if (params.contactEmail !== undefined) set.contactEmail = params.contactEmail;
  if (params.contactPhone !== undefined) set.contactPhone = params.contactPhone;
  if (params.notes !== undefined) set.notes = params.notes;
  if (params.isActive !== undefined) set.isActive = params.isActive;
  if (params.ownerUserId !== undefined) {
    if (params.ownerUserId) {
      const [owner] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, params.ownerUserId))
        .limit(1);
      if (!owner) {
        throw Object.assign(new Error("Owner user not found"), { code: "NOT_FOUND" });
      }
      // F-SEC-03: only a financial_institution account may own an intermediary.
      if (owner.role !== "financial_institution") {
        throw Object.assign(
          new Error("Owner must have financial_institution role"),
          { code: "INVALID_DATA" },
        );
      }
    }
    set.ownerUserId = params.ownerUserId;
  }

  const [row] = await db
    .update(financingIntermediaries)
    .set(set)
    .where(eq(financingIntermediaries.id, params.id))
    .returning(intermediarySelection);

  if (!row) {
    throw Object.assign(new Error("Intermediary not found"), { code: "NOT_FOUND" });
  }

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: params.adminUserId,
    reason: "financing_intermediary_update",
    metadata: { intermediary_id: params.id },
  });

  return mapIntermediary(row);
}

/* ── FI workspace lifecycle ────────────────────────────── */

export interface FiLifecycleEventRow {
  id: string;
  intermediary_id: string;
  from_status: FiWorkspaceStatus | null;
  to_status: FiWorkspaceStatus;
  actor_user_id: string | null;
  reason: string | null;
  created_at: string | null;
}

/**
 * Provision (or return existing) workspace for an FI user.
 * Advisory lock on ownerUserId hash prevents concurrent double-creation.
 * Idempotent: calling twice returns same record.
 */
export async function ensureFiWorkspace(ownerUserId: string): Promise<FinancingIntermediaryRow> {
  // Hash ownerUserId to a 32-bit integer for advisory lock key
  let hash = 0;
  for (let i = 0; i < ownerUserId.length; i++) {
    hash = Math.imul(31, hash) + ownerUserId.charCodeAt(i) | 0;
  }
  const lockKey = Math.abs(hash) % 2147483647;

  const client = await (await import("@workspace/db")).pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [lockKey]);
    try {
      // Check if workspace already exists
      const [existing] = await db
        .select(intermediarySelection)
        .from(financingIntermediaries)
        .where(eq(financingIntermediaries.workspaceOwnerUserId, ownerUserId))
        .limit(1);
      if (existing) return mapIntermediary(existing);

      // Verify user has financial_institution role
      const [owner] = await db
        .select({ id: users.id, name: users.name, role: users.role })
        .from(users)
        .where(eq(users.id, ownerUserId))
        .limit(1);
      if (!owner) throw Object.assign(new Error("User not found"), { code: "NOT_FOUND" });
      if (owner.role !== "financial_institution") {
        throw Object.assign(new Error("User must have financial_institution role"), { code: "INVALID_DATA" });
      }

      const now = new Date();
      const [created] = await db
        .insert(financingIntermediaries)
        .values({
          name: owner.name ?? "Financial Institution",
          ownerUserId,
          workspaceOwnerUserId: ownerUserId,
          workspaceStatus: "draft",
          isActive: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning(intermediarySelection);

      // Log the creation event
      await db.insert(fiLifecycleEvents).values({
        intermediaryId: created!.id,
        fromStatus: null,
        toStatus: "draft",
        actorUserId: ownerUserId,
        reason: "workspace_created",
      });

      return mapIntermediary(created!);
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [lockKey]);
    }
  } finally {
    client.release();
  }
}

/**
 * Transition workspace status through the allowed state machine.
 * Writes a fi_lifecycle_events record in the same transaction.
 * Also keeps isActive in sync (active→true, else→false) for backwards compat.
 */
export async function transitionWorkspaceStatus(params: {
  intermediaryId: string;
  newStatus: FiWorkspaceStatus;
  actorUserId: string;
  reason?: string;
}): Promise<FinancingIntermediaryRow> {
  const [current] = await db
    .select({ id: financingIntermediaries.id, workspaceStatus: financingIntermediaries.workspaceStatus })
    .from(financingIntermediaries)
    .where(eq(financingIntermediaries.id, params.intermediaryId))
    .limit(1);
  if (!current) throw Object.assign(new Error("Intermediary not found"), { code: "NOT_FOUND" });

  const fromStatus = current.workspaceStatus as FiWorkspaceStatus;
  if (fromStatus === params.newStatus) {
    // Idempotent — already in target status
    const [row] = await db.select(intermediarySelection).from(financingIntermediaries).where(eq(financingIntermediaries.id, params.intermediaryId)).limit(1);
    return mapIntermediary(row!);
  }
  if (!FI_WORKSPACE_TRANSITIONS[fromStatus]?.has(params.newStatus)) {
    throw Object.assign(
      new Error(`Invalid workspace transition from ${fromStatus} to ${params.newStatus}`),
      { code: "INVALID_STATUS_TRANSITION" },
    );
  }

  const isActive = params.newStatus === "active";
  await db.transaction(async (tx) => {
    await tx
      .update(financingIntermediaries)
      .set({ workspaceStatus: params.newStatus, isActive, updatedAt: new Date() })
      .where(eq(financingIntermediaries.id, params.intermediaryId));
    await tx.insert(fiLifecycleEvents).values({
      intermediaryId: params.intermediaryId,
      fromStatus,
      toStatus: params.newStatus,
      actorUserId: params.actorUserId,
      reason: params.reason ?? null,
    });
  });

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: params.actorUserId,
    reason: "fi_workspace_transition",
    metadata: { intermediary_id: params.intermediaryId, from: fromStatus, to: params.newStatus },
  });

  const [updated] = await db.select(intermediarySelection).from(financingIntermediaries).where(eq(financingIntermediaries.id, params.intermediaryId)).limit(1);
  return mapIntermediary(updated!);
}

/**
 * Assert the workspace is active — throws 403 WORKSPACE_NOT_ACTIVE otherwise.
 * Call at the start of every inbox/request operation.
 */
export async function assertWorkspaceActive(intermediaryId: string): Promise<void> {
  const [row] = await db
    .select({ workspaceStatus: financingIntermediaries.workspaceStatus })
    .from(financingIntermediaries)
    .where(eq(financingIntermediaries.id, intermediaryId))
    .limit(1);
  if (!row) throw Object.assign(new Error("Institution not found"), { code: "NOT_FOUND" });
  if (row.workspaceStatus !== "active") {
    throw Object.assign(
      new Error("Institution workspace is not active"),
      { code: "WORKSPACE_NOT_ACTIVE" },
    );
  }
}

/**
 * Suspend all workspaces owned by a user (called on account delete/suspend).
 * Idempotent: already-suspended workspaces are skipped.
 */
export async function suspendWorkspaceOnOwnerExit(ownerUserId: string): Promise<void> {
  const ownedIntermediaries = await db
    .select({ id: financingIntermediaries.id, workspaceStatus: financingIntermediaries.workspaceStatus })
    .from(financingIntermediaries)
    .where(eq(financingIntermediaries.workspaceOwnerUserId, ownerUserId));

  for (const inst of ownedIntermediaries) {
    if (inst.workspaceStatus === "suspended") continue;
    await db.transaction(async (tx) => {
      await tx
        .update(financingIntermediaries)
        .set({ workspaceStatus: "suspended", isActive: false, updatedAt: new Date() })
        .where(eq(financingIntermediaries.id, inst.id));
      await tx.insert(fiLifecycleEvents).values({
        intermediaryId: inst.id,
        fromStatus: inst.workspaceStatus as FiWorkspaceStatus,
        toStatus: "suspended",
        actorUserId: null,
        reason: "owner_account_exit",
      });
    });
  }
}

/**
 * Get lifecycle events for an intermediary (timeline).
 */
export async function getLifecycleEvents(intermediaryId: string): Promise<FiLifecycleEventRow[]> {
  const rows = await db
    .select()
    .from(fiLifecycleEvents)
    .where(eq(fiLifecycleEvents.intermediaryId, intermediaryId))
    .orderBy(desc(fiLifecycleEvents.createdAt));
  return rows.map((r) => ({
    id: r.id,
    intermediary_id: r.intermediaryId,
    from_status: r.fromStatus as FiWorkspaceStatus | null,
    to_status: r.toStatus as FiWorkspaceStatus,
    actor_user_id: r.actorUserId,
    reason: r.reason,
    created_at: r.createdAt ? r.createdAt.toISOString() : null,
  }));
}

export async function getOwnedWorkspace(ownerUserId: string): Promise<FinancingIntermediaryRow | null> {
  const [row] = await db
    .select(intermediarySelection)
    .from(financingIntermediaries)
    .where(eq(financingIntermediaries.workspaceOwnerUserId, ownerUserId))
    .limit(1);
  return row ? mapIntermediary(row) : null;
}

/* ── FI phase 2: institution access (the bank's own side) ─────────────────
 *
 * The flow (user-locked): buyer requests financing → BANCO admin studies the
 * risk (existing pipeline: new → forwarded) → the moment it is forwarded, it
 * hands off AUTOMATICALLY to the bank's own people. BANCO remains a verified
 * ads platform — it brokers the introduction, never the loan.
 */

export interface InstitutionMembership {
  intermediary_id: string;
  intermediary_name: string;
  /** owner = the FI account that owns the intermediary; manager sees all
   *  branches; agent is scoped to its branch (plus unrouted requests). */
  role: "owner" | "manager" | "agent";
  branch_id: string | null;
}

/**
 * Resolve which institution (if any) a marketplace user belongs to — either as
 * the owning FI account or via an employee seat. Null = not institution staff.
 */
export async function resolveInstitutionMembership(
  dbUserId: string,
): Promise<InstitutionMembership | null> {
  const [owned] = await db
    .select({ id: financingIntermediaries.id, name: financingIntermediaries.name })
    .from(financingIntermediaries)
    // No isActive guard here — workspace_status is the access gate (assertWorkspaceActive).
    // An FI owner's membership resolves regardless of workspace phase so callers
    // that legitimately need to know "who owns this institution" still work.
    .where(eq(financingIntermediaries.ownerUserId, dbUserId))
    .limit(1);
  if (owned) {
    return {
      intermediary_id: owned.id,
      intermediary_name: owned.name,
      role: "owner",
      branch_id: null,
    };
  }

  const [seat] = await db
    .select({
      intermediaryId: financingSeats.intermediaryId,
      branchId: financingSeats.branchId,
      role: financingSeats.role,
      name: financingIntermediaries.name,
    })
    .from(financingSeats)
    .innerJoin(
      financingIntermediaries,
      eq(financingSeats.intermediaryId, financingIntermediaries.id),
    )
    .where(
      and(
        eq(financingSeats.userId, dbUserId),
        eq(financingIntermediaries.isActive, true),
      ),
    )
    .limit(1);
  if (!seat) return null;

  return {
    intermediary_id: seat.intermediaryId,
    intermediary_name: seat.name,
    role: seat.role === "manager" ? "manager" : "agent",
    branch_id: seat.branchId,
  };
}

/**
 * The institution's request inbox — ONLY requests Banco explicitly forwarded to
 * this institution (intermediaryId match) in a live bank lifecycle status
 * (forwarded | contacted | closed). Never the raw "new" pool or rejected rows.
 * Agent seats with a branch see their branch's requests plus unrouted ones;
 * owner / manager see everything.
 */
export async function listInstitutionRequests(params: {
  dbUserId: string;
  status?: FinancingStatus;
  cursor?: string;
  limit: number;
}): Promise<{
  membership: InstitutionMembership;
  items: FinancingRequestRow[];
  branches: { id: string; name: string }[];
  cursor?: string;
  has_next: boolean;
}> {
  const membership = await resolveInstitutionMembership(params.dbUserId);
  if (!membership) {
    throw Object.assign(new Error("Not a financial-institution member"), {
      code: "FORBIDDEN",
    });
  }

  await assertWorkspaceActive(membership.intermediary_id);

  // The institution's branches ride the inbox response so the bank side needs
  // no admin-only endpoint to render its branch-routing picker. Names only —
  // scoped to the caller's own institution by the membership gate above.
  const branchRows = await db
    .select({ id: financingBranches.id, name: financingBranches.name })
    .from(financingBranches)
    .where(eq(financingBranches.intermediaryId, membership.intermediary_id))
    .orderBy(asc(financingBranches.name));

  const conditions: SQL[] = [
    eq(leadHistory.actionType, "finance_request"),
    eq(financingRequests.intermediaryId, membership.intermediary_id),
  ];
  if (params.status) {
    conditions.push(eq(effectiveStatus, params.status));
  } else {
    // Default inbox: only bank-visible lifecycle states (not new/rejected).
    conditions.push(
      inArray(effectiveStatus, ["forwarded", "contacted", "closed"]),
    );
  }
  if (membership.role === "agent" && membership.branch_id) {
    conditions.push(
      or(
        isNull(financingRequests.branchId),
        eq(financingRequests.branchId, membership.branch_id),
      )!,
    );
  }
  if (params.cursor) {
    const cursorDate = new Date(params.cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      conditions.push(lt(leadHistory.createdAt, cursorDate));
    }
  }

  const rows = (await baseQuery(conditions).limit(params.limit + 1)) as RawRow[];
  const has_next = rows.length > params.limit;
  const page = rows.slice(0, params.limit);
  const last = page[page.length - 1];

  return {
    membership,
    items: page.map(mapRow),
    branches: branchRows,
    cursor: has_next && last?.createdAt ? last.createdAt.toISOString() : undefined,
    has_next,
  };
}

/**
 * Bank-side status machine (institution members only):
 * forwarded → contacted → closed. Idempotent same-status updates are allowed.
 * Admin still owns new / forwarded / rejected via the admin CRM path.
 */
const INSTITUTION_STATUS_TRANSITIONS: Record<
  FinancingStatus,
  ReadonlySet<Extract<FinancingStatus, "contacted" | "closed">>
> = {
  new: new Set(),
  forwarded: new Set(["contacted"]),
  contacted: new Set(["closed"]),
  closed: new Set(),
  rejected: new Set(),
};

function assertInstitutionStatusTransition(
  from: FinancingStatus,
  to: Extract<FinancingStatus, "contacted" | "closed">,
): void {
  if (from === to) return;
  if (!INSTITUTION_STATUS_TRANSITIONS[from].has(to)) {
    throw Object.assign(
      new Error(`Invalid status transition from ${from} to ${to}`),
      { code: "INVALID_DATA" },
    );
  }
}

/** Same visibility rule as listInstitutionRequests for branch-scoped agents. */
function agentCanAccessRequest(
  membership: InstitutionMembership,
  requestBranchId: string | null,
): boolean {
  if (membership.role !== "agent" || !membership.branch_id) return true;
  return requestBranchId === null || requestBranchId === membership.branch_id;
}

/**
 * Bank-side lifecycle transitions: contacted / closed only (the admin owns
 * new/forwarded/rejected). Owner + manager may also route a request to one of
 * the institution's branches. Scoped hard to the caller's institution — a
 * request belonging to another bank reads as NOT_FOUND, never FORBIDDEN, so
 * membership probing leaks nothing. Branch-scoped agents get the same NOT_FOUND
 * treatment for out-of-scope requests (F-SEC-01 / R1).
 */
export async function updateInstitutionRequest(params: {
  dbUserId: string;
  leadId: string;
  status?: Extract<FinancingStatus, "contacted" | "closed">;
  branchId?: string | null;
}): Promise<FinancingRequestRow> {
  const membership = await resolveInstitutionMembership(params.dbUserId);
  if (!membership) {
    throw Object.assign(new Error("Not a financial-institution member"), {
      code: "FORBIDDEN",
    });
  }

  await assertWorkspaceActive(membership.intermediary_id);

  const existing = await getFinancingRequestByLeadId(params.leadId);
  if (!existing || existing.intermediary_id !== membership.intermediary_id) {
    throw Object.assign(new Error("Finance request not found"), { code: "NOT_FOUND" });
  }

  // F-SEC-01: LIST and PATCH must share the same branch scope for agents.
  if (!agentCanAccessRequest(membership, existing.branch_id)) {
    throw Object.assign(new Error("Finance request not found"), { code: "NOT_FOUND" });
  }

  if (params.status !== undefined) {
    assertInstitutionStatusTransition(existing.status, params.status);
  }

  const set: Partial<typeof financingRequests.$inferInsert> = { updatedAt: new Date() };
  if (params.status !== undefined) set.status = params.status;
  if (params.branchId !== undefined) {
    if (membership.role === "agent") {
      throw Object.assign(new Error("Only the institution owner or a manager can route to a branch"), {
        code: "FORBIDDEN",
      });
    }
    if (params.branchId) {
      const [branch] = await db
        .select({ id: financingBranches.id })
        .from(financingBranches)
        .where(
          and(
            eq(financingBranches.id, params.branchId),
            eq(financingBranches.intermediaryId, membership.intermediary_id),
          ),
        )
        .limit(1);
      if (!branch) {
        throw Object.assign(new Error("Branch not found"), { code: "NOT_FOUND" });
      }
    }
    set.branchId = params.branchId;
  }

  // Status changes must be conditional on the observed status so concurrent
  // agents cannot reopen a closed row via last-write-wins (same class as booking).
  const statusChanging =
    params.status !== undefined && params.status !== existing.status;
  const whereClause = statusChanging
    ? and(
        eq(financingRequests.leadId, params.leadId),
        eq(financingRequests.status, existing.status),
      )
    : eq(financingRequests.leadId, params.leadId);

  const updatedRows = await db
    .update(financingRequests)
    .set(set)
    .where(whereClause)
    .returning({ leadId: financingRequests.leadId });

  if (statusChanging && updatedRows.length === 0) {
    const fresh = await getFinancingRequestByLeadId(params.leadId);
    if (fresh && params.status && fresh.status === params.status) {
      return fresh;
    }
    throw Object.assign(
      new Error(
        `Cannot update a ${fresh?.status ?? "missing"} finance request — refresh and retry`,
      ),
      { code: "CONFLICT" },
    );
  }

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: params.dbUserId,
    reason: "financing_request_institution_update",
    metadata: {
      lead_id: params.leadId,
      intermediary_id: membership.intermediary_id,
      status: params.status ?? null,
      branch_id: params.branchId ?? null,
    },
  });

  const updated = await getFinancingRequestByLeadId(params.leadId);
  if (!updated) {
    throw Object.assign(new Error("Finance request not found"), { code: "NOT_FOUND" });
  }
  return updated;
}

/**
 * The auto-handoff ping: notify the institution's owner account + every seat
 * the moment Banco forwards a request. In-app (bilingual) with the lead id so
 * the client can deep-link into the bank inbox. Best-effort by design.
 */
async function notifyInstitutionHandoff(
  leadId: string,
  intermediaryId: string,
  listingTitle: string,
): Promise<void> {
  const [inst] = await db
    .select({
      ownerUserId: financingIntermediaries.ownerUserId,
      name: financingIntermediaries.name,
    })
    .from(financingIntermediaries)
    .where(eq(financingIntermediaries.id, intermediaryId))
    .limit(1);
  if (!inst) return;

  const seats = await db
    .select({ userId: financingSeats.userId })
    .from(financingSeats)
    .where(eq(financingSeats.intermediaryId, intermediaryId));

  const recipients = new Set<string>(seats.map((s) => s.userId));
  if (inst.ownerUserId) recipients.add(inst.ownerUserId);
  if (recipients.size === 0) return;

  await Promise.all(
    Array.from(recipients).map((userId) =>
      createNotification({
        userId,
        type: "system",
        title: "طلب تمويل جديد محوّل إليكم · Financing request forwarded",
        body: `حوّلت بانكو طلب تمويل على «${listingTitle}» بعد الدراسة · Banco forwarded a financing request after review`,
        data: { financing_lead_id: leadId },
      }).catch(() => {}),
    ),
  );
}

/* ── FI phase 2: branches + seats (admin-managed) ──────── */

export interface FinancingBranchRow {
  id: string;
  intermediary_id: string;
  name: string;
  city: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface FinancingSeatRow {
  id: string;
  intermediary_id: string;
  branch_id: string | null;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  role: "manager" | "agent";
  created_at: string | null;
}

export async function listBranches(intermediaryId: string): Promise<FinancingBranchRow[]> {
  const rows = await db
    .select()
    .from(financingBranches)
    .where(eq(financingBranches.intermediaryId, intermediaryId))
    .orderBy(asc(financingBranches.createdAt));
  return rows.map((r) => ({
    id: r.id,
    intermediary_id: r.intermediaryId,
    name: r.name,
    city: r.city,
    is_active: r.isActive,
    created_at: r.createdAt ? r.createdAt.toISOString() : null,
  }));
}

export async function createBranch(params: {
  intermediaryId: string;
  name: string;
  city?: string | null;
  adminUserId: string;
}): Promise<FinancingBranchRow> {
  const [im] = await db
    .select({ id: financingIntermediaries.id })
    .from(financingIntermediaries)
    .where(eq(financingIntermediaries.id, params.intermediaryId))
    .limit(1);
  if (!im) {
    throw Object.assign(new Error("Intermediary not found"), { code: "NOT_FOUND" });
  }

  const [row] = await db
    .insert(financingBranches)
    .values({
      intermediaryId: params.intermediaryId,
      name: params.name,
      city: params.city ?? null,
    })
    .returning();

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: params.adminUserId,
    reason: "financing_branch_create",
    metadata: { intermediary_id: params.intermediaryId, branch_id: row.id },
  });

  return {
    id: row.id,
    intermediary_id: row.intermediaryId,
    name: row.name,
    city: row.city,
    is_active: row.isActive,
    created_at: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

export async function listSeats(intermediaryId: string): Promise<FinancingSeatRow[]> {
  const rows = await db
    .select({
      id: financingSeats.id,
      intermediaryId: financingSeats.intermediaryId,
      branchId: financingSeats.branchId,
      userId: financingSeats.userId,
      role: financingSeats.role,
      createdAt: financingSeats.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(financingSeats)
    .innerJoin(users, eq(financingSeats.userId, users.id))
    .where(eq(financingSeats.intermediaryId, intermediaryId))
    .orderBy(asc(financingSeats.createdAt));
  return rows.map((r) => ({
    id: r.id,
    intermediary_id: r.intermediaryId,
    branch_id: r.branchId,
    user_id: r.userId,
    user_name: r.userName,
    user_email: r.userEmail,
    role: r.role === "manager" ? "manager" : "agent",
    created_at: r.createdAt ? r.createdAt.toISOString() : null,
  }));
}

export async function createSeat(params: {
  intermediaryId: string;
  userId: string;
  branchId?: string | null;
  role?: "manager" | "agent";
  adminUserId: string;
}): Promise<FinancingSeatRow> {
  const [im] = await db
    .select({
      id: financingIntermediaries.id,
      isActive: financingIntermediaries.isActive,
    })
    .from(financingIntermediaries)
    .where(eq(financingIntermediaries.id, params.intermediaryId))
    .limit(1);
  if (!im) {
    throw Object.assign(new Error("Intermediary not found"), { code: "NOT_FOUND" });
  }
  // F-CLM-02 invariant (fail-closed): a seat IS operational access to the
  // institution inbox. There is no separate is_verified flag on institutions —
  // creation is admin-gated — so isActive is the on/off invariant and a seat
  // must never be granted on a deactivated institution.
  if (!im.isActive) {
    throw Object.assign(new Error("Institution is inactive"), { code: "FORBIDDEN" });
  }

  const [member] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);
  if (!member) {
    throw Object.assign(new Error("User not found"), { code: "NOT_FOUND" });
  }
  if (member.deletedAt) {
    throw Object.assign(new Error("User account is deleted"), { code: "FORBIDDEN" });
  }

  if (params.branchId) {
    const [branch] = await db
      .select({ id: financingBranches.id })
      .from(financingBranches)
      .where(
        and(
          eq(financingBranches.id, params.branchId),
          eq(financingBranches.intermediaryId, params.intermediaryId),
        ),
      )
      .limit(1);
    if (!branch) {
      throw Object.assign(new Error("Branch not found"), { code: "NOT_FOUND" });
    }
  }

  const inserted = await db
    .insert(financingSeats)
    .values({
      intermediaryId: params.intermediaryId,
      userId: params.userId,
      branchId: params.branchId ?? null,
      role: params.role ?? "agent",
    })
    .onConflictDoNothing({
      target: [financingSeats.intermediaryId, financingSeats.userId],
    })
    .returning();

  if (inserted.length === 0) {
    throw Object.assign(new Error("User is already a member of this institution"), {
      code: "CONFLICT",
    });
  }
  const row = inserted[0];

  writeAudit({
    eventType: "admin_action",
    severity: "info",
    actorUserId: params.adminUserId,
    reason: "financing_seat_create",
    metadata: {
      intermediary_id: params.intermediaryId,
      seat_id: row.id,
      user_id: params.userId,
    },
  });

  return {
    id: row.id,
    intermediary_id: row.intermediaryId,
    branch_id: row.branchId,
    user_id: row.userId,
    user_name: member.name,
    user_email: member.email,
    role: row.role === "manager" ? "manager" : "agent",
    created_at: row.createdAt ? row.createdAt.toISOString() : null,
  };
}
