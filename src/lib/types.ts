export type Decision =
  | "Approved"
  | "Step up verification"
  | "Hold for review"
  | "Blocked"
  | "Offer safer checkout option";

export type RiskTone = "low" | "medium" | "high" | "critical";

export type CheckoutSignals = {
  amount: number;
  newDevice: boolean;
  newShippingAddress: boolean;
  billingShippingMismatch: boolean;
  merchantRisk: number;
  agentPermissionLimit: number;
  buyerHistory: "known" | "thin" | "new";
  chargebackProbability: number;
  velocityRisk: number;
  paymentMethodTrust: number;
  cartCategoryRisk: number;
};

export type CheckoutAttempt = {
  id: string;
  agent: string;
  buyer: string;
  purchase: string;
  amountLabel: string;
  merchant: string;
  paymentMethod: string;
  time: string;
  humanOwner: string;
  identityStatus: string;
  allowedTypes: string[];
  consentExpiration: string;
  lastCheckoutAction: string;
  merchantPermissions: string[];
  baseline: string;
  signalLabels: string[];
  signals: CheckoutSignals;
};

export type RiskAssessment = {
  riskScore: number;
  riskTone: RiskTone;
  decision: Decision;
  decisionReason: string;
  riskDrivers: string[];
  recommendedAction: string;
  auditTrail: string[];
};

export type AuditEvent = {
  label: string;
  detail: string;
  time: string;
};
