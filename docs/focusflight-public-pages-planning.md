# FocusFlight Public Information Pages — Planning Addendum

> **Planning-only document.** This addendum recommends copy, information architecture, and product decisions for future public pages. It does not change the FocusFlight application.

> **Legal note:** I’m an AI, not a lawyer. The Privacy Policy and Terms recommendations below are a working product draft, not formal legal advice. A qualified lawyer should review the final pages against the countries in which the service is offered, the hosting and analytics vendors actually used, payment features, and the final account-deletion process before launch.

## 1. Product-story direction

The public pages should make FocusFlight feel like an **honest, thoughtful independent project**, not an over-polished productivity company. The voice should be warm, specific, and modest: a developer learning by building a tool that turns a focus session into a small virtual journey.

Use **FocusFlight** consistently in public copy. Do not mix it with “PomoFlight,” which appeared only in the rough examples. Avoid claims such as “the best Pomodoro app,” “science-backed,” “secure by industry-leading audits,” or “premium” until those claims can be supported.

| Page | Primary job | Search / visibility goal |
|---|---|---|
| About | Explain the idea, feature set, creator, roadmap, and feedback path | Indexable; supports branded and focus-timer discovery |
| Privacy Policy | Clearly explain actual data handling and user controls | Publicly linked from every page; accuracy matters more than SEO |
| Terms of Service | Define acceptable use, service limitations, account expectations, and changes | Publicly linked from every page; review before launch |
| Feedback | Give visitors a simple way to report issues or ideas | Noindex; reduce spam and protect user privacy |
| Changelog / Version History | Show visible, dated product evolution | Indexable only when maintained consistently |

## 2. Proposed navigation and page map

The primary navigation can stay intentionally light. The public-information pages belong in the footer and in the existing **About** destination.

```text
Main navigation
├── Home
├── My Journey (signed-in users)
├── Co-Focus (when built)
└── About

Footer
├── About FocusFlight
├── Changelog
├── Feedback
├── Privacy Policy
└── Terms of Service
```

Recommended future routes are `/about`, `/changelog`, `/feedback`, `/privacy`, and `/terms`. The feedback page should be excluded from search indexing. The About page should become the content-led, indexable public explanation of what FocusFlight is; Privacy and Terms should be easy to find but should not be treated as keyword-landing pages.

## 3. About page

### 3.1 Information architecture

The About page should feel like a concise field guide or pilot logbook. It should be readable in under three minutes, with deeper sections available without overwhelming a visitor.

| Section | Purpose | Recommended content |
|---|---|---|
| Hero | Explain the product immediately | A clear one-sentence description and a quiet map or route detail |
| The idea | Explain why virtual travel belongs in a focus timer | Brief founder-story copy; no exaggerated claims |
| How it works | Remove uncertainty about the core flow | Four simple steps from choosing airports to completing a session |
| What you can do today | Describe real, shipped features only | Map, airport search, route, timer, progress, trip history, account |
| Built with | Share technical transparency in plain language | Leaflet/OSM, geographic routes, Supabase, responsive web app |
| Development log | Show the project is actively evolving | Short, factual changelog cards linked to `/changelog` |
| Goal and feedback | Invite useful ideas and set expectations | Founder note, feedback button, privacy-aware feedback explanation |

### 3.2 Suggested hero copy

> ## Focus a little farther.
>
> **FocusFlight is a virtual flight timer for study, work, and deliberate time.** Choose an origin and destination, begin a focus session, and watch a real route move forward as your timer counts down.
>
> It is not a real booking tool and it does not track your physical location. It is a small way to make a focused block of time feel like a journey with a beginning, middle, and arrival.

The supporting call to action should be **“Start a focus flight”**. A secondary link can be **“See how it works.”**

### 3.3 Suggested founder / project note

The page should include a human note that does not pretend FocusFlight is a large company. The name can be substituted once the owner decides how they want to appear publicly.

> ### Built while learning
>
> Hi, I’m **[your name]**. FocusFlight is a project I am building while I learn to design, code, and improve things on the web.
>
> I wanted a timer that felt less like a countdown sitting in the corner of a screen. The first version became a map, then a route, then a small personal travel log for completed focus sessions. I am still learning, still refining it, and keeping the project intentionally simple.
>
> If something is confusing, broken, or worth trying, I would genuinely like to hear about it.

This note can use the owner’s real name, a first name, or a public handle. It should not promise response times, feature delivery, or a commercial roadmap.

### 3.4 “How FocusFlight works” section

The section should use four small illustrated steps rather than dense product copy.

