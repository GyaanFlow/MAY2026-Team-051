const { createApp, reactive, ref, computed } = Vue;

const icons = {
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.6 3.7-5.5 6.5-5.5s5.3 1.9 6.5 5.5"/><path d="M18.5 8v6M15.5 11h6"/></svg>',
  memberships: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/><path d="M8 17.5l2 2 3.5-3.5"/></svg>',
  hours: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  bookingLimits: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="10" width="4" height="9" rx="1"/><rect x="10" y="5" width="4" height="14" rx="1"/><rect x="17" y="13" width="4" height="6" rx="1"/></svg>',
  plans: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2 3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5Z"/><path d="M9 12l2 2 4-4"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V10M11 20V4M18 20v-7"/><path d="M3 20h18"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"/></svg>'
};



const ToggleSwitch = {
  props: {
    modelValue: { type: Boolean, default: false },
    onLabel: { type: String, default: 'On' },
    offLabel: { type: String, default: 'Off' }
  },
  emits: ['update:modelValue'],
  template: `
    <button
      type="button"
      class="toggle-switch"
      :class="{ 'toggle-on': modelValue }"
      role="switch"
      :aria-checked="modelValue"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <span class="toggle-knob"></span>
      <span class="toggle-text">{{ modelValue ? onLabel : offLabel }}</span>
    </button>
  `
};

const StatCard = {
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    sublabel: { type: String, default: '' },
    tone: { type: String, default: 'default' }
  },
  template: `
    <div class="stat-card" :class="'stat-card-' + tone">
      <span class="stat-card-value">{{ value }}</span>
      <span class="stat-card-label">{{ label }}</span>
      <span class="stat-card-sub" v-if="sublabel">{{ sublabel }}</span>
    </div>
  `
};

const BarChart = {
  props: {
    data: { type: Array, required: true }, 
    unit: { type: String, default: '' },
    height: { type: Number, default: 160 }
  },
  computed: {
    maxVal() {
      return Math.max(1, ...this.data.map((d) => d.value));
    }
  },
  template: `
    <div class="bar-chart" :style="{ height: height + 'px' }">
      <div class="bar-chart-col" v-for="(d, i) in data" :key="i">
        <span class="bar-chart-value">{{ d.value }}{{ unit }}</span>
        <div class="bar-chart-track">
          <div class="bar-chart-fill" :style="{ height: (d.value / maxVal * 100) + '%' }"></div>
        </div>
        <span class="bar-chart-label">{{ d.label }}</span>
      </div>
    </div>
  `
};

const DonutChart = {
  props: {
    data: { type: Array, required: true } // [{ label, value, color }]
  },
  computed: {
    total() {
      return this.data.reduce((sum, d) => sum + d.value, 0) || 1;
    },
    segments() {
      const circumference = 2 * Math.PI * 15.9155;
      let cumulative = 0;
      return this.data.map((d) => {
        const pct = d.value / this.total;
        const dash = pct * circumference;
        const seg = {
          ...d,
          pct: Math.round(pct * 100),
          dashArray: dash + ' ' + (circumference - dash),
          dashOffset: -cumulative * circumference
        };
        cumulative += pct;
        return seg;
      });
    }
  },
  template: `
    <div class="donut-chart-wrap">
      <svg viewBox="0 0 36 36" class="donut-chart">
        <circle
          v-for="(seg, i) in segments"
          :key="i"
          cx="18" cy="18" r="15.9155"
          fill="none"
          :stroke="seg.color"
          stroke-width="4"
          :stroke-dasharray="seg.dashArray"
          :stroke-dashoffset="seg.dashOffset"
        />
      </svg>
      <ul class="donut-legend">
        <li v-for="(seg, i) in segments" :key="i">
          <span class="donut-dot" :style="{ background: seg.color }"></span>
          {{ seg.label }} — {{ seg.value }} ({{ seg.pct }}%)
        </li>
      </ul>
    </div>
  `
};

