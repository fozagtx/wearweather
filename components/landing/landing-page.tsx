"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Plus, X } from "lucide-react";
import { Eyebrow, GhostButton, PrimaryButton, SectionShell } from "@/components/ui";
import {
  BriefTerminal,
  HeroBoard,
  MockupStage,
  MakeupBoard,
  PlansBoard,
  PriorityModal,
  SessionPreview,
  TryOnDetail,
} from "@/components/landing/mockups";
import { getActiveCatalogue } from "@/lib/catalogue";
import { exampleBrief } from "@/lib/example-brief";
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
    body: "Five inputs: what you’re dressing for, how it feels outside, time outdoors, polish, and whether you want a makeup finish. WearWeather ranks from those selections, not assumptions about you.",
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
    body: "When you start try-on, the app sends your photo and the catalogue still to YouCam cloth-v4. Until that finishes, you are looking at the source photo and the catalogue reference, not a generated result.",
    media: <TryOnDetail />,
    src: "/optimized/feature2.webp",
    alt: "Forest behind the source and catalogue comparison",
  },
  {
    eyebrow: "Makeup",
    title: "A day-matched finish, if you want one.",
    body: "Opt in on the brief. WearWeather ranks a YouCam Look VTO template against the same day (meeting, heat, commute), then you can try that finish on the clothes rehearsal. We do not infer gender from your photo.",
    media: <MakeupBoard />,
    src: "/optimized/feature3.webp",
    alt: "Ocean behind the makeup finish recommendation",
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
    a: "WearWeather does not replace a tailor, a retailer, or your camera roll. It takes a day brief and returns three explainable plans from a labeled catalogue, then optionally runs YouCam cloth-v4 and Look VTO on one look.",
  },
  {
    q: "What is in the catalogue?",
    a: `${getActiveCatalogue().length} active editorial looks, each with garment metadata: layer weight, removable layer, lining, movement tags, coverage, care. Unknown values never become positive reasons.`,
  },
  {
    q: "Can I try makeup with the look?",
    a: "Yes, if you opt in on the brief. After clothes try-on, WearWeather recommends a YouCam Look VTO template scored against the same day. Anyone can opt in; the app does not infer gender from the photo. Virtual makeup is a visualization, not a product match guarantee.",
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
    a: "Yes. JPG or PNG, under 10 MB, one person facing forward with the whole face and shoulders visible. The file stays as a local object URL until you start try-on. WearWeather does not assess body, health, or worth.",
  },
];

function Marquee() {
  return (
    <section id="the-day" className="overflow-hidden bg-background py-12 sm:py-16">
      <h2 className="mx-auto mb-12 max-w-3xl px-4 text-center text-3xl font-semibold tracking-[-0.5px] sm:text-4xl">
        The inputs the planner actually uses.
      </h2>
      <div className="agent-marquee group relative mx-auto max-w-2xl">
        <div className="agent-marquee__track flex w-max py-2">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy === 1}>
              {marquee.map((label) => (
                <li key={`${copy}-${label}`} className="flex items-center gap-2 whitespace-nowrap font-mono text-sm leading-none text-muted-foreground">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-card text-xs leading-none">
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
  hasSave,
  onContinue,
  onForgetSave,
}: {
  onExample: () => void;
  onUpload: () => void;
  hasSave?: boolean;
  onContinue?: () => void;
  onForgetSave?: () => void;
}) {
  const plans = useMemo(() => rankWearPlans(exampleBrief, 1), []);

  return (
    <div id="top">
      <section id="demo" className="relative px-4 pt-20 pb-10 sm:px-8 lg:px-[30px]">
        <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
          <div className="max-w-xl lg:sticky lg:top-24">
            <Eyebrow>See the look. Plan the wear.</Eyebrow>
            <h1 className="mt-3 text-3xl font-normal tracking-[-0.5px] text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
              Stop guessing outfits.
              <br />
              Start rehearsing the day.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Rank three looks for the day you actually have, then try one on a photo before you buy.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {hasSave && onContinue && <PrimaryButton onClick={onContinue}>Continue saved look</PrimaryButton>}
              {hasSave ? (
                <GhostButton onClick={onExample}>Rehearse the example day</GhostButton>
              ) : (
                <PrimaryButton onClick={onExample}>Rehearse the example day</PrimaryButton>
              )}
              <GhostButton onClick={onUpload}>Start with my photo</GhostButton>
            </div>
            {hasSave && onForgetSave && (
              <button
                type="button"
                onClick={onForgetSave}
                className="mt-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Clear saved look
              </button>
            )}
          </div>
          <div className="min-w-0">
            <HeroBoard />
          </div>
        </div>
      </section>

      <Marquee />

      <SectionShell id="features" className="scroll-mt-20">
        <div className="feature-stack">
          <div className="feature-stack__copy-col">
            {features.map((block, index) => (
              <div
                key={block.eyebrow}
                className="feature-stack__copy space-y-4"
                style={{ ["--i"]: index + 1 } as CSSProperties}
              >
                <Eyebrow>{block.eyebrow}</Eyebrow>
                <h3 className="text-2xl font-medium tracking-[-0.5px] text-balance sm:text-3xl">
                  {block.title}
                </h3>
                <p className="max-w-[500px] text-base leading-relaxed text-pretty text-muted-foreground">
                  {block.body}
                </p>
              </div>
            ))}
          </div>
          <div className="feature-stack__card-col">
            {features.map((block, index) => (
              <div
                key={block.eyebrow}
                className="feature-stack__card relative"
                style={{ ["--i"]: index + 1, ["--stack"]: index, zIndex: 20 + index } as CSSProperties}
              >
                <MockupStage src={block.src} alt={block.alt}>
                  {block.media}
                </MockupStage>
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell id="see-it">
        <h2 className="text-3xl font-semibold tracking-[-0.5px] sm:text-4xl">The example brief, ranked</h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Client meeting, hot + humid, extended commute, business polished, “I run warm” and “I need easy movement”. These three plans are what rankWearPlans returns for that brief.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-px bg-border md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.planId} className="bg-card">
              <div className="flex min-h-[28rem] items-start justify-center bg-[#ecece4]">
                <img src={plan.sourceImageUrl} alt={plan.title} className="max-h-[32rem] w-full object-contain object-top" />
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
          <PrimaryButton onClick={onExample}>Rehearse this brief</PrimaryButton>
        </div>
      </SectionShell>

      <Faq />
    </div>
  );
}
