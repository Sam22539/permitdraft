// Foundable payments kit: sends the buyer to Stripe's checkout page for an order the website's server made. Foundable keeps
// this file and replaces it whole when the kit changes, so never edit it. A page imports openCheckout from buy.tsx, which reaches
// this file in the browser alone, since TanStack Start refuses a `.client` file the server's code reaches.

/**
 * Opens Stripe's checkout page for an order, from the press that asked for it: `start` asks the website's own server to make the
 * order (a server function that calls createOrder from orders.server.ts) and answers it. On the website the page goes to
 * Stripe's page; in Build's preview, which cannot show Stripe's page inside it, Build takes the order from there, lets the tester
 * pay it and brings them back to Build; and Foundable's own check of the website as its visitors see it, which makes no real
 * order, stops it as it is asked (`stopped`), so `start` never runs and nothing fails, the page showing no error. Call it in the
 * press's own handler, before anything is awaited, so a tab Build opens for it may open; it rejects with
 * what `start` rejected with, or where the order can no longer be paid.
 */
export async function openCheckout(start: () => Promise<{ url: string | null }>): Promise<void> {
  // Build's preview answers this ask as it is made, so the page knows whether a new tab or the page itself goes to Stripe, and
  // Foundable's check of the website stops the order there.
  const ask = { taken: false, stopped: false };
  document.dispatchEvent(new CustomEvent("foundable:order-checkout", { detail: { phase: "start", ask } }));
  const say = (detail: { phase: "open"; url: string } | { phase: "fail"; reason?: string } | { phase: "stopped" }) => {
    if (ask.taken) document.dispatchEvent(new CustomEvent("foundable:order-checkout", { detail }));
  };
  if (ask.stopped) {
    say({ phase: "stopped" });
    return;
  }
  try {
    const { url } = await start();
    if (!url) throw new Error("This order can no longer be paid.");
    if (ask.taken) say({ phase: "open", url });
    else window.location.assign(url);
  } catch (error) {
    // Why it failed, as the page hears it, so Foundable's own check of the website can say why too.
    say({ phase: "fail", ...(error instanceof Error ? { reason: error.message } : {}) });
    throw error;
  }
}
