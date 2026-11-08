# Event essentials — Agent-Native Hackathon (Builder.io)

All quotes are verbatim. Where the Rules and the event page differ, the **Official Rules** are the
controlling text (the event page links to them for eligibility and requirements).

- Rules: https://www.builder.io/hackathon/rules (fetched 2026-11-08, Chrome)
- Event page: https://www.builder.io/hackathon (fetched 2026-11-08, Chrome)
- Submit page: https://www.builder.io/hackathon/submit (fetched 2026-11-08, Chrome)

---

## Deadline (absolute + timezone)

> "Monday, November 9, 2026 at 11:59 PM PT: Final submission deadline."

> "All dates are in 2026. Pacific Time (America/Los_Angeles) controls all deadlines, regardless of the
> participant's location. The final submission timestamp is November 9, 2026, at 11:59 PM PT
> (November 10, 2026, at 07:59 UTC). The final weekend is not the entire building period."

**For us (WAT, UTC+1): Tue 2026-11-10 08:59 WAT.** The Rules give the UTC conversion (07:59 UTC); WAT
adds one hour.

> "Participants should submit early and verify receipt. Technical problems do not automatically extend a deadline."

### Schedule (Rules, verbatim)
- October 27, 2026: Hackathon begins; building can start immediately.
- October 29, 2026 at 8:30 AM PT: Optional kickoff webinar.
- November 3, 2026 at 8:30 AM PT: Optional office hours.
- November 5, 2026 at 8:30 AM PT: Optional office hours.
- November 6 – November 8, 2026: Final Hackathon Weekend.
- Monday, November 9, 2026 at 11:59 PM PT: Final submission deadline.
- November 13, 2026: Target winner announcement, subject to verification.

## Eligibility (Rules, verbatim)

> "Eligible individuals and teams worldwide may participate, subject to applicable laws and restrictions.
> Every participant must be at least 18 years old, or the age of legal majority in their jurisdiction if
> higher, when entering."

> "Void where prohibited by law. Individuals and jurisdictions are excluded where participation or payment
> would violate applicable trade sanctions or other legal restrictions. International participants may win
> cash prizes subject to eligibility, legal verification, payment availability, and tax requirements."

> "Sponsor employees and individuals involved in judging cannot win. Each team member must satisfy these
> eligibility requirements. Team members must authorize the submission and agree to any prize allocation."

**Team size:** **no cap is stated** in the Rules, the FAQ, or the submit form. FAQ, verbatim: "Yes. You can
participate solo or as part of a team. Every team member must meet the participation eligibility
requirements and be identified in the submission. Cash prizes are awarded per winning entry, not per team
member. See the Official Rules for team requirements."

**Registration:** not required. Event page: "Open to developers worldwide. Start building today. No registration required."

## How to enter / submission format (Rules, verbatim)

> - "Build a functional application using Agent-Native.
> - Submit original work or meaningful new development completed during the Hackathon, beginning October 27,
>   2026. Identify pre-existing work, templates, libraries, third-party assets, and what changed during the event.
> - Provide a project description, creator or team details, contact information, and an accessible
>   demonstration of the working application.
> - Record a public Clips demonstration showing the actual application in use. The recording must be viewable
>   without a login or access request. A public repository or live deployment is encouraged but not required.
> - Submit the required information and public Clips link through the project submission form by Monday,
>   November 9, 2026 at 11:59 PM PT, and confirm receipt. Recording a clip alone does not submit an entry.
> - Agree to the approved Official Rules and confirm eligibility when submitting an entry."

### Submission form fields (https://www.builder.io/hackathon/submit, read from the DOM, not submitted)

"What you'll need": "Your name and contact information" · "Project name and description, including your
team members and any pre-existing work you built on" · "Public Clips recording".

| Field label (verbatim) | Form `name` | Required |
|---|---|---|
| First name * | `firstname` | yes |
| Last name | `lastname` | no |
| Email * | `email` | yes |
| Project name * | `hackathon_project_name` | yes |
| Project description * (placeholder: "What it does, how it uses Agent-Native, any pre-existing work, templates, or third-party assets and what changed during the event, and the names of everyone on your team") | `hackathon_project_description` | yes |
| Project or GitHub URL (optional) | `github_project_url` | no |
| Public Clips recording URL * | `clip_url` | yes |
| Slides URL (optional) | `slides_url` | no |
| ☐ "I agree to the Agent-Native Hackathon Official Rules, and confirm that every team member meets the eligibility requirements and authorizes this entry. I also agree to allow Builder to store and process my personal data. *" | `processingConsent` | yes |
| ☐ "Marketing offers and updates (optional)." | `marketingConsent` | no |

No `maxlength` is set on any field. Page header: "Submission deadline: November 9, 2026 at 11:59 PM PT".

### Is the repo required to be public? — **No.**
FAQ, verbatim: "Your Clips recording must be publicly viewable without a login or access request. A public
live app and public repository are encouraged but not required. Your app can have a normal sign-in flow."
IP section: the license granted "does not transfer ownership or require releasing private source code."

### Is Clips required? — **Yes.**
FAQ, verbatim: "Yes. Every entry requires a demo recorded with Clips. A recording made with another tool does
not replace this requirement." (Clips account and recording facts: `sponsors/clips.md`.)

### Existing projects
FAQ, verbatim: "Yes, existing projects may qualify if meaningful development happens on or after October 27,
2026 and before Monday, November 9, 2026 at 11:59 PM PT. Identify pre-existing work and explain what you
built or significantly modified during the challenge. Eligibility is subject to the Official Rules."

