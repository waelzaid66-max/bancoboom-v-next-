/**
 * B-oom Car — vehicle category glyphs.
 *
 * Hand-authored so the whole strip shares ONE stroke weight, ONE optical size
 * and ONE corner language. lucide-react-native has no motorcycle / bus / yacht /
 * helicopter glyph, so mixing it with substitutes produced the inconsistent
 * icon row the owner rejected ("هوية الميني اب والطبقات مفقودة").
 *
 * Rules for anyone adding a type here:
 *   • 24×24 viewBox, stroke-only, strokeWidth 1.6, round caps/joins.
 *   • Wheels/rotors are the only closed shapes — never fill a body.
 *   • Keep the visual mass between y=6 and y=18 so every glyph optically
 *     centres against its neighbours in the horizontal strip.
 */
import * as React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export type VehicleGlyphName =
  | "cars"
  | "suv"
  | "electric"
  | "motorcycles"
  | "trucks"
  | "buses"
  | "vans"
  | "heavy"
  | "boats"
  | "yachts"
  | "ships"
  | "aircraft"
  | "jets"
  | "helicopters"
  | "agricultural"
  | "construction"
  | "emergency"
  | "military"
  | "classic"
  | "luxury"
  | "more";

type Props = {
  name: VehicleGlyphName;
  size?: number;
  color?: string;
};

