/** The hero's tilted picture card: "my wallet is like an onion" meme. */
export default function HeroMeme() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="hero-meme"
      src="/hero-meme.webp"
      width={530}
      height={530}
      alt="Meme: my wallet is like an onion, when I open it it makes me cry."
      decoding="async"
    />
  );
}
