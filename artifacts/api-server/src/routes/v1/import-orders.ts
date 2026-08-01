import { Router } from "express";
import {
  createImportOrderHandler,
  listMyImportOrdersHandler,
  getImportOrderHandler,
  updateImportOrderStageHandler,
  cancelImportOrderHandler,
  listImportOrderDocumentsHandler,
  attachImportOrderDocumentHandler,
  deleteImportOrderDocumentHandler,
} from "../../controllers/importOrderController";
import { requireAuth, requireAdminRole, requirePermission } from "../../middlewares/authGuard";
import {
  publicRateLimiter,
  writeRateLimiter,
} from "../../middlewares/rateLimiter";

const router = Router();

router.post("/", writeRateLimiter, requireAuth, createImportOrderHandler);
// "/mine" must be registered before "/:id" so it is not captured as an id.
router.get("/mine", publicRateLimiter, requireAuth, listMyImportOrdersHandler);
router.get("/:id", publicRateLimiter, requireAuth, getImportOrderHandler);
// Stage/quote changes are commercial ops — moderators/support must not advance them.
router.patch(
  "/:id/stage",
  writeRateLimiter,
  requireAuth,
  requireAdminRole,
  requirePermission("manage_financing"),
  updateImportOrderStageHandler,
);
router.post("/:id/cancel", writeRateLimiter, requireAuth, cancelImportOrderHandler);
// Order paperwork — owner-scoped attach/list/remove (files go through the
// shared presigned-upload flow first; these only record the servable URL).
router.get(
  "/:id/documents",
  publicRateLimiter,
  requireAuth,
  listImportOrderDocumentsHandler,
);
router.post(
  "/:id/documents",
  writeRateLimiter,
  requireAuth,
  attachImportOrderDocumentHandler,
);
router.delete(
  "/:id/documents/:documentId",
  writeRateLimiter,
  requireAuth,
  deleteImportOrderDocumentHandler,
);

export default router;
