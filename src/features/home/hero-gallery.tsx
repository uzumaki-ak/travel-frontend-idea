import Image from "next/image";

/**
 * Hero photo cluster: a tall arch flanked by two offset capsules and a small
 * circle. All photos come from the site's own media library.
 *
 * Layers per photo: outer = position + scroll parallax (`data-speed`, GSAP),
 * inner = load reveal (`.hero-pop`, CSS). Kept separate so the two transforms
 * never fight over the same element.
 */
type Shot = {
  src: string;
  alt: string;
  /** Position inside the cluster box, in percentages, so it scales at every width. */
  box: string;
  shape: string;
  speed: number;
  delay: number;
  sizes: string;
};

const SHOTS: Shot[] = [
  {
    src: "/media/home/Dawki-River-5.jpg",
    alt: "A boat on the emerald water of the Dawki river",
    box: "left-0 top-[16%] h-[72%] w-[30%]",
    shape: "rounded-full",
    speed: 0.1,
    delay: 450,
    sizes: "(min-width: 1024px) 12vw, 30vw",
  },
  {
    src: "/media/home/Nohkalikai-Falls-1-.jpg",
    alt: "Nohkalikai Falls, Cherrapunji",
    box: "left-[33%] top-0 h-full w-[34%]",
    // An arch: top radius = half the width (container units), soft bottom corners.
    shape: "rounded-t-[50cqw] rounded-b-[2.25rem]",
    speed: -0.06,
    delay: 300,
    sizes: "(min-width: 1024px) 14vw, 34vw",
  },
  {
    src: "/media/home/wei-sawdong-falls-2-kaga.jpg",
    alt: "Wei Sawdong Falls, Cherrapunji",
    box: "right-0 top-[6%] h-[72%] w-[30%]",
    shape: "rounded-full",
    speed: 0.16,
    delay: 600,
    sizes: "(min-width: 1024px) 12vw, 30vw",
  },
];

const BADGE: Shot = {
  src: "/media/home/Umiam-Lake-7-kaga.jpg",
  alt: "A boat on Umiam Lake in the mist",
  box: "left-[19%] bottom-[-4%] w-[23%] aspect-square",
  shape: "rounded-full",
  speed: 0.28,
  delay: 800,
  sizes: "(min-width: 1024px) 9vw, 23vw",
};

export function HeroGallery() {
  return (
    <div
      data-pointer-zone=""
      className="relative mx-auto h-[clamp(300px,88vw,460px)] w-full max-w-[34rem] lg:h-[min(44vw,640px)] lg:max-w-none"
    >
      {/* Concentric rings behind the arch: a quiet nod to ripples on still water. */}
      <div aria-hidden="true" className="hero-fade absolute top-[8%] left-1/2 aspect-square w-[78%] -translate-x-1/2 [--delay:200ms]">
        <div className="hero-orbit absolute inset-0 rounded-full border border-dashed border-ink/12 before:absolute before:inset-[9%] before:rounded-full before:border before:border-ink/8 after:absolute after:inset-[20%] after:rounded-full after:border after:border-ink/6">
          {/* A single bead riding the outer ring makes the slow rotation readable. */}
          <span className="absolute top-[14.6%] left-[14.6%] size-2.5 -translate-1/2 rounded-full bg-mandarin" />
        </div>
      </div>

      {SHOTS.map((shot) => (
        <Photo key={shot.src} shot={shot} />
      ))}

      <Photo shot={BADGE} ring />
    </div>
  );
}

function Photo({ shot, ring = false }: { shot: Shot; ring?: boolean }) {
  return (
    <div data-speed={shot.speed} data-depth={shot.speed * 120} className={`@container absolute ${shot.box}`}>
      <div
        className={`hero-pop relative h-full w-full overflow-clip ${shot.shape} ${ring ? "outline-[6px] outline-fog outline-solid" : ""}`}
        style={{ "--delay": `${shot.delay}ms`, "--float": `${-6 - shot.speed * 40}px` } as React.CSSProperties}
      >
        <Image src={shot.src} alt={shot.alt} fill sizes={shot.sizes} preload={shot.delay < 400} className="object-cover" />
      </div>
    </div>
  );
}
