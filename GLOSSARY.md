# Game Universe

Game Universe is a bilingual (FR/EN) gaming platform: a public catalogue of
games, characters, players and esport, plus a personal area for signed-in
members.

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
