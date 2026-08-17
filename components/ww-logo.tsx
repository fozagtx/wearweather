export function WwLogo({ className = "size-7" }: { className?: string }) {
  return (
    <img
      src="/ww-logo.svg"
      alt=""
      width={28}
      height={28}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
