import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getStripe } from "@/lib/stripe";
import { createSessionConversation } from "@/lib/services/coachingConversationService";
import { coachingSessionPaid, coachingSessionTransitioned } from "@/lib/services/notifications";
import {
  createCoachingLifecycle,
  type CoachingLifecycle,
} from "@/lib/services/coaching-lifecycle/createCoachingLifecycle";
import { createSupabaseSessionStore } from "@/lib/services/coaching-lifecycle/supabaseSessionStore";
import { createStripePaymentGateway } from "@/lib/services/coaching-lifecycle/stripePaymentGateway";
import type { LifecycleEffects } from "@/types/coaching-lifecycle";

export { createCoachingLifecycle, type CoachingLifecycle };
export { isPayableSession } from "@/lib/services/coaching-lifecycle/rules";
export { paymentReportFromCheckout } from "@/lib/services/coaching-lifecycle/stripePaymentGateway";

const productionEffects: LifecycleEffects = {
  async openConversation(session) {
    if (!session.coachPlayerId) return;
    await createSessionConversation(session.coachPlayerId, session.studentId, session.id);
  },
  async notifyTransition(input) {
    await coachingSessionTransitioned(input);
  },
  async notifyPaid(input) {
    await coachingSessionPaid(input);
  },
};

/** The lifecycle wired to Supabase (service role), Stripe and the notification modules. */
export function getCoachingLifecycle(): CoachingLifecycle {
  return createCoachingLifecycle({
    store: createSupabaseSessionStore(getSupabaseAdmin()),
    payments: createStripePaymentGateway(getStripe()),
    effects: productionEffects,
  });
}
