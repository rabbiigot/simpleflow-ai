import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanData, PlanTier } from "@/lib/backend-api";
import { type Currency, formatPlanPrice } from "@/lib/pricing";
import { Check, Loader2 } from "lucide-react";

// Only Pro offers a free trial.
const TRIAL_DAYS: Partial<Record<PlanTier, number>> = { PRO: 7 };

type Props = {
  plans: PlanData[];
  selectedTier: PlanTier;
  currency: Currency;
  onSelect: (tier: PlanTier) => void;
  onStartFree: () => void;
  onStartTrial: (tier: PlanTier) => void;
  onProceedPayment: (tier: PlanTier) => void;
  onBack: () => void;
  finalizing: boolean;
};

/** Post-signup plan picker. Cards mirror the get-started pricing. */
export default function SignupPlanSelection({
  plans,
  selectedTier,
  currency,
  onSelect,
  onStartFree,
  onStartTrial,
  onProceedPayment,
  onBack,
  finalizing,
}: Props) {
  const display = (plans.length ? plans : []).filter(
    (p) => p.tier !== "ENTERPRISE",
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground">
          Choose your plan
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start free, or try a paid plan free — no charge during the trial.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {display.map((plan) => {
          const isFree = plan.tier === "FREE";
          const trialDays = TRIAL_DAYS[plan.tier];
          const selected = selectedTier === plan.tier;
          return (
            <button
              type="button"
              key={plan.id}
              onClick={() => onSelect(plan.tier)}
              className={cn(
                "flex flex-col rounded-xl border bg-white p-5 text-left transition dark:bg-card",
                selected
                  ? "border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-500/30"
                  : "border-gray-200 hover:border-indigo-300 dark:border-border",
              )}
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-foreground">
                {plan.name}
              </h3>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-foreground">
                {formatPlanPrice(plan.tier, currency, "monthly")}
                {!isFree && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / user / mo
                  </span>
                )}
              </p>

              {plan.features?.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {plan.features.slice(0, 7).map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-blue-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 space-y-2">
                {isFree ? (
                  <Button
                    type="button"
                    className="w-full"
                    disabled={finalizing}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartFree();
                    }}
                  >
                    {finalizing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Start Free"
                    )}
                  </Button>
                ) : (
                  <>
                    {trialDays != null && (
                      <Button
                        type="button"
                        className="w-full"
                        disabled={finalizing}
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartTrial(plan.tier);
                        }}
                      >
                        Free Trial {trialDays} days
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={trialDays != null ? "outline" : "default"}
                      className="w-full"
                      disabled={finalizing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onProceedPayment(plan.tier);
                      }}
                    >
                      Proceed to Payment
                    </Button>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBack}
          disabled={finalizing}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to details
        </button>
      </div>
    </div>
  );
}
