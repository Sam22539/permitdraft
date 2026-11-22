import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/permit/hp-1187")({
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/sample-job", search: location.search as never, hash: location.hash || undefined, replace: true });
  },
});
