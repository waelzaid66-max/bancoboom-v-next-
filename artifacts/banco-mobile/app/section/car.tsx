import { SectionSearchApp } from "@/components/search/SectionSearchApp";

/**
 * B-oom Car — BANCO's all-vehicles section (cars · boats · launches · planes…).
 *
 * Chrome is declared HERE so a cars judgement never silently becomes the rule
 * for real-estate or materials. Car Import (`/import`) is a separate world —
 * never melt Import into this section.
 *
 * Engines = chips (Wave 6 REL-17): new · used · imported · bank · islamic must
 * stay visible on the strip. listingMode stays a pill (sale / wanted, set once).
 * Stay-parity identity lives in CarsHomeHeader (REL-20).
 */
export default function CarSectionScreen() {
  return (
    <SectionSearchApp
      category="car"
      titleKey="home.categories.car"
      subtitleKey="search.discover.section.carSub"
      chrome={{ listingMode: "pill", engines: "chips" }}
    />
  );
}
