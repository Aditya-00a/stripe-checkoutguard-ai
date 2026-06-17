import type { CheckoutAttempt, Decision, RiskAssessment, RiskTone } from "./types";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function toneForScore(score: number): RiskTone {
  if (score >= 86) return "critical";
  if (score >= 61) return "high";
  if (score >= 31) return "medium";
  return "low";
}

function decisionForScore(score: number, trustedBuyer: boolean): Decision {
  if (score <= 30) return "Approved";
  if (score <= 60) return trustedBuyer ? "Approved" : "Hold for review";
  if (score <= 80) return "Step up verification";
  return "Blocked";
}

function addDriver(condition: boolean, driver: string, drivers: string[]) {
  if (condition) drivers.push(driver);
}

export function assessCheckout(checkout: CheckoutAttempt): RiskAssessment {
  const { signals } = checkout;
  const trustedBuyer = signals.buyerHistory === "known";
  const overPermissionLimit = signals.amount > signals.agentPermissionLimit;

  let score = 8;
  score += signals.amount > 5000 ? 22 : signals.amount > 1000 ? 18 : signals.amount > 100 ? 7 : 2;
  score += signals.newDevice ? 14 : 0;
  score += signals.newShippingAddress ? 12 : 0;
  score += signals.billingShippingMismatch ? 17 : 0;
  score += signals.merchantRisk * 0.18;
  score += overPermissionLimit ? 18 : 0;
  score += signals.buyerHistory === "new" ? 16 : signals.buyerHistory === "thin" ? 8 : 0;
  score += signals.chargebackProbability * 0.24;
  score += signals.velocityRisk * 0.18;
  score += signals.cartCategoryRisk * 0.14;
  score -= signals.paymentMethodTrust * 0.12;

  const riskScore = clampScore(score > 93 && signals.paymentMethodTrust > 50 ? 93 : score);
  const riskTone = toneForScore(riskScore);
  const decision = overPermissionLimit && riskScore > 75 ? "Blocked" : decisionForScore(riskScore, trustedBuyer);

  const riskDrivers: string[] = [];
  addDriver(signals.newShippingAddress, "New shipping address", riskDrivers);
  addDriver(signals.newDevice, "First checkout from this device", riskDrivers);
  addDriver(signals.billingShippingMismatch, "Billing and shipping mismatch", riskDrivers);
  addDriver(signals.amount > 1000, "Cart value exceeds buyer baseline", riskDrivers);
  addDriver(
    signals.cartCategoryRisk >= 65,
    checkout.purchase.toLowerCase().includes("electronics") ? "High value electronics" : "Cart contains resellable goods",
    riskDrivers,
  );
  addDriver(signals.chargebackProbability >= 30, "Refund risk elevated", riskDrivers);
  addDriver(signals.velocityRisk >= 60, "Suspicious checkout velocity", riskDrivers);
  addDriver(overPermissionLimit, "Agent permission limit exceeded", riskDrivers);
  addDriver(signals.merchantRisk >= 65, "Merchant risk requires review", riskDrivers);
  if (riskDrivers.length === 0) {
    riskDrivers.push("Known buyer, trusted address, low amount, and valid agent permission");
  }

  const recommendedAction =
    decision === "Approved"
      ? "Approve the checkout and preserve the agent consent trail."
      : decision === "Step up verification"
        ? "Request buyer confirmation before authorizing the purchase."
        : decision === "Hold for review"
          ? "Route the checkout to a risk analyst with full context."
          : decision === "Offer safer checkout option"
            ? "Offer a lower-risk payment method or split authorization."
            : "Block authorization and prevent agent reuse until reviewed.";

  const decisionReason =
    `${checkout.agent} was routed to ${decision.toLowerCase()} because ${riskDrivers
      .slice(0, 3)
      .join(", ")}. ${decision === "Blocked" ? "The transaction should not be authorized without manual clearance." : "The buyer and payment context can still be evaluated without losing good revenue."}`;

  return {
    riskScore,
    riskTone,
    decision,
    decisionReason,
    riskDrivers,
    recommendedAction,
    auditTrail: [
      "Agent initiated checkout",
      "Buyer identity checked",
      "Payment method verified",
      "Risk score generated",
      "Guardrail policy evaluated",
      "Decision issued",
      "Reviewer action logged",
    ],
  };
}