### Other FAQ points (verbatim)
- Technical bar: "Comfort with JavaScript or TypeScript, ideally React. You should be able to work in a web-app codebase, connect APIs, and troubleshoot basic issues. A team should have at least one person who can own implementation."
- What to build: "Choose a problem and build an AI agent with an interface people would enjoy using. Your working project must use the Agent-Native framework. No assigned tracks. No prescribed use cases. Build what you want. Recognition categories celebrate different strengths, not required tracks, and do not carry extra prize money."
- Shape: "No. Choose the interaction that fits the problem. The focus is a useful agent and a thoughtful interface, not a particular layout or number of agents." (answering "Does it have to be a chatbot or a multi-agent app?")
- Judging note: "The focus is what you built, not the production value of your recording or your social following."

## Judging — published criteria WITH exact weights (Rules, verbatim)

> - "**Usefulness and Execution: 40%.** A clear problem and a complete working flow. Does the project deliver
>   a useful outcome, reduce manual effort, and make that outcome usable?
> - **Creativity and Design: 20%.** An imaginative idea or interaction. What makes the experience distinctive
>   and enjoyable to use?
> - **Innovation: 20%.** A thoughtful people-and-agent workflow that improves how something gets done, rather
>   than adding AI without a clear purpose.
> - **Cleverness and Use of Agent-Native: 20%.** Resourceful use of Agent-Native to bring the interface, agent
>   behavior, and application capabilities together."

> "Judges score each criterion from 0 to 10. Each judge's weighted total is the sum of each criterion score
> multiplied by its percentage weight. The mean weighted total across judges determines an entry's score, and
> eligible entries are ranked from highest to lowest."

Tie-break, verbatim as rendered (the sentence starts lowercase on the page, so a leading clause looks
missing; we quote it exactly as shown): "compare the tied entries' mean Usefulness and Execution scores, then
Creativity and Design, then Innovation, then Cleverness and Use of Agent-Native. If still tied, the panel
reassesses the tied entries against the same rubric and records a reasoned ranking. No random drawing is used."

> "Rankings are provisional until eligibility, originality, framework use, demo accessibility, and compliance
> are verified. A noncompliant or unverifiable entry may be disqualified, with the next highest-ranked eligible
> entry considered for the vacated place."

**Event-page short descriptions** of the same rubric, verbatim ("One weighted rubric for all ranked prizes"):
Usefulness and Execution 40%: "Solve a clear problem with a complete, working experience." · Creativity and
Design 20%: "Make the idea or interaction distinctive and thoughtful." · Innovation 20%: "Use the agent to
meaningfully improve the experience." · Cleverness and Use of Agent-Native 20%: "Use Agent-Native resourcefully
to connect the whole experience."

**"What makes a strong entry" (event page, verbatim):**
- "An agent with a purpose: Build around a clear task: analyze data, automate a workflow, or create something users can work with."
- "An interface that puts users in control: Let users explore results, make edits, and guide the agent's next steps."
- "A connected experience: Make the UI and agent work with the same data and actions, so users can move between direct interaction and agent assistance."

Challenge headline: "Build an app where people and agents work together." / "Use the Agent-Native framework to
turn your idea into a working app. Give your agent a real job and your users an interface to view, edit, and
act on its work."

## Prize structure (Rules, verbatim)

> - "Grand Prize: $5,000 USD.
> - 2nd Place: $2,500 USD.
> - 3rd Place: $1,500 USD.
> - 4th Place: $750 USD.
> - 5th Place: $250 USD.
>
> Total: $10,000 USD across five ranked cash prizes. Each winning entry may receive at most one ranked cash
> prize. Prizes are awarded per winning entry, not per individual team member. Recognition categories do not
> add to the cash total."

Event page extras (verbatim): "Builder Spotlight: A Community feature, winners-webinar invitation, official
social mentions, and a shout-out from Steve." · "$10,000 USD across 5 ranked prizes. One cash award per
project or team; winner benefits are additional." FAQ: "Any approved mentorship and credits apply once per
unique winning project, not once per award." (Mentorship and credits are not defined anywhere else: **gap**.)

Tax (Rules): "Non-U.S. winners may be subject to U.S. withholding, potentially at a rate of 30%, unless an
applicable exemption or reduced treaty rate is established." W-9 / W-8BEN may be required.

## Disqualifiers and compliance (Rules, verbatim)

> "Entries must be truthful, lawful, and submitted with the necessary permissions. Plagiarism, fabricated
> demonstrations, fraud, interference with other participants, harassment, exploitation of the submission
> process, or violation of these rules may result in disqualification."

Also disqualifying in effect:
- A Clips recording that is not publicly viewable (it must be "viewable without a login or access request").
- A non-Clips recording ("A recording made with another tool does not replace this requirement").
- Not identifying pre-existing work.
- Failing verification: "A potential winner may be disqualified if verification fails, required documents or team agreement cannot be provided, payment would be unlawful, or the approved response deadline is missed."
- Framework use: "Naming or importing the framework alone is not enough." (Best Use of Agent-Native description; repeated in the FAQ judging answer.) Rankings also verify "framework use".
- Privacy: "Do not upload tax forms, identity documents, or payment credentials to the public demo or general submission form."

## Testnet vs mainnet
N-A: no blockchain component.

## Other rules
- Free, no purchase. Optional events, sharing, and social posts do not affect score.
- IP: "Participants retain ownership of their applications and original code" and grant Builder.io a nonexclusive license to display and promote the submission.
- Governing law: California. Contact: hackathon@builder.io.
