"use client";

/**
 * Floating photo that follows the cursor over `[data-preview]` links.
 * Desktop with a fine pointer only, and never with reduced motion.
 * Images mount on the first hover so they cost nothing until then.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LEAF } from "@/ui/shape";

const FOLLOW = 0.16; // easing factor per frame

export function DestinationPreview({ images }: { images: string[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const zone = box.current?.closest<HTMLElement>("[data-preview-zone]");
    const media = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!zone || !media.matches) return;

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let frame = 0;

    const loop = () => {
      pos.x += (target.x - pos.x) * FOLLOW;
      pos.y += (target.y - pos.y) * FOLLOW;
      const tilt = Math.max(-8, Math.min(8, (target.x - pos.x) * 0.06));
      if (box.current) {
        box.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -60%) rotate(${tilt}deg)`;
      }
      frame = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const link = (e.target as HTMLElement).closest<HTMLElement>("[data-preview]");
      setCurrent(link?.dataset.preview ?? null);
    };

    const onEnter = (e: PointerEvent) => {
      target.x = pos.x = e.clientX;
      target.y = pos.y = e.clientY;
      setArmed(true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(loop);
    };

    const onLeave = () => {
      setCurrent(null);
      cancelAnimationFrame(frame);
    };

    zone.addEventListener("pointerenter", onEnter);
    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      zone.removeEventListener("pointerenter", onEnter);
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={box}
      aria-hidden="true"
      data-visible={current !== null || undefined}
      className={`pointer-events-none fixed top-0 left-0 z-30 hidden aspect-[4/5] w-[min(22vw,300px)] overflow-clip opacity-0 transition-opacity duration-300 data-visible:opacity-100 md:block ${LEAF}`}
    >
      {armed
        ? images.map((src) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              sizes="300px"
              className={`object-cover transition-[opacity,scale] duration-500 ease-out-expo ${src === current ? "scale-100 opacity-100" : "scale-110 opacity-0"}`}
            />
          ))
        : null}
    </div>
  );
}
