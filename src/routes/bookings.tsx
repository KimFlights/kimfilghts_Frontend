import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchUserBookings, type UserBooking } from "@/services/flightMockApi";
import { getAuthSnapshot } from "@/lib/auth";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "My Bookings — KimFlights" }] }),
  beforeLoad: ({ location }) => {
    const { isAuthenticated } = getAuthSnapshot();
    if (!isAuthenticated) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  component: Bookings,
});

function Bookings() {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        const data = await fetchUserBookings();
        setBookings(data);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  return (
    <main className="min-h-screen bg-background px-6 pt-32 pb-24 md:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline justify-between border-b border-border pb-6">
          <h1 className="text-3xl font-light tracking-tight text-foreground">My Bookings</h1>
        </div>

        {loading ? (
          <div className="mt-12 text-center text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Loading...
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">No bookings found</p>
          </div>
        ) : (
          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 font-medium uppercase tracking-[0.2em] text-muted-foreground">Reference</th>
                  <th className="pb-4 font-medium uppercase tracking-[0.2em] text-muted-foreground">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.bookingReference} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="py-4 font-mono">{b.bookingReference}</td>
                    <td className="py-4 text-deal">${b.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
