# GameUniverse

A video game community: players track their library, review games, follow
esports and earn a virtual currency for their activity.

## GU Coins

**GU Coin**:
The site's virtual currency, earned through activity and spent on predictions.
It has no real-money value.
_Avoid_: credits, points, tokens

**Wallet**:
A player's GU Coin balance, with lifetime totals earned and spent. A balance is
never negative.
_Avoid_: account, purse

**Ledger**:
The append-only history of every GU Coin movement. The wallet is always the sum
of its ledger entries.
_Avoid_: transaction log

**Ledger entry**:
One GU Coin movement for one player: a signed amount, its kind, and the balance
right after it.
_Avoid_: transaction (when talking about the domain), movement

**Ledger key**:
The identity of a ledger entry in the world (a prediction, an admin grant
attempt). Posting a second entry with the same ledger key changes nothing.
_Avoid_: idempotency token, reference (reference is the activity's subject)

**Signup bonus**:
The ledger entry that opens a wallet. Every wallet starts with exactly one.
_Avoid_: welcome coins

**Activity reward**:
A ledger entry earned by an activity (review, library add, friend add...),
bounded by the activity's cooldown and daily cap and paid once per subject.

**Admin grant**:
A ledger entry posted by an admin, positive or negative. A negative grant
cannot overdraw the wallet.
_Avoid_: adjustment, manual credit

## Esport predictions

**Prediction**:
A player's wager of GU Coins on the winner of a pro esport match.
_Avoid_: bet (in code and docs), pronostic (UI only, FR)

**Stake**:
The GU Coins debited when a prediction is placed.
_Avoid_: bet amount

**Settlement**:
Turning every pending prediction of a finished match into won or lost, and
paying each won prediction its payout. It happens fully or not at all.
_Avoid_: resolution, payout run

**Payout**:
The GU Coins credited for a won prediction: twice the stake.
_Avoid_: winnings
