# stripe.asion.ai - CheckoutGuard AI

CheckoutGuard AI is an agentic commerce risk and revenue copilot concept for `stripe.asion.ai`.

AI agents are starting to shop, subscribe, and complete checkout on behalf of users. CheckoutGuard AI gives merchant risk, payments, and revenue operations teams a command center for reviewing AI-initiated checkout activity before it becomes fraud, chargeback loss, or blocked good revenue.

## What It Shows

- Three realistic AI shopping-agent checkout attempts.
- Deterministic risk scoring for buyer, agent, payment, merchant, cart, velocity, and permission signals.
- Decision outcomes for approve, step-up verification, hold for review, and block.
- A risk analyst explanation panel with top drivers and recommended action.
- Payment guardrails, revenue protection metrics, charts, and audit evidence.
- Interactive search, queue selection, decision buttons, navigation, notifications, user menu, and date range selector.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React icons
- Static mock data in `src/lib/mock-data.ts`
- Deterministic scoring in `src/lib/risk-engine.ts`

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```

The UI has been checked locally across desktop and mobile viewports for page-level overflow, console errors, and core click flows.
