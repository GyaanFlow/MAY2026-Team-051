/**
 * LibraryData — shared dummy data + helpers for the Study Library front end.
 * This is demo data only. Replace with real API calls once the backend exists.
 */
const LibraryData = (function () {

  const ZONES = ['Hall A', 'Hall B', 'Hall C', 'Silent Zone'];

  let TIME_SLOTS = [
    { id: 'slot-1', label: '08:00 – 10:00', start: 8, end: 10, startTime: '08:00', endTime: '10:00' },
    { id: 'slot-2', label: '10:00 – 12:00', start: 10, end: 12, startTime: '10:00', endTime: '12:00' },
    { id: 'slot-3', label: '12:00 – 14:00', start: 12, end: 14, startTime: '12:00', endTime: '14:00' },
    { id: 'slot-4', label: '14:00 – 16:00', start: 14, end: 16, startTime: '14:00', endTime: '16:00' },
    { id: 'slot-5', label: '16:00 – 18:00', start: 16, end: 18, startTime: '16:00', endTime: '18:00' },
    { id: 'slot-6', label: '18:00 – 20:00', start: 18, end: 20, startTime: '18:00', endTime: '20:00' }
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

  // gaurav: fix - toISOString() converts to UTC, which put "today" a day behind
  // for anyone east of UTC (e.g. IST) during local morning hours. Use local date parts instead.
  function toLocalDateStr(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function todayStr() {
    return toLocalDateStr(new Date());
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return toLocalDateStr(d);
  }

  function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function parseTimeToMinutes(timeVal) {
    if (typeof timeVal === 'number') {
      return Math.round(timeVal * 60);
    }
    if (typeof timeVal === 'string' && timeVal.includes(':')) {
      const parts = timeVal.trim().split(':').map(Number);
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    }
    const n = Number(timeVal) || 0;
    return Math.round(n * 60);
  }

  function formatHHMM(totalMinutes) {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = Math.floor(totalMinutes % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function generateTimeSlots(openTimeStr = '08:00', closeTimeStr = '20:00', stepMinutes = 120, minMinutes = null) {
    const openM = parseTimeToMinutes(openTimeStr || '08:00');
    let closeM = parseTimeToMinutes(closeTimeStr || '20:00');
    if (closeM <= openM) {
      closeM = 24 * 60;
    }

    const slots = [];
    let current = openM;
    let idx = 1;

    while (current < closeM) {
      let next = current + stepMinutes;
      if (next > closeM) {
        next = closeM;
      }
      if (minMinutes && (next - current) < minMinutes) {
        break;
      }
      const sStr = formatHHMM(current);
      const eStr = formatHHMM(next);

      slots.push({
        id: `slot-${idx}`,
        label: `${sStr} – ${eStr}`,
        start: current / 60,
        end: next / 60,
        startTime: sStr,
        endTime: eStr
      });

      current = next;
      idx++;
    }

    return slots;
  }

  function getOperatingHoursForDate(dateStr, settings) {
    if (!settings) {
      return { isOpen: true, openTime: '08:00', closeTime: '20:00' };
    }

    const closures = settings.holiday_closures || [];
    const holiday = closures.find((c) => c.date === dateStr);
    if (holiday) {
      return {
        isOpen: false,
        reason: holiday.reason || 'Holiday Closure',
        openTime: null,
        closeTime: null
      };
    }

    const d = new Date(dateStr + 'T00:00:00');
    const dayIndex = d.getDay();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = weekdays[dayIndex];

    const weekly = settings.weekly_hours || [];
    const dayEntry = weekly.find((item) => item.day === dayName);

    if (dayEntry) {
      if (!dayEntry.is_open) {
        return {
          isOpen: false,
          reason: `Closed on ${dayName}`,
          openTime: null,
          closeTime: null
        };
      }
      return {
        isOpen: true,
        openTime: dayEntry.open_time || settings.open_time || '08:00',
        closeTime: dayEntry.close_time || settings.close_time || '20:00'
      };
    }

    const openTime = settings.open_time || '08:00';
    const closeTime = settings.close_time || '20:00';
    return {
      isOpen: true,
      openTime,
      closeTime
    };
  }

  function getTimeSlotsForDate(dateStr, settings, stepMinutes = 120) {
    const hours = getOperatingHoursForDate(dateStr, settings);
    if (!hours.isOpen) {
      return [];
    }
    const minMinutes = settings && settings.min_booking_minutes ? Number(settings.min_booking_minutes) : null;
    return generateTimeSlots(hours.openTime, hours.closeTime, stepMinutes, minMinutes);
  }

  function updateOperatingHours(settings) {
    if (!settings) return TIME_SLOTS;
    const openTime = settings.open_time || '08:00';
    const closeTime = settings.close_time || '20:00';
    const minMinutes = settings.min_booking_minutes ? Number(settings.min_booking_minutes) : null;
    const newSlots = generateTimeSlots(openTime, closeTime, 120, minMinutes);
    TIME_SLOTS.length = 0;
    newSlots.forEach((s) => TIME_SLOTS.push(s));
    return TIME_SLOTS;
  }

  function slotById(id) {
    if (!id) return null;
    let found = TIME_SLOTS.find((s) => s.id === id);
    if (found) return found;

    if (typeof id === 'string' && id.startsWith('slot-')) {
      const raw = id.slice(5);
      const parts = raw.split('-');
      if (parts.length === 2) {
        const sM = parseTimeToMinutes(parts[0]);
        const eM = parseTimeToMinutes(parts[1]);
        const sStr = formatHHMM(sM);
        const eStr = formatHHMM(eM);
        return {
          id,
          label: `${sStr} – ${eStr}`,
          start: sM / 60,
          end: eM / 60,
          startTime: sStr,
          endTime: eStr
        };
      }
    }
    return null;
  }

  function slotDateTime(dateStr, slotIdOrObj, which) {
    if (!dateStr) return null;
    const slot = (typeof slotIdOrObj === 'object' && slotIdOrObj !== null)
      ? slotIdOrObj
      : slotById(slotIdOrObj);
    const d = new Date(dateStr + 'T00:00:00');
    if (!slot) return d;
    const val = which === 'end' ? (slot.end ?? slot.endTime) : (slot.start ?? slot.startTime);
    const totalMinutes = parseTimeToMinutes(val);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    d.setHours(h, m, 0, 0);
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
    generateTimeSlots,
    getOperatingHoursForDate,
    getTimeSlotsForDate,
    updateOperatingHours,
    parseTimeToMinutes,
    formatHHMM,
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