| Step | Heading | Plain-language copy |
|---|---|---|
| 1 | Choose your route | Search for a starting airport and a destination. FocusFlight uses the selected locations to place your route on a real map. |
| 2 | Begin your flight | Start the focus timer. The flight path and aircraft progress are tied to the same timer. |
| 3 | Keep your focus | Pause when life interrupts, then resume the same session later. Your route remains visible while you work. |
| 4 | Arrive and remember | Finish the flight to save a completed trip to your personal journey history. |

The copy should explicitly say that unfinished solo flights do **not** update the virtual solo current location. This communicates the existing product rule without making it sound punitive.

### 3.5 “What you can do today” feature list

Only describe capabilities that are currently shipped and functioning.

| Feature | Suggested public description |
|---|---|
| Real flight map | Explore airport-to-airport routes on an interactive OpenStreetMap-based map. |
| Airport and city search | Select origins and destinations using airport codes, airport names, or city search. |
| Focus-linked route progress | Your virtual aircraft follows the route as the focus timer progresses. |
| Realistic duration framing | Known routes can use cached direct-flight duration references; other routes are clearly marked as estimates. |
| Personal journey | Signed-in users can keep a private record of completed trips, visited places, and travel patterns. |
| Pause and resume | Interruptions do not force a session restart; resume the same focus flight when ready. |
| Responsive web access | Use the app in a modern browser on desktop or mobile. |

Do **not** list Co-Focus rooms, social profiles, leaderboards, Google login, paid plans, or public profiles as live features until they are built.

### 3.6 Technical features, written for people

The technical section should be short and transparent. It is meant to build trust and give technically curious visitors context, not become developer documentation.

> ### Made with maps, routes, and a little focus
>
> FocusFlight uses an interactive map rather than a decorative background. Airports are placed with real coordinates, routes follow geographic flight paths, and the timer controls the visible journey. Accounts and personal trip history are handled through an authenticated database service, while the app is delivered as a fast web experience.

| Technical element | Visitor-friendly explanation |
|---|---|
| Leaflet + OpenStreetMap | The map can be moved, zoomed, and explored like a real map. |
| Geographic route calculations | The aircraft follows the same geographic route shown on screen, including long-distance paths. |
| Supabase authentication and data | Accounts and completed trip records are associated with the signed-in user. |
| Vercel deployment | The site is delivered from a production web deployment connected to the project repository. |

### 3.7 Version history / changelog

Do not invent version numbers, dates, or releases. The changelog must be populated only from real project milestones. It can begin as a modest development log and later graduate to semantic versioning if releases become regular.

Suggested initial structure:

| Entry format | Example content style |
|---|---|
| `In development` | “Improving active-route visibility and documenting the product direction.” |
| `Initial public beta` | “Introduced the interactive flight timer, airport selection, virtual journey history, and account support.” |
| Future planned section | “Co-Focus rooms, optional social profiles, and ranking features are being explored. These are not available yet.” |

The changelog should distinguish **Shipped**, **In progress**, and **Exploring**. A link to the GitHub repository can be included if the owner is comfortable making the repository public; otherwise, do not imply that source code is publicly available.

### 3.8 Feedback box

The feedback callout should welcome useful reports without promising support coverage.

> ### Help shape the next flight
>
> FocusFlight is still growing. If you found a bug, had trouble with a route, or have an idea that would make focusing easier, send a note. Short and specific feedback is especially helpful.

Recommended fields are category, message, optional contact email, and optional page/route context. Categories can be **Bug report**, **Feature idea**, **Map or route issue**, **Account issue**, and **Something else**. The form should say:

> Please avoid sending passwords, payment details, or sensitive personal information. Feedback may be reviewed to improve FocusFlight, but a reply is not guaranteed.

The initial implementation should include abuse protection and a rate limit. Until the form exists, use a contact email or a simple “Feedback coming soon” state rather than a non-functioning button.

## 4. Privacy Policy — content plan

The final policy must match the actual product, vendors, and legal jurisdiction at launch. The rough draft should be rewritten in plain English and should avoid promises that cannot be verified.

### 4.1 Important corrections to the rough example

| Rough claim | Recommended treatment |
|---|---|
| “We collect your password” | Replace with: **“Authentication is provided by Supabase. FocusFlight does not receive or store your raw password.”** |
| “We collect device information” | Include only if this is actually collected through analytics, hosting logs, or error monitoring; identify the purpose and provider. |
| “We conduct regular security audits” | Do not claim this unless there is a real, documented audit practice. |
| “We will delete data within a reasonable time” | Define the deletion workflow and realistic time frame only after it is implemented. |
| “We provide paid services” | Omit until a payment system and applicable refund terms actually exist. |

### 4.2 Recommended privacy-policy structure

The initial policy should be dated and include a version/effective date. It should use **FocusFlight**, not PomoFlight.

