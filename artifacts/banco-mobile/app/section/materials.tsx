import { SectionSearchApp } from "@/components/search/SectionSearchApp";

/**
 * B-CORE Industrial Hub — materials section.
 *
 * Upper header: identity + search/Filters. Browse axes (type/origin/commodity)
 * are smart horizontal strips inside SectionSearchApp. listingMode refinements
 * stay in FilterSheet. MiniAppBottomNav untouched.
 */
export default function MaterialsSectionScreen() {
  return (
    <SectionSearchApp
      category="materials"
      titleKey="home.categories.materials"
      subtitleKey="search.discover.section.materialsSub"
      chrome={{ listingMode: "pill", engines: "chips" }}
    />
  );
}
