# GameUniverse

A video game discovery and community platform: game catalog, player profiles, libraries, and paid
coaching between players.

## Coaching

**Coaching session**:
A booked, paid slot during which a coach coaches a student on one game.
_Avoid_: Booking, lesson, appointment

**Coach**:
A player who offers coaching sessions through a coach profile.

**Student**:
The player who books a coaching session with a coach.
_Avoid_: Client, learner

**Session status**:
Where a coaching session stands in its life: requested, confirmed, in progress, completed,
cancelled or disputed.

**Payment status**:
Where the money of a coaching session stands: pending, paid, refund pending, refunded or released.
Independent of the session status.

**Session action**:
A step a participant takes on a coaching session: confirm, decline, start, complete or cancel.
_Avoid_: Transition (the action is what a person does; the status change is its result)

**Payable session**:
A confirmed coaching session whose payment status is still pending.

**Refund pending**:
The payment status of a cancelled, paid session whose refund is owed but not yet confirmed by
Stripe.

**Refund amount**:
The part of the payment returned to the student, set by the coach's cancellation policy for a
student or coach cancellation, or in full when a payment lands on an already cancelled session.

**Cancellation policy**:
The coach's rules mapping how early a session is cancelled to the share of the payment refunded.

**External refund**:
A refund issued outside the platform's own cancellation flow, typically from the Stripe dashboard.
