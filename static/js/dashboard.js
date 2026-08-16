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
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>',
  payments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/><path d="M6 14.5h4"/></svg>',
  complaints: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>',
  announcements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10v4a1 1 0 0 0 1 1h2l4 4V5l-4 4H5a1 1 0 0 0-1 1Z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M20 6a8 8 0 0 1 0 12"/></svg>'
};

const MODIFY_WINDOW_MS = 2 * 60 * 60 * 1000; // students may modify/cancel up to 2 hours before start

createApp({
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: true },
      { id: 'availability', label: 'Seat Availability', icon: icons.availability, enabled: true },
      { id: 'booking', label: 'Book a Space', icon: icons.booking, enabled: true },
      { id: 'myBookings', label: 'My Bookings', icon: icons.myBookings, enabled: true },
      { id: 'history', label: 'History', icon: icons.history, enabled: true },
      { id: 'payments', label: 'Payment History', icon: icons.payments, enabled: true },
      { id: 'complaints', label: 'Complaints', icon: icons.complaints, enabled: true },
      { id: 'announcements', label: 'Announcements', icon: icons.announcements, enabled: true },
      { id: 'profile', label: 'Profile Management', icon: icons.profile, enabled: true }
    ]);

    const activeTab = ref('overview');

    function setActiveTab(id) {
      const tab = tabs.value.find((t) => t.id === id);
      if (tab && tab.enabled) {
        activeTab.value = id;
      }
    }

    const tabSubtitles = {
      overview: 'A quick snapshot of your bookings, activity, and updates.',
      profile: 'Manage your personal and library details.',
      availability: 'See which seats and study rooms are free right now.',
      booking: 'Reserve a seat or study room ahead of time.',
      myBookings: 'Modify or cancel an upcoming reservation.',
      history: 'Review your past study sessions and attendance.',
      payments: 'Review payments recorded on your account.',
      complaints: 'Raise an issue and track its resolution.',
      announcements: 'Updates and notices from the library admin.'
    };

    const currentTabLabel = computed(() => {
      const tab = tabs.value.find((t) => t.id === activeTab.value);
      return tab ? tab.label : '';
    });
    const currentTabSubtitle = computed(() => tabSubtitles[activeTab.value] || '');

    // ---------------------------------------------------------------
    // Profile (existing)
    // ---------------------------------------------------------------
    // const profile = reactive({
    //   fullName: 'Ananya Sharma',
    //   avatarUrl: '',
    //   dob: '2003-04-12',
    //   gender: 'female',
    //   phone: '9876543210',
    //   address: '221B Lake View Road, Pune, MH',

    //   studentId: 'STU-2026-0142',
    //   membershipType: 'Premium',
    //   membershipStart: '2026-01-05',
    //   membershipValidUntil: '2026-12-31',
    //   preferredSeat: 'Hall B, Seat 14, Morning Slot',

    //   hoursLogged: 128,
    //   lastVisit: 'Jul 5, 2026',

    //   username: 'ananya.sharma'
    // });
    const profile = reactive({
  fullName: '',
  avatarUrl: '',
  dob: '',
  gender: '',
  phone: '',
  address: '',

  studentId: '',
  membershipType: '',
  membershipStart: '',
  membershipValidUntil: '',
  membershipStatus: '',
  membershipValid: false,
  membershipPlan: null,

  preferredSeat: '',

  hoursLogged: 0,
  lastVisit: '',

  username: '',
  email: ''
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

    // function savePersonal() {
    //   console.log('Personal info saved:', {
    //     fullName: profile.fullName,
    //     dob: profile.dob,
    //     gender: profile.gender,
    //     phone: profile.phone,
    //     address: profile.address
    //   });
    //   flashSaved('personal');
    // }
    async function savePersonal() {
  try {
    await apiFetch('/students/me', {
      method: 'PUT',
      body: JSON.stringify({
        full_name: profile.fullName,
        dob: profile.dob,
        gender: profile.gender,
        phone: profile.phone,
        address: profile.address
      })
    });

    flashSaved('personal');

  } catch (error) {
    console.error('Failed to update profile:', error);
    securityError.value =
      error.message || 'Unable to update personal details.';
  }
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
    async function loadStudentProfile() {
  try {
    const data = await apiFetch('/students/me');

    profile.fullName = data.full_name || '';
    profile.dob = data.dob || '';
    profile.gender = data.gender || '';
    profile.phone = data.phone || '';
    profile.address = data.address || '';

    profile.studentId = data.roll_number || data.student_id || '';

    profile.membershipStatus = data.membership_status || '';
    profile.membershipValid = Boolean(data.membership_valid);
    profile.membershipValidUntil = data.membership_expiry || '';
    profile.membershipPlan = data.membership_plan || null;

    profile.membershipType =
      data.membership_plan?.plan_name || '';

    profile.username = data.username || '';
    profile.email = data.email || '';

  } catch (error) {
    console.error('Failed to load student profile:', error);

    if (error.message) {
      securityError.value = error.message;
    }
  }
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

    async function refreshAvailability() {
      lastUpdated.value = new Date();
      try {
        const currentHour = now.value.getHours();
        // find current slot
        const slot = LibraryData.TIME_SLOTS.find((s) => s.start <= currentHour && currentHour < s.end) || LibraryData.TIME_SLOTS[0];
        const start_time = slot.label.split(' – ')[0];
        const end_time = slot.label.split(' – ')[1];
        const dateStr = LibraryData.todayStr();
        const data = await apiFetch(`/seats/availability?date=${dateStr}&start_time=${start_time}&end_time=${end_time}`);
        
        const availableNumbers = new Set(data.available_seats.map(s => s.seat_number));
        
        seats.value.forEach((fs, idx) => {
          const seatNum = `S${String(idx + 1).padStart(2, '0')}`;
          if (idx < 20) {
            fs.status = availableNumbers.has(seatNum) ? 'available' : 'occupied';
          } else {
            fs.status = 'occupied';
          }
        });
      } catch (error) {
        console.error('Failed to refresh availability:', error);
      }
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

    // ---------------------------------------------------------------
    // 4.1 Student Check-In — unique code shown to library staff
    // ---------------------------------------------------------------
    function generateCheckInCode() {
      return String(Math.floor(100000 + Math.random() * 900000));
    }

    function isSeatBookedFor(seatId, date, slotId) {
      const key = slotKey(date, slotId);
      return Boolean(slotBookings[key] && slotBookings[key].includes(seatId));
    }

    function slotClock(hour) {
      return `${String(hour).padStart(2, '0')}:00`;
    }

    function formatApiSeat(seat) {
      const seatNum = parseInt(String(seat.seat_number || '').replace('S', ''), 10);
      const zone = !seatNum ? 'Library' : seatNum <= 8 ? 'Hall A' : seatNum <= 16 ? 'Hall B' : 'Silent Zone';
      const isRoom = String(seat.seat_type || '').toLowerCase() === 'room';
      return {
        id: seat.seat_id,
        name: seatNum ? `${zone} · Seat ${seatNum}` : (seat.seat_number || 'Seat'),
        zone,
        type: isRoom ? 'room' : 'seat',
        capacity: isRoom ? 4 : 1,
        hasPower: seat.seat_type === 'Premium' || isRoom,
        status: 'available',
        seatNumber: seat.seat_number,
        seatType: seat.seat_type
      };
    }

    function slotFromTimes(start, end) {
      const startHour = Number(String(start).slice(0, 2));
      const endHour = Number(String(end).slice(0, 2));
      return LibraryData.TIME_SLOTS.find((slot) => slot.start === startHour && slot.end === endHour)
        || { id: `slot-${start}-${end}`, label: `${start} – ${end}`, start: startHour, end: endHour };
    }

    function mapBooking(data) {
      const display = formatApiSeat({
        seat_id: data.seat_id,
        seat_number: data.seat_number,
        seat_type: data.seat_type
      });
      const slot = slotFromTimes(data.start_time, data.end_time);
      const statusMap = {
        Confirmed: 'upcoming',
        'Checked-In': 'checked-in',
        Completed: 'completed',
        Cancelled: 'cancelled',
        'No-Show': 'no-show'
      };
      return {
        id: data.booking_id,
        seatId: data.seat_id,
        seatName: display.name,
        zone: display.zone,
        type: display.type,
        date: data.booking_date,
        slotId: slot.id,
        slotLabel: slot.label,
        startDateTime: new Date(`${data.booking_date}T${data.start_time}`),
        endDateTime: new Date(`${data.booking_date}T${data.end_time}`),
        status: statusMap[data.status] || String(data.status || '').toLowerCase(),
        checkInCode: data.checkin_code,
        checkInTime: null,
        checkOutTime: null
      };
    }

    function splitStoredBookings(records) {
      const mapped = (records || []).map(mapBooking);
      myBookings.value = mapped.filter((booking) => booking.status === 'upcoming' || booking.status === 'checked-in');
      history.value = mapped.filter((booking) => booking.status !== 'upcoming' && booking.status !== 'checked-in');
    }

    async function loadMyBookings() {
      try {
        const data = await apiFetch('/students/me/bookings');
        splitStoredBookings(data.bookings);
      } catch (error) {
        console.error('Failed to load bookings:', error);
      }
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

    const availableSeatsForSlot = ref([]);
    const loadingAvailability = ref(false);

    async function fetchBookableSeats() {
      if (!bookingForm.date || !bookingForm.slotId) return;
      loadingAvailability.value = true;
      try {
        const slot = LibraryData.TIME_SLOTS.find(s => s.id === bookingForm.slotId);
        if (!slot) return;
        const start_time = slotClock(slot.start);
        const end_time = slotClock(slot.end);
        const data = await apiFetch(`/seats/availability?date=${bookingForm.date}&start_time=${start_time}&end_time=${end_time}`);
        availableSeatsForSlot.value = data.available_seats || [];
      } catch (error) {
        console.error('Failed to fetch available seats:', error);
      } finally {
        loadingAvailability.value = false;
      }
    }

    const bookableSeats = computed(() => {
      return availableSeatsForSlot.value.map(formatApiSeat).filter((s) => {
        if (bookingForm.zone !== 'all' && s.zone !== bookingForm.zone) return false;
        if (bookingForm.type !== 'all' && s.type !== bookingForm.type) return false;
        return true;
      });
    });

    // Fetch availability whenever the slot changes
    watch([() => bookingForm.date, () => bookingForm.slotId], () => {
      fetchBookableSeats();
    }, { immediate: true });

    // Reset the selected seat whenever the filters change and it's no longer valid
    watch([() => bookingForm.date, () => bookingForm.slotId, () => bookingForm.zone, () => bookingForm.type], () => {
      if (bookingForm.seatId && !bookableSeats.value.some((s) => s.id === bookingForm.seatId)) {
        bookingForm.seatId = null;
      }
    });

    const selectedBookingSeat = computed(() => bookableSeats.value.find((s) => s.id === bookingForm.seatId) || null);

    const bookingError = ref('');
    const bookingSuccess = ref(null);
    const bookingSaving = ref(false);

    const myBookings = ref([]);
    const history = ref([]);

    async function confirmBooking() {
      if (!bookingForm.seatId) {
        bookingError.value = 'Please select an available seat or room.';
        return;
      }
      const slot = LibraryData.slotById(bookingForm.slotId);
      if (!slot) {
        bookingError.value = 'Please choose a valid time slot.';
        return;
      }

      bookingError.value = '';
      bookingSaving.value = true;

      try {
        const data = await apiFetch('/bookings', {
          method: 'POST',
          body: JSON.stringify({
            seat_id: bookingForm.seatId,
            date: bookingForm.date,
            start_time: slotClock(slot.start),
            end_time: slotClock(slot.end)
          })
        });
        const booking = mapBooking(data.booking);
        myBookings.value.unshift(booking);
        bookingSuccess.value = booking;
        bookingForm.seatId = null;
        await fetchBookableSeats();
      } catch (error) {
        bookingError.value = error.message || 'Unable to create booking.';
      } finally {
        bookingSaving.value = false;
      }
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
    const editAvailableSeats = ref([]);

    const editBookableSeats = computed(() => editAvailableSeats.value);

    async function fetchEditSeats() {
      if (!editingBookingId.value || !editForm.date || !editForm.slotId) {
        editAvailableSeats.value = [];
        return;
      }
      const slot = LibraryData.slotById(editForm.slotId);
      if (!slot) return;
      try {
        const data = await apiFetch(
          `/seats/availability?date=${editForm.date}&start_time=${slotClock(slot.start)}&end_time=${slotClock(slot.end)}`
        );
        const seats = (data.available_seats || []).map(formatApiSeat);
        const current = myBookings.value.find((booking) => booking.id === editingBookingId.value);
        if (current && !seats.some((seat) => seat.id === current.seatId)) {
          seats.unshift({
            id: current.seatId,
            name: current.seatName,
            zone: current.zone,
            type: current.type,
            capacity: current.type === 'room' ? 4 : 1,
            hasPower: false,
            status: 'available'
          });
        }
        editAvailableSeats.value = seats;
      } catch (error) {
        editError.value = error.message || 'Unable to load available seats.';
      }
    }

    watch([editingBookingId, () => editForm.date, () => editForm.slotId], () => {
      fetchEditSeats();
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

    async function changePassword() {
  if (
    !security.currentPassword ||
    !security.newPassword ||
    !security.confirmPassword
  ) {
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

  try {
    securityError.value = '';

    await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: security.currentPassword,
        new_password: security.newPassword
      })
    });

    security.currentPassword = '';
    security.newPassword = '';
    security.confirmPassword = '';

    flashSaved('security');

  } catch (error) {
    securityError.value =
      error.message || 'Unable to update password.';
  }
}

    async function saveModify(booking) {
      if (!editForm.seatId) {
        editError.value = 'Please choose a seat or room.';
        return;
      }
      const slot = LibraryData.slotById(editForm.slotId);
      if (!slot) {
        editError.value = 'Please choose a valid time slot.';
        return;
      }

      try {
        const data = await apiFetch(`/bookings/${booking.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            seat_id: editForm.seatId,
            date: editForm.date,
            start_time: slotClock(slot.start),
            end_time: slotClock(slot.end)
          })
        });
        const updated = mapBooking(data.booking);
        const index = myBookings.value.findIndex((item) => item.id === booking.id);
        if (index !== -1) {
          myBookings.value[index] = updated;
        }
        editingBookingId.value = null;
        editError.value = '';
        await fetchBookableSeats();
      } catch (error) {
        editError.value = error.message || 'Unable to update booking.';
      }
    }

    async function cancelBooking(booking) {
      try {
        await apiFetch(`/bookings/${booking.id}/cancel`, { method: 'POST' });
        booking.status = 'cancelled';
        myBookings.value = myBookings.value.filter((item) => item.id !== booking.id);
        history.value.unshift(booking);
      } catch (error) {
        editError.value = error.message || 'Unable to cancel booking.';
      }
    }

    const upcomingBookings = computed(() => myBookings.value.filter((b) => b.status === 'upcoming' || b.status === 'checked-in'));

    // ---------------------------------------------------------------
    // 4.1 Student Check-In — copy the code to share with staff
    // ---------------------------------------------------------------
    const copiedCodeId = ref('');

    function copyCheckInCode(booking) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(booking.checkInCode).catch(() => {});
      }
      copiedCodeId.value = booking.id;
      setTimeout(() => {
        if (copiedCodeId.value === booking.id) copiedCodeId.value = '';
      }, 1500);
    }

    // ---------------------------------------------------------------
    // 4.4 Study Session Check-Out
    // ---------------------------------------------------------------
    function checkOutBooking(booking) {
      const seat = seats.value.find((s) => s.id === booking.seatId);
      if (seat) seat.status = 'available';

      booking.status = 'completed';
      booking.checkOutTime = now.value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      if (!booking.checkInTime) booking.checkInTime = 'Earlier today';

      // TODO: PATCH /api/bookings/{id}/check-out once the backend endpoint exists
      console.log('Checked out:', booking.id);

      myBookings.value = myBookings.value.filter((b) => b.id !== booking.id);
      history.value.unshift(booking);
    }

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

    // ---------------------------------------------------------------
    // 5.2 Payment History
    // ---------------------------------------------------------------
    // TODO: GET /api/students/{id}/payments once the backend endpoint exists
    const payments = ref([
      {
        id: 'PAY-6003', date: LibraryData.addDays(today, -2), amount: 300,
        mode: 'Card', purpose: 'Day Pass — Guest Slot'
      },
      {
        id: 'PAY-6002', date: LibraryData.addDays(today, -14), amount: 150,
        mode: 'Cash', purpose: 'Extended Study Room Fee'
      },
      {
        id: 'PAY-6001', date: LibraryData.addDays(today, -30), amount: 1200,
        mode: 'UPI', purpose: 'Premium Membership — Monthly'
      }
    ]);

    const paymentsSummary = computed(() => {
      const totalPaid = payments.value.reduce((sum, p) => sum + p.amount, 0);
      return {
        totalPaid,
        count: payments.value.length,
        lastPayment: payments.value.length ? payments.value[0].date : '—'
      };
    });

    function paymentModeBadgeClass(mode) {
      if (mode === 'Cash') return 'badge-success';
      if (mode === 'UPI') return 'badge-warning';
      if (mode === 'Card') return 'badge';
      return 'badge-muted';
    }


    // ---------------------------------------------------------------
    // Story 6.1 — Complaint Submission (Student)
    // ---------------------------------------------------------------
    const COMPLAINT_CATEGORIES = LibraryData.COMPLAINT_CATEGORIES;
    const COMPLAINT_STATUS_LABELS = LibraryData.COMPLAINT_STATUS_LABELS;

    const complaintForm = reactive({
      category: '',
      subject: '',
      description: ''
    });

    const complaintError = ref('');
    const complaintSuccess = ref(false);
    let complaintCounter = 6010;

    // Seed with any complaints this student already has on file, so the
    // "My Complaints" list isn't empty on first load.
    const myComplaints = ref(
      LibraryData.seedComplaints().filter((c) => c.studentId === profile.studentId)
    );

    function complaintStatusBadgeClass(status) {
      return LibraryData.complaintStatusBadgeClass(status);
    }

    function submitComplaint() {
      if (!complaintForm.category || !complaintForm.subject.trim() || !complaintForm.description.trim()) {
        complaintError.value = 'Please select a category and fill in both the subject and description.';
        complaintSuccess.value = false;
        return;
      }

      complaintCounter += 1;
      const complaint = {
        id: `CMP-${complaintCounter}`,
        studentName: profile.fullName,
        studentId: profile.studentId,
        category: complaintForm.category,
        subject: complaintForm.subject.trim(),
        description: complaintForm.description.trim(),
        status: 'open',
        date: today,
        resolutionNote: '',
        resolvedBy: ''
      };

      // TODO: POST /api/students/complaints once the backend endpoint exists
      console.log('Complaint submitted:', complaint);

      myComplaints.value.unshift(complaint);
      complaintError.value = '';
      complaintSuccess.value = true;

      complaintForm.category = '';
      complaintForm.subject = '';
      complaintForm.description = '';

      setTimeout(() => {
        complaintSuccess.value = false;
      }, 2500);
    }

    // ---------------------------------------------------------------
    // Story 6.3 — Announcements (read-only view for students)
    // ---------------------------------------------------------------
    const announcements = ref(
      LibraryData.seedAnnouncements().filter((a) => a.active && (a.audience === 'all' || a.audience === 'students'))
    );

    const sortedAnnouncements = computed(() =>
      [...announcements.value].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    );

    function announcementPriorityBadgeClass(priority) {
      return LibraryData.announcementPriorityBadgeClass(priority);
    }

    // ---------------------------------------------------------------
    // Overview — a quick, read-only snapshot pulled from the other tabs.
    // Shows: seats free right now, the next upcoming booking, hours
    // logged, open complaints, latest announcements, and recent payments.
    // ---------------------------------------------------------------
    const openComplaintsCount = computed(
      () => myComplaints.value.filter((c) => c.status !== 'resolved').length
    );

    const nextBooking = computed(() => {
      const list = [...upcomingBookings.value].sort((a, b) =>
        a.startDateTime && b.startDateTime ? a.startDateTime - b.startDateTime : 0
      );
      return list[0] || null;
    });

    const overviewAnnouncements = computed(() => sortedAnnouncements.value.slice(0, 3));
    const overviewRecentPayments = computed(() => payments.value.slice(0, 3));

    // ---------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------
    // onMounted(() => {
    //   clockTimer = setInterval(() => {
    //     now.value = new Date();
    //   }, 1000 * 30);
    //   liveTimer = setInterval(simulateLiveUpdate, 6000);
    // });
    onMounted(() => {
      loadStudentProfile();
      refreshAvailability();
      loadMyBookings();

      clockTimer = setInterval(() => {
        now.value = new Date();
      }, 1000 * 30);

      liveTimer = setInterval(refreshAvailability, 30000);
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
      bookingSaving,
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

      // 4.1 / 4.4 Check-in code & check-out
      copiedCodeId,
      copyCheckInCode,
      checkOutBooking,

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
      statusBadgeClass,

      // 5.2 Payment history
      payments,
      paymentsSummary,
      paymentModeBadgeClass,

      // 6.1 Complaint submission
      COMPLAINT_CATEGORIES,
      COMPLAINT_STATUS_LABELS,
      complaintForm,
      complaintError,
      complaintSuccess,
      myComplaints,
      complaintStatusBadgeClass,
      submitComplaint,

      // 6.3 Announcements (view only)
      sortedAnnouncements,
      announcementPriorityBadgeClass,

      // Overview
      openComplaintsCount,
      nextBooking,
      overviewAnnouncements,
      overviewRecentPayments
    };
  }
}).mount('#app');