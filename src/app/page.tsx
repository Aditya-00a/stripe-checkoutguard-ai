"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileCheck2,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  LucideIcon,
  Menu,
  ReceiptText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  baseAuditEvents,
  checkoutAttempts,
  decisionBreakdown,
  guardrails,
  kpis,
  revenueMetrics,
  riskDistribution,
} from "@/lib/mock-data";
import { assessCheckout } from "@/lib/risk-engine";
import type { AuditEvent, CheckoutAttempt, Decision, RiskAssessment } from "@/lib/types";

type NavItem = {
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Checkout Queue", icon: ReceiptText },
  { label: "Agents", icon: Bot },
  { label: "Risk Engine", icon: Gauge },
  { label: "Guardrails", icon: SlidersHorizontal },
  { label: "Revenue Protection", icon: CircleDollarSign },
  { label: "Audit Trail", icon: FileCheck2 },
  { label: "Settings", icon: Settings },
];

const sectionTargets: Record<string, string> = {
  Overview: "overview",
  "Checkout Queue": "checkout-queue",
  Agents: "agents",
  "Risk Engine": "risk-engine",
  Guardrails: "guardrails",
  "Revenue Protection": "revenue-protection",
  "Audit Trail": "audit-trail",
  Settings: "settings",
};

const decisionMeta: Record<
  Decision,
  {
    badge: string;
    icon: LucideIcon;
    border: string;
    fill: string;
  }
> = {
  Approved: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    border: "border-emerald-200",
    fill: "#00d084",
  },
  "Step up verification": {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    icon: AlertTriangle,
    border: "border-amber-200",
    fill: "#f59e0b",
  },
  "Hold for review": {
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    icon: ShieldAlert,
    border: "border-indigo-200",
    fill: "#635bff",
  },
  Blocked: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    icon: XCircle,
    border: "border-rose-200",
    fill: "#e11d48",
  },
  "Offer safer checkout option": {
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    icon: WalletCards,
    border: "border-sky-200",
    fill: "#0ea5e9",
  },
};

function StripeAsionLogo() {
  return (
    <div className="flex items-center gap-3" aria-label="stripe.asion.ai CheckoutGuard AI">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#635bff] text-lg font-black text-white shadow-[0_14px_36px_rgba(99,91,255,0.35)]">
        S
      </div>
      <div className="leading-none">
        <div className="text-xl font-semibold text-[#0a2540]">
          stripe<span className="text-[#635bff]">.asion.ai</span>
        </div>
        <p className="mt-1 text-[11px] font-semibold uppercase text-[#697386]">
          CheckoutGuard AI
        </p>
      </div>
    </div>
  );
}

function formatDecision(decision: Decision) {
  return decision === "Step up verification" ? "Step up" : decision;
}

function DecisionPill({ decision }: { decision: Decision }) {
  const meta = decisionMeta[decision];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {formatDecision(decision)}
    </span>
  );
}

function KpiCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  const positive = delta.startsWith("+");
  return (
    <div className="rounded-2xl border border-[#e3e8ee] bg-white p-4 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
      <p className="text-xs font-semibold uppercase text-[#697386]">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-[#0a2540]">{value}</p>
        <span className={`text-xs font-semibold ${positive ? "text-emerald-600" : "text-amber-600"}`}>
          {delta}
        </span>
      </div>
    </div>
  );
}

