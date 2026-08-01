/**
 * Shared dealer-OS currency picker — SoT `@workspace/taxonomy/markets`
 * allowlist (D-07 / REL-05). Replaces free-text currency Inputs.
 */
import { listingCurrencyAllowlist } from "@workspace/taxonomy/markets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CODES = listingCurrencyAllowlist();

export function CurrencySelect({
  value,
  onValueChange,
  testId,
}: {
  value: string;
  onValueChange: (code: string) => void;
  testId?: string;
}) {
  const upper = (value || "EGP").trim().toUpperCase();
  const safe = CODES.includes(upper) ? upper : "EGP";

  return (
    <Select value={safe} onValueChange={onValueChange}>
      <SelectTrigger className="bg-input border-border" data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CODES.map((code) => (
          <SelectItem key={code} value={code}>
            {code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
