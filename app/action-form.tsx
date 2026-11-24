"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "../features/showings/actions";

type Props = {
  action: (state: ActionState | null, data: FormData) => Promise<ActionState>;
  button: string;
  pending: string;
  children: ReactNode;
};

export function ActionForm({ action, button, pending, children }: Props) {
  const [state, submit, busy] = useActionState(action, null);

  return (
    <form action={submit} className="action-form">
      {children}
      <button disabled={busy}>{busy ? pending : button}</button>
      {state && (
        <p className={`feedback ${state.status}`} role={state.status === "error" ? "alert" : "status"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
