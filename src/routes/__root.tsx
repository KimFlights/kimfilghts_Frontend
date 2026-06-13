import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-light tracking-tight text-foreground">404</h1>
        <p className="mt-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">Page not found</p>
        <div className="mt-8">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-80">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-medium text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:opacity-80">Retry</button>
          <a href="/" className="rounded-full border border-border px-6 py-3 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-accent">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aero — Next-Generation Flight Booking" },
      { name: "description", content: "Cinematic flight discovery. Find premium deals and curate multi-city itineraries effortlessly." },
      { property: "og:title", content: "Aero — Next-Generation Flight Booking" },
      { property: "og:description", content: "Cinematic flight discovery. Find premium deals and curate multi-city itineraries effortlessly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
          KIMFLIGHTS
        </Link>
        <div className="hidden gap-8 md:flex">
          <Link to="/" className="text-xs uppercase tracking-[0.2em] text-foreground/80 hover:text-foreground">Discover</Link>
          <Link to="/admin" className="text-xs uppercase tracking-[0.2em] text-foreground/80 hover:text-foreground">Admin</Link>
          <Link to="/login" className="text-xs uppercase tracking-[0.2em] text-foreground/80 hover:text-foreground">Members</Link>
        </div>
        <Link to="/login" className="text-xs uppercase tracking-[0.2em] text-foreground/80 hover:text-foreground">Sign in</Link>
      </nav>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Nav />
      <Outlet />
    </QueryClientProvider>
  );
}
