function Icosahedron({
  size,
  color,
  x,
  y,
  ring,
}: {
  size: number;
  color: "indigo" | "teal";
  x: number;
  y: number;
  ring?: boolean;
}) {
  const c = color === "indigo" ? "#6366F1" : "#2DD4BF";
  const dark = color === "indigo" ? "#4338CA" : "#0F9488";
  return (
    <div className="absolute" style={{ left: x, top: y, width: size, height: size }}>
      {ring && (
        <svg
          viewBox="0 0 200 200"
          className="pointer-events-none absolute"
          style={{ left: -size * 0.35, top: -size * 0.25, width: size * 1.7, height: size * 1.7 }}
        >
          <ellipse
            cx="100"
            cy="100"
            rx="98"
            ry="40"
            fill="none"
            stroke="#C7D2FE"
            strokeWidth="1"
            opacity="0.6"
            transform="rotate(-18 100 100)"
          />
        </svg>
      )}
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <linearGradient id={`grad-${x}-${y}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.55" />
            <stop offset="100%" stopColor={dark} stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <ellipse cx="100" cy="190" rx="55" ry="10" fill={dark} opacity="0.12" />
        <polygon points="100,10 170,70 100,100" fill={`url(#grad-${x}-${y})`} stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
        <polygon points="100,10 30,70 100,100" fill={c} fillOpacity="0.35" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
        <polygon points="100,100 170,70 150,150" fill={dark} fillOpacity="0.55" stroke="#fff" strokeOpacity="0.4" strokeWidth="1" />
        <polygon points="100,100 30,70 50,150" fill={c} fillOpacity="0.4" stroke="#fff" strokeOpacity="0.4" strokeWidth="1" />
        <polygon points="100,100 150,150 100,190" fill={dark} fillOpacity="0.7" stroke="#fff" strokeOpacity="0.4" strokeWidth="1" />
        <polygon points="100,100 50,150 100,190" fill={c} fillOpacity="0.5" stroke="#fff" strokeOpacity="0.4" strokeWidth="1" />
      </svg>
    </div>
  );
}

function Dot({ x, y, size = 6, color = "#A5B4FC" }: { x: number; y: number; size?: number; color?: string }) {
  return (
    <span
      className="absolute rounded-full"
      style={{ left: x, top: y, width: size, height: size, background: color }}
    />
  );
}

export function LoginVisual() {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-background-secondary to-background">
      <Icosahedron size={110} color="teal" x={70} y={200} />
      <Icosahedron size={170} color="indigo" x={210} y={90} ring />
      <Icosahedron size={240} color="indigo" x={90} y={340} ring />
      <Icosahedron size={90} color="teal" x={370} y={420} />
      <Dot x={60} y={130} />
      <Dot x={210} y={60} size={5} />
      <Dot x={430} y={150} size={7} />
      <Dot x={80} y={470} size={5} />
      <Dot x={340} y={330} size={5} />
      <Dot x={410} y={480} size={5} />
    </div>
  );
}