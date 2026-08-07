import { Router } from "express";
import {
  institutionInboxHandler,
  institutionUpdateRequestHandler,
  workspaceProvisionHandler,
  workspaceStatusHandler,
  workspaceEventsHandler,
  workspaceTransitionHandler,
} from "../../controllers/financingController";
import { requireAuth, requireAdminRole } from "../../middlewares/authGuard";
import { writeRateLimiter, publicRateLimiter } from "../../middlewares/rateLimiter";

const router = Router();

// FI phase 2 — the bank's own inbox. Any signed-in user may CALL these, but the
// service resolves institution membership (owner account or employee seat) and
// rejects everyone else, so the routes stay simple while access stays scoped.
// Banks only ever see requests Banco explicitly forwarded to them.
router.get("/inbox", publicRateLimiter, requireAuth, institutionInboxHandler);
router.patch(
  "/inbox/:leadId",
  writeRateLimiter,
  requireAuth,
  institutionUpdateRequestHandler,
);

// FI phase 5 — workspace lifecycle
router.post("/workspace", writeRateLimiter, requireAuth, workspaceProvisionHandler);
router.get("/workspace", publicRateLimiter, requireAuth, workspaceStatusHandler);
router.get("/workspace/events", publicRateLimiter, requireAuth, workspaceEventsHandler);
router.patch("/workspace/status", writeRateLimiter, requireAuth, requireAdminRole, workspaceTransitionHandler);

export default router;
