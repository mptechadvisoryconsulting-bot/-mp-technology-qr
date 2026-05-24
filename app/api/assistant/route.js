const fallbackAnswers = [
  {
    keywords: ["dynamic", "edit", "destination"],
    answer:
      "Choose Dynamic tracked link when saving a QR code. The printed QR points to your /r code, and the dashboard stores the final destination so you can update or track it later.",
  },
  {
    keywords: ["stripe", "payment", "billing", "checkout"],
    answer:
      "Create products and recurring prices in Stripe, copy the price IDs into Vercel, add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET, then redeploy. Customers start checkout from the Pricing page.",
  },
  {
    keywords: ["scan", "history", "analytics", "count"],
    answer:
      "Open a saved ?qr link from the dashboard or scan a downloaded dynamic QR. The dashboard records recent scan history and monthly saved scan counts for that account only.",
  },
  {
    keywords: ["vercel", "login", "preview"],
    answer:
      "Use the production app domain for QR payloads. Set NEXT_PUBLIC_SITE_URL to https://app.scanops.io after the domain is connected, then create a new QR after redeploying.",
  },
];

export async function POST(request) {
  const { question } = await request.json();
  if (!question?.trim()) {
    return Response.json({ error: "Ask a setup question first." }, { status: 400 });
  }

  if (process.env.OPENAI_API_KEY) {
    const answer = await askOpenAI(question);
    return Response.json({ answer });
  }

  const lowerQuestion = question.toLowerCase();
  const match = fallbackAnswers.find((item) => item.keywords.some((keyword) => lowerQuestion.includes(keyword)));
  return Response.json({
    answer:
      match?.answer ||
      "I can help with QR setup, dynamic links, Stripe payments, scan history, Vercel deployment, and customer onboarding. Add OPENAI_API_KEY in Vercel to enable fuller AI answers.",
  });
}

async function askOpenAI(question) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.2",
      instructions:
        "You are the support assistant for ScanOps, an operational QR automation SaaS. Answer setup questions clearly and briefly. Focus on QR creation, dynamic links, scan analytics, account privacy, Stripe billing, Supabase auth, and Vercel deployment. Do not ask for secret keys.",
      input: question,
    }),
  });

  if (!response.ok) {
    return "AI setup is connected but returned an error. Check OPENAI_API_KEY and OPENAI_MODEL in Vercel.";
  }

  const data = await response.json();
  return data.output_text || "I could not generate an answer yet.";
}
