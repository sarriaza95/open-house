import Link from "next/link";

export function Navigation({ active }: { active: "home" | "buyer" | "seller" | "my-showings" }) {
  return (
    <header className="top">
      <div className="shell top-inner">
        <Link className="brand" href="/">Open<span>House</span></Link>
        <nav aria-label="Demo navigation">
          <Link href="/" aria-current={active === "home" ? "page" : undefined}>Home</Link>
          <Link href="/showings" aria-current={active === "buyer" ? "page" : undefined}>Find showings</Link>
          <Link href="/my-showings" aria-current={active === "my-showings" ? "page" : undefined}>My showings</Link>
          <Link href="/seller" aria-current={active === "seller" ? "page" : undefined}>Seller dashboard</Link>
        </nav>
      </div>
    </header>
  );
}
