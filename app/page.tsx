export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ background: "#070707" }}
    >
      <h1
        className="font-bebas tracking-widest"
        style={{
          color: "#C9A84C",
          fontSize: "clamp(4rem, 12vw, 10rem)",
          letterSpacing: "0.15em",
          lineHeight: 1,
        }}
      >
        LYCHO
      </h1>
      <p
        className="font-cormorant mt-4 tracking-[0.3em] uppercase"
        style={{
          color: "#C9A84C",
          fontSize: "clamp(0.75rem, 2vw, 1.125rem)",
          opacity: 0.8,
        }}
      >
        Intelligence. Transmitted.
      </p>
    </main>
  );
}
