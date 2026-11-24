import Link from "next/link";
import Image from "next/image";
import { Navigation } from "./navigation";

export default function HomePage() {
  return (
    <>
      <Navigation active="home" />
      <main className="shell home">
        <section className="home-hero" aria-labelledby="home-heading">
          <div className="home-copy">
            <h1 id="home-heading">See your next home in person.</h1>
            <p>Explore available homes and book a showing that fits your schedule.</p>
            <Link className="cta" href="/showings">Find showings</Link>
          </div>
          <div className="home-photo">
            <Image src="/openhouse-garden.webp" alt="Modern house opening onto a lush courtyard garden" fill sizes="(max-width: 720px) 100vw, 55vw" preload />
          </div>
        </section>
        <section className="home-guide" aria-labelledby="guide-heading">
          <h2 id="guide-heading">A showing that fits your day</h2>
          <div className="home-steps">
            <article><h3>Set your availability</h3><p>Choose the dates and times you’re free to visit.</p></article>
            <article><h3>Explore available homes</h3><p>Browse photos, prices, and property details for listings that fit your schedule.</p></article>
            <article><h3>Book your visit</h3><p>Select a showing time and confirm with your contact details.</p></article>
          </div>
          <Link className="cta" href="/showings">Browse available homes</Link>
        </section>
      </main>
    </>
  );
}
