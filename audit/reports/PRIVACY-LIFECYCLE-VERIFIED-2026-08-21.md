# Two privacy lifecycle defects — verified, and one mechanism already exists

Continuation of the deep audit into the two privacy-critical findings I had not yet verified myself. Executed at `canonical @ 4f2c81c`, **2026-08-21 23:45 UTC**.

**Both confirmed. Both are cheaper to fix than their reports suggest, because in each case the correct machinery already exists elsewhere in the same codebase and is simply not called on this path.**

---

## 1 · 🔴 LIST-LIN-02 — a deleted listing photo stays publicly readable forever

### The chain, verified in three parts

**① Anonymous read is granted by the object ACL alone. The database is never consulted.** `lib/objectAcl.ts:143-147`:

```ts
if (aclPolicy.visibility === "public" && requestedPermission === ObjectPermission.READ) {
  return true;
}
```

That check runs **before** any owner or rule evaluation, and nothing in it touches `listing_media`. **Once an object is finalized public, deleting its database row has exactly zero effect on who can read it.**

**② Finalization writes precisely that ACL.** `lib/uploadFinalization.ts:93-95`:

```ts
await storage.trySetObjectEntityAclPolicy(reference.objectPath, {
  owner: ownerId,
  visibility: "public",
  …
```

**③ Removal deletes only the row.** `ListingService.ts:1474`:

```ts
await tx.delete(listingMedia).where(eq(listingMedia.listingId, id));
```

I searched the entire `ListingService` for `deleteObject`, `removeObject`, `visibility: "private"`, and any retirement call. **There is none.**

### The consequence, stated plainly

**A seller removes a photo during Edit — because it shows their face, their license plate, their front door, their child — and the image remains anonymously downloadable at its original URL, permanently.** The app tells them it is gone. It is not. The same holds for explicit listing delete and for dealer bulk delete.

**This is a privacy defect, not a storage-hygiene defect.** Orphaned bytes cost money; orphaned *publicly readable* bytes that the user was told were deleted are a different category.

### ✅ And the mechanism to fix it already exists and is already trusted

`deleteServingUrls` is a first-class method on the `ObjectStorage` interface (`lib/objectStorageProvider.ts:58`) and is **already called from three other lifecycles**:

| Caller | Purpose |
|---|---|
| `UserService.ts:621` | account deletion — purges chat, story and KYC media |
| `ImportOrderService.ts:467` | import document retirement |
| `uploadClaims.ts:121` | upload cleanup |

**So this is not "build object retirement." It is "call the retirement path that already works, from the one lifecycle that does not."** That materially lowers the cost and the risk of the repair.

### The constraint their report states, which I endorse

> *"Do not blindly delete every old URL immediately after a DB transaction."*

Correct, and it is the whole difficulty. A final URL is owner-bound and may be referenced elsewhere — the same object legitimately appears as both an image and a video poster thumbnail. **Retirement must be reference-aware and idempotent**, and must survive partial provider failure, cover both storage providers, and tolerate legacy objects that predate the trusted ACL metadata.

**Their account-deletion note is also right and should not be quietly merged into this work:** `deleteAccount()` deliberately preserves listing references while tombstoning the user. Whether listing media should be retained, privatised or deleted under *account* deletion is a **retention policy decision for the owner**, separate from explicit listing deletion.

---

## 2 · 🟠 ACC-LIN-02 — "deletion failed" is shown to a user whose account was deleted

### Verified at `app/settings.tsx:650-672`, and again at `:716-729`

```ts
await suspendForAccountDeletion();
try {
  await deleteAccount();                        // ← server tombstone is now DURABLE
  await purgeAfterAccountDeletion().catch(…);
  await unregisterCachedPushTokenBestEffort();
  await signOut();                              // ← if this throws …
  router.replace("/(tabs)");
} catch {
  resumeAfterAccountDeletionFailure();          // ← … messenger is re-enabled on a deleted account
  setDeleting(false);
  Alert.alert(t("settings.deleteErrorTitle"), t("settings.deleteErrorBody"));
}
```

**One `try` spans both the irreversible server action and everything after it.** So a Clerk `signOut()` failure — a network blip at exactly the wrong moment — is classified as "account deletion failed."

