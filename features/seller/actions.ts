"use server";

import { redirect } from "next/navigation";
import type { ActionState } from "../showings/actions";
import { demoSeller, endSellerSession, startSellerSession } from "./session";

export async function signIn(_: ActionState | null, form: FormData): Promise<ActionState> {
  if (form.get("username") !== demoSeller.username || form.get("password") !== demoSeller.password) {
    return { status: "error", message: "The username or password is incorrect." };
  }
  await startSellerSession();
  redirect("/seller");
}

export async function signOut() {
  await endSellerSession();
  redirect("/seller/login");
}
