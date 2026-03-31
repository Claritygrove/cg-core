import { useState } from "react";
import { BookOpen, Book, Headphones, Play, Youtube, Puzzle, ExternalLink, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Core Values ──────────────────────────────────────────────────────────────

interface CoreValue {
  letter: string;
  name: string;
  description: string;
  askYourself: string[];
}

const CORE_VALUES: CoreValue[] = [
  {
    letter: "D",
    name: "Devoted",
    description: "Loyalty to my team and leadership fuels a passion for what I do and motivates me to improve.",
    askYourself: [
      "How much do I really care about the specific successes and failures of my team?",
      "How aware am I of how my individual contributions affect my team?",
      "How often do I go \"above and beyond\" to help my team succeed?",
    ],
  },
  {
    letter: "E",
    name: "Enthusiastic",
    description: "I pursue positivity, even when outside circumstances make it difficult.",
    askYourself: [
      "How hard is it to set my personal struggles aside when I clock in?",
      "Do my teammates describe me as consistently upbeat, bright, and positive?",
      "When the day gets hard, how do I maintain a positive attitude?",
    ],
  },
  {
    letter: "D",
    name: "Dependable",
    description: "My team can count on me to be flexible, hardworking, and punctual as I relentlessly follow through on my commitments.",
    askYourself: [
      "What have I done specifically in the last 2 weeks to demonstrate dependability to my teammates?",
      "How do my teammates feel when they see that they are scheduled to work with me?",
      "How often am I calling off a shift or showing up late for work?",
    ],
  },
  {
    letter: "I",
    name: "Integrity Focused",
    description: "I strive to do the right thing, especially when nobody's watching.",
    askYourself: [
      "What drives me to become more honest and selfless?",
      "Does my work ethic change based on who is (or is not) working with me?",
      "Do I talk about my teammates differently when they're not around?",
    ],
  },
  {
    letter: "C",
    name: "Constructive",
    description: "I work actively to create a \"no drama\" culture by encouraging face-to-face, constructive conversations to resolve conflict or coach my teammates.",
    askYourself: [
      "How do I talk to my least favorite teammate? How do I talk about them when they are not present?",
      "Am I truly fighting for a \"no-drama\" culture or just trying to avoid the drama?",
      "When giving feedback to a teammate, is helping them become a better person my main goal?",
    ],
  },
  {
    letter: "A",
    name: "Authentic",
    description: "I am transparent about my weaknesses and open about steps I'm taking to improve.",
    askYourself: [
      "Am I asking for accountability in my growth areas?",
      "Am I self-aware and confident enough to admit when I've made a mistake and share what I'm currently doing to improve myself, both personally and professionally?",
    ],
  },
  {
    letter: "T",
    name: "Teachable",
    description: "My humble posture invites feedback and demonstrates an openness to new ideas.",
    askYourself: [
      "Am I thankful for feedback or do I make excuses?",
      "How can I be more open to feedback given to me by teammates with less status or tenure?",
      "How do I respond to feedback that is harshly worded?",
    ],
  },
  {
    letter: "E",
    name: "Efficient",
    description: "I am always looking for ways to achieve better results at faster speeds.",
    askYourself: [
      "What could I do to improve my personal productivity?",
      "Am I faster at each of my daily/weekly tasks than I was 3 months ago?",
      "Would fellow teammates describe me as \"the most effective person I work with?\"",
    ],
  },
];

function CoreValueCard({ value }: { value: CoreValue }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="hover:border-primary/30 transition-colors duration-200">
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-lg font-display font-bold text-primary leading-none">{value.letter}</span>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-bold leading-snug">{value.name}</CardTitle>
            <p className="text-[12px] text-foreground/70 leading-relaxed mt-1">{value.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Ask Yourself
        </button>
        {open && (
          <ul className="mt-3 space-y-2 pl-1">
            {value.askYourself.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12px] text-foreground/70 leading-relaxed">
                <span className="text-primary/60 font-bold mt-0.5 shrink-0 text-[10px]">Q</span>
                {q}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resource {
  title: string;
  description: string;
  link?: string;
  linkLabel?: string;
  meta?: string; // author, host, speaker, etc.
}

// ─── Resource data ────────────────────────────────────────────────────────────

const LEADERSHIP_RESOURCES: Resource[] = [
  {
    title: "The 5 Levels of Leadership",
    meta: "John Maxwell",
    description:
      "Maxwell's framework breaks leadership into five stages — Position, Permission, Production, People Development, and Pinnacle. A useful lens for understanding where you are and what growth looks like.",
    link: "#",
    linkLabel: "Explore framework",
  },
  {
    title: "Extreme Ownership",
    meta: "Jocko Willink & Leif Babin",
    description:
      "Born from Navy SEAL leadership, this framework centers on one principle: leaders own everything in their world. No excuses, no blame — just clear accountability and decisive action.",
    link: "#",
    linkLabel: "Learn more",
  },
  {
    title: "The Coaching Habit Framework",
    meta: "Michael Bungay Stanier",
    description:
      "Seven essential questions that shift you from telling people what to do to helping them think for themselves. Particularly useful for store managers developing their teams.",
    link: "#",
    linkLabel: "See the questions",
  },
  {
    title: "Dare to Lead",
    meta: "Brené Brown",
    description:
      "Courage, vulnerability, trust, and values aren't soft skills — they're the foundation of effective leadership. Brown's research-backed principles apply directly to how we show up for our teams.",
    link: "#",
    linkLabel: "Read overview",
  },
];

const BOOKS: Resource[] = [
  {
    title: "Start with Why",
    meta: "Simon Sinek",
    description:
      "Why do some leaders inspire while others just manage? Sinek argues that great leaders and organizations lead with purpose first. Essential reading for anyone building a team culture.",
  },
  {
    title: "Leaders Eat Last",
    meta: "Simon Sinek",
    description:
      "Explores how the best leaders create environments of trust and safety where people naturally give their best. Grounded in biology and real-world leadership stories.",
  },
  {
    title: "The Ideal Team Player",
    meta: "Patrick Lencioni",
    description:
      "Lencioni identifies three core virtues of great team players — humble, hungry, and smart. Directly applicable to hiring, developing, and coaching retail store teams.",
  },
  {
    title: "Multipliers",
    meta: "Liz Wiseman",
    description:
      "Some leaders drain intelligence from their teams; others amplify it. Wiseman's research helps you identify which kind of leader you are — and how to become a multiplier.",
  },
];

const PODCASTS: Resource[] = [
  {
    title: "EntreLeadership",
    meta: "Ramsey Solutions",
    description:
      "Practical business and leadership wisdom for operators and owners. Episodes cover hiring, culture, communication, and execution — relevant to running multi-unit retail.",
    link: "#",
    linkLabel: "Listen",
  },
  {
    title: "The Craig Groeschel Leadership Podcast",
    meta: "Craig Groeschel",
    description:
      "Short, punchy leadership episodes focused on real situations: giving hard feedback, building trust, managing change. One of the highest-rated leadership podcasts available.",
    link: "#",
    linkLabel: "Listen",
  },
  {
    title: "How I Built This",
    meta: "Guy Raz · NPR",
    description:
      "Founders of major companies tell the unfiltered story of how they built what they built — including the failures. Great for building perspective and entrepreneurial thinking.",
    link: "#",
    linkLabel: "Listen",
  },
];

const TED_TALKS: Resource[] = [
  {
    title: "How Great Leaders Inspire Action",
    meta: "Simon Sinek",
    description:
      "The \"Start with Why\" talk that launched a movement. Sinek explains why purpose-driven leadership consistently outperforms title-driven leadership. One of the most-watched TED talks ever.",
    link: "#",
    linkLabel: "Watch",
  },
  {
    title: "The Power of Vulnerability",
    meta: "Brené Brown",
    description:
      "Counter-intuitive but proven: the leaders people trust most are those willing to be real. Brown's research on vulnerability, courage, and connection is directly applicable to team leadership.",
    link: "#",
    linkLabel: "Watch",
  },
  {
    title: "Every Kid Needs a Champion",
    meta: "Rita Pierson",
    description:
      "A retired teacher's passionate case for why relationships are the foundation of results. Replace \"student\" with \"employee\" and this talk becomes one of the best leadership talks ever recorded.",
    link: "#",
    linkLabel: "Watch",
  },
];

const YOUTUBE_VIDEOS: Resource[] = [
  {
    title: "The 4 Types of Workplace Conversations",
    meta: "Leadercast",
    description:
      "Breaks down the four conversations every leader needs to master — coaching, feedback, delegation, and accountability. Practical and immediately applicable to daily management.",
    link: "#",
    linkLabel: "Watch",
  },
  {
    title: "How to Give Feedback That Actually Works",
    meta: "TEDx",
    description:
      "Most feedback fails because of how it's delivered, not what's said. This talk reframes feedback as a gift and offers a clear structure for making it land.",
    link: "#",
    linkLabel: "Watch",
  },
  {
    title: "Leading Through Change",
    meta: "Simon Sinek",
    description:
      "A candid, unscripted conversation about how leaders maintain trust and direction when things are uncertain. Applicable to seasonal shifts, staff transitions, and store resets.",
    link: "#",
    linkLabel: "Watch",
  },
];

interface GeniusType {
  name: string;
  emoji: string;
  description: string;
  color: string;
}

const GENIUS_TYPES: GeniusType[] = [
  {
    name: "Wonder",
    emoji: "🔭",
    color: "bg-violet-500/10 border-violet-500/20 text-violet-300",
    description: "The genius of pondering and asking questions. People with this gift naturally wonder why things are the way they are and identify opportunities others miss.",
  },
  {
    name: "Invention",
    emoji: "💡",
    color: "bg-amber-500/10 border-amber-500/20 text-amber-300",
    description: "The genius of creating original solutions. These people love starting from scratch and generating new ideas — even when others don't yet see the path.",
  },
  {
    name: "Discernment",
    emoji: "🎯",
    color: "bg-rose-500/10 border-rose-500/20 text-rose-300",
    description: "The genius of evaluation and instinct. These people have a natural ability to assess ideas, spot problems, and know intuitively what will work.",
  },
  {
    name: "Galvanizing",
    emoji: "⚡",
    color: "bg-orange-500/10 border-orange-500/20 text-orange-300",
    description: "The genius of rallying people to action. These people naturally inspire, motivate, and create momentum — they don't just communicate, they move people.",
  },
  {
    name: "Enablement",
    emoji: "🤝",
    color: "bg-teal-500/10 border-teal-500/20 text-teal-300",
    description: "The genius of supporting and assisting. These people respond to the needs of others and provide the help that allows ideas and projects to move forward.",
  },
  {
    name: "Tenacity",
    emoji: "🏁",
    color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    description: "The genius of following through. These people push through obstacles and get things done — they don't stop until the work is complete and the result is real.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-display font-bold tracking-tight">{title}</h2>
        {description && <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card className="hover:border-primary/30 transition-colors duration-200 flex flex-col">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-sm font-semibold leading-snug">{resource.title}</CardTitle>
        {resource.meta && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{resource.meta}</p>
        )}
      </CardHeader>
      <CardContent className="px-5 pb-5 flex flex-col flex-1 gap-3">
        <p className="text-[13px] text-foreground/75 leading-relaxed flex-1">{resource.description}</p>
        {resource.link && (
          <a
            href={resource.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors self-start"
          >
            <ExternalLink className="h-3 w-3" />
            {resource.linkLabel ?? "Open"}
          </a>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EVUniversity() {
  return (
    <div className="max-w-5xl mx-auto space-y-14">

      {/* ── Header ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">EV University</h1>
        </div>
        <div className="max-w-3xl space-y-2 pl-1">
          <p className="text-[15px] text-foreground/85 leading-relaxed">
            Great stores are built by great leaders — and great leaders never stop growing. EV University is a curated space for store managers and key leaders to sharpen their skills, expand their thinking, and invest in their own development.
          </p>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            You don't need a business degree to lead well. You need exposure to the right ideas, a habit of reflection, and the willingness to keep learning. The resources here are practical, field-tested, and chosen specifically for people running real operations with real teams.
          </p>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            Dig into whatever resonates. Share what you find useful. Come back often.
          </p>
        </div>
      </div>

      {/* ── Core Values ── */}
      <section>
        <div className="flex items-start gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-display font-bold text-primary leading-none">EV</span>
          </div>
          <div>
            <h2 className="text-lg font-display font-bold tracking-tight">Eagle V Core Values</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
              Everything we do as a team is anchored to these eight values. They shape how we show up, how we treat each other, and how we grow.
            </p>
          </div>
        </div>

        {/* DEDICATE acronym banner */}
        <div className="flex items-center gap-1.5 mb-5 mt-4 flex-wrap">
          {CORE_VALUES.map((v, i) => (
            <div key={i} className="flex flex-col items-center px-3 py-2 rounded-lg bg-primary/8 border border-primary/15">
              <span className="text-base font-display font-bold text-primary leading-none">{v.letter}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wide font-medium">{v.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CORE_VALUES.map((v, i) => (
            <CoreValueCard key={i} value={v} />
          ))}
        </div>
      </section>

      {/* ── Leadership Resources ── */}
      <section>
        <SectionHeader
          icon={BookOpen}
          title="Leadership Resources"
          description="Frameworks, principles, and articles that form a foundation for how we think about leading people."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LEADERSHIP_RESOURCES.map((r) => <ResourceCard key={r.title} resource={r} />)}
        </div>
      </section>

      {/* ── Books ── */}
      <section>
        <SectionHeader
          icon={Book}
          title="Books"
          description="These aren't assigned reading — but leaders who've read them tend to lead differently. Pick one and start."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BOOKS.map((r) => <ResourceCard key={r.title} resource={r} />)}
        </div>
      </section>

      {/* ── Podcasts ── */}
      <section>
        <SectionHeader
          icon={Headphones}
          title="Podcasts"
          description="Good for commutes, opening shifts, or any time you have 20–30 minutes and want to invest in yourself."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PODCASTS.map((r) => <ResourceCard key={r.title} resource={r} />)}
        </div>
      </section>

      {/* ── TED Talks ── */}
      <section>
        <SectionHeader
          icon={Play}
          title="TED Talks"
          description="Short, high-impact talks — most under 20 minutes — that challenge how you think about leadership, people, and purpose."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TED_TALKS.map((r) => <ResourceCard key={r.title} resource={r} />)}
        </div>
      </section>

      {/* ── YouTube Videos ── */}
      <section>
        <SectionHeader
          icon={Youtube}
          title="YouTube Videos"
          description="Free, accessible, and often just as valuable as anything behind a paywall. These are worth bookmarking."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {YOUTUBE_VIDEOS.map((r) => <ResourceCard key={r.title} resource={r} />)}
        </div>
      </section>

      {/* ── Working Genius ── */}
      <section>
        <SectionHeader
          icon={Puzzle}
          title="Working Genius"
          description="A framework from Patrick Lencioni that helps individuals and teams understand how they're wired for work."
        />

        <Card className="mb-6">
          <CardContent className="px-6 py-5 space-y-3">
            <p className="text-[13px] text-foreground/80 leading-relaxed">
              Working Genius is a productivity and team effectiveness model built around six types of work — and the idea that every person has two natural "geniuses" (work that energizes them), two areas of "competency" (work they can do but that drains them), and two "frustrations" (work that depletes them quickly).
            </p>
            <p className="text-[13px] text-foreground/80 leading-relaxed">
              Understanding your team's genius profile helps you assign work more intentionally, reduce burnout, and have honest conversations about why certain roles feel natural to some people and exhausting to others. It's particularly useful during floorset planning, scheduling, and team development conversations.
            </p>
            <div className="pt-1">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Take the Working Genius Assessment
              </a>
              <span className="text-[11px] text-muted-foreground ml-2">(team results and discussion guide coming soon)</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GENIUS_TYPES.map((g) => (
            <Card key={g.name} className={`border ${g.color.split(" ").filter(c => c.startsWith("border-")).join(" ")} hover:border-opacity-60 transition-colors`}>
              <CardHeader className="pb-2 px-5 pt-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{g.emoji}</span>
                  <CardTitle className={`text-sm font-bold ${g.color.split(" ").filter(c => c.startsWith("text-")).join(" ")}`}>
                    {g.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-[12px] text-foreground/70 leading-relaxed">{g.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom breathing room */}
      <div className="h-4" />
    </div>
  );
}
