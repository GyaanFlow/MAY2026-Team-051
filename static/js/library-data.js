/**
 * LibraryData — shared dummy data + helpers for the Study Library front end.
 * This is demo data only. Replace with real API calls once the backend exists.
 */
const LibraryData = (function () {

  const ZONES = ['Hall A', 'Hall B', 'Hall C', 'Silent Zone'];

  const TIME_SLOTS = [
    { id: 'slot-1', label: '08:00 – 10:00', start: 8, end: 10 },
    { id: 'slot-2', label: '10:00 – 12:00', start: 10, end: 12 },
    { id: 'slot-3', label: '12:00 – 14:00', start: 12, end: 14 },
    { id: 'slot-4', label: '14:00 – 16:00', start: 14, end: 16 },
    { id: 'slot-5', label: '16:00 – 18:00', start: 16, end: 18 },
    { id: 'slot-6', label: '18:00 – 20:00', start: 18, end: 20 }
  ];

  const STATUS_LABELS = {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    maintenance: 'Unavailable'
  };

  // Deterministic-ish seed so the demo looks the same on every load,
  // but still varied across seats/rooms.
  function seededStatus(index) {
    const cycle = ['available', 'available', 'occupied', 'reserved', 'available', 'occupied'];
    if (index % 17 === 0) return 'maintenance';
    return cycle[index % cycle.length];
  }

  function generateSeats() {
    const seats = [];
    let counter = 0;

    // Individual study seats across three halls
    ZONES.slice(0, 3).forEach((zone, zIdx) => {
      const seatsPerZone = 8;
      for (let i = 1; i <= seatsPerZone; i++) {
        seats.push({
          id: `seat-${zIdx}-${i}`,
          name: `${zone} · Seat ${i}`,
          zone,
          type: 'seat',
          capacity: 1,
          hasPower: i % 2 === 0,
          status: seededStatus(counter)
        });
        counter++;
      }
    });

    // Silent zone individual seats
    for (let i = 1; i <= 6; i++) {
      seats.push({
        id: `seat-silent-${i}`,
        name: `Silent Zone · Seat ${i}`,
        zone: 'Silent Zone',
        type: 'seat',
        capacity: 1,
        hasPower: true,
        status: seededStatus(counter)
      });
      counter++;
    }

    // Group study rooms
    const rooms = [
      { name: 'Study Room 101', zone: 'Hall A', capacity: 4 },
      { name: 'Study Room 102', zone: 'Hall A', capacity: 6 },
      { name: 'Study Room 201', zone: 'Hall B', capacity: 4 },
      { name: 'Study Room 202', zone: 'Hall B', capacity: 8 },
      { name: 'Study Room 301', zone: 'Hall C', capacity: 4 }
    ];
    rooms.forEach((room, i) => {
      seats.push({
        id: `room-${i}`,
        name: room.name,
        zone: room.zone,
        type: 'room',
        capacity: room.capacity,
        hasPower: true,
        status: seededStatus(counter)
      });
      counter++;
    });

    return seats;
  }

  function todayStr() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function slotById(id) {
    return TIME_SLOTS.find((s) => s.id === id);
  }

  function slotDateTime(dateStr, slotId, which) {
    const slot = slotById(slotId);
    if (!slot) return null;
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(which === 'end' ? slot.end : slot.start, 0, 0, 0);
    return d;
  }

  return {
    ZONES,
    TIME_SLOTS,
    STATUS_LABELS,
    generateSeats,
    todayStr,
    addDays,
    formatDateLabel,
    slotById,
    slotDateTime
  };
})();
