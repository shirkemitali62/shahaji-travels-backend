export const BUSES = [
  {
    _id: '1',
    name: 'Shahaji Express',
    number: 'MH12AB1234',
    type: 'AC Sleeper',
    departure: '09:00 PM',
    arrival: '05:30 AM',
    totalSeats: 36,
    price: 900,
    rating: 4.6,
    route: { from: 'Ravet', to: 'Mumbai' },
    boardingPoints: ['Ravet', 'Nigdi', 'Shivaji Nagar'],
    droppingPoints: ['Dadar', 'Ghatkopar', 'Borivali']
  },
  {
    _id: '2',
    name: 'Shahaji Premium',
    number: 'MH14CD5678',
    type: 'Non AC Sleeper',
    departure: '10:15 PM',
    arrival: '06:10 AM',
    totalSeats: 30,
    price: 750,
    rating: 4.3,
    route: { from: 'Pune', to: 'Mumbai' },
    boardingPoints: ['Pune Station', 'Shivaji Nagar', 'Swargate'],
    droppingPoints: ['Dadar', 'Ghatkopar', 'Borivali']
  },
  {
    _id: '3',
    name: 'Shahaji Royal',
    number: 'MH10EF3321',
    type: 'Sleeper Seater',
    departure: '08:30 PM',
    arrival: '04:45 AM',
    totalSeats: 36,
    price: 820,
    rating: 4.5,
    route: { from: 'Sangli', to: 'Mumbai' },
    boardingPoints: ['Sangli', 'Miraj', 'Karad'],
    droppingPoints: ['Dadar', 'Ghatkopar']
  }
];
