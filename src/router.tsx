import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./route-tree.gen";

export function getRouter() {
  // A visitor who scrolled a page before its code arrived stays where they are as it takes over: on a fresh visit the
  // router's first render scrolls the window to the top (TanStack Router issue 8933), which threw a slow phone's visitor
  // back to the top mid-page. So that render, of the very history entry the visitor opened, leaves the window alone, as
  // the browser does, never scrolling it, so a finger still moving keeps going. A reload or Back (where the router puts
  // back the saved place), a page opened at a #section, a move before that render and every later move scroll as the
  // router does.
  let hydrating = typeof window !== "undefined" && !location.hash
    && (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "navigate";
  let opened: { pathname: string; index: number } | undefined;
  let held = false;
  const router = createRouter({
    routeTree,
    scrollRestoration: ({ location: at }) => {
      held = hydrating && at.pathname === opened?.pathname && at.state.__TSR_index === opened.index && !at.hash;
      return !held;
    },
    defaultPreload: "intent",
  });
  if (hydrating) {
    opened = { pathname: router.latestLocation.pathname, index: router.latestLocation.state.__TSR_index };
    // Subscribed after the router's own scroll handling, so it ends the hold once that first render is done.
    const rendered = router.subscribe("onRendered", () => {
      rendered();
      hydrating = false;
      // The router keeps a page's place only from a scroll it hears after a render, and none came: tell it the window's
      // place, so Back to this page or a reload returns there.
      if (held && (scrollX || scrollY)) document.dispatchEvent(new Event("scroll"));
    });
  }
  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
