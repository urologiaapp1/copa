import { ImageResponse } from "next/og";

/** Ícono de la copa dibujado con formas (sin fuentes de emoji). */
export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14100f",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* cáliz */}
          <div
            style={{
              width: size * 0.44,
              height: size * 0.3,
              background: "#6a1b2a",
              borderRadius: `${size * 0.02}px ${size * 0.02}px ${size}px ${size}px`,
              border: `${size * 0.02}px solid #c9a227`,
            }}
          />
          {/* tallo */}
          <div style={{ width: size * 0.045, height: size * 0.2, background: "#c9a227" }} />
          {/* base */}
          <div
            style={{
              width: size * 0.26,
              height: size * 0.045,
              background: "#c9a227",
              borderRadius: size * 0.02,
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
