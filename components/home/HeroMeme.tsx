/** The hero's tilted picture card: "I heard he has 32GB of RAM" meme. */
export default function HeroMeme() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="hero-meme"
      src="/hero-meme-ram.webp"
      width={265}
      height={190}
      alt="Meme: two girls whispering, 'I heard he has 32GB of RAM'."
      decoding="async"
    />
  );
}