export function VehicleGlyph({ name, size = 24, color = "#FFFFFF" }: Props) {
  const stroke = color;
  const common = {
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "cars" ? (
        <>
          <Path
            {...common}
            d="M3 15.4v-2.1c0-.5.3-1 .8-1.2l1.3-.5 1.8-3.4c.3-.6.9-.9 1.5-.9h7c.6 0 1.2.3 1.5.9l1.8 3.4 1.3.5c.5.2.8.7.8 1.2v2.1"
          />
          <Path {...common} d="M6.3 11.5h11.4" />
          <Path {...common} d="M3 15.4h2.2M18.8 15.4H21" />
          <Circle {...common} cx="7.6" cy="15.9" r="1.9" />
          <Circle {...common} cx="16.4" cy="15.9" r="1.9" />
        </>
      ) : null}

      {name === "suv" ? (
        <>
          <Path
            {...common}
            d="M3 15.2v-2.4c0-.5.3-1 .8-1.2l1.1-.4V8.4c0-.6.5-1 1-1h11.6c.6 0 1 .4 1 1v2.8l1.1.4c.5.2.8.7.8 1.2v2.4"
          />
          <Path {...common} d="M5.9 11.2h12.2" />
          <Path {...common} d="M12 7.4v3.8" />
          <Path {...common} d="M3 15.2h2.2M18.8 15.2H21" />
          <Circle {...common} cx="7.6" cy="15.8" r="1.9" />
          <Circle {...common} cx="16.4" cy="15.8" r="1.9" />
        </>
      ) : null}

      {name === "electric" ? (
        <>
          <Path
            {...common}
            d="M3 15.4v-2.1c0-.5.3-1 .8-1.2l1.3-.5 1.8-3.4c.3-.6.9-.9 1.5-.9h4.2"
          />
          <Path {...common} d="M17.9 11.6l1.3.5c.5.2.8.7.8 1.2v2.1" />
          <Path {...common} d="M6.3 11.5h5.1" />
          <Path {...common} d="M3 15.4h2.2M18.8 15.4H21" />
          <Circle {...common} cx="7.6" cy="15.9" r="1.9" />
          <Circle {...common} cx="16.4" cy="15.9" r="1.9" />
          <Path {...common} d="M16.4 4.2l-2.6 4.1h2.6l-2 3.6" />
        </>
      ) : null}

      {name === "vans" ? (
        <>
          <Path
            {...common}
            d="M2.8 15.3V8.1c0-.5.4-.9.9-.9h9.9c.4 0 .8.2 1 .5l3.9 4.6c.2.2.3.5.3.8v2.2"
          />
          <Path {...common} d="M13.1 7.6v4.9h5.2" />
          <Path {...common} d="M2.8 15.3h1.5M9.6 15.3h3.6M17.7 15.3h1.5" />
          <Circle {...common} cx="6.9" cy="15.8" r="1.8" />
          <Circle {...common} cx="15.6" cy="15.8" r="1.8" />
        </>
      ) : null}

      {name === "jets" ? (
        <>
          <Path
            {...common}
            d="M2.6 12.4l5.6-1.1 3.2-5.4c.3-.6.9-.9 1.5-.9h1.3l-1.6 5.6 5.1-1 1.9-2.4h1.8l-1.4 3.4 1.4 3.4h-1.8l-1.9-2.4-11 2.2z"
          />
          <Path {...common} d="M6.4 15.4l-1.5 3.2h1.9l2.6-3.6" />
        </>
      ) : null}

      {name === "agricultural" ? (
        <>
          <Circle {...common} cx="7.4" cy="15.4" r="3.6" />
          <Circle {...common} cx="17.8" cy="16.4" r="2.6" />
          <Path {...common} d="M4.8 11.8V8.6c0-.5.4-.9.9-.9h3.6c.5 0 .9.4.9.9v2.4" />
          <Path {...common} d="M10.2 11h5.4v3.9" />
          <Path {...common} d="M10.6 15.4h4.6" />
          <Path {...common} d="M15.6 11h2.8" />
        </>
      ) : null}

      {name === "construction" ? (
        <>
          <Path {...common} d="M3.4 16.2h6.4v2.2H3.4z" />
          <Path {...common} d="M4.8 16.2v-3.4h3.6v3.4" />
          <Path {...common} d="M8.4 13.4l4.2-6.2 6.6 4.4" />
          <Path {...common} d="M12.6 7.2h6.6" />
          <Path {...common} d="M19.2 11.6v2.6" />
          <Circle {...common} cx="19.2" cy="16.4" r="2.1" />
        </>
      ) : null}

      {name === "emergency" ? (
        <>
          <Path {...common} d="M2.8 15.2V9.4c0-.5.4-.9.9-.9h8.7c.4 0 .8.2 1 .5l3.5 4.1c.2.2.3.5.3.8v1.3" />
          <Path {...common} d="M12.4 8.9v4.6h4.6" />
          <Path {...common} d="M6.6 10.6v2.8M5.2 12h2.8" />
          <Path {...common} d="M2.8 15.2h1.4M9.2 15.2h3.4M17 15.2h1.4" />
          <Path {...common} d="M12 5.6V4.2" />
          <Circle {...common} cx="6.6" cy="15.7" r="1.7" />
          <Circle {...common} cx="15.3" cy="15.7" r="1.7" />
        </>
      ) : null}

      {name === "military" ? (
        <>
          <Path
            {...common}
            d="M2.6 15.1v-2.3c0-.5.4-.9.9-.9h4.1l2-2.6c.2-.3.5-.4.8-.4h5.4c.5 0 .9.4.9.9v2.1h2.8c.5 0 .9.4.9.9v2.3"
          />
          <Path {...common} d="M10.4 8.9v3h6.3" />
          <Path {...common} d="M13.2 8.9V6.4h6.2" />
          <Circle {...common} cx="6.8" cy="15.6" r="2.1" />
          <Circle {...common} cx="16.2" cy="15.6" r="2.1" />
        </>
      ) : null}

      {name === "classic" ? (
        <>
          <Path
            {...common}
            d="M2.8 15.2v-2c0-.6.4-1.1 1-1.3l1.6-.4 2-3.2c.3-.5.8-.8 1.4-.8h6.2c.6 0 1.1.3 1.4.8l2 3.2 1.6.4c.6.2 1 .7 1 1.3v2"
          />
          <Path {...common} d="M7 11.5h10" />
          <Path {...common} d="M12 7.5v4" />
          <Path {...common} d="M2.8 15.2h2M19.2 15.2h2" />
          <Path {...common} d="M4.4 12.9h1.6M18 12.9h1.6" />
          <Circle {...common} cx="7.4" cy="15.7" r="2" />
          <Circle {...common} cx="16.6" cy="15.7" r="2" />
        </>
      ) : null}

      {name === "luxury" ? (
        <>
          <Path {...common} d="M4.6 7.4l2.6 2.1L12 4.6l4.8 4.9 2.6-2.1-1.4 6.2H6z" />
          <Path {...common} d="M6 17.4h12" />
        </>
      ) : null}

      {name === "motorcycles" ? (
        <>
          <Circle {...common} cx="5.4" cy="15.6" r="3.1" />
          <Circle {...common} cx="18.6" cy="15.6" r="3.1" />
          <Path {...common} d="M5.4 15.6l3.4-4.9h4.9l2.6 4.2" />
          <Path {...common} d="M8.8 10.7l-1.3-2h2.9" />
          <Path {...common} d="M13.7 10.7h3.1l1.2 2" />
          <Path {...common} d="M9.6 15.6h5.3" />
        </>
      ) : null}

      {name === "trucks" ? (
        <>
          <Path {...common} d="M2.6 15.4V8.2c0-.5.4-.9.9-.9h8.3c.5 0 .9.4.9.9v7.2" />
          <Path {...common} d="M12.7 10.4h2.9c.4 0 .7.1.9.4l2.4 2.7c.2.2.3.5.3.8v1.1" />
          <Path {...common} d="M2.6 15.4h1.4M9.4 15.4h3.3M18.1 15.4h1.9" />
          <Circle {...common} cx="6.7" cy="15.9" r="1.8" />
          <Circle {...common} cx="16.4" cy="15.9" r="1.8" />
        </>
      ) : null}

      {name === "buses" ? (
        <>
          <Path
            {...common}
            d="M4 15.6V7.4c0-.6.5-1.1 1.1-1.1h13.8c.6 0 1.1.5 1.1 1.1v8.2"
          />
          <Path {...common} d="M4 10.2h16" />
          <Path {...common} d="M12 6.3v3.9" />
          <Path {...common} d="M4 15.6h1.4M9.2 15.6h5.6M18.6 15.6H20" />
          <Circle {...common} cx="7.1" cy="16.1" r="1.7" />
          <Circle {...common} cx="16.9" cy="16.1" r="1.7" />
        </>
      ) : null}

      {name === "heavy" ? (
        <>
          <Path {...common} d="M4.6 10.6V8.4c0-.5.4-.9.9-.9h4.2c.5 0 .9.4.9.9v2.2" />
          <Path {...common} d="M3.9 10.6h7.4v3.8H3.9z" />
          <Path {...common} d="M11.3 11.2l3.4-3.4 4.6 4.2" />
          <Path {...common} d="M19.3 12v2.4" />
          <Path
            {...common}
            d="M4.4 16.2h11.4c1 0 1.8.8 1.8 1.8H2.6c0-1 .8-1.8 1.8-1.8z"
          />
        </>
      ) : null}

      {name === "boats" ? (
        <>
          <Path {...common} d="M3.4 13.9h17.2l-2.4 3.6H5.8z" />
          <Path {...common} d="M8.1 13.9l1.5-3.4h4.1l1.4 3.4" />
          <Path {...common} d="M14.6 10.5l3.1 3.4" />
          <Path
            {...common}
            d="M2.6 19.9c1.3 0 1.3.9 2.6.9s1.3-.9 2.6-.9 1.3.9 2.6.9 1.3-.9 2.6-.9 1.3.9 2.6.9 1.3-.9 2.6-.9 1.3.9 2.6.9"
          />
        </>
      ) : null}

      {name === "yachts" ? (
        <>
          <Path {...common} d="M2.8 13.6h18.4l-2.6 3.7H5.6z" />
          <Path {...common} d="M6.4 13.6v-3.1h9.1v3.1" />
          <Path {...common} d="M8.7 10.5V8.1h4.6v2.4" />
          <Path {...common} d="M11 8.1V5.9" />
          <Path {...common} d="M15.5 11.7h2.9" />
          <Path
            {...common}
            d="M2.6 19.9c1.3 0 1.3.9 2.6.9s1.3-.9 2.6-.9 1.3.9 2.6.9 1.3-.9 2.6-.9 1.3.9 2.6.9 1.3-.9 2.6-.9 1.3.9 2.6.9"
          />
        </>
      ) : null}

      {name === "ships" ? (
        <>
          <Path {...common} d="M2.6 13.8h18.8l-2.7 3.9H5.3z" />
          <Path {...common} d="M5.6 13.8v-2.6h6.8v2.6" />
          <Path {...common} d="M9 11.2V8.9h3.4v2.3" />
          <Path {...common} d="M14.4 13.8v-2.6h4.1v2.6" />
          <Path {...common} d="M12.4 6.6v2.3" />
          <Path
            {...common}
            d="M2.6 19.9c1.3 0 1.3.9 2.6.9s1.3-.9 2.6-.9 1.3.9 2.6.9 1.3-.9 2.6-.9 1.3.9 2.6.9 1.3-.9 2.6-.9 1.3.9 2.6.9"
          />
        </>
      ) : null}

      {name === "aircraft" ? (
        <Path
          {...common}
          d="M12 3.2c.9 0 1.5.9 1.5 2v3.4l7.3 4.1v2.1l-7.3-2.1v3.2l2.3 1.7v1.5L12 17.9l-3.8 1.2v-1.5l2.3-1.7v-3.2l-7.3 2.1v-2.1l7.3-4.1V5.2c0-1.1.6-2 1.5-2z"
        />
      ) : null}

      {name === "helicopters" ? (
        <>
          <Path {...common} d="M3.6 5.4h16.8" />
          <Path {...common} d="M12 5.4v2.6" />
          <Path
            {...common}
            d="M6.6 14.4v-1.9c0-2.5 2-4.5 4.5-4.5h2.3l2.8 3.4h2.6c1 0 1.8.8 1.8 1.8v1.2c0 .9-.7 1.6-1.6 1.6H8.4c-1 0-1.8-.8-1.8-1.6z"
          />
          <Path {...common} d="M16.2 11.4h5.2" />
          <Path {...common} d="M20.4 11.4v3" />
          <Path {...common} d="M6.2 18.6h11.4" />
          <Path {...common} d="M9.4 16v2.6M14.6 16v2.6" />
        </>
      ) : null}

      {name === "more" ? (
        <>
          <Path {...common} d="M5.4 5.4h4.2v4.2H5.4zM14.4 5.4h4.2v4.2h-4.2z" />
          <Path {...common} d="M5.4 14.4h4.2v4.2H5.4zM14.4 14.4h4.2v4.2h-4.2z" />
        </>
      ) : null}
    </Svg>
  );
}
