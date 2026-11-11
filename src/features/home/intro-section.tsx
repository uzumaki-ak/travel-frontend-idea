import Image from "next/image";
import { home } from "@/content/home";
import { LEAF } from "@/ui/shape";

/** Two of the site's own photos, used as quiet depth beside the copy. */
const SIDE_PHOTOS = ["/media/home/Umiam-Lake-7-kaga.jpg", "/media/home/Laitlum-Canyons-1-kaga.jpeg"] as const;

export function IntroSection() {
  // The first intro paragraph opens the hero; the rest live here, unchanged.
  const [, statement, ...details] = home.intro;

  return (
    <section aria-label="About Kajaawa" className="py-24 md:py-36">
      <div className="wrap grid gap-16 md:grid-cols-12">
        <p
          data-motion="words"
          className="font-display text-lead font-medium tracking-[-0.02em] md:col-span-10 lg:col-span-9"
        >
          {statement}
        </p>

        <div className="relative hidden md:col-span-4 md:block">
          <div className="sticky top-28 flex gap-4">
            {SIDE_PHOTOS.map((src, i) => (
              <div
                key={src}
                className={`relative aspect-[3/4] flex-1 overflow-clip ${LEAF} ${i === 1 ? "mt-16" : ""}`}
              >
                <div data-speed={i === 0 ? 0.12 : -0.12} className="absolute -inset-y-[12%] inset-x-0">
                  <Image src={src} alt="" fill sizes="(min-width: 768px) 16vw, 1px" className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2 md:col-span-8">
          {details.map((paragraph) => (
            <p key={paragraph} data-motion="rise" className="max-w-[36ch] text-[1.0625rem] leading-relaxed text-moss">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
