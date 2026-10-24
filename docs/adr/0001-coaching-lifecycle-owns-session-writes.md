# The coaching lifecycle module owns every coaching session write

Status and payment status of a coaching session are written only by `src/lib/services/coaching-lifecycle/`,
through the service role, with compare-and-set claims pinning both axes. The module checks roles and
transitions itself; the `enforce_coaching_session_write` trigger stays as a defence against direct
PostgREST calls, not as the rule source. We chose this over keeping user-client writes for status
(trigger-checked) plus service-role writes for payment, because a cancellation with a refund must
move both axes atomically (`cancelled + refund_pending`) to guarantee a single refund against
concurrent Stripe webhooks.

## Consequences

- Any new transition is added to the module's rules **and** to the trigger, or direct PostgREST
  callers and the app diverge.
- A failed Stripe refund is a visible `refund_pending` state, settled by `charge.refunded`.