| Section | What the final policy should cover |
|---|---|
| Introduction and scope | What FocusFlight is, who operates it, the effective date, and how to contact the operator. |
| Information processed | Account email, profile details supplied by the user, virtual trip data, focus-session records, feedback submissions, and necessary technical/server logs actually used. |
| Why information is used | Operating accounts, saving trip history, providing the map/timer, responding to feedback, maintaining security, and improving the app. |
| Service providers | Supabase for authentication/data, Vercel for hosting, and map/geocoding providers that may receive request/IP data when the map or search is used. List the actual providers and link to their policies where appropriate. |
| Sharing and public visibility | Explain that data is not sold; disclose legal/security exceptions; explain profile, leaderboard, and room-visibility controls if/when social features launch. |
| Retention and deletion | State what is retained while an account exists, the deletion-request route, backups/operational exceptions, and any defined period. |
| User controls | Access/update profile, privacy settings, delete or request deletion, withdraw marketing consent if marketing is added. |
| Security | Use restrained language: reasonable technical and organizational measures; no claim of perfect security. |
| Children and region-specific rights | Add only after jurisdiction and target audience are decided; get legal review for age gates and regional privacy rights. |
| Policy changes | Explain effective dates and notice of material changes. |
| Contact | A working support or privacy contact method. |

### 4.3 Proposed plain-language opening

> ## Privacy Policy
>
> **Effective date: [date]**
>
> FocusFlight is a virtual focus-timer project. This policy explains what information is used when you create an account, complete a focus flight, use the map, or contact the project.
>
> FocusFlight is designed around virtual journeys. Your selected airports and current location in the app are not your physical location unless you choose to enter or share information that identifies you. We do not sell personal information.

### 4.4 Current product data inventory to verify before publishing

The final policy should be confirmed against the deployed configuration, not assumed from the current source code alone.

| Data category | Likely purpose in current product | Disclosure to confirm |
|---|---|---|
| Email address and authentication session | Sign-in, account recovery, account management | Supabase role and authentication handling |
| Profile fields | Display and personalisation | Which fields are optional and who can see them |
| Selected airports, virtual routes, duration, completion status | Personal journey history and progress | That these are virtual/focus data, not real travel records |
| Map/search requests | Render maps and resolve place/airport searches | OpenStreetMap tile and geocoding-provider processing |
| Feedback text and optional email | Read/respond to suggestions and bugs | Retention and who can access submissions |
| Hosting/security logs | Reliability and abuse prevention | Exact provider, retention, and whether analytics/error tracking is enabled |

Future social features require a policy update before launch. It must explain public profile settings, leaderboard participation, friend-only information, group room membership, blocks, and account-visibility controls.

## 5. Terms of Service — content plan

Terms should describe the product honestly, avoid unimplemented commerce clauses, and remain readable. They should be reviewed before launch because enforceability and required clauses depend on jurisdiction.

### 5.1 What to retain from the rough example

The service description, user responsibilities, availability caveat, intellectual-property statement, change notice, and dispute-resolution concept are useful starting points. The paid-service section should **not** appear until paid plans exist. The account-termination conditions should be tailored to real moderation and deletion practices rather than copied as a generic list.

### 5.2 Recommended terms structure

| Section | Proposed content |
|---|---|
| Acceptance and service description | Explain that FocusFlight is a virtual focus and time-management web application. |
| Accounts | Accurate registration information, account security, responsible use, and account-recovery approach. |
| Virtual flights and data | State that routes, current locations, and travel histories are virtual representations of focus sessions—not real travel, navigation, or aviation information. |
| Acceptable use | No abuse, interference, fraud, unauthorized automation, harassment, or attempts to access other users’ data. |
| User feedback | The user may submit feedback; the operator may use ideas without compensation, while personal data remains subject to the Privacy Policy. |
| Availability and changes | The project may change, pause, or end features; no guarantee of uninterrupted access. |
| Intellectual property | FocusFlight content, design, brand, and code are protected as applicable; users retain rights in material they supply where relevant. |
| Disclaimers and liability | Appropriate, jurisdiction-reviewed limitations; do not state that all liability is excluded everywhere. |
| Suspension and termination | Grounds tied to misuse, security, legal requirements, or operation of the service; explain available appeal/contact path if one exists. |
| Governing law and disputes | Add only once operator location and legal advice are established. |
| Changes and contact | Effective date, notification approach, and a working contact method. |

### 5.3 Proposed plain-language service description

> ## Terms of Service
>
> **Effective date: [date]**
>
> FocusFlight is a virtual focus-timer web application. It lets users select virtual airport routes, run focus sessions, and keep a record of completed focus flights. The maps, airports, durations, and current locations shown in FocusFlight are part of a virtual productivity experience. They are not flight booking, navigation, aviation, or real-world travel services.

