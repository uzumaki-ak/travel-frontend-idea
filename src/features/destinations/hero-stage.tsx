"use client";

/**
 * The hub's full-bleed hero stage.
 *
 *  - With a `video`, it plays muted and looping behind the title (poster first).
 *    If the file is missing or fails, it falls back to the photo sequence.
 *  - Without one, the photos play as a slow cinematic sequence: each slide
 *    zooms out gently, then crossfades to the next. Story-style bars along the
 *    top show the timing and jump to any slide; a caption names the place.
 *  - It is time-driven, never scroll-driven. It pauses on hover, on keyboard
 *    focus, when the tab is hidden, and with the pause button (WCAG 2.2.2).
 *    With reduced motion: no autoplay and no zoom.
 *
 * The title, tagline and buttons are passed in as children (server-rendered).
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/ui/icons";

export type StageSlide = { src: string; alt: string; place?: string };

const SLIDE_MS = 6500;
const CONTROL =
  "grid size-9 cursor-pointer place-items-center rounded-full border border-fog/35 text-fog backdrop-blur-sm transition-colors hover:bg-fog hover:text-ink md:size-11 md:text-lg";

/** `short`: a cinematic band (destination guide) instead of the near full-screen stage. */
export function HeroStage({
  slides,
  video,
  children,
  short = false,
  contentClassName = "absolute inset-x-0 bottom-0 p-5 md:p-10 lg:p-12",
}: {
  slides: StageSlide[];
  video?: { src: string; poster: string };
  children: React.ReactNode;
  short?: boolean;
  /** Where the overlaid content sits (default: along the bottom). */
  contentClassName?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // by the button
  const [held, setHeld] = useState(false); // by hover / focus / hidden tab
  const [reduced, setReduced] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  const count = slides.length;
  const film = video && !videoFailed ? video : null;
  const running = !film && count > 1 && !paused && !held && !reduced;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const onVisibility = () => setHeld(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // The film can fail before React is listening (it starts loading with the HTML),
  // so also check its state once mounted, and keep listening for a later error.
  useEffect(() => {
    const v = filmRef.current;
    if (!v) return;
    const check = () => {
      if (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) setVideoFailed(true);
    };
    const frame = requestAnimationFrame(check);
    v.addEventListener("error", check);
    return () => {
      cancelAnimationFrame(frame);
      v.removeEventListener("error", check);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [running, index, count]);

  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  const current = slides[index];

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label="Photos of the destination"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setHeld(false);
      }}
      className={`relative isolate overflow-hidden rounded-[1.75rem] bg-river-deep text-fog md:rounded-[2.75rem] ${
        short ? "h-[26rem] md:h-[min(68svh,40rem)]" : "h-[max(27rem,62svh)] md:h-[max(38rem,min(calc(100svh-var(--header-h)-3.5rem),62rem))]"
      }`}
    >
      {/* Media. */}
      {film ? (
        <video
          ref={filmRef}
          className="absolute inset-0 -z-10 size-full object-cover"
          src={film.src}
          poster={film.poster}
          autoPlay={!reduced}
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        slides.map((s, i) => (
          <div
            key={s.src}
            aria-hidden={i !== index}
            className={`absolute inset-0 -z-10 transition-opacity duration-[1400ms] ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              preload={i === 0}
              sizes="100vw"
              // Restart the slow zoom each time this slide comes back.
              key={i === index ? `on-${index}` : "off"}
              className={`object-cover ${i === index ? "animate-[stage-zoom_9s_var(--ease-out-expo)_both]" : ""}`}
            />
          </div>
        ))
      )}

      {/* Shade: strong at the bottom for the title, light at the top for the bars. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-river-deep/90 via-river-deep/25 to-river-deep/35" />

      {/* Story bars + caption. */}
      {!film && count > 1 ? (
        <div className="absolute inset-x-5 top-5 flex flex-col gap-3 md:inset-x-8 md:top-7">
          <div className="flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}${s.place ? `: ${s.place}` : ""}`}
                aria-current={i === index ? "true" : undefined}
                className="group relative h-6 flex-1 cursor-pointer"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-fog/30 transition-colors group-hover:bg-fog/50">
                  <span
                    // Re-keyed per slide so the fill restarts; paused with the slideshow.
                    key={i === index ? `fill-${index}` : `idle-${i}`}
                    className={`block h-full origin-left rounded-full bg-fog ${
                      i < index ? "scale-x-100" : i === index ? (reduced ? "scale-x-100" : "animate-[stage-fill_linear_both]") : "scale-x-0"
                    }`}
                    style={i === index && !reduced ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" } : undefined}
                  />
                </span>
              </button>
            ))}
          </div>
          {/* Caption on the left, controls on the right: kept up here so the title below gets the full width. */}
          <div className="flex items-center justify-between gap-4">
            <p aria-live="polite" className="flex min-w-0 items-center gap-3 font-mono text-[0.75rem] text-fog/85">
              <span className="shrink-0 tabular-nums">
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              {current?.place ? <span className="truncate">{current.place}</span> : null}
            </p>
            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
              <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play slideshow" : "Pause slideshow"} className={CONTROL}>
                {paused ? (
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current md:size-3.5">
                    <path d="M4 2.5v11l9-5.5z" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 fill-current md:size-3.5">
                    <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" />
                  </svg>
                )}
              </button>
              <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={CONTROL}>
                <ArrowLeftIcon />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next photo" className={CONTROL}>
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Title block (server content), full width. */}
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
