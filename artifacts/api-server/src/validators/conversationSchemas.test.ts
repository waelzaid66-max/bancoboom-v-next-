import { describe, expect, it } from "vitest";

import {
  ConversationSummarySchema,
  MessageItemSchema,
  SendMessageSchema,
} from "./schemas";

const clientMessageId = "11e8f4d2-c8ab-4f52-8c19-f3aa1c7b3d04";

describe("Messenger contracts", () => {
  it("accepts a stable client message UUID and rejects a non-UUID retry key", () => {
    expect(
      SendMessageSchema.parse({
        body: "hello",
        client_message_id: clientMessageId,
      }),
    ).toMatchObject({ body: "hello", client_message_id: clientMessageId });
    expect(() =>
      SendMessageSchema.parse({ body: "hello", client_message_id: "retry-1" }),
    ).toThrow();
  });

  it("keeps client_message_id in the strict message response contract", () => {
    expect(
      MessageItemSchema.parse({
        id: "message-1",
        conversation_id: "conversation-1",
        sender_id: "sender-1",
        client_message_id: clientMessageId,
        body: "hello",
        is_mine: true,
        created_at: new Date(0).toISOString(),
        read_at: null,
        media_url: null,
        media_kind: null,
        reactions: {},
        my_reactions: [],
        reply_to: null,
        listing_ref: null,
      }).client_message_id,
    ).toBe(clientMessageId);
  });

  it("keeps privacy-filtered presence in the strict conversation response", () => {
    expect(
      ConversationSummarySchema.parse({
        id: "conversation-1",
        listing_id: "listing-1",
        listing_title: null,
        listing_thumb: null,
        counterparty_id: "user-2",
        counterparty_name: "Counterparty",
        counterparty_presence: "unknown",
        last_message_text: null,
        last_message_at: null,
        unread: 0,
        viewer_role: "buyer",
      }).counterparty_presence,
    ).toBe("unknown");
  });
});
