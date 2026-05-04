import {
  generateTicket,
  sendTicketOnWhatsApp,
} from "./utils/generateTicket";
const DEMO_ADMIN = {
  email: "shahajitravels@gmail.com",
  password: "shahaji2607",
};

const initialData = {
  buses: [],
  routes: [],
  trips: [],
  customers: [],
  bookings: [],
};

const initialSettings = {
  companyName: "Shahaji Travels",
  supportPhone: "",
  supportEmail: "",
  officeAddress: "",
  currency: "INR",
  timezone: "IST (UTC+5:30)",
  bookingCancellation: "Allowed",
  refundPolicy: "Partial Refund",
  maxSeatsPerBooking: 6,
};

const menu = [
  { key: "dashboard", icon: "📊", label: "Dashboard" },
  { key: "bookings", icon: "🎫", label: "Bookings" },
  { key: "trips", icon: "🗺️", label: "Trips" },
  { key: "buses", icon: "🚍", label: "Buses" },
  { key: "routes", icon: "📍", label: "Routes" },
  { key: "customers", icon: "👥", label: "Customers" },
  { key: "reports", icon: "📈", label: "Reports" },
  { key: "settings", icon: "⚙️", label: "Settings" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("shahaji_admin_logged_in") === "true"
  );
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState({ show: false, text: "", icon: "✅" });

  const [db, setDb] = useState(() => {
    const saved = localStorage.getItem("shahaji_admin_react_ui_db");
    return saved ? JSON.parse(saved) : initialData;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("shahaji_admin_react_ui_settings");
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [bookingFilter, setBookingFilter] = useState("all");

  const persistDb = (next) => {
    setDb(next);
    localStorage.setItem("shahaji_admin_react_ui_db", JSON.stringify(next));
  };

  const persistSettings = (next) => {
    setSettings(next);
    localStorage.setItem("shahaji_admin_react_ui_settings", JSON.stringify(next));
  };

  const showToast = (text, icon = "✅") => {
    setToast({ show: true, text, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2500);
  };

 const handleLogin = async (email, password) => {
  try {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("shahaji_admin_logged_in", "true");
      setIsLoggedIn(true);
      showToast("Login successful", "🔐");
      return { success: true };
    } else {
      return {
        success: false,
        message: data.message || "Invalid credentials",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Backend not connected",
    };
  }
};

  const handleLogout = () => {
    localStorage.removeItem("shahaji_admin_logged_in");
    setIsLoggedIn(false);
    setPage("dashboard");
  };

  const addBus = (bus) => {
    const next = { ...db, buses: [{ id: Date.now(), ...bus }, ...db.buses] };
    persistDb(next);
    showToast(`Bus "${bus.name}" added successfully`, "🚍");
  };

  const deleteBus = (id) => {
    const next = { ...db, buses: db.buses.filter((b) => b.id !== id) };
    persistDb(next);
    showToast("Bus deleted", "🗑️");
  };

  const addRoute = (route) => {
    const next = { ...db, routes: [{ id: Date.now(), ...route }, ...db.routes] };
    persistDb(next);
    showToast(`Route "${route.from} → ${route.to}" added`, "📍");
  };

  const deleteRoute = (id) => {
    const next = { ...db, routes: db.routes.filter((r) => r.id !== id) };
    persistDb(next);
    showToast("Route deleted", "🗑️");
  };

  const addTrip = (trip) => {
    const next = { ...db, trips: [{ id: Date.now(), ...trip }, ...db.trips] };
    persistDb(next);
    showToast(`Trip "${trip.name}" added successfully`, "🗺️");
  };

  const deleteTrip = (id) => {
    const next = { ...db, trips: db.trips.filter((t) => t.id !== id) };
    persistDb(next);
    showToast("Trip deleted", "🗑️");
  };

  const addCustomer = (customer) => {
    const next = {
      ...db,
      customers: [{ id: Date.now(), ...customer }, ...db.customers],
    };
    persistDb(next);
    showToast(`Customer "${customer.name}" added`, "👤");
  };

  const deleteCustomer = (id) => {
    const next = { ...db, customers: db.customers.filter((c) => c.id !== id) };
    persistDb(next);
    showToast("Customer deleted", "🗑️");
  };

  const createDemoBooking = () => {
    if (!db.customers.length || !db.trips.length) {
      showToast("Add at least one customer and one trip first", "⚠️");
      return;
    }

    const customer = db.customers[0];
    const trip = db.trips[0];

    const booking = {
      id: Date.now(),
      customer: customer.name,
      route: trip.route,
      date: trip.date,
      seats: "A1, A2",
      amount: Number(trip.fare || 0) * 2,
      status: "Confirmed",
    };

    const next = { ...db, bookings: [booking, ...db.bookings] };
    persistDb(next);
    showToast("Demo booking created", "🎫");
  };

  const updateBookingStatus = (id, status) => {
    const next = {
      ...db,
      bookings: db.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
    };
    persistDb(next);
    showToast(`Booking ${status}`, status === "Cancelled" ? "❌" : "✅");
  };

  const dashboard = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const totalRevenue = db.bookings
      .filter((b) => b.status === "Confirmed")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return {
      totalBookings: db.bookings.length,
      todayBookings: db.bookings.filter((b) => b.date === today).length,
      totalBuses: db.buses.length,
      customers: db.customers.length,
      trips: db.trips.length,
      revenue: totalRevenue,
    };
  }, [db]);

  const reportStats = useMemo(() => {
    const totalRevenue = db.bookings
      .filter((b) => b.status === "Confirmed")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const confirmed = db.bookings.filter((b) => b.status === "Confirmed").length;
    const pending = db.bookings.filter((b) => b.status === "Pending").length;
    const cancelled = db.bookings.filter((b) => b.status === "Cancelled").length;
    const total = db.bookings.length || 1;

    const routeMap = {};
    db.bookings.forEach((b) => {
      if (!routeMap[b.route]) routeMap[b.route] = { trips: 0, bookings: 0, revenue: 0 };
      routeMap[b.route].bookings += 1;
      routeMap[b.route].revenue += Number(b.amount || 0);
    });

    db.trips.forEach((t) => {
      if (!routeMap[t.route]) routeMap[t.route] = { trips: 0, bookings: 0, revenue: 0 };
      routeMap[t.route].trips += 1;
    });

    return {
      totalBookings: db.bookings.length,
      totalRevenue,
      totalCustomers: db.customers.length,
      activeBuses: db.buses.filter((b) => b.status === "Active").length,
      confirmed,
      pending,
      cancelled,
      confirmedPct: (confirmed / total) * 100,
      pendingPct: (pending / total) * 100,
      cancelledPct: (cancelled / total) * 100,
      topRoutes: Object.entries(routeMap).map(([route, v]) => ({ route, ...v })),
    };
  }, [db]);

  const filteredBookings =
    bookingFilter === "all"
      ? db.bookings
      : db.bookings.filter((b) => b.status.toLowerCase() === bookingFilter.toLowerCase());

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <>
      <div className="admin-body">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🚌</div>
            <div className="logo-title">Shahaji</div>
            <div className="logo-sub">Travels Admin</div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">Main</div>
            {menu.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${page === item.key ? "active" : ""}`}
                onClick={() => setPage(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
                {item.key === "bookings" && (
                  <span className="nav-badge">{db.bookings.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="admin-info">
              <div className="admin-avatar">A</div>
              <div>
                <div className="admin-name">Admin</div>
                <div className="admin-role">Super Admin</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div>
              <div className="topbar-title">Shahaji Travels Admin</div>
              <div className="topbar-sub">Professional bus booking management panel</div>
            </div>
          </header>

          <div className="content">
            {page === "dashboard" && (
              <div className="page">
                <div className="page-header">
                  <h1>Dashboard 📊</h1>
                  <p>Welcome back! Here is your live Shahaji Travels business summary.</p>
                </div>

                <div className="stats-grid">
                  <StatCard icon="🎫" label="Total Bookings" value={dashboard.totalBookings} sub="All bookings" />
                  <StatCard icon="📅" label="Today's Bookings" value={dashboard.todayBookings} sub="Today count" />
                  <StatCard icon="🚍" label="Total Buses" value={dashboard.totalBuses} sub="Fleet count" />
                  <StatCard icon="👥" label="Customers" value={dashboard.customers} sub="Registered users" />
                  <StatCard icon="🗺️" label="Trips" value={dashboard.trips} sub="Running + planned" />
                  <StatCard icon="💰" label="Revenue" value={`₹${dashboard.revenue}`} sub="Total earnings" />
                </div>
              </div>
            )}

            {page === "bookings" && (
              <div className="page">
                <div className="page-header">
                  <h1>Bookings 🎫</h1>
                  <p>Manage all bus ticket bookings</p>
                </div>

                <div className="section-card">
                  <div className="tab-pills">
                    {["all", "Confirmed", "Pending", "Cancelled"].map((s) => (
                      <button
                        key={s}
                        className={`tab-pill ${
                          (s === "all" && bookingFilter === "all") ||
                          bookingFilter === s.toLowerCase()
                            ? "active"
                            : ""
                        }`}
                        onClick={() => setBookingFilter(s === "all" ? "all" : s.toLowerCase())}
                      >
                        {s === "all" ? "All" : s}
                      </button>
                    ))}
                  </div>
                  <div className="section-card">
  <SeatLayout />
</div>

                  <div style={{ marginBottom: 16 }}>
                    <button className="btn-primary" onClick={createDemoBooking}>
                      🎫 Add Demo Booking
                    </button>
                  </div>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#ID</th>
                        <th>Customer</th>
                        <th>Route</th>
                        <th>Trip Date</th>
                        <th>Seats</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b) => (
                        <tr key={b.id}>
                          <td><b>#BK{String(b.id).slice(-3)}</b></td>
                          <td>{b.customer}</td>
                          <td>{b.route}</td>
                          <td>{b.date}</td>
                          <td>{b.seats}</td>
                          <td>₹{b.amount}</td>
                          <td>{statusBadge(b.status)}</td>
                          <td style={{ display: "flex", gap: 6 }}>
                            <button className="btn-sm btn-edit" onClick={() => updateBookingStatus(b.id, "Confirmed")}>✅</button>
                            <button className="btn-sm btn-del" onClick={() => updateBookingStatus(b.id, "Cancelled")}>❌</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!filteredBookings.length && (
                    <div className="empty-state">
                      <div className="empty-icon">🎫</div>
                      <div className="empty-text">No bookings yet.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {page === "buses" && <BusesPage buses={db.buses} addBus={addBus} deleteBus={deleteBus} />}
            {page === "routes" && <RoutesPage routes={db.routes} addRoute={addRoute} deleteRoute={deleteRoute} />}
            {page === "trips" && <TripsPage trips={db.trips} addTrip={addTrip} deleteTrip={deleteTrip} />}
            {page === "customers" && <CustomersPage customers={db.customers} addCustomer={addCustomer} deleteCustomer={deleteCustomer} />}
            {page === "reports" && <ReportsPage reportStats={reportStats} />}
            {page === "settings" && (
              <SettingsPage
                settings={settings}
                setSettings={persistSettings}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      <div className={`toast ${toast.show ? "show" : ""}`}>
        <span>{toast.icon}</span>
        <span>{toast.text}</span>
      </div>
    </>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const result = onLogin(email, password);
    if (!result.success) setError(result.message);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🚌</div>
        <h1>Shahaji Travels Admin</h1>
        <p>Login to continue</p>

        <form onSubmit={submit} className="login-form">
          <input
            className="form-input"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="form-input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" className="btn-primary login-btn">
            🔐 Login
          </button>
        </form>

        <div className="login-demo">
          <b>Demo Login</b>
          <div>Email: admin@shahajitravels.com</div>
          <div>Password: 123456</div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-val">{value}</div>
      {sub ? (
        <div className="stat-sub">
          <span className="stat-change neutral">{sub}</span>
        </div>
      ) : null}
    </div>
  );
}

function ReportsPage({ reportStats }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Reports 📈</h1>
        <p>Business analytics & insights</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <StatCard icon="🎫" label="Total Bookings" value={reportStats.totalBookings} />
        <StatCard icon="💰" label="Total Revenue" value={`₹${reportStats.totalRevenue}`} />
        <StatCard icon="👥" label="Customers" value={reportStats.totalCustomers} />
        <StatCard icon="🚍" label="Active Buses" value={reportStats.activeBuses} />
      </div>
    </div>
  );
}

function BusesPage({ buses, addBus, deleteBus }) {
  const [form, setForm] = useState({
    name: "",
    number: "",
    type: "AC",
    category: "Sleeper",
    totalSeats: "",
    availSeats: "",
    status: "Active",
  });

  const submit = () => {
    if (!form.name || !form.number || !form.totalSeats || !form.availSeats) return;
    addBus(form);
    setForm({
      name: "",
      number: "",
      type: "AC",
      category: "Sleeper",
      totalSeats: "",
      availSeats: "",
      status: "Active",
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Buses 🚍</h1>
        <p>Manage your entire fleet</p>
      </div>

      <div className="form-card">
        <div className="form-title">Add New Bus</div>
        <div className="form-grid">
          <Input label="Bus Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Enter bus name" />
          <Input label="Bus Number" value={form.number} onChange={(v) => setForm({ ...form, number: v })} placeholder="Enter bus number" />
          <Select label="Bus Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={["AC", "Non-AC", "Sleeper", "Semi-Sleeper", "Volvo"]} />
          <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={["Sleeper", "Seater", "Luxury"]} />
          <Input label="Total Seats" value={form.totalSeats} onChange={(v) => setForm({ ...form, totalSeats: v })} placeholder="Enter total seats" type="number" />
          <Input label="Available Seats" value={form.availSeats} onChange={(v) => setForm({ ...form, availSeats: v })} placeholder="Enter available seats" type="number" />
          <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["Active", "Inactive", "Maintenance"]} />
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>🚍 Add Bus</button>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Bus List</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Number</th>
              <th>Type</th>
              <th>Category</th>
              <th>Seats</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buses.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.number}</td>
                <td>{b.type}</td>
                <td>{b.category}</td>
                <td>{b.availSeats}/{b.totalSeats}</td>
                <td>{statusBadge(b.status)}</td>
                <td>
                  <button className="btn-sm btn-del" onClick={() => deleteBus(b.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoutesPage({ routes, addRoute, deleteRoute }) {
  const [form, setForm] = useState({
    from: "",
    to: "",
    dist: "",
    dur: "",
    board: "",
    drop: "",
    status: "Active",
  });

  const submit = () => {
    if (!form.from || !form.to || !form.dist || !form.dur || !form.board || !form.drop) return;
    addRoute(form);
    setForm({ from: "", to: "", dist: "", dur: "", board: "", drop: "", status: "Active" });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Routes 📍</h1>
      </div>

      <div className="form-card">
        <div className="form-title">Add New Route</div>
        <div className="form-grid">
          <Input label="From" value={form.from} onChange={(v) => setForm({ ...form, from: v })} placeholder="Enter from city" />
          <Input label="To" value={form.to} onChange={(v) => setForm({ ...form, to: v })} placeholder="Enter to city" />
          <Input label="Distance" value={form.dist} onChange={(v) => setForm({ ...form, dist: v })} placeholder="230 km" />
          <Input label="Duration" value={form.dur} onChange={(v) => setForm({ ...form, dur: v })} placeholder="5 hrs" />
          <Input label="Boarding" value={form.board} onChange={(v) => setForm({ ...form, board: v })} placeholder="Boarding point" />
          <Input label="Dropping" value={form.drop} onChange={(v) => setForm({ ...form, drop: v })} placeholder="Dropping point" />
          <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["Active", "Inactive"]} />
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>📍 Add Route</button>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Route List</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Distance</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id}>
                <td>{r.from}</td>
                <td>{r.to}</td>
                <td>{r.dist}</td>
                <td>{r.dur}</td>
                <td>{statusBadge(r.status)}</td>
                <td>
                  <button className="btn-sm btn-del" onClick={() => deleteRoute(r.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TripsPage({ trips, addTrip, deleteTrip }) {
  const [form, setForm] = useState({
    name: "",
    bus: "",
    route: "",
    date: "",
    dep: "",
    arr: "",
    fare: "",
    seats: "",
    status: "Active",
  });

  const submit = () => {
    if (!form.name || !form.bus || !form.route || !form.date) return;
    addTrip(form);
    setForm({
      name: "",
      bus: "",
      route: "",
      date: "",
      dep: "",
      arr: "",
      fare: "",
      seats: "",
      status: "Active",
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Trips 🗺️</h1>
      </div>

      <div className="form-card">
        <div className="form-title">Add New Trip</div>
        <div className="form-grid">
          <Input label="Trip Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Trip name" />
          <Input label="Bus Name" value={form.bus} onChange={(v) => setForm({ ...form, bus: v })} placeholder="Bus name" />
          <Input label="Route Name" value={form.route} onChange={(v) => setForm({ ...form, route: v })} placeholder="Route name" />
          <Input label="Travel Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />
          <Input label="Departure Time" value={form.dep} onChange={(v) => setForm({ ...form, dep: v })} type="time" />
          <Input label="Arrival Time" value={form.arr} onChange={(v) => setForm({ ...form, arr: v })} type="time" />
          <Input label="Fare" value={form.fare} onChange={(v) => setForm({ ...form, fare: v })} type="number" placeholder="Fare" />
          <Input label="Seats" value={form.seats} onChange={(v) => setForm({ ...form, seats: v })} type="number" placeholder="Seats" />
          <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["Active", "Scheduled", "Completed", "Cancelled"]} />
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>🗺️ Add Trip</button>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Trip List</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Bus</th>
              <th>Route</th>
              <th>Date</th>
              <th>Fare</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.bus}</td>
                <td>{t.route}</td>
                <td>{t.date}</td>
                <td>₹{t.fare}</td>
                <td>{statusBadge(t.status)}</td>
                <td>
                  <button className="btn-sm btn-del" onClick={() => deleteTrip(t.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomersPage({ customers, addCustomer, deleteCustomer }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    bookings: 0,
    status: "Active",
  });

  const submit = () => {
    if (!form.name || !form.phone || !form.email || !form.city) return;
    addCustomer(form);
    setForm({ name: "", phone: "", email: "", city: "", bookings: 0, status: "Active" });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Customers 👥</h1>
      </div>

      <div className="form-card">
        <div className="form-title">Add New Customer</div>
        <div className="form-grid">
          <Input label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Phone" />
          <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="Email" />
          <Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="City" />
          <Input label="Bookings" value={form.bookings} onChange={(v) => setForm({ ...form, bookings: v })} type="number" placeholder="0" />
          <Select label="Status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={["Active", "Inactive"]} />
        </div>
        <div className="form-actions">
          <button className="btn-primary" onClick={submit}>👤 Add Customer</button>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">Customer List</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
              <th>Bookings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.city}</td>
                <td>{c.bookings}</td>
                <td>{statusBadge(c.status)}</td>
                <td>
                  <button className="btn-sm btn-del" onClick={() => deleteCustomer(c.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPage({ settings, setSettings, showToast }) {
  const update = (key, value) => setSettings({ ...settings, [key]: value });

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings ⚙️</h1>
        <p>Manage Shahaji Travels system settings</p>
      </div>

      <div className="form-card">
        <div className="form-title">General Settings</div>
        <div className="form-grid">
          <Input label="Company Name" value={settings.companyName} onChange={(v) => update("companyName", v)} placeholder="Shahaji Travels" />
          <Input label="Support Phone" value={settings.supportPhone} onChange={(v) => update("supportPhone", v)} placeholder="+91 XXXXX XXXXX" />
          <Input label="Support Email" value={settings.supportEmail} onChange={(v) => update("supportEmail", v)} placeholder="support@shahajitravel.com" />
          <Input label="Office Address" value={settings.officeAddress} onChange={(v) => update("officeAddress", v)} placeholder="Office address" />
          <Select label="Currency" value={settings.currency} onChange={(v) => update("currency", v)} options={["INR", "USD", "EUR"]} />
          <Select label="Timezone" value={settings.timezone} onChange={(v) => update("timezone", v)} options={["IST (UTC+5:30)", "UTC"]} />
        </div>

        <div className="form-actions">
          <button className="btn-primary" onClick={() => showToast("Settings saved successfully", "💾")}>
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function statusBadge(status) {
  const cls =
    status === "Active" || status === "Confirmed"
      ? "badge badge-green"
      : status === "Pending"
      ? "badge badge-yellow"
      : status === "Cancelled" || status === "Inactive"
      ? "badge badge-red"
      : "badge badge-blue";

  return <span className={cls}>{status}</span>;
}
const sendTicketAutomatically = async (booking) => {
  try {
    const res = await fetch("http://localhost:5000/api/send-ticket-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(booking),
    });

    const data = await res.json();

    if (data.success) {
      showToast("Ticket WhatsApp var pathavla", "💬");
    } else {
      showToast(data.message || "WhatsApp send failed", "❌");
    }
  } catch (error) {
    showToast("Server error while sending ticket", "❌");
  }
};