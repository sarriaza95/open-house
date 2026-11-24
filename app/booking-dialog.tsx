"use client";

import { useId, useRef } from "react";
import { bookShowing } from "../features/showings/actions";
import { ActionForm } from "./action-form";

export function BookingDialog({ title, slots }: { title: string; slots: { id: string; label: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()}>Choose a showing</button>
      <dialog ref={dialog} className="booking-dialog" aria-labelledby={heading}>
        <div className="dialog-header">
          <div>
            <h2 id={heading}>Book a showing</h2>
            <p className="muted">{title}</p>
          </div>
          <button type="button" className="secondary" onClick={() => dialog.current?.close()}>Close</button>
        </div>
        <ActionForm action={bookShowing} button="Book showing" pending="Booking…">
          <label>Showing time
            <select name="slotId" required>
              {slots.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
            </select>
          </label>
          <small>Times shown in Guatemala time.</small>
          <label>Full name<input name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>
          <label>Mobile number<input name="phone" type="tel" autoComplete="tel" placeholder="+502 5555 1234" required maxLength={30} /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        </ActionForm>
      </dialog>
    </>
  );
}
