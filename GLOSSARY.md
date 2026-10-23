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

## User interface

**Dismissable layer**:
A temporary surface (menu, dropdown, panel, overlay, dialog) that closes on
Escape or on a pointer pressed outside its inside regions.
_Avoid_: popup, popover (except for a specific component), click-outside

**Layer stack**:
The order of the dismissable layers open at a given time; the last one opened
is the top layer.
_Avoid_: z-index, modal stack

**Top layer**:
The most recently opened dismissable layer; the only one that receives Escape.
_Avoid_: active layer, current modal

**Inside region**:
An area that counts as inside a dismissable layer (its container, plus declared
regions such as its trigger); a pointer pressed there does not close it.
_Avoid_: ignored zone, exclusion

**Trigger**:
The element that had the focus when a dismissable layer opened, and gets it
back when the layer closes.
_Avoid_: anchor, opener

**Scroll lock**:
Page scrolling blocked while at least one dismissable layer asks for it.
_Avoid_: body lock, overflow hidden

**Focus trap**:
The constraint that keeps keyboard navigation (Tab, Shift+Tab) inside a
dismissable layer.
_Avoid_: focus lock, focus scope

## Navigation

**Navigation Model**: The single description of everything the editorial shell
can link to for one visitor at one location: public entries, spaces, account
links and which of them are active. _Avoid_: menu config, nav data, sidebar
links

**Public Entry**: A top-level group of public catalogue destinations (games,
characters, players, esport), shown in the top bar and in the mobile "Discover"
section. _Avoid_: mega-menu item, top link

**Space**: A top-level group of member-oriented destinations (social, groups,
communities, library, predictions, coaching, account), shown in the rail and in
the mobile "My area" section. _Avoid_: section, category, rail item

**Account Link**: A shortcut to the signed-in member's own pages (profile,
library, settings), offered only to signed-in members. _Avoid_: user menu item,
dropdown link

**Membership Link**: A link to a group or community the signed-in member belongs
to, listed under its Space. _Avoid_: my-group item, dynamic child

**Active Link**: The one destination that best matches the current location;
every rendering of that destination shows it as current. _Avoid_: selected link,
current item

**Active Space** / **Active Entry**: The Space or Public Entry whose territory
contains the current location. _Avoid_: open space (an open space is the panel
the visitor chose to show, not the location)
