import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import "../styles.css";
import { LangProvider } from "../lib/lang";

// Link previews read the Open Graph and X tags below; og:title and og:description repeat the page's own title and description.
const title = "PermitDraft — traceable permit drafts for HVAC offices";
const description = "See how a heat-pump change-out job becomes a permit draft where every value traces to its confirmed source.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title },
      { name: "description", content: description },
      { name: "author", content: "Foundable" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@joinfoundable" },
    ],
    links: [
      { rel: "icon", href: "/generated-assets/company-logo.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@600;700&display=swap" },
    ],
  }),
  component: WebsiteDocument,
  notFoundComponent: () => (
    <main className="not-found">
      <h1>Page not found</h1>
      <Link to="/">Return home</Link>
    </main>
  ),
});

function WebsiteDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <LangProvider><Outlet /></LangProvider>
        <Scripts />
      </body>
    </html>
  );
}
