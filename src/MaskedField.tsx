import { useId } from "react";

type MaskedFieldProps = {
  width?: number | string;
  height?: number;
  radius?: number;
  bg?: string;
  stripe?: string;
  border?: string;
  gap?: number;
  stripeWidth?: number;
  angle?: number;
  label?: string;
  fontSize?: number;
  textColor?: string;
};
export function MaskedField({
  width = "100%",
  height = 40,
  radius = 8,
  bg = "#f4f4f5",
  stripe = "#cfcfcf",
  border = "#d4d4d8",
  gap = 12,
  stripeWidth = 6,
  angle = 45,
  label = "N/A",
  fontSize = 14,
  textColor = "#475569",
}: MaskedFieldProps) {
  const uid = useId().replace(/[:]/g, "");
  const patternId = `na-stripes-${uid}`;
  const titleId = `na-title-${uid}`;
  const vbW = 300;
  const vbH = height;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${vbW} ${vbH}`}
      role="img"
      aria-labelledby={titleId}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <title id={titleId}>Not applicable</title>
      <defs>
        <pattern
          id={patternId}
          width={gap}
          height={gap}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${angle})`}
        >
          <rect width={stripeWidth} height={gap} fill={stripe} />
        </pattern>
      </defs>

      <rect x="0" y="0" width={vbW} height={vbH} rx={radius} fill={bg} stroke={border} />
      <rect x="0" y="0" width={vbW} height={vbH} rx={radius} fill={`url(#${patternId})`} />
      {label ? (
        <text
          x={vbW / 2}
          y={vbH / 2}
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
          fontSize={fontSize}
          fontWeight={600}
          fill={textColor}
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}