### 5.4 Future clauses that must wait for real features

Do not publish clauses about any of the following until the associated capability exists and has been reviewed:

| Future feature | Required terms / policy work |
|---|---|
| Paid plans or subscriptions | Price, billing, taxes, renewal, cancellation, refund rights, payment processor, and consumer-law review |
| Google sign-in | Identity-provider disclosure and updated account/recovery wording |
| Public profiles and leaderboards | Visibility controls, acceptable conduct, reporting/moderation, and privacy disclosure |
| Friends and rooms | Invitation/room rules, blocking, harassment rules, room member visibility, and account actions |
| Co-Focus group flights | Participation rules, session abandonment, focus-time attribution, and group-history disclosure |

## 6. Feedback, support, and launch safeguards

Before a feedback form or legal pages are published, define the following operational details. These decisions are more important than polished copy because the public pages must describe what actually happens.

| Decision | Minimum answer needed before launch |
|---|---|
| Public operator identity | Real name, studio name, or public handle; a working contact address or form |
| Jurisdiction / target countries | Where the operator is based and which users are actively targeted |
| Account deletion | How users request deletion, what is deleted, and realistic timing |
| Email confirmation and recovery | The actual emails sent, sender identity, and return URL behavior |
| Analytics and logs | Which analytics, error reporting, cookies, and hosting logs are enabled |
| Map and search providers | The exact production providers and their privacy disclosures |
| Feedback handling | Who can view submissions, retention, rate limits, and abuse response |
| Paid features | Confirm none exist before launch; if added later, write a separate commercial update |

## 7. SEO and accessibility guidance for these pages

The About page can support discovery, but it should not use repetitive keywords. A clear title and naturally useful copy is stronger than trying to repeat “Pomodoro timer” across every section.

| Page | Proposed title | Proposed description |
|---|---|---|
| About | `About FocusFlight — A Virtual Focus Timer` | `Learn how FocusFlight turns focused study and work sessions into virtual flights on an interactive map.` |
| Changelog | `FocusFlight Changelog` | `See completed updates and current development notes for FocusFlight.` |
| Privacy | `FocusFlight Privacy Policy` | `Learn how FocusFlight handles account, focus-session, and virtual journey information.` |
| Terms | `FocusFlight Terms of Service` | `Read the terms for using the FocusFlight virtual focus-timer application.` |
| Feedback | `Feedback — FocusFlight` | Noindex; do not treat it as a search landing page. |

Every page should use one descriptive `h1`, meaningful heading structure, readable contrast, keyboard-accessible links and form fields, mobile-friendly line lengths, and a visible footer. The About page’s map imagery must be supplementary; the product explanation must be complete in text for visitors who do not load or cannot use the map.

## 8. Implementation sequence when work is authorized

This is the recommended build order once implementation is explicitly approved.

1. Confirm the public operator identity, support contact method, target countries, current vendor list, and account-deletion behavior.
2. Build the About page and footer links first, using only current, verified features.
3. Add the changelog with factual entries and a clear future-features distinction.
4. Build the feedback form with rate limiting, acknowledgement states, and appropriate data storage/access controls.
5. Draft Privacy and Terms pages from the confirmed operational facts; obtain legal review before relying on them publicly.
6. Add page metadata, sitemap coverage, and accessibility review.
7. Update policy/terms before enabling payments, social visibility, group rooms, Google sign-in, or any new external provider.

## 9. Acceptance checklist

| Area | Completion criteria |
|---|---|
| About | Explains the product in plain language, shows only shipped features, includes a modest founder note, and gives a working feedback route. |
| Changelog | Contains only dated, factual releases or development notes; future work is labeled clearly. |
| Privacy | Matches actual data flows, provider use, retention/deletion process, and privacy controls; has been legally reviewed as appropriate. |
| Terms | Matches actual product capabilities; does not claim paid services or moderation practices that do not exist; has been legally reviewed as appropriate. |
| Feedback | Does not collect unnecessary sensitive data, is protected from basic abuse, and states that a reply is not guaranteed. |
| SEO / accessibility | Metadata, heading hierarchy, footer navigation, responsive layouts, and keyboard access are validated. |

## 10. Decisions still needed from the owner

Before implementation, the owner should decide the following:

- The public name or handle to use in the founder note and a working public contact method.
- Whether the GitHub repository will remain private or be linked from the About page.
- Whether the product will be promoted to users in particular countries and the governing legal jurisdiction.
- The exact process and time frame for account/data deletion requests.
- Whether feedback should be stored in-app, sent by email, or handled through an external form provider.
- Whether the changelog is maintained manually from real releases or generated from repository releases.
- When social features launch, the final default visibility choices for public profiles, current virtual location, and leaderboard participation.
