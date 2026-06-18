import { createFileRoute, Link, useSearch } from "@tanstack/react-router";

// Define the search params to read the error reason from the URL
interface PaymentFailedSearchParams {
  reason?: string;
}

export const Route = createFileRoute("/payment-failed")({
  validateSearch: (search: Record<string, unknown>): PaymentFailedSearchParams => {
    return {
      reason: typeof search.reason === "string" ? search.reason : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Payment Failed — KimFlights" }] }),
  component: PaymentFailed,
});

function PaymentFailed() {
  const { reason } = Route.useSearch();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pt-24 text-center">
      <div className="animate-fade-up max-w-md">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <svg
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-red-500">Payment Declined</p>
        <h1 className="mt-4 text-3xl font-light text-foreground md:text-4xl">
          We couldn't process your payment
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {reason
            ? `The transaction was declined by your bank or the payment provider with the following reason: "${reason}". Please check your card details and ensure you have sufficient funds.`
            : "We were unable to charge the card you provided. Please verify your payment information and try again."}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/checkout"
            className="inline-block rounded-full bg-foreground px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-background transition hover:opacity-90"
          >
            Try Again
          </Link>
          <Link
            to="/"
            className="inline-block rounded-full border border-border bg-transparent px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground transition hover:bg-muted/50"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
