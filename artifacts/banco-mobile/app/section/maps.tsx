import { MapsHubApp } from "@/components/search/maps/MapsHubApp";

/**
 * BANCO Maps — mini-app §7 of 10.
 *
 * Dedicated Maps section entered from Discover Search. High-tech map stack
 * (Leaflet / clusters / SearchResultsMap) lives here and also feeds every
 * catalogue via intentional `?map=1` duplication. Never melt into Real Estate.
 */
export default function MapsSectionScreen() {
  return <MapsHubApp />;
}
