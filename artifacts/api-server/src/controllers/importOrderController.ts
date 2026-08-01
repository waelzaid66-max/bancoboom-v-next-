import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createImportOrder,
  listMyImportOrders,
  getImportOrder,
  updateImportOrderStage,
  cancelImportOrder,
  listImportOrderDocuments,
  attachImportOrderDocument,
  deleteImportOrderDocument,
} from "../services/ImportOrderService";
import {
  successResponse,
  errorResponse,
  validateResponse,
  ImportOrderSchema,
  ImportOrderListItemSchema,
  CreateImportOrderSchema,
  ImportOrderCreateResultSchema,
  ImportOrderDocumentSchema,
  AttachImportOrderDocumentSchema,
} from "../validators/schemas";

function mapError(res: Response, err: unknown, label: string) {
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json(errorResponse("INVALID_DATA", err.errors[0]?.message ?? "Invalid data"));
  }
  const e = err as { code?: string; message?: string; name?: string };
  if (e.code === "INVALID_DATA")
    return res.status(400).json(errorResponse("INVALID_DATA", e.message ?? "Invalid data"));
  if (e.code === "UNAUTHORIZED")
    return res.status(401).json(errorResponse("UNAUTHORIZED", e.message ?? "Unauthorized"));
  if (e.code === "NOT_FOUND")
    return res.status(404).json(errorResponse("NOT_FOUND", e.message ?? "Not found"));
  // UploadOwnershipError (and any FORBIDDEN-coded error) → 403, matching
  // listings / company / upload controllers.
  if (e.code === "FORBIDDEN" || e.name === "UploadOwnershipError")
    return res.status(403).json(errorResponse("FORBIDDEN", e.message ?? "Forbidden"));
  // Missing migrate (e.g. import_order_documents) → honest 503, not opaque 500.
  const pgCode = e.code ?? (err as { cause?: { code?: string } })?.cause?.code;
  const msg = String(e.message ?? "");
  if (
    pgCode === "42P01" ||
    (/does not exist/i.test(msg) && /import_order/i.test(msg))
  ) {
    return res.status(503).json(
      errorResponse(
        "SERVICE_UNAVAILABLE",
        "Import documents storage is not ready — run DB migrate (drizzle push) on this environment",
      ),
    );
  }
  console.error(label, err);
  return res.status(500).json(errorResponse("INTERNAL_ERROR", "Request failed"));
}

// POST /v1/import-orders — create a car-import order (authenticated buyer).
export async function createImportOrderHandler(req: Request, res: Response) {
  try {
    const input = CreateImportOrderSchema.parse(req.body);
    const result = await createImportOrder(req.userId!, input);
    const validated = validateResponse(ImportOrderCreateResultSchema, result);
    return res.status(201).json(successResponse(validated));
  } catch (err) {
    return mapError(res, err, "[ImportOrder create]");
  }
}

// GET /v1/import-orders/mine — the authenticated buyer's own import orders.
export async function listMyImportOrdersHandler(req: Request, res: Response) {
  try {
    const result = await listMyImportOrders(req.userId!);
    const validated = validateResponse(ImportOrderListItemSchema.array(), result);
    return res.json(successResponse(validated));
  } catch (err) {
    return mapError(res, err, "[ImportOrder mine]");
  }
}

// GET /v1/import-orders/:id — a single import order owned by the buyer.
export async function getImportOrderHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const order = await getImportOrder(req.userId!, id);
    if (!order)
      return res.status(404).json(errorResponse("NOT_FOUND", "Import order not found"));
    const validated = validateResponse(ImportOrderSchema, order);
    return res.json(successResponse(validated));
  } catch (err) {
    return mapError(res, err, "[ImportOrder get]");
  }
}

// PATCH /v1/import-orders/:id/stage — admin/ops advances order stage.
export async function updateImportOrderStageHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { stage, quote_amount } = req.body as { stage: string; quote_amount?: number };
    if (!stage)
      return res.status(400).json(errorResponse("INVALID_DATA", "stage is required"));
    const result = await updateImportOrderStage(id, stage, { quoteAmount: quote_amount });
    const validated = validateResponse(ImportOrderSchema, result);
    return res.json(successResponse(validated));
  } catch (err) {
    return mapError(res, err, "[ImportOrder updateStage]");
  }
}

// POST /v1/import-orders/:id/cancel — buyer cancels their own order.
export async function cancelImportOrderHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const result = await cancelImportOrder(req.userId!, id);
    const validated = validateResponse(ImportOrderSchema, result);
    return res.json(successResponse(validated));
  } catch (err) {
    return mapError(res, err, "[ImportOrder cancel]");
  }
}

// GET /v1/import-orders/:id/documents — the order's attached paperwork.
export async function listImportOrderDocumentsHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const result = await listImportOrderDocuments(req.userId!, id);
    const validated = validateResponse(ImportOrderDocumentSchema.array(), result);
    return res.json(successResponse(validated));
  } catch (err) {
    return mapError(res, err, "[ImportOrder docs list]");
  }
}

// POST /v1/import-orders/:id/documents — attach an uploaded file to the order.
export async function attachImportOrderDocumentHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const input = AttachImportOrderDocumentSchema.parse(req.body);
    const result = await attachImportOrderDocument(req.userId!, id, input);
    const validated = validateResponse(ImportOrderDocumentSchema, result);
    return res.status(201).json(successResponse(validated));
  } catch (err) {
    return mapError(res, err, "[ImportOrder docs attach]");
  }
}

// DELETE /v1/import-orders/:id/documents/:documentId — remove an attachment.
export async function deleteImportOrderDocumentHandler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const documentId = req.params.documentId as string;
    await deleteImportOrderDocument(req.userId!, id, documentId);
    return res.json(successResponse({ deleted: true }));
  } catch (err) {
    return mapError(res, err, "[ImportOrder docs delete]");
  }
}
