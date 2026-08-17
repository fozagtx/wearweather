"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { Eyebrow, GhostButton, PrimaryButton, SectionShell } from "@/components/ui";
import {
  BriefTerminal,
  HeroBoard,
  MockupStage,
  PlansBoard,
  PriorityModal,
  SessionPreview,
  TryOnDetail,
} from "@/components/landing/mockups";
import { getActiveCatalogue } from "@/lib/catalogue";
import { GITHUB_REPO, exampleBrief } from "@/lib/example-brief";
import { rankWearPlans } from "@/lib/recommendation-engine";
import { PREFERENCES, contextLabels, preferenceLabels } from "@/lib/types";

const marquee = [
  ...Object.values(contextLabels.wearMoment),
  ...Object.values(contextLabels.temperatureBand),
  ...Object.values(contextLabels.outdoorDuration),
  ...Object.values(contextLabels.formality),
  ...PREFERENCES.map((id) => preferenceLabels[id]),
];

const features = [
  {
    eyebrow: "The day",
    title: "Tell it the day you actually have.",
    body: "Four inputs: what you’re dressing for, how it feels outside, time outdoors, and polish. WearWeather ranks from those selections — not assumptions about you.",
    media: <BriefTerminal />,
    src: "/optimized/feature3.webp",
    alt: "Ocean and dunes behind the live ranking preview",
  },
  {
    eyebrow: "The shortlist",
    title: "Three Wear Plans. Reasons attached.",
    body: "Each plan is a catalogue look scored against your brief. You get the look title, verified facts, and a check-before-buying note. Not a feed.",
    media: <PlansBoard />,
    src: "/optimized/feature.webp",
    alt: "Clouds behind the three ranked Wear Plans",
  },
  {
    eyebrow: "Try-on",
    title: "See the look on your photo, then read the limit.",
    body: "When you start try-on, the app sends your photo and the catalogue still to YouCam cloth-v4. Until that finishes, you are looking at the source photo and the catalogue reference — not a generated result.",
    media: <TryOnDetail />,
    src: "/optimized/feature2.webp",
    alt: "Forest behind the source and catalogue comparison",
  },
  {
    eyebrow: "Priorities",
    title: "Your words, one to three chips.",
    body: "I run warm. I avoid cling. I need easy movement. I prefer coverage. I need low-maintenance care. The shortlist moves when these change.",
    media: <PriorityModal />,
    src: "/optimized/feature.webp",
    alt: "Clouds behind the priority chips",
  },
  {
    eyebrow: "Session",
    title: "No account. Photo stays here until you submit.",
    body: "Preview is a local object URL. The server stores only a short-lived signed cookie mapping request IDs. Reset deletes it. WearWeather does not store your image.",
    media: <SessionPreview />,
    src: "/optimized/feature4.webp",
    alt: "Dunes behind the photo-consent preview",
  },
];

const faqs = [
  {
    q: "I already use Pinterest or a retailer try-on. Is this for me?",
    a: "WearWeather does not replace a tailor, a retailer, or your camera roll. It takes a day brief and returns three explainable plans from a labelled catalogue, then optionally runs YouCam cloth-v4 on one look.",
  },
  {
    q: "What is in the catalogue?",
    a: `${getActiveCatalogue().length} active editorial looks, each with garment metadata: layer weight, removable layer, lining, movement tags, coverage, care. Unknown values never become positive reasons.`,
  },
  {
    q: "How does ranking work?",
    a: "rankWearPlans scores each active look against formality, temperature band, outdoor time, then your selected priorities. You get three plans with reasons tied to those inputs.",
  },
  {
    q: "Do I need an account or a YouCam key?",
    a: "No account. Ranking runs in the browser against the bundled catalogue. Live try-on needs YOUCAM_API_KEY on the server; without it the app returns a service-unavailable state and keeps the plan.",
  },
  {
    q: "Can I use my own photo?",
    a: "Yes. JPG or PNG, under 10 MB, one person facing forward with shoulders visible. The file stays as a local object URL until you start try-on. WearWeather does not assess body, health, or worth.",
  },
];

