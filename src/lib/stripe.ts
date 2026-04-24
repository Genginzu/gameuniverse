import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Platform commission rate (15%) */
export const PLATFORM_FEE_RATE = 0.15;
