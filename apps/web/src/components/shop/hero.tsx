import Link from "next/link";
import { ImageIcon } from "../icons";

export function Hero() {
  return (
    <section className="bg-surface-subtle">
      <div className="page-wrap flex flex-wrap items-center gap-12 py-7 md:py-14">
        <div className="flex flex-[1_1_420px] flex-col items-start gap-3">
          <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">New this week</p>
          <h1 className="text-2xl leading-8 font-bold tracking-[-0.01em] md:text-[44px] md:leading-[52px] md:font-extrabold md:tracking-[-0.02em]">
            New arrivals, every week
          </h1>
          <p className="max-w-[460px] text-[15px] leading-[22px] text-ink-muted md:text-[17px] md:leading-[26px]">
            Electronics, clothing and home essentials, picked for everyday use and delivered to your door.
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            <Link
              href="/?sort=newest#shop"
              scroll={false}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Shop new arrivals
            </Link>
            <a
              href="#shop"
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-[15px] font-semibold text-ink transition-colors hover:bg-surface-subtle"
            >
              Browse categories
            </a>
          </div>
        </div>
        {/* Swap this panel for a campaign image (next/image) when one exists */}
        <div
          aria-hidden
          className="hidden h-[300px] flex-[1_1_420px] items-center justify-center rounded-xl bg-[#e9ecf2] text-ink-muted md:flex"
        >
          <ImageIcon size={40} />
        </div>
      </div>
    </section>
  );
}
