const { createApp, reactive, ref, computed, onMounted, onBeforeUnmount, watch } = Vue;

const icons = {
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>',
  availability: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><path d="M7.5 14.5l2 2 3.5-4"/></svg>',
  booking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><path d="M12 14v4M10 16h4"/></svg>',
  myBookings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.2 1.8"/><path d="M4 4l1.5 2.5"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>'
};

const MODIFY_WINDOW_MS = 2 * 60 * 60 * 1000; // students may modify/cancel up to 2 hours before start

createApp({
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: false },
      { id: 'availability', label: 'Seat Availability', icon: icons.availability, enabled: true },
      { id: 'booking', label: 'Book a Space', icon: icons.booking, enabled: true },
      { id: 'myBookings', label: 'My Bookings', icon: icons.myBookings, enabled: true },
      { id: 'history', label: 'History', icon: icons.history, enabled: true },
      { id: 'profile', label: 'Profile Management', icon: icons.profile, enabled: true },
      { id: 'settings', label: 'Settings', icon: icons.settings, enabled: false }
    ]);

    const activeTab = ref('availability');

    function setActiveTab(id) {
      const tab = tabs.value.find((t) => t.id === id);
      if (tab && tab.enabled) {
        activeTab.value = id;
      }
    }

    const tabSubtitles = {
      profile: 'Manage your personal and library details.',
      availability: 'See which seats and study rooms are free right now.',
      booking: 'Reserve a seat or study room ahead of time.',
      myBookings: 'Modify or cancel an upcoming reservation.',
      history: 'Review your past study sessions and attendance.'
    };

    const currentTabLabel = computed(() => {
      const tab = tabs.value.find((t) => t.id === activeTab.value);
      return tab ? tab.label : '';
    });
    const currentTabSubtitle = computed(() => tabSubtitles[activeTab.value] || '');

    // ---------------------------------------------------------------
    // Profile (existing)
    // ---------------------------------------------------------------
    const profile = reactive({
      fullName: 'Ananya Sharma',
      avatarUrl: '',
      dob: '2003-04-12',
      gender: 'female',
      phone: '9876543210',
      address: '221B Lake View Road, Pune, MH',

      studentId: 'STU-2026-0142',
      membershipType: 'Premium',
      membershipStart: '2026-01-05',
      membershipValidUntil: '2026-12-31',
      preferredSeat: 'Hall B, Seat 14, Morning Slot',

      hoursLogged: 128,
      lastVisit: 'Jul 5, 2026',

      username: 'ananya.sharma'
    });

    const security = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const securityError = ref('');
    const savedSection = ref('');
    const deactivationRequested = ref(false);

    const initials = computed(() => {
      if (!profile.fullName) return 'S';
      return profile.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
    });

    const avatarStyle = computed(() => {
      return profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})` } : {};
    });

    function flashSaved(section) {
      savedSection.value = section;
      setTimeout(() => {
        if (savedSection.value === section) savedSection.value = '';
      }, 2500);
    }

    function savePersonal() {
      console.log('Personal info saved:', {
        fullName: profile.fullName,
        dob: profile.dob,
        gender: profile.gender,
        phone: profile.phone,
        address: profile.address
      });
      flashSaved('personal');
    }

    function saveLibrary() {
      console.log('Library info saved:', {
        studentId: profile.studentId,
        membershipType: profile.membershipType,
        membershipStart: profile.membershipStart,
        membershipValidUntil: profile.membershipValidUntil,
        preferredSeat: profile.preferredSeat
      });
      flashSaved('library');
    }

    function changePassword() {
      if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
        securityError.value = 'Please fill in all password fields.';
        return;
      }
      if (security.newPassword !== security.confirmPassword) {
        securityError.value = 'New passwords do not match.';
        return;
      }
      if (security.newPassword.length < 8) {
        securityError.value = 'New password must be at least 8 characters.';
        return;
      }

      securityError.value = '';
      console.log('Password change submitted');

      security.currentPassword = '';
      security.newPassword = '';
      security.confirmPassword = '';
      flashSaved('security');
    }

    function handleAvatarChange(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        profile.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function removeAvatar() {
      profile.avatarUrl = '';
    }

    function requestDeactivation() {
      console.log('Deactivation requested');
      deactivationRequested.value = true;
    }

    function handleLogout() {
      window.location.href = '/';
    }

    // ---------------------------------------------------------------
    // Live clock — powers "real-time" status and countdowns
    // ---------------------------------------------------------------
    const now = ref(new Date());
    let clockTimer = null;

    // ---------------------------------------------------------------
    // 3.1 Real-Time Seat Availability
    // ---------------------------------------------------------------
    const seats = ref(LibraryData.generateSeats());
    const lastUpdated = ref(new Date());
    let liveTimer = null;

    const availFilters = reactive({
      zone: 'all',
      type: 'all',
      search: ''
    });

    const secondsSinceUpdate = computed(() => {
      return Math.max(0, Math.floor((now.value - lastUpdated.value) / 1000));
    });

    const filteredSeats = computed(() => {
      return seats.value.filter((s) => {
        if (availFilters.zone !== 'all' && s.zone !== availFilters.zone) return false;
        if (availFilters.type !== 'all' && s.type !== availFilters.type) return false;
        if (availFilters.search && !s.name.toLowerCase().includes(availFilters.search.toLowerCase())) return false;
        return true;
      });
    });

    const availabilitySummary = computed(() => {
      const total = seats.value.length;
      const available = seats.value.filter((s) => s.status === 'available').length;
      const occupied = seats.value.filter((s) => s.status === 'occupied').length;
      const reserved = seats.value.filter((s) => s.status === 'reserved').length;
      return { total, available, occupied, reserved };
    });

    function refreshAvailability() {
      lastUpdated.value = new Date();
    }

    // Lightly randomize a couple of seats every few seconds to simulate
    // a real-time feed. TODO: replace with a websocket / polling call.
    function simulateLiveUpdate() {
      const cycle = ['available', 'occupied', 'reserved'];
      const flipCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < flipCount; i++) {
        const pool = seats.value.filter((s) => s.status !== 'maintenance');
        const target = pool[Math.floor(Math.random() * pool.length)];
        if (target) {
          const next = cycle[Math.floor(Math.random() * cycle.length)];
          target.status = next;
        }
      }
      lastUpdated.value = new Date();
    }

    function goBookSeat(seat) {
      bookingForm.zone = seat.zone;
      bookingForm.type = seat.type;
      bookingForm.seatId = null;
      activeTab.value = 'booking';
    }

    // ---------------------------------------------------------------
    // 3.2 Advance Booking
    // ---------------------------------------------------------------
    const today = LibraryData.todayStr();

    // Pre-seeded reservations other students already hold, keyed as
    // "date|slotId" -> array of seat ids. Used to compute future availability
    // independent of the live "right now" status above.
    const slotBookings = reactive({
      [`${today}|slot-3`]: ['seat-0-1', 'seat-1-2'],
      [`${LibraryData.addDays(today, 1)}|slot-2`]: ['room-0']
    });

    function slotKey(date, slotId) {
      return `${date}|${slotId}`;
    }

    function isSeatBookedFor(seatId, date, slotId) {
      const key = slotKey(date, slotId);
      return Boolean(slotBookings[key] && slotBookings[key].includes(seatId));
    }

    const bookingForm = reactive({
      date: today,
      slotId: 'slot-4',
      zone: 'all',
      type: 'all',
      seatId: null
    });

    const bookingDateOptions = computed(() => {
      return Array.from({ length: 7 }, (_, i) => {
        const d = LibraryData.addDays(today, i);
        return { value: d, label: i === 0 ? `Today · ${LibraryData.formatDateLabel(d)}` : LibraryData.formatDateLabel(d) };
      });
    });

    const bookableSeats = computed(() => {
      return seats.value.filter((s) => {
        if (bookingForm.zone !== 'all' && s.zone !== bookingForm.zone) return false;
        if (bookingForm.type !== 'all' && s.type !== bookingForm.type) return false;
        if (s.status === 'maintenance') return false;
        if (isSeatBookedFor(s.id, bookingForm.date, bookingForm.slotId)) return false;
        return true;
      });
    });

    // Reset the selected seat whenever the filters change and it's no longer valid
    watch([() => bookingForm.date, () => bookingForm.slotId, () => bookingForm.zone, () => bookingForm.type], () => {
      if (bookingForm.seatId && !bookableSeats.value.some((s) => s.id === bookingForm.seatId)) {
        bookingForm.seatId = null;
      }
    });

    const selectedBookingSeat = computed(() => seats.value.find((s) => s.id === bookingForm.seatId) || null);

    const bookingError = ref('');
    const bookingSuccess = ref(null); // holds the confirmed booking once submitted
    let bookingRefCounter = 1042;

    const myBookings = ref([]);
    const history = ref([]);

    function confirmBooking() {
      if (!bookingForm.seatId) {
        bookingError.value = 'Please select an available seat or room.';
        return;
      }
      const seat = selectedBookingSeat.value;
      const slot = LibraryData.slotById(bookingForm.slotId);
      const startDateTime = LibraryData.slotDateTime(bookingForm.date, bookingForm.slotId, 'start');
      const endDateTime = LibraryData.slotDateTime(bookingForm.date, bookingForm.slotId, 'end');

      bookingRefCounter += 1;
      const booking = {
        id: `BK-${bookingRefCounter}`,
        seatId: seat.id,
        seatName: seat.name,
        zone: seat.zone,
        type: seat.type,
        date: bookingForm.date,
        slotId: bookingForm.slotId,
        slotLabel: slot.label,
        startDateTime,
        endDateTime,
        status: 'upcoming',
        checkInTime: null,
        checkOutTime: null
      };

      // TODO: POST /api/bookings once the backend endpoint exists
      console.log('Booking created:', booking);

      const key = slotKey(bookingForm.date, bookingForm.slotId);
      if (!slotBookings[key]) slotBookings[key] = [];
      slotBookings[key].push(seat.id);

      myBookings.value.unshift(booking);
      bookingError.value = '';
      bookingSuccess.value = booking;
      bookingForm.seatId = null;
    }

    function dismissBookingSuccess() {
      bookingSuccess.value = null;
    }

    // ---------------------------------------------------------------
    // 3.3 Booking Modification (cancel / modify within permitted window)
    // ---------------------------------------------------------------
    function canModify(booking) {
      if (booking.status !== 'upcoming') return false;
      return booking.startDateTime.getTime() - now.value.getTime() > MODIFY_WINDOW_MS;
    }

    function modifyDeadlineLabel(booking) {
      const deadline = new Date(booking.startDateTime.getTime() - MODIFY_WINDOW_MS);
      const diffMs = deadline.getTime() - now.value.getTime();
      if (diffMs <= 0) return 'Modification window closed';
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      if (hours > 0) return `Modifiable for ${hours}h ${mins}m more`;
      return `Modifiable for ${mins}m more`;
    }

    const editingBookingId = ref(null);
    const editForm = reactive({ date: today, slotId: 'slot-4', seatId: null });
    const editError = ref('');

    const editBookableSeats = computed(() => {
      if (!editingBookingId.value) return [];
      return seats.value.filter((s) => {
        if (s.status === 'maintenance') return false;
        const bookedElsewhere = isSeatBookedFor(s.id, editForm.date, editForm.slotId);
        // allow keeping the seat currently held for this booking
        const current = myBookings.value.find((b) => b.id === editingBookingId.value);
        if (bookedElsewhere && !(current && current.seatId === s.id && current.date === editForm.date && current.slotId === editForm.slotId)) {
          return false;
        }
        return true;
      });
    });

    function startModify(booking) {
      editingBookingId.value = booking.id;
      editForm.date = booking.date;
      editForm.slotId = booking.slotId;
      editForm.seatId = booking.seatId;
      editError.value = '';
    }

    function cancelModify() {
      editingBookingId.value = null;
      editError.value = '';
    }

    function saveModify(booking) {
      if (!editForm.seatId) {
        editError.value = 'Please choose a seat or room.';
        return;
      }
      // free the old slot
      const oldKey = slotKey(booking.date, booking.slotId);
      if (slotBookings[oldKey]) {
        slotBookings[oldKey] = slotBookings[oldKey].filter((id) => id !== booking.seatId);
      }

      const seat = seats.value.find((s) => s.id === editForm.seatId);
      const slot = LibraryData.slotById(editForm.slotId);

      booking.seatId = seat.id;
      booking.seatName = seat.name;
      booking.zone = seat.zone;
      booking.type = seat.type;
      booking.date = editForm.date;
      booking.slotId = editForm.slotId;
      booking.slotLabel = slot.label;
      booking.startDateTime = LibraryData.slotDateTime(editForm.date, editForm.slotId, 'start');
      booking.endDateTime = LibraryData.slotDateTime(editForm.date, editForm.slotId, 'end');

      const newKey = slotKey(editForm.date, editForm.slotId);
      if (!slotBookings[newKey]) slotBookings[newKey] = [];
      slotBookings[newKey].push(seat.id);

      // TODO: PATCH /api/bookings/{id} once the backend endpoint exists
      console.log('Booking modified:', { ...booking });

      editingBookingId.value = null;
    }

    function cancelBooking(booking) {
      const key = slotKey(booking.date, booking.slotId);
      if (slotBookings[key]) {
        slotBookings[key] = slotBookings[key].filter((id) => id !== booking.seatId);
      }
      booking.status = 'cancelled';

      // TODO: DELETE /api/bookings/{id} once the backend endpoint exists
      console.log('Booking cancelled:', booking.id);

      myBookings.value = myBookings.value.filter((b) => b.id !== booking.id);
      history.value.unshift(booking);
    }

    const upcomingBookings = computed(() => myBookings.value.filter((b) => b.status === 'upcoming' || b.status === 'checked-in'));

    // ---------------------------------------------------------------
    // Extension requests (feeds Story 3.7 on the staff side)
    // ---------------------------------------------------------------
    const extensionRequests = ref([]);
    const extendingBookingId = ref(null);
    const extendMinutes = ref(60);

    function openExtendForm(booking) {
      extendingBookingId.value = booking.id;
      extendMinutes.value = 60;
    }

    function cancelExtend() {
      extendingBookingId.value = null;
    }

    function submitExtension(booking) {
      extensionRequests.value.unshift({
        id: `EXT-${booking.id}-${Date.now()}`,
        bookingId: booking.id,
        seatName: booking.seatName,
        currentEnd: booking.endDateTime,
        requestedMinutes: extendMinutes.value,
        status: 'pending'
      });
      // TODO: POST /api/bookings/{id}/extend-request once the backend endpoint exists
      console.log('Extension requested for', booking.id, extendMinutes.value, 'minutes');
      extendingBookingId.value = null;
    }

    function extensionStatus(booking) {
      const req = extensionRequests.value.find((r) => r.bookingId === booking.id);
      return req ? req.status : null;
    }

    // ---------------------------------------------------------------
    // 3.4 Booking and Attendance History
    // ---------------------------------------------------------------
    const historyFilter = ref('all');

    function seedHistory() {
      const d1 = LibraryData.addDays(today, -1);
      const d2 = LibraryData.addDays(today, -3);
      const d3 = LibraryData.addDays(today, -5);
      const d4 = LibraryData.addDays(today, -6);

      history.value = [
        {
          id: 'BK-1031', seatName: 'Hall B · Seat 4', zone: 'Hall B', type: 'seat',
          date: d1, slotLabel: '10:00 – 12:00', status: 'completed',
          checkInTime: '10:02 AM', checkOutTime: '11:58 AM'
        },
        {
          id: 'BK-1024', seatName: 'Study Room 202', zone: 'Hall B', type: 'room',
          date: d2, slotLabel: '14:00 – 16:00', status: 'completed',
          checkInTime: '2:05 PM', checkOutTime: '4:00 PM'
        },
        {
          id: 'BK-1017', seatName: 'Silent Zone · Seat 3', zone: 'Silent Zone', type: 'seat',
          date: d3, slotLabel: '08:00 – 10:00', status: 'no-show',
          checkInTime: null, checkOutTime: null
        },
        {
          id: 'BK-1009', seatName: 'Hall A · Seat 6', zone: 'Hall A', type: 'seat',
          date: d4, slotLabel: '16:00 – 18:00', status: 'completed',
          checkInTime: '4:00 PM', checkOutTime: '5:55 PM'
        }
      ];
    }
    seedHistory();

    const filteredHistory = computed(() => {
      const combined = [...history.value].sort((a, b) => (a.date < b.date ? 1 : -1));
      if (historyFilter.value === 'all') return combined;
      return combined.filter((h) => h.status === historyFilter.value);
    });

    const historySummary = computed(() => {
      const completed = history.value.filter((h) => h.status === 'completed');
      const noShows = history.value.filter((h) => h.status === 'no-show').length;
      const cancelled = history.value.filter((h) => h.status === 'cancelled').length;
      const totalSessions = history.value.length;
      return {
        totalSessions,
        completed: completed.length,
        noShows,
        cancelled,
        hoursLogged: profile.hoursLogged
      };
    });

    function statusBadgeClass(status) {
      if (status === 'completed') return 'badge-success';
      if (status === 'no-show') return 'badge-danger';
      if (status === 'cancelled') return 'badge-muted';
      if (status === 'upcoming') return 'badge';
      if (status === 'checked-in') return 'badge-warning';
      return 'badge';
    }

    // Seed one "in progress" booking so the extension-request flow is demoable,
    // plus a further-out upcoming booking so modify/cancel is demoable.
    function seedActiveBooking() {
      const slot = LibraryData.TIME_SLOTS.find((s) => s.start <= now.value.getHours() && now.value.getHours() < s.end) || LibraryData.TIME_SLOTS[3];
      const seat = seats.value.find((s) => s.id === 'seat-0-3');
      if (seat) {
        const startDateTime = LibraryData.slotDateTime(today, slot.id, 'start');
        const endDateTime = LibraryData.slotDateTime(today, slot.id, 'end');
        const key = slotKey(today, slot.id);
        if (!slotBookings[key]) slotBookings[key] = [];
        if (!slotBookings[key].includes(seat.id)) slotBookings[key].push(seat.id);

        myBookings.value.push({
          id: 'BK-1050',
          seatId: seat.id,
          seatName: seat.name,
          zone: seat.zone,
          type: seat.type,
          date: today,
          slotId: slot.id,
          slotLabel: slot.label,
          startDateTime,
          endDateTime,
          status: 'checked-in',
          checkInTime: '—',
          checkOutTime: null
        });
      }

      const laterSlot = LibraryData.TIME_SLOTS[LibraryData.TIME_SLOTS.length - 1];
      const laterSeat = seats.value.find((s) => s.id === 'seat-1-5');
      if (laterSeat) {
        const laterKey = slotKey(today, laterSlot.id);
        if (!slotBookings[laterKey]) slotBookings[laterKey] = [];
        if (!slotBookings[laterKey].includes(laterSeat.id)) slotBookings[laterKey].push(laterSeat.id);

        myBookings.value.push({
          id: 'BK-1051',
          seatId: laterSeat.id,
          seatName: laterSeat.name,
          zone: laterSeat.zone,
          type: laterSeat.type,
          date: today,
          slotId: laterSlot.id,
          slotLabel: laterSlot.label,
          startDateTime: LibraryData.slotDateTime(today, laterSlot.id, 'start'),
          endDateTime: LibraryData.slotDateTime(today, laterSlot.id, 'end'),
          status: 'upcoming',
          checkInTime: null,
          checkOutTime: null
        });
      }
    }
    seedActiveBooking();

    // ---------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------
    onMounted(() => {
      clockTimer = setInterval(() => {
        now.value = new Date();
      }, 1000 * 30);
      liveTimer = setInterval(simulateLiveUpdate, 6000);
    });

    onBeforeUnmount(() => {
      if (clockTimer) clearInterval(clockTimer);
      if (liveTimer) clearInterval(liveTimer);
    });

    return {
      icons,
      tabs,
      activeTab,
      setActiveTab,
      currentTabLabel,
      currentTabSubtitle,

      profile,
      security,
      securityError,
      savedSection,
      deactivationRequested,
      initials,
      avatarStyle,
      savePersonal,
      saveLibrary,
      changePassword,
      handleAvatarChange,
      removeAvatar,
      requestDeactivation,
      handleLogout,

      // Availability
      seats,
      availFilters,
      filteredSeats,
      availabilitySummary,
      secondsSinceUpdate,
      refreshAvailability,
      goBookSeat,
      ZONES: LibraryData.ZONES,
      STATUS_LABELS: LibraryData.STATUS_LABELS,

      // Booking
      bookingForm,
      bookingDateOptions,
      TIME_SLOTS: LibraryData.TIME_SLOTS,
      bookableSeats,
      selectedBookingSeat,
      bookingError,
      bookingSuccess,
      confirmBooking,
      dismissBookingSuccess,

      // My bookings / modification
      upcomingBookings,
      canModify,
      modifyDeadlineLabel,
      editingBookingId,
      editForm,
      editError,
      editBookableSeats,
      startModify,
      cancelModify,
      saveModify,
      cancelBooking,

      // Extension
      extendingBookingId,
      extendMinutes,
      openExtendForm,
      cancelExtend,
      submitExtension,
      extensionStatus,

      // History
      history,
      historyFilter,
      filteredHistory,
      historySummary,
      statusBadgeClass
    };
  }
}).mount('#app');
