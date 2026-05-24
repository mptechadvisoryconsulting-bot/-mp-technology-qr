import Stripe from "stripe";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const plans = [
  {
    key: "STARTER",
    name: "ScanOps Starter",
    description: "25 dynamic QR codes, 1 user, basic analytics.",
    prices: { MONTHLY: 1200, QUARTERLY: 3400, YEARLY: 12000 },
  },
  {
    key: "PROFESSIONAL",
    name: "ScanOps Professional",
    description: "100 dynamic QR codes, up to 5 users, advanced analytics, branding, and exports.",
    prices: { MONTHLY: 2900, QUARTERLY: 8200, YEARLY: 29000 },
  },
  {
    key: "BUSINESS",
    name: "ScanOps Business",
    description: "500 dynamic QR codes, up to 10 users, API access, bulk uploads, and advanced exports.",
    prices: { MONTHLY: 7900, QUARTERLY: 22500, YEARLY: 79000 },
  },
];

const intervals = {
  MONTHLY: { interval: "month", interval_count: 1 },
  QUARTERLY: { interval: "month", interval_count: 3 },
  YEARLY: { interval: "year", interval_count: 1 },
};

const rl = readline.createInterface({ input, output });

const secretKey = (await rl.question("Paste Stripe secret key (sk_test_ or sk_live_): ")).trim();
const siteUrl =
  (await rl.question("Production app URL [https://mp-technology-qr.vercel.app]: ")).trim() ||
  "https://mp-technology-qr.vercel.app";
rl.close();

if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
  console.error("That does not look like a Stripe secret key.");
  process.exit(1);
}

const stripe = new Stripe(secretKey);
const env = {
  STRIPE_SECRET_KEY: secretKey,
};

for (const plan of plans) {
  const product = await findOrCreateProduct(stripe, plan);
  for (const [term, amount] of Object.entries(plan.prices)) {
    const price = await findOrCreatePrice(stripe, product.id, plan.key, term, amount);
    env[`STRIPE_PRICE_${plan.key}_${term}`] = price.id;
  }
}

const webhook = await stripe.webhookEndpoints.create({
  url: `${siteUrl.replace(/\/$/, "")}/api/stripe/webhook`,
  enabled_events: [
    "checkout.session.completed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ],
  description: "ScanOps production subscription webhook",
});
env.STRIPE_WEBHOOK_SECRET = webhook.secret;

console.log("\nAdd these to Vercel Environment Variables for Production and Preview:\n");
for (const [key, value] of Object.entries(env)) {
  console.log(`${key}=${value}`);
}
console.log("\nThen redeploy Vercel.");

async function findOrCreateProduct(stripeClient, plan) {
  const products = await stripeClient.products.search({
    query: `metadata['scanops_plan']:'${plan.key.toLowerCase()}'`,
  });
  if (products.data[0]) return products.data[0];
  return stripeClient.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { scanops_plan: plan.key.toLowerCase() },
  });
}

async function findOrCreatePrice(stripeClient, productId, planKey, term, amount) {
  const prices = await stripeClient.prices.search({
    query: `metadata['scanops_plan']:'${planKey.toLowerCase()}' AND metadata['scanops_term']:'${term.toLowerCase()}'`,
  });
  if (prices.data[0]) return prices.data[0];
  return stripeClient.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: amount,
    recurring: intervals[term],
    metadata: {
      scanops_plan: planKey.toLowerCase(),
      scanops_term: term.toLowerCase(),
    },
  });
}