**Their report identifies the state-machine consequence correctly:** `resumeAfterAccountDeletionFailure()` clears `purgingRef` and `suspendedRef` and reschedules the outbox drain, re-enabling messenger processing for an account the server has already tombstoned. Reactive recovery follows when the next request returns `ACCOUNT_DELETED` — but an invalid state was entered first.

**I want to add the consequence I think matters more, which their report does not emphasise: the user is told a false thing about an irreversible privacy action.**

The alert says deletion failed. **It succeeded.** A user who asked to be deleted now believes they were not — they may retry, or worse, conclude their data is still held and act on that belief. **For a deletion flow, telling the truth about the outcome is the whole point of the flow.**

### The fix is bounded, and their framing is right

> *"This is bounded. It does not require redesigning account deletion, Messenger, Clerk, push, or QueryClient."*

Agreed. The `catch` must distinguish two cases:

- **`deleteAccount()` itself failed** → resume, and tell the user deletion failed. Correct today.
- **Anything after it failed** → **never resume.** Force local teardown, and tell the user the account *was* deleted while reporting the sign-out problem separately.

**Both deletion paths need it** — the SSO typed-delete and the password-confirmed path are separate copies of the same structure.

### Their guard blind-spot section is exactly the pattern I keep reporting

`messenger-wiring-guard.test.mjs` proves that `suspendForAccountDeletion()`, `purgeAfterAccountDeletion()` and `resumeAfterAccountDeletionFailure()` **exist and are referenced**. It does **not** prove the ordering, and it cannot — a source-text guard sees tokens, not control flow. **That is precisely the "static guard without a real mount" weakness this repository's own `render-coverage-guard` was built to prevent.** The correct pairing here is a behavioural test that fails `signOut()` and asserts the outbox stays suspended.

---

## 3 · What their transition matrix gets right — and it is a lot

Their §1 enumerates **eleven** identity-transition edges, each with exact source evidence. **Ten are `PRESENT` or `PRESENT/GUARDED`, and I spot-checked the structure rather than taking it on faith.** The design underneath is genuinely strong:

- `custom-fetch.ts` invokes teardown only on `401` **plus** `ACCOUNT_DELETED`, with a one-shot latch against teardown storms
- outbox storage is **owner-keyed**, and foreign-owner storage is purged both on sign-out and before hydrating a new owner
- the **JWT subject is checked against the entry owner before send** — that is the control that actually prevents cross-account message leakage
- the shared `QueryClient` is cleared on any Clerk `userId` change
- manual sign-out is **fail-closed on the outbox**: cleanup must succeed or sign-out aborts with a visible error

**A marketplace with two-account switching and a durable message outbox is exactly where cross-identity bleed happens, and this has been thought about carefully.** The single ordering defect above sits inside an otherwise well-built machine — which is why it is worth fixing precisely rather than rebuilding anything.

**And their own honesty holds:** the cold-restart and two-account journey is marked `PRESENT AT SOURCE / DEVICE UNPROVEN`. That is the correct classification, and it is the same wall every other item in this engagement hits.

---

## 4 · Where these rank

| | Finding | Why here |
|---|---|---|
| 🔴 P0 | Price corruption | destroys owner data, silently, on every edit |
| 🔴 P0 | `DEPLOY-01` | no deployment can be created at all |
| 🔴 **P1** | **LIST-LIN-02** | **user told data is deleted; it is publicly readable** |
| 🔴 P1 | Gate-3 seller overrides moderation | authority bypass |
| 🟠 **P1** | **ACC-LIN-02** | **user told deletion failed when it succeeded** |
| 🟠 P1 | Play key not gitignored | credential exposure on a public repo |

**The two verified here share a shape with the price defect: the system tells the user something untrue about an irreversible action.** That is a distinct class from a feature gap, and I think it should be ranked as one.

---

## 5 · Method note

I verified both findings by reading the executing code paths, not by trusting the reports — the ACL decision at `objectAcl.ts:143`, the absence of any retirement call in `ListingService`, the existing `deleteServingUrls` callers, and the exact `try`/`catch` spans in both deletion paths.

**Both reports were accurate.** My additions are: the retirement mechanism already exists and is trusted in three other lifecycles, and the ACC-LIN-02 user-facing falsehood deserves more weight than the state-machine issue it was filed under.

---
*Verified at `canonical @ 4f2c81c`. No file modified outside `audit/reports/`; nothing pushed to `canonical/vnext-assembly`; tags remain 0.*
