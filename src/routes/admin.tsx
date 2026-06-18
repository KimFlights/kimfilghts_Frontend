import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, MoreHorizontal, Ban, CheckCircle2, LogOut } from "lucide-react";
import {
  ADMIN_FLIGHTS,
  ADMIN_BOOKINGS,
  ADMIN_USERS,
  type AdminFlight,
  type AdminUser,
} from "@/domains/admin/mockData";
import { useAuth, getAuthSnapshot } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — KimFlights" }] }),
  beforeLoad: ({ location }) => {
    const { isAuthenticated, user } = getAuthSnapshot();
    if (!isAuthenticated || user?.role !== "ADMIN") {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
  },
  component: Admin,
});

function Admin() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-24">
      <section className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="animate-fade-up flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Console · {user?.username}
            </p>
            <h1 className="mt-2 text-4xl font-light tracking-tight text-foreground md:text-5xl">
              Admin Dashboard
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>

        <Tabs defaultValue="flights" className="mt-10">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="flights">Flights</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="flights">
            <FlightsTab />
          </TabsContent>
          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function FlightsTab() {
  const [flights, setFlights] = useState<AdminFlight[]>(ADMIN_FLIGHTS);
  const addFlight = () => {
    const id = String(Date.now());
    setFlights([
      {
        id,
        flightNumber: `NEW${flights.length + 1}`,
        route: "— → —",
        departure: new Date().toISOString().slice(0, 16).replace("T", " "),
        price: 0,
        seats: 0,
      },
      ...flights,
    ]);
  };
  const remove = (id: string) => setFlights(flights.filter((f) => f.id !== id));

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <p className="text-sm text-muted-foreground">{flights.length} flights</p>
        <button
          onClick={addFlight}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-background hover:opacity-90"
        >
          <Plus className="h-3 w-3" /> Add flight
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flight</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Departure</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Seats</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flights.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-mono text-xs">{f.flightNumber}</TableCell>
              <TableCell>{f.route}</TableCell>
              <TableCell className="text-muted-foreground">{f.departure}</TableCell>
              <TableCell>${f.price}</TableCell>
              <TableCell>{f.seats}</TableCell>
              <TableCell className="text-right">
                <button className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => remove(f.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function BookingsTab() {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PNR</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ADMIN_BOOKINGS.map((b) => (
            <TableRow key={b.pnr}>
              <TableCell className="font-mono text-xs">{b.pnr}</TableCell>
              <TableCell>{b.email}</TableCell>
              <TableCell>{b.route}</TableCell>
              <TableCell className="text-muted-foreground">{b.date}</TableCell>
              <TableCell>${b.total}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${
                    b.status === "Confirmed"
                      ? "bg-deal/15 text-deal"
                      : b.status === "Cancelled"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {b.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>(ADMIN_USERS);
  const toggle = (id: string) =>
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Banned" : "Active" } : u,
      ),
    );
  return (
    <div className="mt-6 rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell className="text-muted-foreground">{u.joined}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${u.status === "Active" ? "bg-deal/15 text-deal" : "bg-destructive/15 text-destructive"}`}
                >
                  {u.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem onClick={() => toggle(u.id)} className="cursor-pointer">
                      {u.status === "Active" ? (
                        <>
                          <Ban className="mr-2 h-3 w-3" /> Ban user
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-3 w-3" /> Reinstate
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