const app = createApp({
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: false },
      { id: 'staffAccounts', label: 'Staff Account Management', icon: icons.staff, enabled: true },
      { id: 'memberships', label: 'Student Membership Management', icon: icons.memberships, enabled: true },
      { id: 'operatingHours', label: 'Operating Hours', icon: icons.hours, enabled: true },
      { id: 'bookingLimits', label: 'Booking Limits', icon: icons.bookingLimits, enabled: true },
      { id: 'plans', label: 'Membership Plans', icon: icons.plans, enabled: true },
      { id: 'reports', label: 'Reports & Analytics', icon: icons.reports, enabled: true },
      { id: 'settings', label: 'Settings', icon: icons.settings, enabled: false }
    ]);

    const activeTab = ref('staffAccounts');

    function setActiveTab(id) {
      const tab = tabs.value.find((t) => t.id === id);
      if (tab && tab.enabled) {
        activeTab.value = id;
      }
    }

    const currentTabLabel = computed(() => {
      const tab = tabs.value.find((t) => t.id === activeTab.value);
      return tab ? tab.label : '';
    });

    const admin = reactive({
      fullName: 'Priya Nair',
      adminId: 'ADMIN-0001'
    });

    const initials = computed(() => {
      if (!admin.fullName) return 'A';
      return admin.fullName
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

    /* ---------------- Staff Account Management ---------------- */

    const staffAccounts = ref([
      { fullName: 'Rohan Mehta', staffId: 'STAFF-0007', position: 'Librarian', phone: '9812345670', address: 'Library Staff Quarters, Pune', username: 'rohan.mehta', status: 'Active' },
      { fullName: 'Kavita Rao', staffId: 'STAFF-0004', position: 'Front Desk Executive', phone: '9812345671', address: 'MG Road, Pune', username: 'kavita.rao', status: 'Active' },
      { fullName: 'Sameer Iyer', staffId: 'STAFF-0002', position: 'Assistant Librarian', phone: '9812345672', address: 'FC Road, Pune', username: 'sameer.iyer', status: 'Inactive' }
    ]);

    const activeStaffCount = computed(() => staffAccounts.value.filter((s) => s.status === 'Active').length);
    const inactiveStaffCount = computed(() => staffAccounts.value.filter((s) => s.status === 'Inactive').length);

    const emptyStaff = () => ({
      fullName: '',
      position: '',
      phone: '',
      staffId: '',
      address: '',
      username: '',
      password: '',
      confirmPassword: ''
    });

    const newStaff = reactive(emptyStaff());
    const staffError = ref('');
    const staffSuccess = ref(false);

    function createStaffAccount() {
      const requiredFields = ['fullName', 'position', 'phone', 'staffId', 'username', 'password'];
      const missing = requiredFields.some((field) => !newStaff[field]);

      if (missing) {
        staffError.value = 'Please fill in all required fields.';
        staffSuccess.value = false;
        return;
      }

      if (newStaff.password !== newStaff.confirmPassword) {
        staffError.value = 'Passwords do not match.';
        staffSuccess.value = false;
        return;
      }

      if (newStaff.password.length < 8) {
        staffError.value = 'Password must be at least 8 characters.';
        staffSuccess.value = false;
        return;
      }

      if (staffAccounts.value.some((s) => s.staffId === newStaff.staffId)) {
        staffError.value = 'A staff account with this Staff ID already exists.';
        staffSuccess.value = false;
        return;
      }

      staffError.value = '';
      // TODO: POST /api/admin/staff once the backend endpoint exists.
      // Only admins should be permitted to call this endpoint.
      console.log('Staff account created:', { ...newStaff });

      staffAccounts.value.unshift({
        fullName: newStaff.fullName,
        staffId: newStaff.staffId,
        position: newStaff.position,
        phone: newStaff.phone,
        address: newStaff.address,
        username: newStaff.username,
        status: 'Active'
      });

      Object.assign(newStaff, emptyStaff());
      staffSuccess.value = true;
      setTimeout(() => {
        staffSuccess.value = false;
      }, 2500);
    }

    const editingStaffId = ref(null);
    const editDraft = reactive({ fullName: '', phone: '', address: '', position: '' });

    function startEditStaff(staffMember) {
      editingStaffId.value = staffMember.staffId;
      editDraft.fullName = staffMember.fullName;
      editDraft.phone = staffMember.phone;
      editDraft.address = staffMember.address;
      editDraft.position = staffMember.position;
    }

    function cancelEditStaff() {
      editingStaffId.value = null;
    }

    function saveEditStaff(staffMember) {
      // TODO: PUT /api/admin/staff/{staffId} once the backend endpoint exists
      staffMember.fullName = editDraft.fullName;
      staffMember.phone = editDraft.phone;
      staffMember.address = editDraft.address;
      staffMember.position = editDraft.position;
      editingStaffId.value = null;
    }

    function toggleStaffStatus(staffMember) {
      // TODO: PATCH /api/admin/staff/{staffId}/status once the backend endpoint exists
      staffMember.status = staffMember.status === 'Active' ? 'Inactive' : 'Active';
    }

    /* ---------------- Student Membership Management ---------------- */

    const memberships = ref([
      { fullName: 'Ananya Sharma', studentId: 'STU-2026-0142', membershipType: 'Premium', status: 'Approved', validUntil: 'Dec 31, 2026' },
      { fullName: 'Vikram Singh', studentId: 'STU-2026-0150', membershipType: 'Regular', status: 'Pending', validUntil: '' },
      { fullName: 'Neha Joshi', studentId: 'STU-2026-0151', membershipType: 'Day Pass', status: 'Pending', validUntil: '' },
      { fullName: 'Arjun Kapoor', studentId: 'STU-2026-0130', membershipType: 'Regular', status: 'Suspended', validUntil: 'Sep 30, 2026' }
    ]);

    const pendingMemberships = computed(() => memberships.value.filter((m) => m.status === 'Pending'));
    const approvedMemberships = computed(() => memberships.value.filter((m) => m.status === 'Approved'));
    const suspendedMemberships = computed(() => memberships.value.filter((m) => m.status === 'Suspended'));

    function approveMembership(m) {
      // TODO: PATCH /api/admin/memberships/{studentId}/approve once the backend endpoint exists
      m.status = 'Approved';
      if (!m.validUntil) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        m.validUntil = nextYear.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }

    function rejectMembership(m) {
      // TODO: DELETE /api/admin/memberships/{studentId} once the backend endpoint exists
      memberships.value = memberships.value.filter((item) => item.studentId !== m.studentId);
    }

    function suspendMembership(m) {
      // TODO: PATCH /api/admin/memberships/{studentId}/suspend once the backend endpoint exists
      m.status = 'Suspended';
    }

    function reactivateMembership(m) {
      // TODO: PATCH /api/admin/memberships/{studentId}/approve once the backend endpoint exists
      m.status = 'Approved';
    }

    

    const operatingHours = reactive([
      { day: 'Monday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
      { day: 'Tuesday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
      { day: 'Wednesday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
      { day: 'Thursday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
      { day: 'Friday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
      { day: 'Saturday', isOpen: true, openTime: '08:00', closeTime: '20:00' },
      { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '18:00' }
    ]);

    const hoursError = ref('');
    const hoursSuccess = ref(false);

    function applyToAllDays(sourceDay) {
      operatingHours.forEach((d) => {
        d.openTime = sourceDay.openTime;
        d.closeTime = sourceDay.closeTime;
      });
    }

    function saveOperatingHours() {
      const openDays = operatingHours.filter((d) => d.isOpen);
      const invalid = openDays.some((d) => d.openTime >= d.closeTime);

      if (openDays.length === 0) {
        hoursError.value = 'At least one day must be open.';
        hoursSuccess.value = false;
        return;
      }
      if (invalid) {
        hoursError.value = 'Closing time must be after opening time for every open day.';
        hoursSuccess.value = false;
        return;
      }

      hoursError.value = '';
      // TODO: PUT /api/admin/settings/operating-hours once the backend endpoint exists.
      console.log('Operating hours saved:', JSON.parse(JSON.stringify(operatingHours)));

      hoursSuccess.value = true;
      setTimeout(() => { hoursSuccess.value = false; }, 2500);
    }

    const holidayClosures = ref([
      { date: '2026-08-15', reason: 'Independence Day' },
      { date: '2026-10-02', reason: 'Gandhi Jayanti' }
    ]);

    const newHoliday = reactive({ date: '', reason: '' });

    function addHolidayClosure() {
      if (!newHoliday.date || !newHoliday.reason) return;
      holidayClosures.value.push({ date: newHoliday.date, reason: newHoliday.reason });
      holidayClosures.value.sort((a, b) => a.date.localeCompare(b.date));
      newHoliday.date = '';
      newHoliday.reason = '';
    }

    function removeHolidayClosure(index) {
      holidayClosures.value.splice(index, 1);
    }

    const openDaysCount = computed(() => operatingHours.filter((d) => d.isOpen).length);

    

    const bookingLimits = reactive({
      totalSeats: 60,
      minBookingMinutes: 30,
      maxBookingHours: 4,
      maxBookingsPerDay: 2,
      advanceBookingDays: 7,
      cancellationWindowHours: 1,
      waitlistEnabled: true
    });

    const seatZones = ref([
      { zone: 'Silent Study Zone', seats: 25 },
      { zone: 'Group Discussion Zone', seats: 15 },
      { zone: 'Computer Zone', seats: 20 }
    ]);

    const zoneSeatTotal = computed(() => seatZones.value.reduce((sum, z) => sum + Number(z.seats || 0), 0));
    const zoneSeatMismatch = computed(() => zoneSeatTotal.value !== Number(bookingLimits.totalSeats));

    const newZone = reactive({ zone: '', seats: null });

    function addSeatZone() {
      if (!newZone.zone || !newZone.seats || newZone.seats <= 0) return;
      seatZones.value.push({ zone: newZone.zone, seats: Number(newZone.seats) });
      newZone.zone = '';
      newZone.seats = null;
    }

    function removeSeatZone(index) {
      seatZones.value.splice(index, 1);
    }

    const bookingLimitsError = ref('');
    const bookingLimitsSuccess = ref(false);

    function saveBookingLimits() {
      if (!bookingLimits.totalSeats || bookingLimits.totalSeats <= 0) {
        bookingLimitsError.value = 'Total seats must be greater than zero.';
        bookingLimitsSuccess.value = false;
        return;
      }
      if (bookingLimits.minBookingMinutes >= bookingLimits.maxBookingHours * 60) {
        bookingLimitsError.value = 'Minimum booking duration must be less than the maximum.';
        bookingLimitsSuccess.value = false;
        return;
      }

      bookingLimitsError.value = '';
      // TODO: PUT /api/admin/settings/booking-limits once the backend endpoint exists.
      console.log('Booking limits saved:', { ...bookingLimits, seatZones: seatZones.value });

      bookingLimitsSuccess.value = true;
      setTimeout(() => { bookingLimitsSuccess.value = false; }, 2500);
    }

  

    const membershipPlans = ref([
      {
        id: 'PLAN-001',
        name: 'Day Pass',
        price: 149,
        billingCycle: 'One-time',
        seatBookingsPerDay: 1,
        advanceBookingDays: 1,
        features: ['Single-day access', 'Any open seat'],
        active: true
      },
      {
        id: 'PLAN-002',
        name: 'Regular',
        price: 1499,
        billingCycle: 'Monthly',
        seatBookingsPerDay: 1,
        advanceBookingDays: 3,
        features: ['Full month access', 'Standard zones', 'Locker on request'],
        active: true
      },
      {
        id: 'PLAN-003',
        name: 'Premium',
        price: 2499,
        billingCycle: 'Monthly',
        seatBookingsPerDay: 2,
        advanceBookingDays: 14,
        features: ['Full month access', 'All zones incl. discussion rooms', 'Dedicated locker', 'Priority booking'],
        active: true
      }
    ]);

    const emptyPlan = () => ({
      name: '',
      price: null,
      billingCycle: 'Monthly',
      seatBookingsPerDay: 1,
      advanceBookingDays: 7,
      featuresText: ''
    });

    const newPlan = reactive(emptyPlan());
    const planError = ref('');
    const planSuccess = ref(false);

    function createPlan() {
      if (!newPlan.name || !newPlan.price || newPlan.price <= 0) {
        planError.value = 'Please provide a plan name and a valid price.';
        planSuccess.value = false;
        return;
      }

      planError.value = '';
      const id = 'PLAN-' + String(membershipPlans.value.length + 1).padStart(3, '0');

      // TODO: POST /api/admin/membership-plans once the backend endpoint exists.
      membershipPlans.value.push({
        id,
        name: newPlan.name,
        price: Number(newPlan.price),
        billingCycle: newPlan.billingCycle,
        seatBookingsPerDay: Number(newPlan.seatBookingsPerDay) || 1,
        advanceBookingDays: Number(newPlan.advanceBookingDays) || 1,
        features: newPlan.featuresText.split(',').map((f) => f.trim()).filter(Boolean),
        active: true
      });

      Object.assign(newPlan, emptyPlan());
      planSuccess.value = true;
      setTimeout(() => { planSuccess.value = false; }, 2500);
    }

    const editingPlanId = ref(null);
    const planEditDraft = reactive({ name: '', price: null, billingCycle: 'Monthly', seatBookingsPerDay: 1, advanceBookingDays: 7, featuresText: '' });

    function startEditPlan(plan) {
      editingPlanId.value = plan.id;
      planEditDraft.name = plan.name;
      planEditDraft.price = plan.price;
      planEditDraft.billingCycle = plan.billingCycle;
      planEditDraft.seatBookingsPerDay = plan.seatBookingsPerDay;
      planEditDraft.advanceBookingDays = plan.advanceBookingDays;
      planEditDraft.featuresText = plan.features.join(', ');
    }

    function cancelEditPlan() {
      editingPlanId.value = null;
    }

    function saveEditPlan(plan) {
      // TODO: PUT /api/admin/membership-plans/{id} once the backend endpoint exists.
      plan.name = planEditDraft.name;
      plan.price = Number(planEditDraft.price);
      plan.billingCycle = planEditDraft.billingCycle;
      plan.seatBookingsPerDay = Number(planEditDraft.seatBookingsPerDay) || 1;
      plan.advanceBookingDays = Number(planEditDraft.advanceBookingDays) || 1;
      plan.features = planEditDraft.featuresText.split(',').map((f) => f.trim()).filter(Boolean);
      editingPlanId.value = null;
    }

    function togglePlanStatus(plan) {
      // TODO: PATCH /api/admin/membership-plans/{id}/status once the backend endpoint exists.
      plan.active = !plan.active;
    }

    function deletePlan(plan) {
      // TODO: DELETE /api/admin/membership-plans/{id} once the backend endpoint exists.
      membershipPlans.value = membershipPlans.value.filter((p) => p.id !== plan.id);
    }

    

    const reportRange = ref('week');
    const reportRanges = ref([
      { id: 'week', label: 'This Week' },
      { id: 'month', label: 'This Month' },
      { id: 'quarter', label: 'This Quarter' }
    ]);

    const reportDatasets = {
      week: {
        totalRevenue: 48250,
        avgOccupancyPct: 68,
        occupancyByHour: [
          { label: '8am', value: 22 }, { label: '10am', value: 41 }, { label: '12pm', value: 58 },
          { label: '2pm', value: 74 }, { label: '4pm', value: 91 }, { label: '6pm', value: 85 },
          { label: '8pm', value: 63 }, { label: '10pm', value: 30 }
        ],
        revenueTrend: [
          { label: 'Mon', value: 6200 }, { label: 'Tue', value: 6800 }, { label: 'Wed', value: 7100 },
          { label: 'Thu', value: 6600 }, { label: 'Fri', value: 7400 }, { label: 'Sat', value: 8200 },
          { label: 'Sun', value: 5950 }
        ]
      },
      month: {
        totalRevenue: 205600,
        avgOccupancyPct: 72,
        occupancyByHour: [
          { label: '8am', value: 26 }, { label: '10am', value: 45 }, { label: '12pm', value: 61 },
          { label: '2pm', value: 78 }, { label: '4pm', value: 95 }, { label: '6pm', value: 88 },
          { label: '8pm', value: 66 }, { label: '10pm', value: 34 }
        ],
        revenueTrend: [
          { label: 'Wk 1', value: 48250 }, { label: 'Wk 2', value: 51200 },
          { label: 'Wk 3', value: 49800 }, { label: 'Wk 4', value: 56350 }
        ]
      },
      quarter: {
        totalRevenue: 612400,
        avgOccupancyPct: 70,
        occupancyByHour: [
          { label: '8am', value: 24 }, { label: '10am', value: 43 }, { label: '12pm', value: 59 },
          { label: '2pm', value: 76 }, { label: '4pm', value: 93 }, { label: '6pm', value: 86 },
          { label: '8pm', value: 64 }, { label: '10pm', value: 32 }
        ],
        revenueTrend: [
          { label: 'Month 1', value: 205600 }, { label: 'Month 2', value: 198300 }, { label: 'Month 3', value: 208500 }
        ]
      }
    };

    const currentReport = computed(() => reportDatasets[reportRange.value]);

    const peakHour = computed(() => {
      const data = currentReport.value.occupancyByHour;
      return data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);
    });

    const membershipDistribution = computed(() => {
      const palette = { Premium: '#4f46e5', Regular: '#0891b2', 'Day Pass': '#d97706' };
      const counts = {};
      memberships.value.forEach((m) => {
        counts[m.membershipType] = (counts[m.membershipType] || 0) + 1;
      });
      return Object.keys(counts).map((type) => ({
        label: type,
        value: counts[type],
        color: palette[type] || '#6b7280'
      }));
    });

    const activeMembershipsCount = computed(() => approvedMemberships.value.length);

    function exportReport() {
      // TODO: GET /api/admin/reports/export?range={reportRange} once the backend endpoint exists.
      console.log('Exporting report for range:', reportRange.value);
    }

    function handleLogout() {
      // TODO: POST /api/logout once the backend endpoint exists
      window.location.href = '/';
    }

    return {
      icons,
      tabs,
      activeTab,
      setActiveTab,
      currentTabLabel,
      admin,
      initials,
      initialsOf,

      staffAccounts,
      activeStaffCount,
      inactiveStaffCount,
      newStaff,
      staffError,
      staffSuccess,
      createStaffAccount,
      editingStaffId,
      editDraft,
      startEditStaff,
      cancelEditStaff,
      saveEditStaff,
      toggleStaffStatus,

      memberships,
      pendingMemberships,
      approvedMemberships,
      suspendedMemberships,
      approveMembership,
      rejectMembership,
      suspendMembership,
      reactivateMembership,

      operatingHours,
      hoursError,
      hoursSuccess,
      applyToAllDays,
      saveOperatingHours,
      holidayClosures,
      newHoliday,
      addHolidayClosure,
      removeHolidayClosure,
      openDaysCount,

      bookingLimits,
      seatZones,
      zoneSeatTotal,
      zoneSeatMismatch,
      newZone,
      addSeatZone,
      removeSeatZone,
      bookingLimitsError,
      bookingLimitsSuccess,
      saveBookingLimits,

      membershipPlans,
      newPlan,
      planError,
      planSuccess,
      createPlan,
      editingPlanId,
      planEditDraft,
      startEditPlan,
      cancelEditPlan,
      saveEditPlan,
      togglePlanStatus,
      deletePlan,

      reportRange,
      reportRanges,
      currentReport,
      peakHour,
      membershipDistribution,
      activeMembershipsCount,
      exportReport,

      handleLogout
    };
  }
});

app.component('toggle-switch', ToggleSwitch);
app.component('stat-card', StatCard);
app.component('bar-chart', BarChart);
app.component('donut-chart', DonutChart);

app.mount('#app');