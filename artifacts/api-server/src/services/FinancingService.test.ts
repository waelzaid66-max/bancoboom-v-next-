import { describe, it, expect, afterAll } from "vitest";
import { eq, inArray, sql } from "drizzle-orm";
import {
  createIntermediary,
  listIntermediaries,
  updateIntermediary,
  updateFinancingRequest,
  createBranch,
  createSeat,
  updateInstitutionRequest,
  listInstitutionRequests,
  ensureFiWorkspace,
  transitionWorkspaceStatus,
  assertWorkspaceActive,
  suspendWorkspaceOnOwnerExit,
  getLifecycleEvents,
} from "./FinancingService";
import { db, createUser, deleteUsers, uniq, randomUUID } from "../__tests__/helpers";
import {
  listings,
  leadHistory,
  financingRequests,
  financingIntermediaries,
  financingBranches,
  financingSeats,
  fiLifecycleEvents,
} from "@workspace/db/schema";

/**
 * FinancingService is the untested bank-financing CRM: the intermediary directory
 * and the finance-request pipeline. Covers intermediary CRUD, the upsert +
 * intermediary assignment on a real finance_request lead, and the validation
 * guards (non-finance/unknown lead, unknown intermediary).
 */
const uids: string[] = [];
const leadIds: string[] = [];
const listingIds: string[] = [];
const imIds: string[] = [];
const branchIds: string[] = [];
const seatIds: string[] = [];
const lifecycleEventIds: string[] = [];

async function financeLead(): Promise<string> {
  const seller = await createUser();
  uids.push(seller);
  const listingId = randomUUID();
  await db.insert(listings).values({
    id: listingId,
    userId: seller,
    title: uniq("fin-listing"),
    category: "car",
    status: "active",
    basePriceCash: "500000",
    location: "Cairo",
  });
  listingIds.push(listingId);
  const leadId = randomUUID();
  await db.insert(leadHistory).values({
    id: leadId,
    listingId,
    sellerId: seller,
    actionType: "finance_request",
  });
  leadIds.push(leadId);
  return leadId;
}

afterAll(async () => {
  if (seatIds.length) {
    await db.delete(financingSeats).where(inArray(financingSeats.id, seatIds));
  }
  if (leadIds.length) {
    await db.delete(financingRequests).where(inArray(financingRequests.leadId, leadIds));
    // leadHistory.sellerId → users has no cascade, so remove leads before users.
    await db.delete(leadHistory).where(inArray(leadHistory.id, leadIds));
  }
  if (branchIds.length) {
    await db.delete(financingBranches).where(inArray(financingBranches.id, branchIds));
  }
  if (lifecycleEventIds.length) {
    await db.delete(fiLifecycleEvents).where(inArray(fiLifecycleEvents.id, lifecycleEventIds));
  }
  for (const id of listingIds) await db.delete(listings).where(eq(listings.id, id));
  for (const id of imIds) await db.delete(financingIntermediaries).where(eq(financingIntermediaries.id, id));
  await deleteUsers(...uids);
});

describe("FinancingService — intermediary directory", () => {
  it("creates, lists, and updates an intermediary", async () => {
    const admin = await createUser();
    uids.push(admin);

    const created = await createIntermediary({
      name: uniq("Bank Partner"),
      contactEmail: "partner@bank.test",
      adminUserId: admin,
    });
    imIds.push(created.id);
    expect(created.is_active).toBe(true);
    expect(created.contact_email).toBe("partner@bank.test");

    const list = await listIntermediaries();
    expect(list.some((i) => i.id === created.id)).toBe(true);

    const updated = await updateIntermediary({
      id: created.id,
      name: "Renamed Partner",
      isActive: false,
      adminUserId: admin,
    });
    expect(updated.name).toBe("Renamed Partner");
    expect(updated.is_active).toBe(false);
  });
});

describe("FinancingService — finance-request pipeline", () => {
  it("upserts status + assigns an intermediary, then updates idempotently", async () => {
    const admin = await createUser();
    uids.push(admin);
    const leadId = await financeLead();
    const im = await createIntermediary({ name: uniq("IM"), adminUserId: admin });
    imIds.push(im.id);

    const r = await updateFinancingRequest({
      leadId,
      status: "forwarded",
      intermediaryId: im.id,
      notes: "call the client",
      adminUserId: admin,
    });
    expect(r.lead_id).toBe(leadId);
    expect(r.status).toBe("forwarded");
    expect(r.intermediary_id).toBe(im.id);
    expect(r.assigned_at).not.toBeNull();
    expect(r.notes).toBe("call the client");

    // Second update upserts the same row (no duplicate), changing only status.
    const r2 = await updateFinancingRequest({ leadId, status: "closed", adminUserId: admin });
    expect(r2.status).toBe("closed");
    expect(r2.intermediary_id).toBe(im.id); // unchanged (not passed)

    const rows = await db.select().from(financingRequests).where(eq(financingRequests.leadId, leadId));
    expect(rows).toHaveLength(1);
  });

  it("rejects an unknown/non-finance lead and an unknown intermediary", async () => {
    const admin = await createUser();
    uids.push(admin);

    await expect(
      updateFinancingRequest({ leadId: randomUUID(), status: "new", adminUserId: admin }),
    ).rejects.toThrow(/not found/i);

    const leadId = await financeLead();
    await expect(
      updateFinancingRequest({ leadId, intermediaryId: randomUUID(), adminUserId: admin }),
    ).rejects.toThrow(/not found/i);
  });
});

