import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signIn } from "../../../features/seller/actions";
import { demoSeller, hasSellerSession } from "../../../features/seller/session";
import { ActionForm } from "../../action-form";
import { Navigation } from "../../navigation";

export const metadata: Metadata = { title: "Seller sign-in" };

export default async function SellerLogin() {
  if (await hasSellerSession()) redirect("/seller");

  return (
    <>
      <Navigation active="seller" />
      <main className="shell login-page">
        <section className="panel login-card" aria-labelledby="login-heading">
          <h1 id="login-heading">Seller sign-in</h1>
          <p className="muted">Sign in to publish listings, manage showing times, and see recent bookings.</p>
          <ActionForm action={signIn} button="Sign in" pending="Signing in…">
            <label>Username<input name="username" autoComplete="username" required maxLength={60} /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={120} /></label>
          </ActionForm>
          <div className="demo-credentials">
            <strong>Demo credentials</strong>
            <dl>
              <div><dt>Username</dt><dd><code>{demoSeller.username}</code></dd></div>
              <div><dt>Password</dt><dd><code>{demoSeller.password}</code></dd></div>
            </dl>
          </div>
        </section>
      </main>
    </>
  );
}
