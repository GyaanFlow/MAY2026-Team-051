const { createApp, reactive, ref, computed, onMounted, onBeforeUnmount, watch } = Vue;

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
  payments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19"/><path d="M6 14.5h4"/></svg>',
  complaints: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9.5v4.5"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>',
  announcements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10v4a1 1 0 0 0 1 1h2l4 4V5l-4 4H5a1 1 0 0 0-1 1Z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M20 6a8 8 0 0 1 0 12"/></svg>'
};

createApp({
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: true },
      { id: 'dailyOverview', label: 'Daily Bookings', icon: icons.daily, enabled: true },
      { id: 'checkIn', label: 'Check-In Verification', icon: icons.checkin, enabled: true },
      { id: 'walkIn', label: 'Walk-In Admission', icon: icons.walkIn, enabled: true },
      { id: 'extensions', label: 'Extension Requests', icon: icons.extend, enabled: true },
      { id: 'payments', label: 'Record Payment', icon: icons.payments, enabled: true },
      { id: 'createStudent', label: 'Create Student Account', icon: icons.addStudent, enabled: true },
      { id: 'verifyMemberships', label: 'Verify Memberships', icon: icons.verify, enabled: true },
      { id: 'complaints', label: 'Student Complaints', icon: icons.complaints, enabled: true },
      { id: 'announcements', label: 'Announcements', icon: icons.announcements, enabled: true },
      { id: 'settings', label: 'Settings', icon: icons.settings, enabled: true }
    ]);

    const activeTab = ref('overview');

    function setActiveTab(id) {
      const tab = tabs.value.find((t) => t.id === id);
      if (tab && tab.enabled) {
        activeTab.value = id;
      }
    }

    const tabSubtitles = {
      overview: "A quick snapshot of today's bookings, requests, and updates.",
      createStudent: "Set up login access for a new student.",
      verifyMemberships: 'Verify student membership details.',
      dailyOverview: "See today's bookings and who's expected to arrive.",
      checkIn: "Verify a student's booking using their check-in code.",
      walkIn: 'Assign an available seat to a same-day walk-in.',
      extensions: "Review students' requests to keep studying.",
      payments: 'Record an offline payment made by a student.',
      complaints: 'View and resolve issues reported by students.',
      announcements: 'Announcements published by the library admin.',
      settings: 'Manage your personal account details.'
    };

    const currentTabLabel = computed(() => {
      const tab = tabs.value.find((t) => t.id === activeTab.value);
      return tab ? tab.label : '';
    });
    const currentTabSubtitle = computed(() => tabSubtitles[activeTab.value] || '');

    // Dummy staff data — replace with data fetched from the backend
    const staff = reactive({
      fullName: 'Rohan Mehta',
      avatarUrl: '',
      email: 'rohan.mehta@studylibrary.com',
      phone: '9822011234',
      dob: '1996-03-22',
      gender: 'male',
      address: '14 Residency Road, Pune, MH',

      staffId: 'STAFF-0007',
      designation: 'Front Desk Staff',
      dateJoined: '2025-02-10',

      username: 'rohan.mehta'
    });

    const security = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const securityError = ref('');
    const savedSection = ref('');

    const avatarStyle = computed(() => {
      return staff.avatarUrl ? { backgroundImage: `url(${staff.avatarUrl})` } : {};
    });

    function flashSaved(section) {
      savedSection.value = section;
      setTimeout(() => {
        if (savedSection.value === section) savedSection.value = '';
      }, 2500);
    }

    function savePersonal() {
      // TODO: PATCH /api/staff/profile once the backend endpoint exists
      console.log('Staff personal info saved:', {
        fullName: staff.fullName,
        email: staff.email,
        phone: staff.phone,
        dob: staff.dob,
        gender: staff.gender,
        address: staff.address
      });
      flashSaved('personal');
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

      // TODO: PATCH /api/staff/password once the backend endpoint exists
      securityError.value = '';
      console.log('Staff password change submitted');

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
        staff.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function removeAvatar() {
      staff.avatarUrl = '';
    }

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
    const overviewLoading = ref(false);
    const overviewError = ref('');
    const occupancyPct = ref(0);
    const todaysBookings = ref([]);

    function slotFromTimes(start, end) {
      const startHour = Number(String(start).slice(0, 2));
      const endHour = Number(String(end).slice(0, 2));
      return LibraryData.TIME_SLOTS.find((slot) => slot.start === startHour && slot.end === endHour)
        || { id: `slot-${start}-${end}`, label: `${start} – ${end}`, start: startHour, end: endHour };
    }

    function seatDisplay(seatNumber) {
      const seatNum = parseInt(String(seatNumber || '').replace('S', ''), 10);
      const zone = !seatNum ? 'Library' : seatNum <= 8 ? 'Hall A' : seatNum <= 16 ? 'Hall B' : 'Silent Zone';
      return {
        zone,
        name: seatNum ? `${zone} · Seat ${seatNum}` : (seatNumber || 'Seat')
      };
    }

    function mapStaffBooking(data) {
      const display = seatDisplay(data.seat_number);
      const statusMap = {
        Confirmed: 'upcoming',
        'Checked-In': 'checked-in',
        Completed: 'completed',
        Cancelled: 'cancelled',
        'No-Show': 'no-show'
      };
      return {
        id: data.booking_id,
        studentName: data.full_name || data.username || 'Student',
        studentId: data.roll_number || data.username || '—',
        seatName: display.name,
        zone: display.zone,
        slot: slotFromTimes(data.start_time, data.end_time),
        status: statusMap[data.status] || String(data.status || '').toLowerCase(),
        source: 'advance',
        checkInCode: data.checkin_code,
        seatId: data.seat_id,
        date: data.booking_date
      };
    }

    async function loadDailyBookings() {
      overviewLoading.value = true;
      overviewError.value = '';
      try {
        const query = overviewDate.value ? `?date=${overviewDate.value}` : '';
        const data = await apiFetch(`/staff/bookings/today${query}`);
        todaysBookings.value = (data.bookings || []).map(mapStaffBooking);
        occupancyPct.value = Number(data.occupancy_pct || 0);
      } catch (error) {
        todaysBookings.value = [];
        occupancyPct.value = 0;
        overviewError.value = error.message || 'Unable to load bookings.';
      } finally {
        overviewLoading.value = false;
      }
    }

    watch(overviewDate, () => {
      loadDailyBookings();
    });

    const overviewBookings = computed(() => {
      return [...todaysBookings.value].sort((a, b) => (a.slot.start || 0) - (b.slot.start || 0));
    });

    const overviewStats = computed(() => {
      const list = overviewBookings.value;
      const total = list.length;
      const expectedArrivals = list.filter((b) => b.status === 'upcoming').length;
      const checkedIn = list.filter((b) => b.status === 'checked-in').length;
      const unarrived = list.filter((b) => b.status === 'no-show').length;
      return { total, expectedArrivals, checkedIn, unarrived, occupancyPct: occupancyPct.value };
    });

    function overviewBadgeClass(status) {
      if (status === 'completed') return 'badge-success';
      if (status === 'checked-in') return 'badge-warning';
      if (status === 'no-show') return 'badge-danger';
      if (status === 'walk-in') return 'badge-muted';
      return 'badge';
    }

    // Display label for a booking status — keeps the internal 'no-show'
    // status value (used across the app) but shows friendlier wording.
    function overviewStatusLabel(status) {
      if (status === 'no-show') return 'Unarrived';
      return status.replace('-', ' ');
    }

    function markArrived(booking) {
      // TODO: PATCH /api/staff/bookings/{id}/check-in once the backend endpoint exists
      booking.status = 'checked-in';
      if (booking.seatId) {
        const seat = seatById(booking.seatId);
        if (seat) seat.status = 'occupied';
      }
    }

    // 4.3 Unarrived Management — staff must wait out a grace period
    // after the slot start time before a booking can be marked unarrived.
    const UNARRIVED_GRACE_MINUTES = 15;

    function unarrivedEligibleAt(booking) {
      if (overviewDate.value !== today) return null;
      const d = new Date(today + 'T00:00:00');
      d.setHours(booking.slot.start, UNARRIVED_GRACE_MINUTES, 0, 0);
      return d;
    }

    function canMarkUnarrived(booking) {
      if (booking.status !== 'upcoming') return false;
      const eligible = unarrivedEligibleAt(booking);
      return Boolean(eligible && now.value.getTime() >= eligible.getTime());
    }

    function unarrivedWaitLabel(booking) {
      const eligible = unarrivedEligibleAt(booking);
      if (!eligible) return '';
      const diffMs = eligible.getTime() - now.value.getTime();
      if (diffMs <= 0) return '';
      const mins = Math.ceil(diffMs / 60000);
      return `Available in ${mins}m`;
    }

    function markUnarrived(booking) {
      if (!canMarkUnarrived(booking)) return;

      // TODO: PATCH /api/staff/bookings/{id}/unarrived once the backend endpoint exists
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
      studentId: '',
      zone: 'all',
      type: 'all',
      seatId: null,
      durationMinutes: 60
    });

    const walkInError = ref('');
    const walkInSuccess = ref(null);
    const walkInSeats = ref([]);
    const walkInLoading = ref(false);
    const walkInSaving = ref(false);

    function formatStaffSeat(seat) {
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
        status: seat.is_available ? 'available' : 'occupied',
        seatNumber: seat.seat_number
      };
    }

    async function loadWalkInSeats() {
      walkInLoading.value = true;
      try {
        const data = await apiFetch('/staff/seats');
        walkInSeats.value = (data || []).map(formatStaffSeat);
      } catch (error) {
        walkInError.value = error.message || 'Unable to load available seats.';
        walkInSeats.value = [];
      } finally {
        walkInLoading.value = false;
      }
    }

    const availableForWalkIn = computed(() => {
      return walkInSeats.value.filter((s) => {
        if (s.status !== 'available') return false;
        if (walkInForm.zone !== 'all' && s.zone !== walkInForm.zone) return false;
        if (walkInForm.type !== 'all' && s.type !== walkInForm.type) return false;
        return true;
      });
    });

    async function assignWalkIn() {
      if (!walkInForm.studentId || !String(walkInForm.studentId).trim()) {
        walkInError.value = 'Please enter the student ID, username, or roll number.';
        walkInSuccess.value = null;
        return;
      }

      if (!walkInForm.seatId) {
        walkInError.value = 'Please select an available seat.';
        walkInSuccess.value = null;
        return;
      }

      walkInError.value = '';
      walkInSuccess.value = null;
      walkInSaving.value = true;

      try {
        const data = await apiFetch('/staff/bookings/walk-in', {
          method: 'POST',
          body: JSON.stringify({
            student_id: String(walkInForm.studentId).trim(),
            seat_id: Number(walkInForm.seatId),
            duration_minutes: Number(walkInForm.durationMinutes) || 60
          })
        });

        const record = mapStaffBooking(data.booking);
        record.source = 'walk-in';
        walkInSuccess.value = record;

        walkInForm.studentId = '';
        walkInForm.seatId = null;

        overviewDate.value = record.date || overviewDate.value;
        await Promise.all([loadWalkInSeats(), loadDailyBookings()]);
      } catch (error) {
        walkInError.value = error.message || 'Unable to admit walk-in student.';
      } finally {
        walkInSaving.value = false;
      }
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
    // const extensionRequests = ref([
    //   {
    //     id: 'EXT-9001', studentName: 'Ananya Sharma', studentId: 'STU-2026-0142',
    //     currentSeatId: 'seat-0-3', currentSeatName: 'Hall B · Seat 3',
    //     requestedMinutes: 60, reason: 'Finishing a group assignment', status: 'pending', resolution: ''
    //   },
    //   {
    //     id: 'EXT-9002', studentName: 'Arjun Rao', studentId: 'STU-2026-0134',
    //     currentSeatId: 'seat-silent-2', currentSeatName: 'Silent Zone · Seat 2',
    //     requestedMinutes: 30, reason: 'Exam prep running long', status: 'pending', resolution: ''
    //   }
    // ]);
    const extensionRequests = ref([]);
const extensionsLoading = ref(false);
const extensionError = ref('');
const extensionSuccess = ref('');
    const reassigningId = ref(null);
    const reassignSeatId = ref(null);

    const availableForReassign = computed(() => {
      return walkInSeats.value.filter((s) => s.status === 'available');
    });

    function pendingExtensions() {
      return extensionRequests.value.filter((r) => r.status === 'pending');
    }

    const pendingList = computed(pendingExtensions);
    const resolvedList = computed(() => extensionRequests.value.filter((r) => r.status !== 'pending'));

    // function approveExtendCurrent(req) {
    //   // TODO: PATCH /api/staff/extensions/{id}/extend once the backend endpoint exists
    //   req.status = 'approved';
    //   req.resolution = `Extended current seat by ${req.requestedMinutes} min`;
    //   console.log('Extension approved (same seat):', req.id);
    // }

    async function approveExtendCurrent(req) {
      extensionError.value = '';
      extensionSuccess.value = '';

      try {
        const data = await apiFetch(`/staff/extension-requests/${req.id}/approve`, {
          method: 'POST',
          body: JSON.stringify({})
        });
        req.status = 'approved';
        req.resolution = `Extended current seat until ${data.booking.end_time}`;
        extensionSuccess.value = 'Extension approved successfully.';
        await loadExtensionRequests();
      } catch (error) {
        extensionError.value = error.message || 'Unable to approve extension.';
      }
    }

    async function startReassign(req) {
      reassigningId.value = req.id;
      reassignSeatId.value = null;
      extensionError.value = '';
      await loadWalkInSeats();
    }

    function cancelReassign() {
      reassigningId.value = null;
      reassignSeatId.value = null;
    }

    async function confirmReassign(req) {
      if (!reassignSeatId.value) {
        extensionError.value = 'Please select an available seat.';
        return;
      }

      extensionError.value = '';
      extensionSuccess.value = '';

      try {
        const data = await apiFetch(`/staff/extension-requests/${req.id}/approve`, {
          method: 'POST',
          body: JSON.stringify({
            seat_id: Number(reassignSeatId.value)
          })
        });
        req.status = 'approved';
        req.resolution = `Reassigned to seat ${data.booking.seat_id} until ${data.booking.end_time}`;
        extensionSuccess.value = 'Extension approved and new seat assigned.';
        reassigningId.value = null;
        reassignSeatId.value = null;
        await Promise.all([loadExtensionRequests(), loadWalkInSeats()]);
      } catch (error) {
        extensionError.value = error.message || 'Unable to reassign seat.';
      }
    }

    async function rejectExtension(req) {
      extensionError.value = '';
      extensionSuccess.value = '';

      try {
        await apiFetch(`/staff/extension-requests/${req.id}/reject`, {
          method: 'POST'
        });
        extensionSuccess.value = 'Extension request rejected.';
        await loadExtensionRequests();
      } catch (error) {
        extensionError.value = error.message || 'Unable to reject extension.';
      }
    }

    // ---------------------------------------------------------------
    // Student registration & membership verification
    // ---------------------------------------------------------------
    const emptyStudent = () => ({
      fullName: '',
      dob: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      studentId: '',
      membershipPlanId: '',
      username: '',
      password: '',
      confirmPassword: ''
    });

    const newStudent = reactive(emptyStudent());
    const createError = ref('');
    const createSuccess = ref(false);
    const registrationLoading = ref(false);
    const createdStudents = ref([]);
    const membershipPlans = ref([]);
    const membershipPlansLoading = ref(false);

    const membershipsToVerify = ref([]);
    const verifyError = ref('');
    const verifyLoadingId = ref(null);

    async function loadMembershipPlans() {
      membershipPlansLoading.value = true;
      try {
        membershipPlans.value = await apiFetch('/staff/membership-plans');
      } catch (error) {
        membershipPlans.value = [];
        console.error('Failed to load membership plans:', error);
      } finally {
        membershipPlansLoading.value = false;
      }
    }

    async function loadStudentsForVerification() {
      verifyError.value = '';
      try {
        membershipsToVerify.value = await apiFetch('/staff/students');
      } catch (error) {
        verifyError.value = error.message;
        membershipsToVerify.value = [];
      }
    }

    async function loadExtensionRequests() {
      extensionsLoading.value = true;
      extensionError.value = '';

      try {
        const data = await apiFetch('/staff/extension-requests?status=all');
        extensionRequests.value = (data.extension_requests || []).map((req) => {
          const currentEnd = req.current_end_time;
          const requestedEnd = req.requested_end_time;
          const status = String(req.status || '').toLowerCase();
          return {
            id: req.extension_request_id,
            bookingId: req.booking_id,
            studentName: req.full_name || req.username || 'Unknown Student',
            studentId: req.username || '',
            currentSeatId: req.seat_id,
            currentSeatName: req.seat_number || 'Unknown Seat',
            currentEndTime: currentEnd,
            requestedEndTime: requestedEnd,
            requestedMinutes: calculateExtensionMinutes(currentEnd, requestedEnd),
            status,
            resolution: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : ''
          };
        });
      } catch (error) {
        extensionError.value = error.message || 'Unable to load extension requests.';
      } finally {
        extensionsLoading.value = false;
      }
    }

    function calculateExtensionMinutes(currentEnd, requestedEnd) {
  if (!currentEnd || !requestedEnd) return 0;

  const [currentHour, currentMinute] =
    currentEnd.split(':').map(Number);

  const [requestedHour, requestedMinute] =
    requestedEnd.split(':').map(Number);

  const currentTotal =
    currentHour * 60 + currentMinute;

  const requestedTotal =
    requestedHour * 60 + requestedMinute;

  return requestedTotal - currentTotal;
}

    async function verifyMembership(student) {
      verifyError.value = '';
      verifyLoadingId.value = student.student_id;
      try {
        const result = await apiFetch(`/staff/students/${student.student_id}/verify`);
        student.membership_status = result.status;
        student.membership_expiry = result.membership_expiry;
        student.verification = result.valid ? 'Valid' : 'Not valid';
      } catch (error) {
        verifyError.value = error.message;
      } finally {
        verifyLoadingId.value = null;
      }
    }

    async function createStudentAccount() {
      const requiredFields = [
        'fullName', 'email', 'phone', 'studentId', 'username', 'password'
      ];
      const missing = requiredFields.some((field) => !newStudent[field]);

      if (missing) {
        createError.value = 'Please fill in the student name, email, phone, roll number, username, and password.';
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
      registrationLoading.value = true;

      try {
        const payload = {
          full_name: newStudent.fullName,
          email: newStudent.email,
          phone: newStudent.phone,
          address: newStudent.address,
          roll_number: newStudent.studentId,
          dob: newStudent.dob || null,
          gender: newStudent.gender || null,
          username: newStudent.username,
          password: newStudent.password,
          plan_id: newStudent.membershipPlanId ? Number(newStudent.membershipPlanId) : null
        };

        const created = await apiFetch('/staff/students/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        createdStudents.value.unshift({
          fullName: created.full_name,
          username: created.username,
          studentId: created.student_id,
          rollNumber: created.roll_number
        });

        await loadStudentsForVerification();

        Object.assign(newStudent, emptyStudent());
        createSuccess.value = true;
        setTimeout(() => {
          createSuccess.value = false;
        }, 2500);
      } catch (error) {
        createError.value = error.message;
        createSuccess.value = false;
      } finally {
        registrationLoading.value = false;
      }
    }

    function handleLogout() {
      // TODO: POST /api/logout once the backend endpoint exists
      window.location.href = '/';
    }

    // ---------------------------------------------------------------
    // Story 6.2 — Complaint Management (Library Staff)
    // ---------------------------------------------------------------
    const complaints = ref(LibraryData.seedComplaints());
    const complaintFilter = ref('open');
    const resolvingComplaintId = ref(null);
    const resolutionDraft = ref('');

    const COMPLAINT_STATUS_LABELS = LibraryData.COMPLAINT_STATUS_LABELS;

    const complaintFilterCounts = computed(() => ({
      open: complaints.value.filter((c) => c.status === 'open').length,
      'in-progress': complaints.value.filter((c) => c.status === 'in-progress').length,
      resolved: complaints.value.filter((c) => c.status === 'resolved').length,
      all: complaints.value.length
    }));

    const filteredComplaints = computed(() => {
      const list = [...complaints.value].sort((a, b) => (a.date < b.date ? 1 : -1));
      if (complaintFilter.value === 'all') return list;
      return list.filter((c) => c.status === complaintFilter.value);
    });

    function complaintStatusBadgeClass(status) {
      return LibraryData.complaintStatusBadgeClass(status);
    }

    function startReview(complaint) {
      // TODO: PATCH /api/staff/complaints/{id}/start once the backend endpoint exists
      complaint.status = 'in-progress';
    }

    function startResolve(complaint) {
      resolvingComplaintId.value = complaint.id;
      resolutionDraft.value = complaint.resolutionNote || '';
    }

    function cancelResolve() {
      resolvingComplaintId.value = null;
      resolutionDraft.value = '';
    }

    function confirmResolve(complaint) {
      if (!resolutionDraft.value.trim()) return;

      // TODO: PATCH /api/staff/complaints/{id}/resolve once the backend endpoint exists
      complaint.status = 'resolved';
      complaint.resolutionNote = resolutionDraft.value.trim();
      complaint.resolvedBy = staff.fullName;

      resolvingComplaintId.value = null;
      resolutionDraft.value = '';
    }

    // ---------------------------------------------------------------
    // Story 6.3 — Announcements (read-only view for staff)
    // ---------------------------------------------------------------
    const announcements = ref(
      LibraryData.seedAnnouncements().filter((a) => a.active && (a.audience === 'all' || a.audience === 'staff'))
    );

    const sortedAnnouncements = computed(() =>
      [...announcements.value].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    );

    function announcementPriorityBadgeClass(priority) {
      return LibraryData.announcementPriorityBadgeClass(priority);
    }

    // ---------------------------------------------------------------
    // Overview — a quick, read-only snapshot pulled from the other tabs.
    // Shows: today's booking stats, a preview of today's schedule,
    // pending extension requests, and the latest announcements.
    // ---------------------------------------------------------------
    const overviewSchedulePreview = computed(() => overviewBookings.value.slice(0, 5));
    const overviewPendingExtensions = computed(() => pendingList.value.slice(0, 3));
    const overviewAnnouncements = computed(() => sortedAnnouncements.value.slice(0, 3));

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
      loadMembershipPlans();
      loadStudentsForVerification();
      loadDailyBookings();
      loadExtensionRequests();
      loadWalkInSeats();

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
      overviewLoading,
      overviewError,
      today,
      overviewBookings,
      overviewStats,
      overviewBadgeClass,
      overviewStatusLabel,
      markArrived,
      markUnarrived,
      canMarkUnarrived,
      unarrivedWaitLabel,

      // Walk-in
      seats,
      ZONES: LibraryData.ZONES,
      walkInForm,
      walkInError,
      walkInSuccess,
      walkInLoading,
      walkInSaving,
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
      extensionError,
      extensionSuccess,
      extensionsLoading,
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
      registrationLoading,
      createdStudents,
      membershipPlans,
      membershipPlansLoading,
      createStudentAccount,
      membershipsToVerify,
      verifyError,
      verifyLoadingId,
      verifyMembership,

      // 6.2 Complaint management
      complaints,
      complaintFilter,
      complaintFilterCounts,
      filteredComplaints,
      COMPLAINT_STATUS_LABELS,
      complaintStatusBadgeClass,
      startReview,
      resolvingComplaintId,
      resolutionDraft,
      startResolve,
      cancelResolve,
      confirmResolve,

      // 6.3 Announcements (view only)
      sortedAnnouncements,
      announcementPriorityBadgeClass,

      // Overview
      overviewSchedulePreview,
      overviewPendingExtensions,
      overviewAnnouncements,

      // Settings
      security,
      securityError,
      savedSection,
      avatarStyle,
      savePersonal,
      changePassword,
      handleAvatarChange,
      removeAvatar,

      handleLogout
    };
  }
}).mount('#app');