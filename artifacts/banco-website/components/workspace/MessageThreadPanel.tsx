"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getGetMessagesQueryKey,
  getListConversationsQueryKey,
  useGetMessages,
  useMarkConversationRead,
  useSendMessage,
  type GetMessages200,
  type Message,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { localeFromPathname } from "../../lib/hub-config";
import { workspaceMessagesPath } from "../../lib/workspace-paths";
import { workspaceUiCopy } from "../../lib/workspace-ui-copy";

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid var(--banco-border)",
  borderRadius: 8,
  background: "var(--banco-card)",
  color: "var(--banco-fg)",
  padding: "0.55rem 0.65rem",
  fontSize: "0.95rem",
  minHeight: 44,
  resize: "none",
};

const btnStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 8,
  background: "var(--banco-primary)",
  color: "#fff",
  padding: "0.55rem 0.9rem",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.9rem",
};

function mediaLabel(
  kind: string | null | undefined,
  copy: ReturnType<typeof workspaceUiCopy>,
): string {
  if (kind === "video") return copy.messagesMediaVideo;
  if (kind === "audio") return copy.messagesMediaAudio;
  return copy.messagesMediaImage;
}

function MessageBubble({
  message,
  copy,
}: {
  message: Message;
  copy: ReturnType<typeof workspaceUiCopy>;
}) {
  const mine = message.is_mine;
  const mediaUrl = message.media_url ?? null;
  const listing = message.listing_ref;
  return (
    <div
      style={{
        alignSelf: mine ? "flex-end" : "flex-start",
        maxWidth: "78%",
        padding: "0.55rem 0.75rem",
        borderRadius: 12,
        background: mine ? "var(--banco-primary)" : "var(--banco-card)",
        color: mine ? "#fff" : "var(--banco-fg)",
        border: mine ? "none" : "1px solid var(--banco-border)",
      }}
    >
      {listing ? (
        <div
          style={{
            marginBottom: message.body || mediaUrl ? "0.4rem" : 0,
            padding: "0.4rem 0.5rem",
            borderRadius: 8,
            background: mine ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.04)",
            fontSize: "0.85rem",
          }}
        >
          <strong style={{ display: "block" }}>{listing.title}</strong>
          {listing.price != null ? (
            <span style={{ opacity: 0.85 }}>{listing.price}</span>
          ) : null}
        </div>
      ) : null}
      {mediaUrl ? (
        <p style={{ margin: "0 0 0.35rem" }}>
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: mine ? "#fff" : "var(--banco-primary)",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            {mediaLabel(message.media_kind, copy)}
          </a>
        </p>
      ) : null}
      {message.body ? (
        <p style={{ margin: 0, lineHeight: 1.55, fontSize: "0.92rem", whiteSpace: "pre-wrap" }}>
          {message.body}
        </p>
      ) : null}
      <p
        style={{
          margin: "0.35rem 0 0",
          fontSize: "0.72rem",
          opacity: 0.8,
          textAlign: mine ? "end" : "start",
        }}
      >
        {new Date(message.created_at).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

type MessageThreadPanelProps = {
  conversationId: string;
};

export function MessageThreadPanel({ conversationId }: MessageThreadPanelProps) {
  const pathname = usePathname() ?? "/workspace/messages";
  const locale = localeFromPathname(pathname);
  const copy = workspaceUiCopy(locale);
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastNewestIdRef = useRef<string | null>(null);

  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesQuery = useGetMessages(conversationId, undefined, {
    query: {
      queryKey: getGetMessagesQueryKey(conversationId),
      enabled: !!conversationId,
      refetchInterval: 4_000,
      refetchOnWindowFocus: true,
    },
  });

  const markRead = useMarkConversationRead();
  const sendMessage = useSendMessage();

  const messages = messagesQuery.data?.data ?? [];
  const newestId = messages.length > 0 ? messages[messages.length - 1]!.id : null;

  // Mark read when the newest message id changes (length alone misses replacements).
  useEffect(() => {
    if (!conversationId || !newestId) return;
    if (newestId === lastNewestIdRef.current) return;
    lastNewestIdRef.current = newestId;
    markRead.mutate(
      { id: conversationId },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
      },
    );
  }, [conversationId, newestId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [newestId]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body || sendMessage.isPending) return;
    setSendError(null);
    const outgoing = body;
    setDraft("");
    sendMessage.mutate(
      { id: conversationId, data: { body: outgoing } },
      {
        onSuccess: (res) => {
          // MSG-06 parity: seed cache on POST success so a failed soft-refetch
          // cannot leave the UI thinking the send never landed.
          const echo = res.data;
          if (echo) {
            const key = getGetMessagesQueryKey(conversationId);
            queryClient.setQueryData<GetMessages200>(key, (prev) => {
              const existing = prev?.data ?? [];
              if (existing.some((m) => m.id === echo.id)) return prev;
              const data = [...existing, echo];
              return {
                data,
                error: null,
                meta: { ...(prev?.meta ?? {}), total: data.length },
              };
            });
          }
          void messagesQuery.refetch().catch(() => {
            // Soft refresh only — message already committed above.
          });
          void queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        },
        onError: () => {
          setDraft(outgoing);
          setSendError(copy.messagesSendError);
        },
      },
    );
  };

  if (messagesQuery.isLoading) {
    return (
      <div data-banco-journey="workspace-message-thread">
        <p style={{ color: "var(--banco-muted)" }}>{copy.loading}</p>
      </div>
    );
  }
  if (messagesQuery.isError) {
    return (
      <div data-banco-journey="workspace-message-thread">
        <p style={{ color: "var(--banco-primary)" }}>{copy.errorGeneric}</p>
        <button
          type="button"
          onClick={() => void messagesQuery.refetch()}
          style={{
            border: "1px solid var(--banco-border)",
            borderRadius: 8,
            background: "transparent",
            color: "var(--banco-fg)",
            padding: "0.35rem 0.75rem",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          {copy.retry}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "0.85rem", minHeight: 420 }}
      data-banco-journey="workspace-message-thread"
    >
      <Link
        href={workspaceMessagesPath(locale)}
        style={{ color: "var(--banco-primary)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}
      >
        ← {copy.messagesBack}
      </Link>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "0.55rem",
          padding: "0.75rem",
          border: "1px solid var(--banco-border)",
          borderRadius: "var(--banco-radius)",
          background: "rgba(0,0,0,0.02)",
          maxHeight: 480,
          overflowY: "auto",
        }}
      >
        {messages.length === 0 ? (
          <p style={{ margin: 0, color: "var(--banco-muted)", fontSize: "0.9rem" }}>{copy.messagesThreadEmpty}</p>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} copy={copy} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={copy.messagesPlaceholder}
          rows={2}
          maxLength={4000}
          style={inputStyle}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button type="submit" disabled={sendMessage.isPending || !draft.trim()} style={btnStyle}>
          {sendMessage.isPending ? copy.messagesSending : copy.messagesSend}
        </button>
      </form>
      {sendError ? (
        <p style={{ margin: 0, color: "var(--banco-primary)", fontSize: "0.85rem" }}>{sendError}</p>
      ) : null}
    </div>
  );
}
