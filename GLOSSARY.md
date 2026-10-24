# GameUniverse

A video game community: players track their library, review games, follow
esports, earn a virtual currency for their activity and book paid coaching.

## GU Coins

**GU Coin**: The site's virtual currency, earned through activity and spent on
predictions. It has no real-money value. _Avoid_: credits, points, tokens

**Wallet**: A player's GU Coin balance, with lifetime totals earned and spent. A
balance is never negative. _Avoid_: account, purse

**Ledger**: The append-only history of every GU Coin movement. The wallet is
always the sum of its ledger entries. _Avoid_: transaction log

**Ledger entry**: One GU Coin movement for one player: a signed amount, its
kind, and the balance right after it. _Avoid_: transaction (when talking about
the domain), movement

**Ledger key**: The identity of a ledger entry in the world (a prediction, an
admin grant attempt). Posting a second entry with the same ledger key changes
nothing. _Avoid_: idempotency token, reference (reference is the activity's
subject)

**Signup bonus**: The ledger entry that opens a wallet. Every wallet starts with
exactly one. _Avoid_: welcome coins

**Activity reward**: A ledger entry earned by an activity (review, library add,
friend add...), bounded by the activity's cooldown and daily cap and paid once
per subject.

**Admin grant**: A ledger entry posted by an admin, positive or negative. A
negative grant cannot overdraw the wallet. _Avoid_: adjustment, manual credit

## Esport predictions

**Prediction**: A player's wager of GU Coins on the winner of a pro esport
match. _Avoid_: bet (in code and docs), pronostic (UI only, FR)

**Stake**: The GU Coins debited when a prediction is placed. _Avoid_: bet amount

**Settlement**: Turning every pending prediction of a finished match into won or
lost, and paying each won prediction its payout. It happens fully or not at all.
_Avoid_: resolution, payout run

**Payout**: The GU Coins credited for a won prediction: twice the stake.
_Avoid_: winnings

## User interface

**Dismissable layer**: A temporary surface (menu, dropdown, panel, overlay,
dialog) that closes on Escape or on a pointer pressed outside its inside
regions. _Avoid_: popup, popover (except for a specific component),
click-outside

**Layer stack**: The order of the dismissable layers open at a given time; the
last one opened is the top layer. _Avoid_: z-index, modal stack

**Top layer**: The most recently opened dismissable layer; the only one that
receives Escape. _Avoid_: active layer, current modal

**Inside region**: An area that counts as inside a dismissable layer (its
container, plus declared regions such as its trigger); a pointer pressed there
does not close it. _Avoid_: ignored zone, exclusion

**Trigger**: The element that had the focus when a dismissable layer opened, and
gets it back when the layer closes. _Avoid_: anchor, opener

**Scroll lock**: Page scrolling blocked while at least one dismissable layer
asks for it. _Avoid_: body lock, overflow hidden

**Focus trap**: The constraint that keeps keyboard navigation (Tab, Shift+Tab)
inside a dismissable layer. _Avoid_: focus lock, focus scope

## Coaching

**Coaching session**: A booked, paid slot during which a coach coaches a student
on one game. _Avoid_: Booking, lesson, appointment

**Coach**: A player who offers coaching sessions through a coach profile.

**Student**: The player who books a coaching session with a coach. _Avoid_:
Client, learner

**Session status**: Where a coaching session stands in its life: requested,
confirmed, in progress, completed, cancelled or disputed.

**Payment status**: Where the money of a coaching session stands: pending, paid,
refund pending, refunded or released. Independent of the session status.

**Session action**: A step a participant takes on a coaching session: confirm,
decline, start, complete or cancel. _Avoid_: Transition (the action is what a
person does; the status change is its result)

**Payable session**: A confirmed coaching session whose payment status is still
pending.

**Refund pending**: The payment status of a cancelled, paid session whose refund
is owed but not yet confirmed by Stripe.

**Refund amount**: The part of the payment returned to the student, set by the
coach's cancellation policy for a student or coach cancellation, or in full when
a payment lands on an already cancelled session.

**Cancellation policy**: The coach's rules mapping how early a session is
cancelled to the share of the payment refunded.

**External refund**: A refund issued outside the platform's own cancellation
flow, typically from the Stripe dashboard.

## Client-side mutations

**Optimistic mutation**: A user-initiated change whose expected result is shown
immediately, before the server confirms it, and undone if the server refuses it.
_Avoid_: optimistic update, instant update

**Affected key**: A cached resource whose new value the optimistic mutation
predicts and shows before confirmation (e.g. a game's "in my library" status).
_Avoid_: modified key, target cache

**Related key**: A cached resource the optimistic mutation does not predict but
that becomes stale once the server confirms (e.g. library stats after adding a
game). _Avoid_: dependent key, linked cache

**Rollback**: Returning every affected key to its last confirmed value when the
server refuses the mutation or cannot be reached. _Avoid_: revert, cancellation

**In-flight toggle**: A toggle whose request has not finished yet; any new
toggle of the same target is ignored until it settles. _Avoid_: pending toggle,
double click

## API routes

**Route pipeline**: The shared prologue an API route declares (access, rate
limit, content write, expected input) and the server applies before the handler,
in a fixed order. _Avoid_: middleware, guard, wrapper

**Route access**: What a route requires from its caller: signed in (required),
optional, or administrator (admin). _Avoid_: auth level, permission

**Administrator**: A user whose `admin` role is set by the server
(`app_metadata`), never a role they gave themselves. _Avoid_: superuser, staff

**Content write**: A request that publishes content other players can see
(review, comment, post), which a suspended account cannot make. _Avoid_: user
write, mutation

**Suspension**: A temporary or permanent ban on publishing content; the account
keeps read access and access to its private data. _Avoid_: ban, block

**Rate limit action**: A family of requests counted together for one caller (the
user, otherwise the IP address) over a sliding window. _Avoid_: quota, throttle
key

**Route error**: An expected refusal from a route, identified by a stable code
(`unauthorized`, `forbidden`, `suspended`, `not_found`, `validation`,
`conflict`, `rate_limited`) that the client relies on. _Avoid_: exception,
failure

## Administration

**Admin entity**: A reference or content record managed in the admin panel
(genre, platform, species, review, game...), listed, edited and deleted by an
administrator. _Avoid_: admin object, CRUD item

**Admin resource**: How the admin panel describes an admin entity: where it is
listed, how a row is identified, whether it has a usage and whether its delete
is forced. _Avoid_: admin config, entity definition

**Usage**: The number of other records (games, characters, players...) that
reference an admin entity. Reading it never changes anything. _Avoid_: usage
check (when it means a delete), references count

**Forced delete**: Deleting an admin entity by first detaching its usages,
instead of being refused while it is in use. _Avoid_: hard delete, cascade
delete

**Delete flow**: The sequence request, show the usage, then confirm or cancel
the deletion of an admin entity. _Avoid_: delete dialog logic
