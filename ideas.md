# FocusFlight Timer — Design Direction

## Three stylistic approaches

### Theme Name: Cloud Atlas Editorial
Very brief intro: A calm, print-inspired focus tool with paper textures, cartographic lines, and warm ink typography. It turns each timer session into a small, considered ritual.
Probability: 0.07

### Theme Name: Night Runway
Very brief intro: A dark, cinematic flight-deck interface with electric runway accents and a strong sense of motion. It feels precise, focused, and a little nocturnal.
Probability: 0.03

### Theme Name: Mineral Current
Very brief intro: A sunlit, mineral-toned interface built from pale stone, sea-glass cyan, and sun-warmed orange. It feels grounded and tactile while still giving the timer an airy sense of travel.
Probability: 0.08

## Chosen approach: Cloud Atlas Editorial

### Design Movement
Contemporary editorial cartography: the quiet confidence of a travel journal, the restraint of Swiss information design, and the handmade specificity of a stamped field guide.

### Core Principles
1. **Calm utility** — the timer is the hero; every decorative decision must make the next action easier to see.
2. **Map as atmosphere** — routes, coordinates, and contour lines create a sense of place without becoming a literal map clone.
3. **Tactile precision** — use paper grain, hairline rules, stamped labels, and soft layered shadows to make the interface feel physical.
4. **Editorial asymmetry** — use offset columns, a rail of metadata, and intentional negative space rather than a centered dashboard stack.

### Color Philosophy
The base is warm cloud-paper (`#F5F1E8`) with ink navy (`#12243A`) for trust and legibility. Sea-glass cyan (`#93CBD0`) supplies the open-sky feeling, while one ownable signal color — runway saffron (`#E99A42`) — marks active controls, timer progress, and route selection. The palette should feel sunlit and analog, never fluorescent.

### Layout Paradigm
The page is organized like a folded flight card: a slim header, an oversized route field with a left metadata rail, and a lower editorial spread. On wide screens, the timer occupies a slightly off-center panel while route cards sit in a staggered row; on mobile, the same content becomes a single clear boarding sequence.

### Signature Elements
- A small stamped compass mark used as both logo and favicon.
- Thin contour-line arcs and dotted route paths that appear behind the timer, never underneath important text.
- Monospace airport-style labels paired with serif editorial headings.

### Interaction Philosophy
Actions feel like boarding: choose a route, confirm the destination, then start the countdown. Controls should offer immediate state feedback through color, a small lift, and a clear label change. No interaction is hidden behind decorative motion.

### Animation
Use short 160–220ms ease-out transitions for hover, focus, and buttons. Route cards lift by 2px and brighten on hover. A selected route draws a dotted line toward the timer panel. The timer ring progresses with a calm linear sweep. Page elements enter in a staggered 40ms cadence, but all non-essential motion is disabled under `prefers-reduced-motion`.

### Typography System
Use `DM Serif Display` for large editorial headlines and `Plus Jakarta Sans` for body copy, labels, and controls. Use `IBM Plex Mono` for airport codes, durations, and overline metadata. Headlines are tight and sentence-cased; labels are uppercase with generous tracking; body copy stays between 15–18px with comfortable line height.

### Brand Essence
**FocusFlight is a scenic Pomodoro timer for people who want structure without sterility — it turns deep work into a small journey.**

Personality adjectives: **measured, curious, atmospheric**.

### Brand Voice
Headlines are concise, observant, and quietly motivating. CTAs sound like actions from a field guide rather than software commands. Microcopy is warm, specific, and never hype-heavy.

Example lines:
- “Choose a route. Keep your eyes on the horizon.”
- “Your next landing is 25 minutes away.”

### Wordmark & Logo
The mark is a four-point compass rose nested inside a rounded boarding stamp, paired with a custom wordmark treatment that sets “Focus” in serif and “Flight” in mono. The implementation uses the symbol as a bold standalone graphic so the brand remains recognizable at small sizes without relying on generated typography.

### Signature Brand Color
Runway saffron — `#E99A42` — the warm amber used only for the active journey state, timer progress, and primary boarding action.
