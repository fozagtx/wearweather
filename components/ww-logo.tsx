export function WwLogo({ className = "size-8" }: { className?: string }) {
  return (
    <img
      src="/ww-logo.png"
      alt=""
      width={32}
      height={32}
      className={`block shrink-0 ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
