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

  function seededStatus(index) {
    const cycle = ['available', 'available', 'occupied', 'reserved', 'available', 'occupied'];
    if (index % 17 === 0) return 'maintenance';
    return cycle[index % cycle.length];
  }

  function generateSeats() {
    const seats = [];
    let counter = 0;

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

  const COMPLAINT_CATEGORIES = [
    'Seating & Furniture',
    'Wi-Fi / Internet',
    'Noise Disturbance',
    'Cleanliness & Hygiene',
    'Staff Behavior',
    'Billing / Payment',
    'Other'
  ];

  const COMPLAINT_STATUS_LABELS = {
    open: 'Open',
    'in-progress': 'In Progress',
    resolved: 'Resolved'
  };

  function seedComplaints() {
    return [
      {
        id: 'CMP-6001',
        studentName: 'Ananya Sharma',
        studentId: 'STU-2026-0142',
        category: 'Wi-Fi / Internet',
        subject: 'Wi-Fi keeps disconnecting in Hall B',
        description: 'The Wi-Fi signal near Hall B, Seat 3 drops every 10–15 minutes, which makes it hard to attend online classes.',
        status: 'open',
        date: '2026-07-18',
        resolutionNote: '',
        resolvedBy: ''
      },
      {
        id: 'CMP-6002',
        studentName: 'Vikram Singh',
        studentId: 'STU-2026-0150',
        category: 'Noise Disturbance',
        subject: 'Loud conversations near Hall A',
        description: 'A group near Hall A, Seat 6 has been talking loudly for the past few sessions, disturbing nearby students.',
        status: 'in-progress',
        date: '2026-07-15',
        resolutionNote: 'Spoke with the group and moved them to a discussion room.',
        resolvedBy: 'Rohan Mehta'
      },
      {
        id: 'CMP-6003',
        studentName: 'Neha Joshi',
        studentId: 'STU-2026-0151',
        category: 'Cleanliness & Hygiene',
        subject: 'Desk was left uncleaned',
        description: 'Study Room 202 had food wrappers left on the desk from the previous booking.',
        status: 'resolved',
        date: '2026-07-10',
        resolutionNote: 'Housekeeping notified; desk cleaned and room inspected before each new booking.',
        resolvedBy: 'Rohan Mehta'
      }
    ];
  }

  function complaintStatusBadgeClass(status) {
    if (status === 'resolved') return 'badge-success';
    if (status === 'in-progress') return 'badge-warning';
    return 'badge-danger';
  }

  const ANNOUNCEMENT_AUDIENCES = [
    { id: 'all', label: 'Everyone' },
    { id: 'students', label: 'Students Only' },
    { id: 'staff', label: 'Staff Only' }
  ];

  const ANNOUNCEMENT_PRIORITIES = ['Normal', 'Important', 'Urgent'];

  function seedAnnouncements() {
    return [
      {
        id: 'ANN-101',
        title: 'Library closed on 15th August',
        message: 'The library will remain closed on 15th August for Independence Day. Bookings for that date have been disabled.',
        audience: 'all',
        priority: 'Important',
        createdBy: 'Priya Nair',
        createdAt: '2026-07-19',
        active: true
      },
      {
        id: 'ANN-102',
        title: 'New Silent Zone seating added',
        message: '10 additional seats have been added to the Silent Zone with power outlets at every desk.',
        audience: 'students',
        priority: 'Normal',
        createdBy: 'Priya Nair',
        createdAt: '2026-07-16',
        active: true
      },
      {
        id: 'ANN-103',
        title: 'Updated unarrived grace period policy',
        message: 'Staff should wait the full 15-minute grace period before marking a booking as unarrived and releasing the seat.',
        audience: 'staff',
        priority: 'Normal',
        createdBy: 'Priya Nair',
        createdAt: '2026-07-12',
        active: true
      }
    ];
  }

  function announcementPriorityBadgeClass(priority) {
    if (priority === 'Urgent') return 'badge-danger';
    if (priority === 'Important') return 'badge-warning';
    return 'badge-muted';
  }

  function resolveSeatZone(seatNumber, zones) {
    const num = parseInt(String(seatNumber || '').replace(/\D/g, ''), 10);
    const list = Array.isArray(zones) ? zones.filter((z) => z && z.zone && Number(z.seats) > 0) : [];
    if (num && list.length) {
      let cursor = 0;
      for (const zone of list) {
        cursor += Number(zone.seats);
        if (num <= cursor) return zone.zone;
      }
      return list[list.length - 1].zone;
    }
    if (!num) return 'Library';
    if (num <= 8) return 'Hall A';
    if (num <= 16) return 'Hall B';
    return 'Silent Zone';
  }

  function seatLabel(seatNumber, zones) {
    const num = parseInt(String(seatNumber || '').replace(/\D/g, ''), 10);
    const zone = resolveSeatZone(seatNumber, zones);
    if (!num) return seatNumber || 'Seat';
    return `${zone} · Seat ${num}`;
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
    slotDateTime,
    resolveSeatZone,
    seatLabel,

    COMPLAINT_CATEGORIES,
    COMPLAINT_STATUS_LABELS,
    seedComplaints,
    complaintStatusBadgeClass,

    ANNOUNCEMENT_AUDIENCES,
    ANNOUNCEMENT_PRIORITIES,
    seedAnnouncements,
    announcementPriorityBadgeClass
  };
})();
