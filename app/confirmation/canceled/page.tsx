import Link from "next/link";
import { Navigation } from "../../navigation";

export default function CanceledPage() {
  return (
    <>
      <Navigation active="buyer" />
      <main className="shell main">
        <section className="hero">
          <h1>Showing canceled</h1>
          <p>Your booking has been canceled.</p>
        </section>
        <Link className="cta" href="/showings">Find another showing</Link>
      </main>
    </>
  );
}
