import sqlite3

def create_database():
    conn = sqlite3.connect('shahaji.db')
    c = conn.cursor()

    # Users Table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Buses Table
    c.execute('''CREATE TABLE IF NOT EXISTS buses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus_name TEXT NOT NULL,
        bus_number TEXT UNIQUE NOT NULL,
        bus_type TEXT NOT NULL,
        total_seats INTEGER NOT NULL,
        amenities TEXT
    )''')

    # Routes Table
    c.execute('''CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_city TEXT NOT NULL,
        to_city TEXT NOT NULL,
        distance_km INTEGER,
        duration_hrs REAL
    )''')

    # Schedules Table
    c.execute('''CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus_id INTEGER,
        route_id INTEGER,
        departure_time TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        travel_date TEXT NOT NULL,
        price REAL NOT NULL,
        available_seats INTEGER,
        FOREIGN KEY (bus_id) REFERENCES buses(id),
        FOREIGN KEY (route_id) REFERENCES routes(id)
    )''')

    # Bookings Table
    c.execute('''CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        schedule_id INTEGER,
        seat_numbers TEXT NOT NULL,
        passenger_name TEXT NOT NULL,
        passenger_phone TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_status TEXT DEFAULT 'pending',
        booking_status TEXT DEFAULT 'confirmed',
        pnr TEXT UNIQUE NOT NULL,
        booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    )''')

    # Sample Buses
    c.execute('''INSERT OR IGNORE INTO buses 
        (bus_name, bus_number, bus_type, total_seats, amenities)
        VALUES 
        ("शाहाजी Express", "MH-12-AB-1234", "Premium AC", 40, "AC,WiFi,Charging"),
        ("शाहाजी Sleeper", "MH-12-CD-5678", "AC Sleeper", 30, "AC,Sleeper,Charging"),
        ("शाहाजी Economy", "MH-12-EF-9012", "Semi-Sleeper", 45, "AC,Water")
    ''')

    # Sample Routes
    c.execute('''INSERT OR IGNORE INTO routes
        (from_city, to_city, distance_km, duration_hrs)
        VALUES
        ("पुणे", "मुंबई", 150, 3.5),
        ("मुंबई", "नाशिक", 170, 4.0),
        ("पुणे", "गोवा", 450, 8.0),
        ("मुंबई", "हैदराबाद", 710, 12.0),
        ("नाशिक", "पुणे", 210, 4.5)
    ''')

    # Sample Schedules
    c.execute('''INSERT OR IGNORE INTO schedules
        (bus_id, route_id, departure_time, arrival_time, travel_date, price, available_seats)
        VALUES
        (1, 1, "06:00", "09:30", "2024-03-05", 450, 40),
        (2, 1, "22:00", "02:00", "2024-03-05", 700, 30),
        (3, 1, "08:30", "13:00", "2024-03-05", 250, 45),
        (1, 2, "07:00", "11:00", "2024-03-05", 400, 40),
        (3, 3, "20:00", "04:00", "2024-03-05", 600, 45)
    ''')

    conn.commit()
    conn.close()
    print("✅ Database तयार झाला!")
    print("✅ Buses add झाल्या!")
    print("✅ Routes add झाले!")
    print("✅ Schedules add झाले!")
    print("🎉 shahaji.db file बनली!")

if __name__ == '__main__':
    create_database()
