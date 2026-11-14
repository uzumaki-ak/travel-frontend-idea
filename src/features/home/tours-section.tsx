import { home } from "@/content/home";
import { TourCard } from "@/features/tours/tour-card";
import { TourCollections } from "./tour-collections";

export function ToursSection() {
  return (
    <section id="tours" aria-label="Tour packages" className="scroll-mt-24 pb-24 md:pb-36">
      <TourCollections collections={home.tourCollections} />
    </section>
  );
}

export function DayToursSection() {
  const { dayTours } = home;

  return (
    <section aria-labelledby="day-tours-title" className="bg-river py-24 text-cloud md:py-36">
      <div className="wrap flex flex-col gap-14 md:gap-20">
        <h2
          id="day-tours-title"
          data-motion="lines"
          className="max-w-[12ch] font-display text-display font-bold tracking-[-0.04em] uppercase"
        >
          {dayTours.title}
        </h2>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-5">
          {dayTours.items.map((tour) => (
            <li key={tour.href} data-motion="rise" className="min-w-0">
              <TourCard tour={tour} layout="grid" tone="dark" sizes="(min-width: 1024px) 18vw, 46vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
