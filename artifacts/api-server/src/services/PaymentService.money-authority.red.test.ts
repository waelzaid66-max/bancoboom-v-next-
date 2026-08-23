import { describe, expect, it } from "vitest";
import type { PaymentOption } from "@workspace/db";
import { computeOffers } from "./PaymentService";

function option(overrides: Partial<PaymentOption> = {}): PaymentOption {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    listingId: "00000000-0000-0000-0000-000000000002",
    mode: "seller_installment",
    downPayment: "20000",
    monthlyPayment: "5000",
    durationMonths: 12,
    isIslamicCompliant: false,
    provider: "seller",
    providerName: null,
    annualRatePct: null,
    profitRatePct: null,
    ...overrides,
  };
}

type CurrencyAwareComputeOffers = (
  options: PaymentOption[],
  listingPriceCash: string | number,
  currency: string,
  locale?: "ar" | "en",
) => ReturnType<typeof computeOffers>;

const computeOffersWithContext =
  computeOffers as unknown as CurrencyAwareComputeOffers;

describe("FIN-OFFER money authority RED contract", () => {
  for (const currency of ["SAR", "AED", "USD", "EUR"] as const) {
    it(`projects ${currency} from listing authority instead of hard-coded EGP`, () => {
      const result = computeOffersWithContext(
        [option()],
        100000,
        currency,
        "en",
      );

      expect(result.offers).toHaveLength(1);
      expect(result.offers[0].monthly_display).toContain(currency);
      expect(result.offers[0].down_payment_display).toContain(currency);
      expect(result.offers[0].total_payable_display).toContain(currency);
      expect(result.best_offer_badge).toContain(currency);
    });
  }

  it("does not leak generic English financing system labels into Arabic projection", () => {
    const result = computeOffersWithContext(
      [option()],
      100000,
      "SAR",
      "ar",
    );

    const systemProjection = [
      result.offers[0]?.provider_badge,
      result.best_offer_badge,
    ]
      .filter(Boolean)
      .join(" ");

    expect(systemProjection).not.toMatch(
      /Seller Plan|Bank Finance|Dealer Finance|Supplier Finance|\bIslamic\b|\bfrom\b|\/mo\b/,
    );
  });

  it("preserves the Islamic public no-rate invariant", () => {
    const result = computeOffersWithContext(
      [
        option({
          mode: "bank_finance",
          isIslamicCompliant: true,
          provider: "bank",
          providerName: "CIB",
          profitRatePct: "10",
        }),
      ],
      100000,
      "AED",
      "en",
    );

    const offer = result.offers[0];
    expect(offer).toBeDefined();
    expect(offer).not.toHaveProperty("rate");
    expect(offer).not.toHaveProperty("apr");
    expect(offer).not.toHaveProperty("annual_rate_pct");
    expect(offer).not.toHaveProperty("profit_rate_pct");
  });
});
