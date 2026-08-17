import { WwLogo } from "@/components/ww-logo";
import { GITHUB_REPO } from "@/lib/example-brief";

const columns = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "How it works" },
      { href: "#the-day", label: "The day" },
      { href: "#demo", label: "Example ranking" },
      { href: "#see-it", label: "The three plans" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "Privacy",
    links: [
      { href: "#faq", label: "No account" },
      { href: "#faq", label: "Photo stays local" },
      { href: "#faq", label: "Session reset" },
    ],
  },
  {
    title: "Source",
    links: [{ href: GITHUB_REPO, label: "GitHub", external: true }],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-card">
      <div className="px-4 py-14 sm:px-8 sm:py-20 lg:px-[30px]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)]">
            <div>
              <a href="#top" className="mb-8 inline-flex items-center gap-2 text-sm font-medium">
                <WwLogo className="size-7" />
                WearWeather
              </a>
              <p className="halftone-slogan hidden text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:block">
                See the look
                <br />
                Plan the wear
                <br />
                Step out ready
              </p>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Visual rehearsal, not physical certainty. Ranking uses the bundled catalogue. Live try-on needs a YouCam key.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
              {columns.map((col) => (
                <div key={col.title}>
                  <p className="text-sm text-foreground">{col.title}</p>
                  <ul className="mt-4 space-y-2">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          {...("external" in link && link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 flex flex-col gap-2 font-mono text-[11px] tracking-[0.4px] text-muted-foreground sm:flex-row sm:justify-between">
            <span>WearWeather</span>
            <span>Visual rehearsal, not physical certainty.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
