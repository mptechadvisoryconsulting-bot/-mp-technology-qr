export const billingTerms = [
  { id: "monthly", label: "Monthly", suffix: "/mo" },
  { id: "quarterly", label: "Quarterly", suffix: "/qtr" },
  { id: "yearly", label: "Yearly", suffix: "/yr" },
];

export const freePlan = {
  id: "free",
  name: "Free Trial",
  description: "For evaluating the platform before choosing a paid plan.",
  limits: "10 dynamic QR codes, 1 user, basic analytics",
  dynamicLimit: 10,
  scanLimit: 500,
  userLimit: 1,
  prices: { monthly: 0, quarterly: 0, yearly: 0 },
  features: ["10 dynamic QR codes", "1 user", "Basic analytics", "500 saved scan records/month"],
};

export const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "For small teams getting started with dynamic QR operations.",
  limits: "25 QR codes, 1 user, basic analytics",
  dynamicLimit: 25,
  scanLimit: 2500,
  userLimit: 1,
    prices: { monthly: 12, quarterly: 34, yearly: 120 },
    priceEnv: {
      monthly: "STRIPE_PRICE_STARTER_MONTHLY",
      quarterly: "STRIPE_PRICE_STARTER_QUARTERLY",
      yearly: "STRIPE_PRICE_STARTER_YEARLY",
    },
    features: ["14-day free trial", "25 dynamic QR codes", "1 user", "Basic analytics"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For operations teams that need analytics, branding, and reports.",
    limits: "100 QR codes, 5 users, advanced analytics",
    dynamicLimit: 100,
    scanLimit: 25000,
    userLimit: 5,
    prices: { monthly: 29, quarterly: 82, yearly: 290 },
    priceEnv: {
      monthly: "STRIPE_PRICE_PROFESSIONAL_MONTHLY",
      quarterly: "STRIPE_PRICE_PROFESSIONAL_QUARTERLY",
      yearly: "STRIPE_PRICE_PROFESSIONAL_YEARLY",
    },
    popular: true,
    features: ["14-day free trial", "100 dynamic QR codes", "5 users", "Advanced analytics", "Export reporting"],
  },
  {
    id: "business",
    name: "Business",
    description: "For high-volume operations teams, warehouses, and support automation.",
    limits: "500 QR codes, 10 users, API access",
    dynamicLimit: 500,
    scanLimit: 100000,
    userLimit: 10,
    prices: { monthly: 79, quarterly: 225, yearly: 790 },
    priceEnv: {
      monthly: "STRIPE_PRICE_BUSINESS_MONTHLY",
      quarterly: "STRIPE_PRICE_BUSINESS_QUARTERLY",
      yearly: "STRIPE_PRICE_BUSINESS_YEARLY",
    },
    features: ["14-day free trial", "500 dynamic QR codes", "10 users", "API access", "Bulk uploads", "Team permissions"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For custom integrations, SLA support, and large operational deployments.",
    limits: "Custom QR limits, unlimited/custom users",
    dynamicLimit: 999999,
    scanLimit: 9999999,
    userLimit: 999999,
    prices: { monthly: null, quarterly: null, yearly: null },
    custom: true,
    features: ["Custom pricing", "Unlimited or custom QR limits", "Unlimited or custom users", "Custom integrations", "SLA support"],
  },
];

export const allPlans = [freePlan, ...plans];

export function findPlan(planId) {
  const aliases = { pro: "professional", agency: "enterprise" };
  const normalizedPlanId = aliases[planId] || planId;
  return allPlans.find((plan) => plan.id === normalizedPlanId) || freePlan;
}

export function findTerm(termId) {
  return billingTerms.find((term) => term.id === termId);
}

export function getPlanLimits(planId) {
  const plan = findPlan(planId);
  return {
    dynamicLimit: plan.dynamicLimit,
    scanLimit: plan.scanLimit,
    userLimit: plan.userLimit,
  };
}
