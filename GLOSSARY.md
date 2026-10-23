# GameUniverse

Game discovery and social platform: players build a game library, review, collect, post and
befriend each other, and are rewarded for that activity.

## Activity rewards

**Activity event**:
A player action the platform rewards, such as a review created or a friendship accepted.
_Avoid_: action, trigger, hook

**Activity reward**:
Everything a player receives for an activity event: achievements unlocked (with their XP) and
GU Coins.
_Avoid_: bonus, prize

**Rewarded party**:
A player who receives an activity reward for a given activity event; a friendship accepted has
two (the accepter and the requester).
_Avoid_: beneficiary, recipient

**Achievement category**:
The family of achievements an activity event can unlock (library, reviews, social, collections,
playtime), each counted from the player's current totals.
_Avoid_: achievement type

**Coin activity type**:
The kind of activity a GU Coins reward pays for; each one has its own amount, cooldown and daily
cap.
_Avoid_: reward type

**Reward reference**:
The identifier of what an activity event is about (the review, the game, the friend); a given
coin activity type pays at most once per reward reference.
_Avoid_: reference key, dedup id

**GU Coins**:
The platform's virtual currency, earned through activity rewards and spent in the shop and on
esport predictions.
_Avoid_: credits, points

**XP**:
Experience points earned only by unlocking achievements; they determine the player's level.
_Avoid_: experience, score
