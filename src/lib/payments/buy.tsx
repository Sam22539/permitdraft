// Foundable payments kit: the Buy and Manage subscription buttons, a page's paid access and the browser's checkout and session
// calls, in React, for any page the server renders. Foundable keeps this file and replaces it whole when the kit changes, so never
// edit it.
import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import * as checkout from "./checkout.client";
import * as purchases from "./purchases.client";

// TanStack Start refuses a `.client` file the server's code reaches, and the server renders a page that imports this file, so
// it reads the browser's (purchases.client.ts, checkout.client.ts) only in the browser, where its effects and presses run.
const hasAccess = createClientOnlyFn(purchases.hasAccess);
const onCheckout = createClientOnlyFn(purchases.onCheckout);
const watchSignIn = createClientOnlyFn(purchases.watchSignIn);

/** What a signed_in Buy button says while nobody is signed in, when it sells nothing. */
const signInWords = "Sign in to buy";

export type BuyButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> & {
  /** The price it sells: the sales plan's priceHandle. */
  priceHandle: string;
  /** anyone: a guest may buy. signed_in: the website's own signed-in user buys, and the purchase is theirs wherever they sign in. */
  audience?: "anyone" | "signed_in";
  /** What the button says while it sells: the sales plan's words. */
  children: ReactNode;
  /** What a signed_in button does while nobody is signed in: the website's own way to sign in (its sign-in page or dialog). */
  onSignIn?: () => void;
  /**
   * The page of this website a buyer comes back to once they pay, by its path ("/welcome"): letters, digits and -._~/ only,
   * no query or #. Absent, the home page. A canceled checkout always comes back to the home page.
   */
  paidPage?: string;
};

/**
 * A Buy button: Foundable's checkout opens from its press, which Foundable's Buy script hears by the button's price, so it has
 * no click handler of its own. A signed_in button sells nothing while nobody is signed in: it says "Sign in to buy" and its press
 * goes to onSignIn, so no one pays for a purchase no account holds; it still names the price it will sell (data-foundable-buy-for),
 * which Foundable's checks read, since the Buy attribute is not there yet.
 */
export function BuyButton({ priceHandle, audience = "anyone", children, onSignIn, paidPage, type = "button", disabled, ...rest }: BuyButtonProps) {
  const signedIn = useSignedIn(audience === "signed_in");
  if (audience === "signed_in" && signedIn !== true) {
    return <button type={type} {...rest} disabled={disabled || signedIn === null} data-foundable-buy-for={priceHandle} onClick={() => { onSignIn?.(); }}>{signInWords}</button>;
  }
  return <button type={type} {...rest} disabled={disabled} data-foundable-buy={priceHandle} data-foundable-paid-page={paidPage}>{children}</button>;
}

export type ManageSubscriptionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children"> & {
  /** The subscription's price its subscribers hold, monthly or yearly: the same priceHandle as its Buy button. */
  priceHandle: string;
  /** What the button says, such as "Manage subscription". */
  children: ReactNode;
};

/**
 * A subscriber's Manage subscription button for a subscription's price, which Foundable's Buy script hears by the button's price, so
 * it has no click handler of its own. It finds the subscription of the website's signed-in user, else of the one this browser
 * bought. It opens Stripe's page of the subscriber's own subscription, where they update their card, see their invoices or cancel: a cancel takes effect at the end of the period already paid (the month or the year it renews by), so they keep access until then with no partial refund, and the page changes no plan. A website reads the paid-until date (paid_through), never whether the subscription renews or ends.
 */
export function ManageSubscriptionButton({ priceHandle, children, type = "button", ...rest }: ManageSubscriptionButtonProps) {
  return <button type={type} {...rest} data-foundable-manage-subscription={priceHandle}>{children}</button>;
}

/** Whether someone is signed in (null until the website's backend says), watched only while `watching`. */
function useSignedIn(watching: boolean): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!watching) return;
    return watchSignIn(setSignedIn);
  }, [watching]);
  return signedIn;
}

/**
 * Whether the signed-in user holds paid access to a product (`productHandle`, the sales plan's): null while it is read and
 * where it could not be (hasAccess), read again each time a Buy on the page comes back from its checkout and each time
 * someone signs in or out. While it is null a page shows neither what is paid for nor its Buy, so a buyer whose read failed
 * is never offered what they bought. It only decides what the page shows; what must be withheld is withheld by the data's
 * own policy.
 */
export function useAccess(productHandle: string): boolean | null {
  const [access, setAccess] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    const read = () => { void hasAccess(productHandle).then(held => { if (live) setAccess(held); }); };
    const unwatch = watchSignIn(read);
    const unlisten = onCheckout(read);
    return () => {
      live = false;
      unwatch();
      unlisten();
    };
  }, [productHandle]);
  return access;
}

/**
 * Sends the buyer to Stripe's checkout page for an order the website's server made (checkout.client.ts), from the press that
 * asked for it: call it in the press's own handler, before anything is awaited. It runs in the browser alone.
 */
export const openCheckout = createClientOnlyFn(checkout.openCheckout);

/**
 * The headers a page sends its own server routes with, so their server code knows who asks (purchases.client.ts); none for
 * nobody signed in. It runs in the browser alone, from a press or an effect.
 */
export const sessionHeaders = createClientOnlyFn(purchases.sessionHeaders);
