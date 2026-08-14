export const WAYPOINT_ORIGIN = "https://project-waypoint-app.vercel.app";

export type FaqItem = {
  question: string;
  answer: string;
};

export type Guide = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faqs: FaqItem[];
};

export const focusGuides: Guide[] = [
  {
    slug: "pomodoro-timer",
    eyebrow: "Focus guide",
    title: "How to use a Pomodoro timer without turning breaks into another task",
    description: "A practical, original guide to using a Pomodoro timer for deep work, gentle breaks, and a sustainable study rhythm.",
    intro: "A Pomodoro timer is not a test of how long you can ignore your needs. It is a small agreement with yourself: focus on one meaningful task, then make room to reset.",
    sections: [
      {
        heading: "Start with a task small enough to name",
        paragraphs: [
          "Before starting a session, describe the next unit of work in plain language: outline one section, solve five problems, review one lecture, or draft the first paragraph. A timer is most useful when it protects a clear target rather than a vague intention to be productive.",
          "If the task is larger than one sitting, decide what would count as a useful landing point before the timer begins. That makes it easier to resume after a break without rebuilding context from scratch.",
        ],
      },
      {
        heading: "Choose a rhythm you can repeat",
        paragraphs: [
          "The familiar 25-minute focus and 5-minute break pattern is a starting point, not a rule. Some people need a shorter runway for difficult starts; others work well with longer intervals when they are already settled. Use a duration that lets you stay present without making the session feel like a dare.",
          "During a break, change your state instead of opening a new source of input. Stand up, look into the distance, drink water, or write down the first next step. The purpose is to return with less friction.",
        ],
      },
      {
        heading: "Let completion create a visible ending",
        paragraphs: [
          "Close a session by recording one sentence about where you stopped and what comes next. This reduces the cost of returning later and gives the finished interval a clear boundary.",
          "Waypoint uses a flight as a gentle visual metaphor for that boundary: you choose a route, protect the time, and arrive when the session is complete. The map is a companion to your work, not a measure of your worth.",
        ],
      },
    ],
    faqs: [
      { question: "Do Pomodoro sessions have to be 25 minutes?", answer: "No. Twenty-five minutes is a common starting point, but the useful length is the one you can repeat with attention and honest breaks." },
      { question: "What should I do if I am interrupted?", answer: "Pause, note the next step, and return when you can. Treat the interruption as information about your environment rather than as a failed session." },
    ],
  },
  {
    slug: "focus-session-planning",
    eyebrow: "Focus guide",
    title: "A simple way to plan a focus session before you press start",
    description: "Plan a calmer, clearer study or work session with a practical focus-session checklist from Waypoint.",
    intro: "A good focus session begins before the timer. Two minutes of planning can prevent twenty minutes of avoiding the work in front of you.",
    sections: [
      {
        heading: "Pick one outcome, not a stack of intentions",
        paragraphs: [
          "Choose the one result that would make this session worthwhile. It can be modest: understand a single concept, turn notes into a short outline, or send a draft that is ready for feedback. A narrow outcome makes it easier to tell whether the session is moving.",
          "Put every other task somewhere safe. A small capture list lets you acknowledge incoming thoughts without asking your attention to carry them.",
        ],
      },
      {
        heading: "Prepare the first minute",
        paragraphs: [
          "Open the document, book, problem set, or tab you need before the countdown starts. Remove the decisions that normally appear at the beginning of a session: where to begin, what file to use, and what to look up first.",
          "If a route helps you make the commitment tangible, select an origin and destination in Waypoint. The journey does not replace the work plan; it gives the time a quieter visual frame.",
        ],
      },
      {
        heading: "Design your return path",
        paragraphs: [
          "At the end, write a single restart cue such as ‘compare sources for section two’ or ‘solve question six next.’ That cue becomes the bridge between this session and the next one.",
          "Over time, review what makes sessions easier to start: time of day, task size, duration, environment, and break style. The best system is one that teaches you how you actually work.",
        ],
      },
    ],
    faqs: [
      { question: "How much planning should happen before a focus session?", answer: "Usually two to five minutes is enough: define the outcome, open what you need, and choose the very first action." },
      { question: "Should I plan every break?", answer: "Only lightly. Decide on a restorative default, then keep the break simple enough that returning is easy." },
    ],
  },
  {
    slug: "flight-metaphor-for-focus",
    eyebrow: "How Waypoint works",
    title: "Why Waypoint turns a focus session into a small journey",
    description: "Learn how Waypoint uses original flight and map metaphors to make a Pomodoro focus session feel clear, calm, and complete.",
    intro: "Waypoint is an original Pomodoro timer built around a simple idea: a session can feel more intentional when time has a beginning, a route, and an arrival.",
    sections: [
      {
        heading: "Choose a route, then protect the time",
        paragraphs: [
          "You pick a starting location and destination from a real interactive map. Waypoint calculates a geographic route and a duration so the flight has a concrete visual shape while you work.",
          "The purpose is not to simulate real travel or optimize distance. It is to turn an abstract block of attention into a quiet commitment with an end in sight.",
        ],
      },
      {
        heading: "Progress follows the session",
        paragraphs: [
          "The aircraft moves only as the focus timer advances. Pausing the session pauses the journey; completing the timer reaches the destination. The same route geometry controls the map path and the aircraft position.",
          "That relationship makes the map legible without demanding attention. You can glance at it when you need a sense of progress and return to the work when you do not.",
        ],
      },
      {
        heading: "Journeys stay personal by default",
        paragraphs: [
          "Completed solo flights can build a private journey history. Co-Focus rooms and group flights use a separate record, so shared sessions never silently move a person’s solo location.",
          "Privacy settings, opt-in rankings, and friend-gated profile depth are designed to keep the metaphor supportive rather than performative.",
        ],
      },
    ],
    faqs: [
      { question: "Is Waypoint a real flight tracker?", answer: "No. Waypoint is a focus timer with an original map-based journey metaphor. Routes visualize your session; they are not live aviation data." },
      { question: "Does a group flight change my personal journey?", answer: "No. Group history and solo history are separate. A completed group flight can only update a solo location through an explicit, eligible manual sync action." },
    ],
  },
];

