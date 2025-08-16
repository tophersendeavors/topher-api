// /api/create-checkout-session.js
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    const PRICE_IDS = {
      chatbot:      process.env.PRICE_CHATBOT,
      receptionist: process.env.PRICE_RECEPTIONIST,
      video:        process.env.PRICE_VIDEO,
      suite:        process.env.PRICE_SUITE
    };
    const { plan, name, email, phone, business, website } = req.body || {};
    const price = PRICE_IDS[plan];
    if (!price) return res.status(400).json({ error: "Unknown plan" });
    if (!email) return res.status(400).json({ error: "Email required" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { plan, name, email, phone, business, website, source: "site-start" }
      },
      customer_email: email,
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      success_url: "https://www.topherai.com/start-success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:  "https://www.topherai.com/#pricing",
      metadata: { plan, name, email, phone, business, website, source: "site-start" }
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Stripe error" });
  }
}
