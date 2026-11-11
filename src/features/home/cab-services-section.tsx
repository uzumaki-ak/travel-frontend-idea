import { resolveSitePath } from "@/config/site";
import { home } from "@/content/home";
import { ArrowUpRightIcon } from "@/ui/icons";
import { FlapText } from "./flap-text";

/** "Our Cab Services" as a departure board: one row per route, flips on hover. */
export function CabServicesSection() {
  const { cabServices } = home;

  return (
    <section id="cabs" aria-labelledby="cabs-title" className="scroll-mt-24 bg-ink py-24 text-cloud md:py-36">
      <div className="wrap flex flex-col gap-14 md:gap-20">
        <h2
          id="cabs-title"
          data-motion="lines"
          className="font-display text-display font-bold tracking-[-0.04em] uppercase"
        >
          {cabServices.title}
        </h2>

        <ul className="grid border-t border-white/12 lg:grid-flow-col lg:grid-cols-2 lg:grid-rows-6 lg:gap-x-12">
          {cabServices.items.map((route) => (
            <li key={route.href} className="border-b border-white/12">
              <a
                href={resolveSitePath(route.href)}
                className="group flex items-center justify-between gap-4 py-5 transition-colors duration-300 hover:text-jade md:py-6"
              >
                <FlapText text={route.label} className="font-mono text-[clamp(0.8rem,1.35vw,1.05rem)] tracking-[0.04em] uppercase" />
                <ArrowUpRightIcon className="shrink-0 text-xl text-mandarin transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