export function guideForSlug(slug: string | undefined) {
  return focusGuides.find((guide) => guide.slug === slug);
}

type SeoDefinition = {
  title: string;
  description: string;
  indexable: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const appStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Waypoint",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  description: "An original Pomodoro timer that turns a focus session into a calm virtual journey.",
  url: WAYPOINT_ORIGIN,
};

function faqStructuredData(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

const staticPages: Record<string, SeoDefinition> = {
  "/": {
    title: "Waypoint — a calmer Pomodoro timer",
    description: "Waypoint turns a simple Pomodoro into a short, atmospheric journey for deep work.",
    indexable: true,
    structuredData: appStructuredData,
  },
  "/about": {
    title: "About Waypoint — A Virtual Focus Timer",
    description: "Learn how Waypoint turns focused study and work sessions into virtual flights on an interactive map.",
    indexable: true,
  },
  "/changelog": {
    title: "Waypoint Changelog",
    description: "See completed updates and current development notes for Waypoint.",
    indexable: true,
  },
  "/leaderboards": {
    title: "Waypoint Rankings — solo and co-focus time",
    description: "Explore opt-in Waypoint rankings for completed solo and co-focus time.",
    indexable: true,
  },
  "/privacy": {
    title: "Waypoint Privacy Policy",
    description: "Learn how Waypoint handles account, focus-session, and virtual journey information.",
    indexable: true,
  },
  "/terms": {
    title: "Waypoint Terms of Service",
    description: "Read the terms for using the Waypoint virtual focus-timer application.",
    indexable: true,
  },
  "/feedback": {
    title: "Feedback — Waypoint",
    description: "Share private, authenticated feedback to help improve Waypoint.",
    indexable: false,
  },
};

export function seoForPath(pathname: string): SeoDefinition {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const guideMatch = normalizedPath.match(/^\/guides\/([^/]+)$/);
  if (guideMatch) {
    const guide = guideForSlug(guideMatch[1]);
    if (guide) {
      return {
        title: `${guide.title} | Waypoint`,
        description: guide.description,
        indexable: true,
        structuredData: [appStructuredData, faqStructuredData(guide.faqs)],
      };
    }
  }

  if (normalizedPath === "/journey" || normalizedPath === "/cofocus" || normalizedPath.startsWith("/u/")) {
    return {
      title: "Waypoint — private journey",
      description: "A private Waypoint account area.",
      indexable: false,
    };
  }

  return staticPages[normalizedPath] ?? {
    title: "Waypoint — a calmer Pomodoro timer",
    description: "Waypoint turns a simple Pomodoro into a short, atmospheric journey for deep work.",
    indexable: false,
  };
}

export function canonicalForPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return `${WAYPOINT_ORIGIN}${normalizedPath}`;
}
