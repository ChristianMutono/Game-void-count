export default function CRTOverlay() {
  return (
    <div
      className="crt-scanline crt-flicker fixed inset-0 pointer-events-none"
      style={{ zIndex: 9997 }}
    />
  );
}