function Marquee() {
  return (
    <section id="the-day" className="overflow-hidden bg-background py-16 sm:py-24">
      <h2 className="mx-auto mb-12 max-w-3xl px-4 text-center text-3xl font-semibold tracking-[-0.5px] sm:text-4xl">
        The inputs the planner actually uses.
      </h2>
      <div className="agent-marquee group relative mx-auto max-w-2xl">
        <div className="agent-marquee__track flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy === 1}>
              {marquee.map((label) => (
                <li key={`${copy}-${label}`} className="flex items-center gap-2 whitespace-nowrap font-mono text-sm text-muted-foreground">
                  <span className="grid size-8 place-items-center rounded-md border border-border bg-card text-xs">
                    {label.slice(0, 1)}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <ul className="agent-static mx-auto mt-10 hidden max-w-3xl flex-wrap justify-center gap-3 px-4">
        {marquee.map((label) => (
          <li key={label} className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <SectionShell id="faq">
      <h2 className="text-3xl font-medium tracking-[-0.5px] sm:text-4xl">
        Frequently
        <br />
        asked questions
      </h2>
      <div className="mt-10 divide-y divide-border border-y border-border">
        {faqs.map((item, index) => {
          const isOpen = open === index;
          return (
            <div key={item.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                className="flex min-h-[72px] w-full items-center justify-between gap-6 py-5 text-left text-lg tracking-[-0.2px] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span>{item.q}</span>
                <span className="grid size-10 shrink-0 place-items-center text-muted-foreground" aria-hidden>
                  {isOpen ? <X className="size-5" /> : <Plus className="size-5" />}
                </span>
              </button>
              {isOpen && (
                <p className="max-w-3xl pb-6 text-base leading-relaxed text-muted-foreground">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function LandingPage({
  onExample,
  onUpload,
}: {
  onExample: () => void;
  onUpload: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const plans = useMemo(() => rankWearPlans(exampleBrief, 1), []);
  const lookCount = getActiveCatalogue().length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(GITHUB_REPO);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div id="top">
      <div className="relative flex flex-col items-center overflow-hidden pt-24 pb-8">
        <div className="relative mx-auto w-full max-w-[1600px] px-4">
          <div className="mx-auto max-w-4xl space-y-5 text-center sm:space-y-7">
            <h1 className="text-4xl font-normal tracking-[-0.5px] text-balance sm:text-5xl md:text-6xl lg:text-[4.75rem] lg:leading-[0.98]">
              Stop guessing outfits.
              <br />
              Start rehearsing the day.
            </h1>
            <p className="mx-auto max-w-4xl text-base leading-8 text-muted-foreground sm:text-xl">
              Rank {lookCount} labelled looks against weather, commute, and how you move. Then try one on your photo.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
            <PrimaryButton onClick={onExample}>Try the example brief</PrimaryButton>
            <GhostButton onClick={onUpload}>Use my photo</GhostButton>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-3xl border border-border bg-background px-5 py-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              GitHub
            </a>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={copy}
              aria-label={`Copy repository URL: ${GITHUB_REPO}`}
              className="landing-install-command rounded-3xl border border-border bg-card/70 px-3 py-2.5 font-mono text-xs tracking-[0.5px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:text-sm"
            >
              <span className="text-muted-foreground/70">$ </span>
              github.com/fozagtx/wearweather
              <span className="ml-3 text-foreground/80">{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <div id="demo" className="relative mx-auto mt-12 w-full max-w-[1400px] overflow-hidden">
            <Image
              src="/optimized/hero-background.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-background/35" />
            <div className="relative px-2 py-8 sm:px-6 sm:py-12 lg:px-10">
              <HeroBoard />
            </div>
          </div>
        </div>
      </div>

      <Marquee />

      <SectionShell id="features">
        <div className="space-y-20 sm:space-y-24 lg:space-y-32">
          {features.map((block) => (
            <div
              key={block.eyebrow}
              className="grid grid-cols-1 items-center gap-8 sm:gap-10 xl:grid-cols-2 xl:gap-16"
            >
              <div className="space-y-6 xl:order-1">
                <Eyebrow>{block.eyebrow}</Eyebrow>
                <h3 className="text-2xl font-medium tracking-[-0.5px] text-balance sm:text-3xl lg:text-4xl">
                  {block.title}
                </h3>
                <p className="max-w-[500px] text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                  {block.body}
                </p>
              </div>
              <div className="xl:order-2">
                <MockupStage src={block.src} alt={block.alt}>
                  {block.media}
                </MockupStage>
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="see-it">
        <h2 className="text-3xl font-semibold tracking-[-0.5px] sm:text-4xl">The example brief, ranked</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Client meeting, hot + humid, extended commute, business polished, “I run warm” and “I need easy movement”. These three plans are what rankWearPlans returns for that brief.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-px bg-border md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.planId} className="bg-card">
              <div className="relative h-56">
                <Image src={plan.sourceImageUrl} alt={plan.title} fill className="object-cover" sizes="400px" />
              </div>
              <div className="p-5">
                <p className="font-mono text-xs tracking-[0.5px] text-muted-foreground">0{plan.rank} · {plan.title}</p>
                <ul className="mt-3 space-y-2">
                  {plan.reasons.map((reason) => (
                    <li key={reason} className="text-sm leading-relaxed text-muted-foreground">
                      {reason}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-mono tracking-[0.4px] text-brand-light">Before you buy </span>
                  {plan.checkBeforeBuying}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8">
          <PrimaryButton onClick={onExample}>Run this brief</PrimaryButton>
        </div>
      </SectionShell>

      <Faq />
    </div>
  );
}