describe("FinancingService — institution AuthZ + status machine (F-SEC-01 / R2)", () => {
  async function setupInstitutionWithBranches() {
    const admin = await createUser();
    uids.push(admin);
    const agentA = await createUser();
    uids.push(agentA);
    const agentB = await createUser();
    uids.push(agentB);
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);

    const im = await createIntermediary({ name: uniq("FI Bank"), adminUserId: admin });
    imIds.push(im.id);
    await updateIntermediary({ id: im.id, ownerUserId: owner, adminUserId: admin });
    // Activate workspace so assertWorkspaceActive gate passes in inbox/update ops.
    // Use raw SQL to avoid depending on dist rebuild for the new enum column type.
    await db.execute(
      sql`UPDATE financing_intermediaries SET workspace_status = 'active' WHERE id = ${im.id}`
    );

    const branchA = await createBranch({
      intermediaryId: im.id,
      name: "Branch A",
      adminUserId: admin,
    });
    branchIds.push(branchA.id);
    const branchB = await createBranch({
      intermediaryId: im.id,
      name: "Branch B",
      adminUserId: admin,
    });
    branchIds.push(branchB.id);

    const seatA = await createSeat({
      intermediaryId: im.id,
      userId: agentA,
      branchId: branchA.id,
      role: "agent",
      adminUserId: admin,
    });
    seatIds.push(seatA.id);
    const seatB = await createSeat({
      intermediaryId: im.id,
      userId: agentB,
      branchId: branchB.id,
      role: "agent",
      adminUserId: admin,
    });
    seatIds.push(seatB.id);

    return { admin, agentA, agentB, owner, im, branchA, branchB };
  }

  it("denies a branch agent PATCH on another branch's request (NOT_FOUND)", async () => {
    const { admin, agentA, im, branchB } = await setupInstitutionWithBranches();
    const leadId = await financeLead();

    await updateFinancingRequest({
      leadId,
      status: "forwarded",
      intermediaryId: im.id,
      adminUserId: admin,
    });
    // Route to branch B — agent A must not see/mutate it.
    await db
      .update(financingRequests)
      .set({ branchId: branchB.id, updatedAt: new Date() })
      .where(eq(financingRequests.leadId, leadId));

    await expect(
      updateInstitutionRequest({
        dbUserId: agentA,
        leadId,
        status: "contacted",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("allows a branch agent to advance status on own-branch and unrouted requests", async () => {
    const { admin, agentA, im, branchA } = await setupInstitutionWithBranches();

    const ownLead = await financeLead();
    await updateFinancingRequest({
      leadId: ownLead,
      status: "forwarded",
      intermediaryId: im.id,
      adminUserId: admin,
    });
    await db
      .update(financingRequests)
      .set({ branchId: branchA.id, updatedAt: new Date() })
      .where(eq(financingRequests.leadId, ownLead));

    const contacted = await updateInstitutionRequest({
      dbUserId: agentA,
      leadId: ownLead,
      status: "contacted",
    });
    expect(contacted.status).toBe("contacted");

    const unroutedLead = await financeLead();
    await updateFinancingRequest({
      leadId: unroutedLead,
      status: "forwarded",
      intermediaryId: im.id,
      adminUserId: admin,
    });

    const unroutedContacted = await updateInstitutionRequest({
      dbUserId: agentA,
      leadId: unroutedLead,
      status: "contacted",
    });
    expect(unroutedContacted.status).toBe("contacted");
  });

  it("enforces forwarded → contacted → closed and rejects illegal jumps", async () => {
    const { admin, owner, im } = await setupInstitutionWithBranches();
    const leadId = await financeLead();
    await updateFinancingRequest({
      leadId,
      status: "forwarded",
      intermediaryId: im.id,
      adminUserId: admin,
    });

    await expect(
      updateInstitutionRequest({ dbUserId: owner, leadId, status: "closed" }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });

    const contacted = await updateInstitutionRequest({
      dbUserId: owner,
      leadId,
      status: "contacted",
    });
    expect(contacted.status).toBe("contacted");

    const closed = await updateInstitutionRequest({
      dbUserId: owner,
      leadId,
      status: "closed",
    });
    expect(closed.status).toBe("closed");

    await expect(
      updateInstitutionRequest({ dbUserId: owner, leadId, status: "contacted" }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });

    // Idempotent same-status is allowed.
    const again = await updateInstitutionRequest({
      dbUserId: owner,
      leadId,
      status: "closed",
    });
    expect(again.status).toBe("closed");
  });

  it("rejects forward to an inactive intermediary (F-SEC-05)", async () => {
    const admin = await createUser();
    uids.push(admin);
    const im = await createIntermediary({ name: uniq("Sleepy Bank"), adminUserId: admin });
    imIds.push(im.id);
    await updateIntermediary({ id: im.id, isActive: false, adminUserId: admin });

    const leadId = await financeLead();
    await expect(
      updateFinancingRequest({
        leadId,
        status: "forwarded",
        intermediaryId: im.id,
        adminUserId: admin,
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
  });

  it("rejects linking an owner without financial_institution role (F-SEC-03)", async () => {
    const admin = await createUser();
    uids.push(admin);
    const individual = await createUser({ role: "individual" });
    uids.push(individual);
    const im = await createIntermediary({ name: uniq("Role Gate Bank"), adminUserId: admin });
    imIds.push(im.id);

    await expect(
      updateIntermediary({
        id: im.id,
        ownerUserId: individual,
        adminUserId: admin,
      }),
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
  });

  it("denies institution inbox for FI role without owner/seat link (N1.3)", async () => {
    const fi = await createUser({ role: "financial_institution" });
    uids.push(fi);
    await expect(
      listInstitutionRequests({ dbUserId: fi, limit: 10 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("FinancingService — FI Workspace Lifecycle (Task 5)", () => {
  it("creates workspace (draft) for financial_institution user — idempotent", async () => {
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);

    const ws1 = await ensureFiWorkspace(owner);
    imIds.push(ws1.id);
    expect(ws1.workspace_status).toBe("draft");
    expect(ws1.is_active).toBe(false);

    // Calling again returns same record
    const ws2 = await ensureFiWorkspace(owner);
    expect(ws2.id).toBe(ws1.id);
  });

  it("rejects workspace creation for non-FI user", async () => {
    const individual = await createUser({ role: "individual" });
    uids.push(individual);
    await expect(ensureFiWorkspace(individual)).rejects.toMatchObject({ code: "INVALID_DATA" });
  });

  it("allowed status transitions succeed", async () => {
    const admin = await createUser();
    uids.push(admin);
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);
    const ws = await ensureFiWorkspace(owner);
    imIds.push(ws.id);

    // draft → pending_review
    const r1 = await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "pending_review", actorUserId: admin, reason: "kyc_submitted" });
    expect(r1.workspace_status).toBe("pending_review");
    expect(r1.is_active).toBe(false);

    // pending_review → active
    const r2 = await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "active", actorUserId: admin, reason: "approved" });
    expect(r2.workspace_status).toBe("active");
    expect(r2.is_active).toBe(true);

    // active → suspended
    const r3 = await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "suspended", actorUserId: admin, reason: "policy_violation" });
    expect(r3.workspace_status).toBe("suspended");
    expect(r3.is_active).toBe(false);

    // suspended → active (re-activation)
    const r4 = await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "active", actorUserId: admin });
    expect(r4.workspace_status).toBe("active");
  });

  it("disallowed transitions throw INVALID_STATUS_TRANSITION", async () => {
    const admin = await createUser();
    uids.push(admin);
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);
    const ws = await ensureFiWorkspace(owner);
    imIds.push(ws.id);

    // draft → active is not allowed (must go through pending_review)
    await expect(
      transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "active", actorUserId: admin })
    ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });

    // draft → suspended is not allowed
    await expect(
      transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "suspended", actorUserId: admin })
    ).rejects.toMatchObject({ code: "INVALID_STATUS_TRANSITION" });
  });

  it("assertWorkspaceActive passes on active, throws on draft/pending_review/suspended", async () => {
    const admin = await createUser();
    uids.push(admin);
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);
    const ws = await ensureFiWorkspace(owner);
    imIds.push(ws.id);

    // draft → should reject
    await expect(assertWorkspaceActive(ws.id)).rejects.toMatchObject({ code: "WORKSPACE_NOT_ACTIVE" });

    // pending_review → should reject
    await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "pending_review", actorUserId: admin });
    await expect(assertWorkspaceActive(ws.id)).rejects.toMatchObject({ code: "WORKSPACE_NOT_ACTIVE" });

    // active → should pass
    await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "active", actorUserId: admin });
    await expect(assertWorkspaceActive(ws.id)).resolves.toBeUndefined();

    // suspended → should reject
    await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "suspended", actorUserId: admin });
    await expect(assertWorkspaceActive(ws.id)).rejects.toMatchObject({ code: "WORKSPACE_NOT_ACTIVE" });
  });

  it("tenant isolation: institution A member cannot access institution B inbox", async () => {
    const admin = await createUser();
    uids.push(admin);

    const ownerA = await createUser({ role: "financial_institution" });
    uids.push(ownerA);
    const wsA = await ensureFiWorkspace(ownerA);
    imIds.push(wsA.id);
    await transitionWorkspaceStatus({ intermediaryId: wsA.id, newStatus: "pending_review", actorUserId: admin });
    await transitionWorkspaceStatus({ intermediaryId: wsA.id, newStatus: "active", actorUserId: admin });

    const ownerB = await createUser({ role: "financial_institution" });
    uids.push(ownerB);
    const wsB = await ensureFiWorkspace(ownerB);
    imIds.push(wsB.id);
    await transitionWorkspaceStatus({ intermediaryId: wsB.id, newStatus: "pending_review", actorUserId: admin });
    await transitionWorkspaceStatus({ intermediaryId: wsB.id, newStatus: "active", actorUserId: admin });

    // ownerA calls listInstitutionRequests → they see institution A membership
    const resultA = await listInstitutionRequests({ dbUserId: ownerA, limit: 10 });
    expect(resultA.membership.intermediary_id).toBe(wsA.id);

    // ownerB calls listInstitutionRequests → they see institution B membership
    const resultB = await listInstitutionRequests({ dbUserId: ownerB, limit: 10 });
    expect(resultB.membership.intermediary_id).toBe(wsB.id);
  });

  it("inbox returns 403 WORKSPACE_NOT_ACTIVE when workspace is not active", async () => {
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);
    const ws = await ensureFiWorkspace(owner);
    imIds.push(ws.id);
    // workspace is draft — inbox should be blocked
    await expect(
      listInstitutionRequests({ dbUserId: owner, limit: 10 })
    ).rejects.toMatchObject({ code: "WORKSPACE_NOT_ACTIVE" });
  });

  it("suspendWorkspaceOnOwnerExit suspends workspace and writes lifecycle event", async () => {
    const admin = await createUser();
    uids.push(admin);
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);
    const ws = await ensureFiWorkspace(owner);
    imIds.push(ws.id);
    await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "pending_review", actorUserId: admin });
    await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "active", actorUserId: admin });

    await suspendWorkspaceOnOwnerExit(owner);

    const [refreshed] = await db
      .select({ workspaceStatus: financingIntermediaries.workspaceStatus, isActive: financingIntermediaries.isActive })
      .from(financingIntermediaries)
      .where(eq(financingIntermediaries.id, ws.id))
      .limit(1);
    expect(refreshed!.workspaceStatus).toBe("suspended");
    expect(refreshed!.isActive).toBe(false);

    const events = await getLifecycleEvents(ws.id);
    const suspendEvent = events.find((e) => e.to_status === "suspended" && e.reason === "owner_account_exit");
    expect(suspendEvent).toBeDefined();
    expect(suspendEvent!.actor_user_id).toBeNull();
  });

  it("getLifecycleEvents returns ordered timeline of transitions", async () => {
    const admin = await createUser();
    uids.push(admin);
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);
    const ws = await ensureFiWorkspace(owner);
    imIds.push(ws.id);
    await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "pending_review", actorUserId: admin, reason: "kyc_docs_received" });
    await transitionWorkspaceStatus({ intermediaryId: ws.id, newStatus: "active", actorUserId: admin, reason: "approved_by_risk" });

    const events = await getLifecycleEvents(ws.id);
    // Most recent first
    expect(events[0]!.to_status).toBe("active");
    expect(events[1]!.to_status).toBe("pending_review");
    // Creation event (from_status null, to_status draft)
    const creation = events.find((e) => e.from_status === null && e.to_status === "draft");
    expect(creation).toBeDefined();
  });

  it("financing request cannot be forwarded to non-active workspace intermediary", async () => {
    const admin = await createUser();
    uids.push(admin);
    const owner = await createUser({ role: "financial_institution" });
    uids.push(owner);
    const ws = await ensureFiWorkspace(owner);
    imIds.push(ws.id);
    // workspace is draft (not active) — forwarding should fail

    const leadId = await financeLead();
    await expect(
      updateFinancingRequest({ leadId, status: "forwarded", intermediaryId: ws.id, adminUserId: admin })
    ).rejects.toMatchObject({ code: "INVALID_DATA" });
  });
});
