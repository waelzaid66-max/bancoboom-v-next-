"use client";

import { useAuth } from "@clerk/nextjs";
import { useDeleteAccount } from "@workspace/api-client-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { localeFromPathname } from "../../lib/hub-config";
import { workspaceUiCopy } from "../../lib/workspace-ui-copy";

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--banco-border)",
  borderRadius: "var(--banco-radius)",
  background: "var(--banco-card)",
  padding: "1.25rem",
};

/**
 * P2-M3 — Web account-delete UI only.
 * Calls existing DELETE /api/v1/users/me via useDeleteAccount; no backend changes.
 */
export function AccountSettingsPanel() {
  const pathname = usePathname() ?? "/workspace";
  const locale = localeFromPathname(pathname);
  const copy = workspaceUiCopy(locale);
  const router = useRouter();
  const { signOut, isSignedIn } = useAuth();
  const deleteMut = useDeleteAccount();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const keyword = copy.accountDeleteKeyword;
  const keywordMatch =
    confirmText.trim().toLocaleUpperCase() === keyword.toLocaleUpperCase();
  const busy = deleteMut.isPending;
  const canDelete = keywordMatch && !busy && !!isSignedIn;

  const openDialog = () => {
    setError(null);
    setConfirmText("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (busy) return;
    setDialogOpen(false);
    setConfirmText("");
    setError(null);
  };

  const runDelete = () => {
    if (!canDelete) return;
    setError(null);
    deleteMut.mutate(undefined as void, {
      onSuccess: () => {
        setDialogOpen(false);
        void signOut()
          .catch(() => {})
          .finally(() => {
            router.replace(locale === "en" ? "/en" : "/");
          });
      },
      onError: () => {
        setError(copy.accountDeleteError);
      },
    });
  };

  return (
    <div data-banco-panel="account-settings">
      <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.25rem" }}>{copy.settingsTitle}</h2>
      <p style={{ margin: "0 0 1.25rem", color: "var(--banco-muted)", lineHeight: 1.65 }}>
        {copy.settingsSubtitle}
      </p>

      <section
        style={{
          ...cardStyle,
          borderColor: "rgba(232,0,45,0.35)",
        }}
        aria-labelledby="account-danger-zone"
      >
        <h3
          id="account-danger-zone"
          style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--banco-primary)" }}
        >
          {copy.accountDangerTitle}
        </h3>
        <p style={{ margin: "0 0 1rem", color: "var(--banco-muted)", fontSize: "0.9rem", lineHeight: 1.65 }}>
          {copy.accountDangerBody}
        </p>
        <button
          type="button"
          onClick={openDialog}
          disabled={!isSignedIn}
          data-testid="account-delete-open"
          style={{
            border: "1px solid var(--banco-primary)",
            borderRadius: 8,
            background: "transparent",
            color: "var(--banco-primary)",
            padding: "0.55rem 0.9rem",
            fontWeight: 700,
            cursor: isSignedIn ? "pointer" : "not-allowed",
            fontSize: "0.9rem",
          }}
        >
          {copy.accountDeleteCta}
        </button>
      </section>

      {dialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-delete-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            padding: "1rem",
          }}
          onClick={closeDialog}
        >
          <div
            style={{
              maxWidth: 400,
              width: "100%",
              background: "var(--banco-card)",
              borderRadius: "var(--banco-radius)",
              padding: "1.25rem",
              border: "1px solid var(--banco-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p id="account-delete-title" style={{ margin: "0 0 0.35rem", fontWeight: 700 }}>
              {copy.accountDeleteTitle}
            </p>
            <p
              style={{
                margin: "0 0 0.85rem",
                color: "var(--banco-muted)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              {copy.accountDeleteBody}
            </p>
            <label
              htmlFor="account-delete-confirm"
              style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.35rem", fontWeight: 600 }}
            >
              {copy.accountDeleteConfirmLabel.replace("{keyword}", keyword)}
            </label>
            <input
              id="account-delete-confirm"
              data-testid="account-delete-confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              disabled={busy}
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginBottom: "0.85rem",
                padding: "0.55rem 0.65rem",
                borderRadius: 8,
                border: "1px solid var(--banco-border)",
                background: "var(--banco-bg, #0a0a0a)",
                color: "var(--banco-fg)",
                fontSize: "0.95rem",
              }}
            />
            {error ? (
              <p
                role="alert"
                style={{ margin: "0 0 0.75rem", color: "var(--banco-primary)", fontSize: "0.85rem" }}
              >
                {error}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeDialog}
                disabled={busy}
                style={{
                  border: "1px solid var(--banco-border)",
                  borderRadius: 8,
                  background: "transparent",
                  padding: "0.45rem 0.85rem",
                  cursor: busy ? "not-allowed" : "pointer",
                  color: "var(--banco-fg)",
                }}
              >
                {copy.accountDeleteCancel}
              </button>
              <button
                type="button"
                data-testid="account-delete-confirm"
                disabled={!canDelete}
                onClick={runDelete}
                style={{
                  border: "none",
                  borderRadius: 8,
                  background: canDelete ? "var(--banco-primary)" : "rgba(232,0,45,0.35)",
                  color: "#fff",
                  padding: "0.45rem 0.85rem",
                  fontWeight: 700,
                  cursor: canDelete ? "pointer" : "not-allowed",
                }}
              >
                {busy ? copy.accountDeleteWorking : copy.accountDeleteConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