function CheckoutQueue({
  attempts,
  selectedId,
  assessments,
  onSelect,
}: {
  attempts: CheckoutAttempt[];
  selectedId: string;
  assessments: Record<string, RiskAssessment>;
  onSelect: (id: string) => void;
}) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#cbd6e2] bg-[#f6f9fc] p-8 text-center">
        <p className="text-sm font-semibold text-[#0a2540]">No matching agent checkouts</p>
        <p className="mt-2 text-sm text-[#697386]">Try searching by buyer, merchant, agent, or payment method.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e3e8ee] bg-white shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
      <div className="grid min-w-[920px] grid-cols-[1.1fr_1fr_1fr_110px_1.15fr_95px_140px_90px] border-b border-[#e3e8ee] bg-[#f6f9fc] px-4 py-3 text-xs font-semibold uppercase text-[#697386]">
        <span>Agent</span>
        <span>Buyer</span>
        <span>Merchant</span>
        <span>Amount</span>
        <span>Payment method</span>
        <span>Risk</span>
        <span>Decision</span>
        <span>Time</span>
      </div>
      <div className="max-h-[324px] min-w-[920px] overflow-y-auto">
        {attempts.map((attempt) => {
          const selected = attempt.id === selectedId;
          const assessment = assessments[attempt.id];
          return (
            <button
              key={attempt.id}
              type="button"
              onClick={() => onSelect(attempt.id)}
              className={`grid w-full grid-cols-[1.1fr_1fr_1fr_110px_1.15fr_95px_140px_90px] items-center border-b border-[#edf2f7] px-4 py-4 text-left text-sm transition last:border-b-0 ${
                selected ? "bg-[#f3f0ff] shadow-[inset_4px_0_0_#635bff]" : "bg-white hover:bg-[#f6f9fc]"
              }`}
            >
              <span className="font-semibold text-[#0a2540]">{attempt.agent}</span>
              <span className="text-[#425466]">{attempt.buyer}</span>
              <span className="text-[#425466]">{attempt.merchant}</span>
              <span className="font-semibold text-[#0a2540]">{attempt.amountLabel}</span>
              <span className="text-[#425466]">{attempt.paymentMethod}</span>
              <span className="font-semibold text-[#0a2540]">{assessment.riskScore}</span>
              <span>
                <DecisionPill decision={assessment.decision} />
              </span>
              <span className="text-[#697386]">{attempt.time}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RiskScoreRing({ score, decision }: { score: number; decision: Decision }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100" role="img" aria-label={`Risk score ${score}`}>
        <circle cx="50" cy="50" r="42" stroke="#e3e8ee" strokeWidth="10" fill="none" />
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke={decisionMeta[decision].fill}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-semibold text-[#0a2540]">{score}</p>
          <p className="text-xs font-semibold text-[#697386]">out of 100</p>
        </div>
      </div>
    </div>
  );
}

function RiskDecisionCard({
  selected,
  assessment,
  onAction,
}: {
  selected: CheckoutAttempt;
  assessment: RiskAssessment;
  onAction: (decision: Decision, action: string) => void;
}) {
  return (
    <section id="risk-engine" className="scroll-mt-28 rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#635bff]">Risk decision</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#0a2540]">{selected.agent}</h2>
          <p className="mt-1 text-sm text-[#697386]">
            {selected.purchase} at {selected.merchant}
          </p>
        </div>
        <DecisionPill decision={assessment.decision} />
      </div>

      <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-center">
        <RiskScoreRing score={assessment.riskScore} decision={assessment.decision} />
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["Amount", selected.amountLabel],
            ["Payment", selected.paymentMethod],
            ["Buyer baseline", selected.baseline],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-3">
              <p className="text-xs font-semibold uppercase text-[#697386]">{label}</p>
              <p className="mt-2 text-sm font-semibold text-[#0a2540]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#e3e8ee] bg-gradient-to-br from-[#f6f9fc] to-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0a2540]">
          <Sparkles className="h-4 w-4 text-[#635bff]" aria-hidden />
          AI explanation
        </div>
        <p className="mt-3 text-sm leading-6 text-[#425466]">{assessment.decisionReason}</p>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-[#0a2540]">Top risk drivers</p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {assessment.riskDrivers.map((driver) => (
            <div key={driver} className="flex items-center gap-2 text-sm text-[#425466]">
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
              {driver}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onAction("Step up verification", "Verification sent")}
          className="rounded-xl bg-[#635bff] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(99,91,255,0.28)] hover:bg-[#5146e5]"
        >
          Send verification
        </button>
        <button
          type="button"
          onClick={() => onAction("Approved", "Reviewer approved")}
          className="rounded-xl border border-[#d6dce6] bg-white px-4 py-3 text-sm font-semibold text-[#0a2540] hover:border-emerald-300 hover:bg-emerald-50"
        >
          Approve anyway
        </button>
        <button
          type="button"
          onClick={() => onAction("Hold for review", "Held for review")}
          className="rounded-xl border border-[#d6dce6] bg-white px-4 py-3 text-sm font-semibold text-[#0a2540] hover:border-amber-300 hover:bg-amber-50"
        >
          Hold for review
        </button>
        <button
          type="button"
          onClick={() => onAction("Blocked", "Payment blocked")}
          className="rounded-xl border border-[#d6dce6] bg-white px-4 py-3 text-sm font-semibold text-[#0a2540] hover:border-rose-300 hover:bg-rose-50"
        >
          Block payment
        </button>
      </div>
    </section>
  );
}

function AgentProfileCard({ selected }: { selected: CheckoutAttempt }) {
  const details = [
    ["Human owner", selected.humanOwner, UserCheck],
    ["Verified identity status", selected.identityStatus, ShieldCheck],
    ["Maximum checkout amount", `$${selected.signals.agentPermissionLimit.toLocaleString()}`, LockKeyhole],
    ["Consent expiration", selected.consentExpiration, Clock3],
    ["Last checkout action", selected.lastCheckoutAction, Activity],
    ["Merchant permissions", selected.merchantPermissions.join(", "), CreditCard],
  ] as const;

  return (
    <section id="agents" className="scroll-mt-28 rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
      <p className="text-sm font-semibold text-[#635bff]">Know Your Agent</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#0a2540]">{selected.agent}</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {details.map(([label, value, Icon]) => (
          <div key={label} className="rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-4">
            <Icon className="h-4 w-4 text-[#635bff]" aria-hidden />
            <p className="mt-3 text-xs font-semibold uppercase text-[#697386]">{label}</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-[#0a2540]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {selected.allowedTypes.map((type) => (
          <span key={type} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {type}
          </span>
        ))}
      </div>
    </section>
  );
}

function PaymentGuardrails() {
  return (
    <section id="guardrails" className="scroll-mt-28 rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
      <p className="text-sm font-semibold text-[#635bff]">Payment Guardrails</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#0a2540]">Policy matrix</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-[#e3e8ee]">
        {guardrails.map(([rule, action]) => (
          <div key={rule} className="grid grid-cols-1 gap-2 border-b border-[#edf2f7] bg-white px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[180px_1fr]">
            <p className="font-semibold text-[#0a2540]">{rule}</p>
            <p className="text-[#425466]">{action}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RevenueProtection({ protectedLift }: { protectedLift: number }) {
  return (
    <section id="revenue-protection" className="scroll-mt-28 rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#635bff]">Revenue Protection</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#0a2540]">Recovered without blind blocking</h2>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
          <p className="text-xs font-semibold text-emerald-700">Action lift</p>
          <p className="text-sm font-semibold text-emerald-700">+${protectedLift.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {revenueMetrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-4">
            <p className="text-sm text-[#697386]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#0a2540]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Charts() {
  const donutStops = riskDistribution.reduce(
    (acc, item) => {
      const start = acc.cursor;
      const end = start + item.value;
      acc.parts.push(`${item.color} ${start}% ${end}%`);
      acc.cursor = end;
      return acc;
    },
    { cursor: 0, parts: [] as string[] },
  ).parts;

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
        <p className="text-sm font-semibold text-[#635bff]">Risk Score Distribution</p>
        <div className="mt-6 grid min-h-64 grid-cols-1 place-items-center">
          <div
            className="relative grid h-48 w-48 place-items-center rounded-full"
            style={{ background: `conic-gradient(${donutStops.join(", ")})` }}
            role="img"
            aria-label="Risk score distribution chart"
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_#e3e8ee]">
              <div>
                <p className="text-3xl font-semibold text-[#0a2540]">58%</p>
                <p className="text-xs font-semibold text-[#697386]">low risk</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {riskDistribution.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm text-[#425466]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}: {item.value}%
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
        <p className="text-sm font-semibold text-[#635bff]">Decision Breakdown</p>
        <div className="mt-6 grid min-h-64 grid-cols-1 items-end gap-4 rounded-2xl bg-[#f6f9fc] p-5">
          {decisionBreakdown.map((entry) => (
            <div key={entry.name} className="grid grid-cols-[96px_1fr_42px] items-center gap-3">
              <p className="text-sm font-semibold text-[#425466]">{entry.name}</p>
              <div className="h-3 overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_#e3e8ee]">
                <div className="h-full rounded-full" style={{ width: `${entry.value}%`, backgroundColor: entry.fill }} />
              </div>
              <p className="text-right text-sm font-semibold text-[#0a2540]">{entry.value}%</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuditTrail({ events }: { events: AuditEvent[] }) {
  return (
    <section id="audit-trail" className="scroll-mt-28 rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
      <p className="text-sm font-semibold text-[#635bff]">Audit Trail</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#0a2540]">Proof for every agent checkout</h2>
      <div className="mt-5 grid grid-cols-1 gap-3">
        {events.map((event, index) => (
          <div key={`${event.label}-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-4 sm:grid-cols-[90px_1fr]">
            <span className="text-xs font-semibold text-[#697386]">{event.time}</span>
            <div>
              <p className="text-sm font-semibold text-[#0a2540]">{event.label}</p>
              <p className="mt-1 text-sm leading-6 text-[#425466]">{event.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SettingsPanel({ statusText }: { statusText: string }) {
  return (
    <section id="settings" className="scroll-mt-28 rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
      <p className="text-sm font-semibold text-[#635bff]">Settings</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#0a2540]">Monitor controls</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Agentic monitor", "Active"],
          ["Risk mode", "Revenue-safe"],
          ["Evidence retention", "24 months"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-4">
            <p className="text-xs font-semibold uppercase text-[#697386]">{label}</p>
            <p className="mt-2 text-sm font-semibold text-[#0a2540]">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold text-indigo-700">{statusText}</p>
    </section>
  );
}

export default function Home() {
  const [selectedId, setSelectedId] = useState("giftfinder-12");
  const [activeSection, setActiveSection] = useState("Overview");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [notice, setNotice] = useState("Agentic commerce monitor active");
  const [protectedLift, setProtectedLift] = useState(0);
  const [decisionOverrides, setDecisionOverrides] = useState<Record<string, Decision>>({});
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(baseAuditEvents);

  const assessments = useMemo(() => {
    return checkoutAttempts.reduce<Record<string, RiskAssessment>>((acc, attempt) => {
      const assessment = assessCheckout(attempt);
      acc[attempt.id] = {
        ...assessment,
        decision: decisionOverrides[attempt.id] ?? assessment.decision,
      };
      return acc;
    }, {});
  }, [decisionOverrides]);

  const selected = checkoutAttempts.find((attempt) => attempt.id === selectedId) ?? checkoutAttempts[1];
  const selectedAssessment = assessments[selected.id];

  const filteredAttempts = checkoutAttempts.filter((attempt) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      attempt.agent,
      attempt.buyer,
      attempt.merchant,
      attempt.purchase,
      attempt.paymentMethod,
    ].some((value) => value.toLowerCase().includes(query));
  });

  function handleNav(label: string) {
    setActiveSection(label);
    setNotice(`${label} selected. CheckoutGuard is showing the latest ${dateRange.toLowerCase()} view.`);
    const targetId = sectionTargets[label];
    if (targetId) {
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function handleSelect(id: string) {
    const next = checkoutAttempts.find((attempt) => attempt.id === id);
    if (!next) return;
    setSelectedId(id);
    setActiveSection("Checkout Queue");
    setNotice(`${next.agent} selected for checkout risk review.`);
  }

  function handleDecision(decision: Decision, action: string) {
    setDecisionOverrides((current) => ({ ...current, [selected.id]: decision }));
    setProtectedLift((current) => current + (decision === "Approved" ? 0 : selected.signals.amount));
    const newEvent: AuditEvent = {
      label: action,
      detail: `${formatDecision(decision)} recorded for ${selected.agent} on ${selected.amountLabel} ${selected.purchase}.`,
      time: "Now",
    };
    setAuditEvents((current) => [newEvent, ...current]);
    setActiveSection("Audit Trail");
    setNotice(`${action} for ${selected.agent}. Audit trail updated.`);
  }

  function handleNotification() {
    setNotice("3 alert summaries reviewed: high-value checkout, new shipping address, and chargeback risk.");
  }

  function handleUserMenu() {
    setNotice("Signed in as Alex. Risk operations workspace is active.");
  }

  return (
    <main className="min-h-screen bg-[#f6f9fc] text-[#0a2540]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_18%_8%,rgba(99,91,255,0.25),transparent_28rem),radial-gradient(circle_at_72%_0%,rgba(0,212,255,0.22),transparent_28rem),linear-gradient(120deg,#ffffff_0%,#f6f9fc_60%,#eef2ff_100%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-[282px] shrink-0 border-r border-[#e3e8ee] bg-white/82 p-5 backdrop-blur-xl lg:block">
          <StripeAsionLogo />
          <nav className="mt-8 grid grid-cols-1 gap-1" aria-label="Primary navigation">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleNav(label)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  activeSection === label
                    ? "bg-[#f3f0ff] text-[#635bff]"
                    : "text-[#425466] hover:bg-[#f6f9fc] hover:text-[#0a2540]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl border border-[#e3e8ee] bg-gradient-to-br from-[#0a2540] via-[#263b80] to-[#635bff] p-4 text-white">
            <Sparkles className="h-5 w-5" aria-hidden />
            <p className="mt-4 text-sm font-semibold">Secure agentic commerce, built for trusted checkout.</p>
            <p className="mt-2 text-xs leading-5 text-white/70">Stripe-inspired concept demo. Not affiliated with Stripe.</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#e3e8ee] bg-white/78 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <StripeAsionLogo />
                <button
                  type="button"
                  onClick={() => handleNav("Overview")}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[#d6dce6] bg-white text-[#0a2540]"
                  aria-label="Open overview"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="relative max-w-2xl flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697386]" aria-hidden />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search agents, merchants, buyers, payments..."
                  className="h-11 w-full rounded-2xl border border-[#d6dce6] bg-white pl-11 pr-4 text-sm font-medium text-[#0a2540] outline-none transition focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Agentic commerce monitor active
                </span>
                <label className="relative">
                  <span className="sr-only">Date range</span>
                  <select
                    value={dateRange}
                    onChange={(event) => {
                      setDateRange(event.target.value);
                      setNotice(`Date range changed to ${event.target.value}.`);
                    }}
                    className="h-10 appearance-none rounded-full border border-[#d6dce6] bg-white px-4 pr-9 text-sm font-semibold text-[#0a2540] outline-none"
                  >
                    <option>Last 24 hours</option>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697386]" aria-hidden />
                </label>
                <button
                  type="button"
                  onClick={handleNotification}
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#d6dce6] bg-white text-[#0a2540] hover:border-[#635bff]"
                  aria-label="Review notifications"
                >
                  <Bell className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={handleUserMenu}
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#0a2540] text-sm font-semibold text-white"
                  aria-label="Open user menu"
                >
                  AS
                </button>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-5 p-4 sm:p-6 2xl:flex-row">
            <section className="grid min-w-0 flex-1 grid-cols-1 content-start gap-5">
              <section id="overview" className="min-w-0 scroll-mt-28 overflow-hidden rounded-[32px] border border-[#e3e8ee] bg-white p-6 shadow-[0_24px_80px_rgba(10,37,64,0.08)]">
                <div className="flex min-w-0 flex-col gap-6 xl:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#d6dce6] bg-[#f6f9fc] px-3 py-1 text-xs font-semibold text-[#635bff]">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      CheckoutGuard AI
                    </div>
                    <h1 className="mt-5 max-w-full text-4xl font-semibold text-[#0a2540] md:text-6xl">
                      Welcome back, Alex
                    </h1>
                    <p className="mt-3 max-w-full text-lg font-medium leading-8 text-[#425466]">
                      Here is what your commerce risk agent is watching today.
                    </p>
                    <p className="mt-5 max-w-full text-sm leading-6 text-[#697386]">
                      Approve trusted agent checkouts. Challenge risky ones. Protect revenue before fraud becomes a chargeback.
                    </p>
                  </div>
                  <div className="relative min-h-[220px] min-w-0 overflow-hidden rounded-[28px] bg-[#0a2540] p-5 text-white xl:w-[330px] xl:shrink-0">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#635bff_0%,#00d4ff_45%,#00d084_100%)] opacity-90" />
                    <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/25" />
                    <div className="absolute bottom-4 right-4 h-36 w-56 rounded-3xl border border-white/20 bg-white/10 backdrop-blur" />
                    <div className="relative">
                      <p className="text-sm font-semibold text-white/80">Agentic Commerce Risk and Revenue Copilot</p>
                      <div className="mt-8 grid grid-cols-1 gap-3">
                        {["Identity", "Payment", "Intent", "Chargeback"].map((signal) => (
                          <div key={signal} className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold">
                            <span>{signal}</span>
                            <CheckCircle2 className="h-4 w-4" aria-hidden />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.label} {...kpi} />
                ))}
              </section>

              <section id="checkout-queue" className="scroll-mt-28">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#635bff]">Agentic Checkout Queue</p>
                    <h2 className="text-2xl font-semibold text-[#0a2540]">AI initiated checkout activity</h2>
                  </div>
                  <p className="hidden text-sm font-semibold text-[#697386] sm:block">{filteredAttempts.length} visible events</p>
                </div>
                <div className="overflow-x-auto">
                  <CheckoutQueue
                    attempts={filteredAttempts}
                    selectedId={selected.id}
                    assessments={assessments}
                    onSelect={handleSelect}
                  />
                </div>
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <RiskDecisionCard selected={selected} assessment={selectedAssessment} onAction={handleDecision} />
                <AgentProfileCard selected={selected} />
              </section>

              <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <PaymentGuardrails />
                <RevenueProtection protectedLift={protectedLift} />
              </section>

              <Charts />
              <AuditTrail events={auditEvents} />
              <SettingsPanel statusText={notice} />
            </section>

            <aside className="grid w-full grid-cols-1 content-start gap-5 2xl:w-[390px] 2xl:shrink-0">
              <section className="rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
                <p className="text-sm font-semibold text-[#635bff]">Active workspace</p>
                <p data-testid="workspace-notice" className="mt-2 text-sm font-semibold leading-6 text-[#0a2540]">
                  {notice}
                </p>
              </section>
              <section className="rounded-2xl border border-[#e3e8ee] bg-white p-5 shadow-[0_18px_45px_rgba(10,37,64,0.06)]">
                <p className="text-sm font-semibold text-[#635bff]">Selected checkout</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#0a2540]">{selected.amountLabel}</h2>
                <p className="mt-2 text-sm leading-6 text-[#425466]">
                  {selected.buyer} buying {selected.purchase} from {selected.merchant}.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {selected.signalLabels.map((signal) => (
                    <div key={signal} className="flex items-center gap-2 text-sm font-medium text-[#425466]">
                      <ShieldCheck className="h-4 w-4 text-[#635bff]" aria-hidden />
                      {signal}
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-[#e3e8ee] bg-[#0a2540] p-5 text-white shadow-[0_22px_60px_rgba(10,37,64,0.22)]">
                <div className="flex items-center gap-3">
                  <LockKeyhole className="h-5 w-5 text-[#00d4ff]" aria-hidden />
                  <p className="font-semibold">Agent permission limits</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/75">
                  CheckoutGuard checks agent authority before payment authorization, then preserves a reviewer-ready evidence trail.
                </p>
                <button
                  type="button"
                  onClick={() => handleNav("Guardrails")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0a2540] hover:bg-[#f6f9fc]"
                >
                  View guardrails
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </button>
              </section>
            </aside>
          </div>

          <footer className="px-6 pb-6 text-xs font-medium text-[#697386]">
            Secure agentic commerce, built for trusted checkout. Unofficial Asion concept demo inspired by Stripe, agentic commerce, checkout risk, and revenue protection workflows.
          </footer>
        </div>
      </div>
    </main>
  );
}
