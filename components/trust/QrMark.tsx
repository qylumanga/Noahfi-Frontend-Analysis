export function QrMark({ seed }: { seed: string }) {
  const bits = seed.replace(/[^a-f0-9]/gi, "");
  const cells = Array.from({ length: 81 }, (_, index) => parseInt(bits[index % bits.length] || "0", 16) > 7);
  return (
    <svg viewBox="0 0 90 90" className="h-28 w-28" role="img" aria-label="Certificate pattern generated from the document hash">
      {cells.map((on, index) => on ? <rect key={index} x={(index % 9) * 10} y={Math.floor(index / 9) * 10} width="9" height="9" fill="#0C1A2B" /> : null)}
    </svg>
  );
}
