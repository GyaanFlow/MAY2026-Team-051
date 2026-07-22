const { createApp, reactive, ref, computed, onMounted, onBeforeUnmount } = Vue;

const icons = {
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>',
  daily: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><path d="M8 14h2M11 14h2M14 14h2M8 17h2"/></svg>',
  walkIn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.6 3.7-5.5 6.5-5.5s5.3 1.9 6.5 5.5"/><path d="M16 6l2.5 2.5L22 5"/></svg>',
  extend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.2 1.8"/><path d="M19.5 4.5l1 3-3 1"/></svg>',
  addStudent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.6 3.7-5.5 6.5-5.5s5.3 1.9 6.5 5.5"/><path d="M18.5 8v6M15.5 11h6"/></svg>',
  verify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/><path d="M8 17.5l2 2 3.5-3.5"/></svg>',
  students: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c1-3.4 3.2-5.2 5.5-5.2s4.5 1.8 5.5 5.2"/><path d="M14.5 20c.6-2.3 2-3.7 4-3.9"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  checkin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>',
  payments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/><path d="M6 14.5h4"/></svg>'
};

createApp({
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: false },
      { id: 'dailyOverview', label: 'Daily Bookings', icon: icons.daily, enabled: true },
      { id: 'checkIn', label: 'Check-In Verification', icon: icons.checkin, enabled: true },
      { id: 'walkIn', label: 'Walk-In Admission', icon: icons.walkIn, enabled: true },
      { id: 'extensions', label: 'Extension Requests', icon: icons.extend, enabled: true },
      { id: 'payments', label: 'Record Payment', icon: icons.payments, enabled: true },
      { id: 'createStudent', label: 'Create Student Account', icon: icons.addStudent, enabled: true },
      { id: 'verifyMemberships', label: 'Verify Memberships', icon: icons.verify, enabled: true },
      { id: 'students', label: 'Students', icon: icons.students, enabled: false },
      { id: 'settings', label: 'Settings', icon: icons.settings, enabled: false }
    ]);

    const activeTab = ref('dailyOverview');

    function setActiveTab(id) {
      const tab = tabs.value.find((t) => t.id === id);
      if (tab && tab.enabled) {
        activeTab.value = id;
      }
    }

    const tabSubtitles = {
      createStudent: "Set up login access for a new student.",
      verifyMemberships: 'Verify student membership details.',
      dailyOverview: "See today's bookings and who's expected to arrive.",
      checkIn: "Verify a student's booking using their check-in code.",
      walkIn: 'Assign an available seat to a same-day walk-in.',
      extensions: "Review students' requests to keep studying.",
      payments: 'Record an offline payment made by a student.'
    };

    const currentTabLabel = computed(() => {
      const tab = tabs.value.find((t) => t.id === activeTab.value);
      return tab ? tab.label : '';
    });
    const currentTabSubtitle = computed(() => tabSubtitles[activeTab.value] || '');

    // Dummy staff data — replace with data fetched from the backend
    const staff = reactive({
      fullName: 'Rohan Mehta',
      staffId: 'STAFF-0007'
    });

    const initials = computed(() => {
      if (!staff.fullName) return 'S';
      return staff.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
    });

    function initialsOf(name) {
      if (!name) return '?';
      return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
    }

    // ---------------------------------------------------------------
    // Shared seat data for this dashboard (walk-ins + occupancy stats)
    // ---------------------------------------------------------------
    const seats = ref(LibraryData.generateSeats());
    const today = LibraryData.todayStr();

    // Live clock — powers the no-show waiting-period countdown
    const now = ref(new Date());
    let clockTimer = null;

    function seatById(id) {
      return seats.value.find((s) => s.id === id);
    }

    // ---------------------------------------------------------------
    // 3.5 Daily Booking Overview
    // ---------------------------------------------------------------
    const overviewDate = ref(today);

    function seedTodaysBookings() {
      const s = LibraryData.TIME_SLOTS;
      const raw = [
        { id: 'BK-2001', studentName: 'Ananya Sharma', studentId: 'STU-2026-0142', seatName: 'Hall B · Seat 3', zone: 'Hall B', slot: s[1], status: 'checked-in', source: 'advance', checkInCode: '638210' },
        { id: 'BK-2002', studentName: 'Vikram Singh', studentId: 'STU-2026-0150', seatName: 'Hall A · Seat 6', zone: 'Hall A', slot: s[2], status: 'upcoming', source: 'advance', checkInCode: '482913' },
        { id: 'BK-2003', studentName: 'Neha Joshi', studentId: 'STU-2026-0151', seatName: 'Study Room 202', zone: 'Hall B', slot: s[3], status: 'upcoming', source: 'advance', checkInCode: '205774' },
        { id: 'BK-2004', studentName: 'Arjun Rao', studentId: 'STU-2026-0134', seatName: 'Silent Zone · Seat 2', zone: 'Silent Zone', slot: s[0], status: 'completed', source: 'advance', checkInCode: '119830' },
        { id: 'BK-2005', studentName: 'Priya Nair', studentId: 'STU-2026-0129', seatName: 'Hall C · Seat 1', zone: 'Hall C', slot: s[0], status: 'no-show', source: 'advance', checkInCode: '553481' },
        { id: 'BK-2006', studentName: 'Karan Malhotra', studentId: 'STU-2026-0160', seatName: 'Hall A · Seat 2', zone: 'Hall A', slot: s[4], status: 'upcoming', source: 'advance', checkInCode: '917364' }
      ];
      // Link each dummy booking to its real seat id so no-show release
      // and check-in can flip the correct seat's live status.
      return raw.map((b) => {
        const seat = seats.value.find((x) => x.name === b.seatName);
        return { ...b, seatId: seat ? seat.id : null };
      });
    }

    const todaysBookings = ref(seedTodaysBookings());

    const overviewBookings = computed(() => {
      if (overviewDate.value !== today) return [];
      return [...todaysBookings.value].sort((a, b) => a.slot.start - b.slot.start);
    });

    const overviewStats = computed(() => {
      const list = overviewBookings.value;
      const total = list.length;
      const expectedArrivals = list.filter((b) => b.status === 'upcoming').length;
      const checkedIn = list.filter((b) => b.status === 'checked-in').length;
      const noShows = list.filter((b) => b.status === 'no-show').length;
      const occupiedNow = seats.value.filter((s) => s.status === 'occupied' || s.status === 'reserved').length;
      const occupancyPct = seats.value.length ? Math.round((occupiedNow / seats.value.length) * 100) : 0;
      return { total, expectedArrivals, checkedIn, noShows, occupancyPct };
    });

    function overviewBadgeClass(status) {
      if (status === 'completed') return 'badge-success';
      if (status === 'checked-in') return 'badge-warning';
      if (status === 'no-show') return 'badge-danger';
      if (status === 'walk-in') return 'badge-muted';
      return 'badge';
    }

    function markArrived(booking) {
      // TODO: PATCH /api/staff/bookings/{id}/check-in once the backend endpoint exists
      booking.status = 'checked-in';
      if (booking.seatId) {
        const seat = seatById(booking.seatId);
        if (seat) seat.status = 'occupied';
      }
    }

    // 4.3 No-Show Management — staff must wait out a grace period
    // after the slot start time before a booking can be marked no-show.
    const NO_SHOW_GRACE_MINUTES = 15;

    function noShowEligibleAt(booking) {
      if (overviewDate.value !== today) return null;
      const d = new Date(today + 'T00:00:00');
      d.setHours(booking.slot.start, NO_SHOW_GRACE_MINUTES, 0, 0);
      return d;
    }

    function canMarkNoShow(booking) {
      if (booking.status !== 'upcoming') return false;
      const eligible = noShowEligibleAt(booking);
      return Boolean(eligible && now.value.getTime() >= eligible.getTime());
    }

    function noShowWaitLabel(booking) {
      const eligible = noShowEligibleAt(booking);
      if (!eligible) return '';
      const diffMs = eligible.getTime() - now.value.getTime();
      if (diffMs <= 0) return '';
      const mins = Math.ceil(diffMs / 60000);
      return `Available in ${mins}m`;
    }

    function markNoShow(booking) {
      if (!canMarkNoShow(booking)) return;

      // TODO: PATCH /api/staff/bookings/{id}/no-show once the backend endpoint exists
      booking.status = 'no-show';

      // Release the reserved seat so it becomes available to other students.
      if (booking.seatId) {
        const seat = seatById(booking.seatId);
        if (seat) seat.status = 'available';
      }
    }

    // ---------------------------------------------------------------
    // 3.6 Walk-In Admission
    // ---------------------------------------------------------------
    const walkInForm = reactive({
      fullName: '',
      studentId: '',
      zone: 'all',
      type: 'all',
      seatId: null
    });

    const walkInError = ref('');
    const walkInSuccess = ref(null);

    const availableForWalkIn = computed(() => {
      return seats.value.filter((s) => {
        if (s.status !== 'available') return false;
        if (walkInForm.zone !== 'all' && s.zone !== walkInForm.zone) return false;
        if (walkInForm.type !== 'all' && s.type !== walkInForm.type) return false;
        return true;
      });
    });

    let walkInCounter = 3010;

    function assignWalkIn() {
      if (!walkInForm.fullName) {
        walkInError.value = "Please enter the student's name.";
        return;
      }
      if (!walkInForm.seatId) {
        walkInError.value = 'Please select an available seat or room to assign.';
        return;
      }
      const seat = seatById(walkInForm.seatId);
      seat.status = 'occupied';

      const currentSlot = LibraryData.TIME_SLOTS.find((s) => s.start <= new Date().getHours() && new Date().getHours() < s.end) || LibraryData.TIME_SLOTS[0];

      walkInCounter += 1;
      const record = {
        id: `WI-${walkInCounter}`,
        studentName: walkInForm.fullName,
        studentId: walkInForm.studentId || 'Walk-in (no ID on file)',
        seatName: seat.name,
        zone: seat.zone,
        slot: currentSlot,
        status: 'walk-in',
        source: 'walk-in'
      };

      // TODO: POST /api/staff/walk-ins once the backend endpoint exists
      console.log('Walk-in admitted:', record);

      todaysBookings.value.push(record);
      walkInSuccess.value = record;
      walkInError.value = '';

      walkInForm.fullName = '';
      walkInForm.studentId = '';
      walkInForm.seatId = null;
    }

    function dismissWalkInSuccess() {
      walkInSuccess.value = null;
    }

    // ---------------------------------------------------------------
    // 4.2 Check-In Verification
    // ---------------------------------------------------------------
    const checkInCodeInput = ref('');
    const checkInError = ref('');
    const checkInMatch = ref(null);
    const checkInSuccess = ref(null);

    function verifyCheckInCode() {
      checkInError.value = '';
      checkInMatch.value = null;

      const code = checkInCodeInput.value.trim();
      if (!code) {
        checkInError.value = 'Please enter the check-in code.';
        return;
      }

      // TODO: GET /api/staff/bookings/lookup?code=... once the backend endpoint exists
      const booking = todaysBookings.value.find((b) => b.checkInCode === code);
      if (!booking) {
        checkInError.value = 'No booking found for this code today.';
        return;
      }
      if (booking.status !== 'upcoming') {
        checkInError.value = `This booking is already marked "${booking.status.replace('-', ' ')}".`;
        return;
      }

      checkInMatch.value = booking;
    }

    function confirmCheckIn(booking) {
      // TODO: PATCH /api/staff/bookings/{id}/check-in once the backend endpoint exists
      booking.status = 'checked-in';
      if (booking.seatId) {
        const seat = seatById(booking.seatId);
        if (seat) seat.status = 'occupied';
      }

      checkInSuccess.value = booking;
      checkInMatch.value = null;
      checkInCodeInput.value = '';
    }

    function dismissCheckInSuccess() {
      checkInSuccess.value = null;
    }

    // ---------------------------------------------------------------
    // 3.7 Extension Approval & Seat Allocation
    // ---------------------------------------------------------------
    const extensionRequests = ref([
      {
        id: 'EXT-9001', studentName: 'Ananya Sharma', studentId: 'STU-2026-0142',
        currentSeatId: 'seat-0-3', currentSeatName: 'Hall B · Seat 3',
        requestedMinutes: 60, reason: 'Finishing a group assignment', status: 'pending', resolution: ''
      },
      {
        id: 'EXT-9002', studentName: 'Arjun Rao', studentId: 'STU-2026-0134',
        currentSeatId: 'seat-silent-2', currentSeatName: 'Silent Zone · Seat 2',
        requestedMinutes: 30, reason: 'Exam prep running long', status: 'pending', resolution: ''
      }
    ]);

    const reassigningId = ref(null);
    const reassignSeatId = ref(null);

    const availableForReassign = computed(() => {
      return seats.value.filter((s) => s.status === 'available');
    });

    function pendingExtensions() {
      return extensionRequests.value.filter((r) => r.status === 'pending');
    }

    const pendingList = computed(pendingExtensions);
    const resolvedList = computed(() => extensionRequests.value.filter((r) => r.status !== 'pending'));

    function approveExtendCurrent(req) {
      // TODO: PATCH /api/staff/extensions/{id}/extend once the backend endpoint exists
      req.status = 'approved';
      req.resolution = `Extended current seat by ${req.requestedMinutes} min`;
      console.log('Extension approved (same seat):', req.id);
    }

    function startReassign(req) {
      reassigningId.value = req.id;
      reassignSeatId.value = null;
    }

    function cancelReassign() {
      reassigningId.value = null;
      reassignSeatId.value = null;
    }

    function confirmReassign(req) {
      if (!reassignSeatId.value) return;
      const newSeat = seatById(reassignSeatId.value);
      const oldSeat = seatById(req.currentSeatId);

      if (oldSeat) oldSeat.status = 'available';
      newSeat.status = 'occupied';

      // TODO: PATCH /api/staff/extensions/{id}/reassign once the backend endpoint exists
      console.log('Extension approved (new seat):', req.id, '→', newSeat.id);

      req.status = 'approved';
      req.resolution = `Reassigned to ${newSeat.name}`;
      reassigningId.value = null;
      reassignSeatId.value = null;
    }

    function rejectExtension(req) {
      // TODO: PATCH /api/staff/extensions/{id}/reject once the backend endpoint exists
      req.status = 'rejected';
      req.resolution = 'Request declined';
      console.log('Extension rejected:', req.id);
    }

    // ---------------------------------------------------------------
    // Create Student Account (existing)
    // ---------------------------------------------------------------
    const emptyStudent = () => ({
      fullName: '',
      dob: '',
      gender: '',
      phone: '',
      address: '',
      studentId: '',
      membershipType: '',
      membershipStart: '',
      membershipValidUntil: '',
      preferredSeat: '',
      username: '',
      password: '',
      confirmPassword: ''
    });

    const newStudent = reactive(emptyStudent());
    const createError = ref('');
    const createSuccess = ref(false);
    const createdStudents = ref([]);

    const membershipsToVerify = ref([
      { fullName: 'Ananya Sharma', studentId: 'STU-2026-0142', membershipType: 'Premium', preferredSeat: 'Hall B, Seat 14', verified: true },
      { fullName: 'Vikram Singh', studentId: 'STU-2026-0150', membershipType: 'Regular', preferredSeat: 'Hall A, Seat 3', verified: false },
      { fullName: 'Neha Joshi', studentId: 'STU-2026-0151', membershipType: 'Day Pass', preferredSeat: 'Hall C, Seat 22', verified: false }
    ]);

    function verifyMembership(m) {
      // TODO: PATCH /api/staff/memberships/{studentId}/verify once the backend endpoint exists
      m.verified = true;
    }

    function createStudentAccount() {
      const requiredFields = ['fullName', 'phone', 'studentId', 'username', 'password'];
      const missing = requiredFields.some((field) => !newStudent[field]);

      if (missing) {
        createError.value = 'Please fill in the student\u2019s name, phone, roll number, username, and password.';
        createSuccess.value = false;
        return;
      }

      if (newStudent.password !== newStudent.confirmPassword) {
        createError.value = 'Passwords do not match.';
        createSuccess.value = false;
        return;
      }

      if (newStudent.password.length < 8) {
        createError.value = 'Password must be at least 8 characters.';
        createSuccess.value = false;
        return;
      }

      createError.value = '';
      // TODO: POST /api/staff/students once the backend endpoint exists.
      // Only after this succeeds should the student be able to log in.
      console.log('Student account created:', { ...newStudent });

      createdStudents.value.unshift({
        fullName: newStudent.fullName,
        username: newStudent.username,
        studentId: newStudent.studentId
      });

      Object.assign(newStudent, emptyStudent());
      createSuccess.value = true;
      setTimeout(() => {
        createSuccess.value = false;
      }, 2500);
    }

    function handleLogout() {
      // TODO: POST /api/logout once the backend endpoint exists
      window.location.href = '/';
    }

    // ---------------------------------------------------------------
    // 5.1 Offline Payment Recording
    // ---------------------------------------------------------------
    const PAYMENT_MODES = ['Cash', 'UPI', 'Card'];

    const paymentForm = reactive({
      studentName: '',
      studentId: '',
      amount: null,
      mode: 'Cash',
      purpose: ''
    });

    const paymentError = ref('');
    const paymentSuccess = ref(null);
    const recordedPayments = ref([]);
    let paymentCounter = 7010;

    function recordPayment() {
      if (!paymentForm.studentName || !paymentForm.amount || paymentForm.amount <= 0) {
        paymentError.value = "Please enter the student's name and a valid amount.";
        paymentSuccess.value = null;
        return;
      }

      paymentCounter += 1;
      const record = {
        id: `PAY-${paymentCounter}`,
        studentName: paymentForm.studentName,
        studentId: paymentForm.studentId || '—',
        amount: paymentForm.amount,
        mode: paymentForm.mode,
        purpose: paymentForm.purpose || 'Library payment',
        date: today,
        recordedBy: staff.fullName
      };

      // TODO: POST /api/staff/payments once the backend endpoint exists
      console.log('Payment recorded:', record);

      recordedPayments.value.unshift(record);
      paymentError.value = '';
      paymentSuccess.value = record;

      paymentForm.studentName = '';
      paymentForm.studentId = '';
      paymentForm.amount = null;
      paymentForm.mode = 'Cash';
      paymentForm.purpose = '';

      setTimeout(() => {
        if (paymentSuccess.value === record) paymentSuccess.value = null;
      }, 2500);
    }

    function paymentModeBadgeClass(mode) {
      if (mode === 'Cash') return 'badge-success';
      if (mode === 'UPI') return 'badge-warning';
      if (mode === 'Card') return 'badge';
      return 'badge-muted';
    }

    // ---------------------------------------------------------------
    // Lightly simulate the floor changing in the background so the
    // walk-in / reassignment lists feel live. TODO: replace with real feed.
    // ---------------------------------------------------------------
    let liveTimer = null;
    onMounted(() => {
      liveTimer = setInterval(() => {
        const pool = seats.value.filter((s) => s.status !== 'maintenance' && s.status !== 'occupied');
        const target = pool[Math.floor(Math.random() * pool.length)];
        if (target && Math.random() > 0.6) {
          target.status = target.status === 'available' ? 'reserved' : 'available';
        }
      }, 8000);
      clockTimer = setInterval(() => {
        now.value = new Date();
      }, 1000 * 30);
    });
    onBeforeUnmount(() => {
      if (liveTimer) clearInterval(liveTimer);
      if (clockTimer) clearInterval(clockTimer);
    });

    return {
      icons,
      tabs,
      activeTab,
      setActiveTab,
      currentTabLabel,
      currentTabSubtitle,
      staff,
      initials,
      initialsOf,

      // Daily overview
      overviewDate,
      today,
      overviewBookings,
      overviewStats,
      overviewBadgeClass,
      markArrived,
      markNoShow,
      canMarkNoShow,
      noShowWaitLabel,

      // Walk-in
      seats,
      ZONES: LibraryData.ZONES,
      walkInForm,
      walkInError,
      walkInSuccess,
      availableForWalkIn,
      assignWalkIn,
      dismissWalkInSuccess,

      // 4.2 Check-in verification
      checkInCodeInput,
      checkInError,
      checkInMatch,
      checkInSuccess,
      verifyCheckInCode,
      confirmCheckIn,
      dismissCheckInSuccess,

      // Extensions
      pendingList,
      resolvedList,
      reassigningId,
      reassignSeatId,
      availableForReassign,
      approveExtendCurrent,
      startReassign,
      cancelReassign,
      confirmReassign,
      rejectExtension,

      // 5.1 Record payment
      PAYMENT_MODES,
      paymentForm,
      paymentError,
      paymentSuccess,
      recordedPayments,
      recordPayment,
      paymentModeBadgeClass,

      // Create student / verify (existing)
      newStudent,
      createError,
      createSuccess,
      createdStudents,
      createStudentAccount,
      membershipsToVerify,
      verifyMembership,

      handleLogout
    };
  }
}).mount('#app');