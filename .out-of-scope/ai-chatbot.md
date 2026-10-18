# AI chatbot assistant

Gamers Universe does not provide a conversational AI assistant (site-wide
chatbot answering questions, recommending games or acting on the user's
account).

## Why this is out of scope

- **Value overlap.** The questions a chatbot would answer ("what should I
  play?", "games like X") are covered by deterministic features: the
  recommendation engine with explained reasons, the "Which game for me" quiz
  (#102), mood discovery (#106) and search. These are cheaper, faster, testable
  and translatable.
- **Security.** A chatbot that reads profile, library or social data is exposed
  to prompt injection through user-generated content (reviews, posts, usernames)
  and can be steered into revealing other users' data. Containing that requires
  strict tool scoping, output filtering and ongoing red-teaming.
- **Cost and moderation.** Per-message LLM cost grows with usage, and open-ended
  generated answers about real people and games need moderation and
  AI-transparency labelling.

Targeted AI features with bounded input and output remain acceptable, e.g. the
AI review summary (#177) and on-demand translation of user content (#17).

## Prior requests

- #180: "Chatbot assistant IA"
