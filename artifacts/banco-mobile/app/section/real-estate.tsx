import { SectionSearchApp } from "@/components/search/SectionSearchApp";

/**
 * Real estate (B-PROPERTIES) — Stay-parity mini-app chrome inside SectionSearchApp.
 *
 * Identity + search/filter + offer + Wanted + types (Commercial/More pickers)
 * live in PropertyHomeHeader. Stays → /section/booking · Request → create RFQ.
 * Deep refinements stay in FilterSheet.
 * Do not touch Cars / Stay shell / Import / MiniAppBottomNav from this shell.
 */
export default function RealEstateSectionScreen() {
  return (
    <SectionSearchApp
      category="real_estate"
      titleKey="home.categories.real_estate"
      subtitleKey="search.discover.section.realEstateSub"
      chrome={{ engines: "chips", propertyType: "pill" }}
    />
  );
}
