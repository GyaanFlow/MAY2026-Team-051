const { createApp, reactive, ref, computed, onMounted } = Vue;

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
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"/></svg>',
  announcements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 10v4a1 1 0 0 0 1 1h2l4 4V5l-4 4H5a1 1 0 0 0-1 1Z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M20 6a8 8 0 0 1 0 12"/></svg>'
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
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: true },
      { id: 'staffAccounts', label: 'Staff Account Management', icon: icons.staff, enabled: true },
      { id: 'memberships', label: 'Student Membership Management', icon: icons.memberships, enabled: true },
      { id: 'operatingHours', label: 'Operating Hours', icon: icons.hours, enabled: true },
      { id: 'bookingLimits', label: 'Booking Limits', icon: icons.bookingLimits, enabled: true },
      { id: 'plans', label: 'Membership Plans', icon: icons.plans, enabled: true },
      { id: 'reports', label: 'Reports & Analytics', icon: icons.reports, enabled: true },
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

    const currentTabLabel = computed(() => {
      const tab = tabs.value.find((t) => t.id === activeTab.value);
      return tab ? tab.label : '';
    });

    const admin = reactive({
      fullName: 'Priya Nair',
      avatarUrl: '',
      email: 'priya.nair@studylibrary.com',
      phone: '9876500011',
      dob: '1990-11-05',
      gender: 'female',
      address: '9 Lakeview Residency, Pune, MH',

      adminId: 'ADMIN-0001',
      designation: 'Library Administrator',
      dateJoined: '2024-06-01',

      username: 'priya.nair'
    });

    const security = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const securityError = ref('');
    const savedSection = ref('');

    const avatarStyle = computed(() => {
      return admin.avatarUrl ? { backgroundImage: `url(${admin.avatarUrl})` } : {};
    });

    function flashSaved(section) {
      savedSection.value = section;
      setTimeout(() => {
        if (savedSection.value === section) savedSection.value = '';
      }, 2500);
    }

    function savePersonal() {
      // TODO: PATCH /api/admin/profile once the backend endpoint exists
      console.log('Admin personal info saved:', {
        fullName: admin.fullName,
        email: admin.email,
        phone: admin.phone,
        dob: admin.dob,
        gender: admin.gender,
        address: admin.address
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

      // TODO: PATCH /api/admin/password once the backend endpoint exists
      securityError.value = '';
      console.log('Admin password change submitted');

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
        admin.avatarUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function removeAvatar() {
      admin.avatarUrl = '';
    }

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

    /* ---------------- Story 1.1: Staff Account Management ---------------- */

    const staffAccounts = ref([]);
    const activeStaffCount = computed(() => staffAccounts.value.filter((s) => s.status === true).length);
    const inactiveStaffCount = computed(() => staffAccounts.value.filter((s) => s.status === false).length);

    const emptyStaff = () => ({
      fullName: '',
      position: '',
      phone: '',
      email: '',
      address: '',
      username: '',
      password: '',
      confirmPassword: ''
    });

    const newStaff = reactive(emptyStaff());
    const staffError = ref('');
    const staffSuccess = ref(false);
    const staffLoading = ref(false);

    function mapStaff(user) {
      return {
        ...user,
        status: Boolean(user.status),
        staffId: `STAFF-${String(user.user_id).padStart(4, '0')}`,
        fullName: user.full_name || '',
        position: user.position || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || ''
      };
    }

    async function loadStaffAccounts() {
      staffLoading.value = true;
      staffError.value = '';

      try {
        const data = await apiFetch('/admin/staff');
        staffAccounts.value = data.map(mapStaff);
      } catch (error) {
        staffError.value = error.message;
      } finally {
        staffLoading.value = false;
      }
    }

    async function createStaffAccount() {
      const requiredFields = ['fullName', 'position', 'phone', 'email', 'username', 'password'];
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

      staffError.value = '';
      staffLoading.value = true;

      try {
        const created = await apiFetch('/admin/staff', {
          method: 'POST',
          body: JSON.stringify({
            username: newStaff.username,
            password: newStaff.password,
            email: newStaff.email,
            full_name: newStaff.fullName,
            position: newStaff.position,
            phone: newStaff.phone,
            address: newStaff.address
          })
        });

        staffAccounts.value.unshift(mapStaff(created));
        Object.assign(newStaff, emptyStaff());
        staffSuccess.value = true;

        setTimeout(() => {
          staffSuccess.value = false;
        }, 2500);
      } catch (error) {
        staffError.value = error.message;
        staffSuccess.value = false;
      } finally {
        staffLoading.value = false;
      }
    }

    const editingStaffId = ref(null);
    const editDraft = reactive({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      position: ''
    });

    function startEditStaff(staffMember) {
      editingStaffId.value = staffMember.user_id;
      editDraft.fullName = staffMember.fullName;
      editDraft.email = staffMember.email;
      editDraft.phone = staffMember.phone;
      editDraft.address = staffMember.address;
      editDraft.position = staffMember.position;
      staffError.value = '';
    }

    function cancelEditStaff() {
      editingStaffId.value = null;
      staffError.value = '';
    }

    async function saveEditStaff(staffMember) {
      staffError.value = '';
      staffLoading.value = true;

      try {
        const updated = await apiFetch(`/admin/staff/${staffMember.user_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            full_name: editDraft.fullName,
            email: editDraft.email,
            phone: editDraft.phone,
            address: editDraft.address,
            position: editDraft.position
          })
        });

        const index = staffAccounts.value.findIndex(
          (staff) => staff.user_id === staffMember.user_id
        );

        if (index !== -1) {
          staffAccounts.value[index] = mapStaff(updated);
        }

        editingStaffId.value = null;
      } catch (error) {
        staffError.value = error.message;
      } finally {
        staffLoading.value = false;
      }
    }

    async function toggleStaffStatus(staffMember) {
      // Story 1.1 currently supports deactivation only. There is intentionally
      // no Activate/Re-activate call because the backend does not expose one.
      if (!staffMember.status) return;

      const confirmed = window.confirm(
        `Deactivate ${staffMember.fullName || staffMember.username}? They will no longer be able to log in.`
      );
      if (!confirmed) return;

      staffError.value = '';
      staffLoading.value = true;

      try {
        const result = await apiFetch(`/admin/staff/${staffMember.user_id}/deactivate`, {
          method: 'POST'
        });

        const index = staffAccounts.value.findIndex(
          (staff) => staff.user_id === staffMember.user_id
        );

        if (index !== -1) {
          staffAccounts.value[index] = mapStaff(result.user);
        }
      } catch (error) {
        staffError.value = error.message;
      } finally {
        staffLoading.value = false;
      }
    }

    /* ---------------- Student Membership Management ---------------- */

    const memberships = ref([]);
    const membershipError = ref('');
    const membershipLoading = ref(false);

    const STATUS_LABELS = {
      Pending: 'Pending',
      Active: 'Approved',
      Rejected: 'Rejected',
      Disapproved: 'Suspended'
    };

    function mapMembership(student) {
      return {
        id: student.student_id,
        student_id: student.student_id,
        studentId: student.roll_number || `STU-${String(student.student_id).padStart(4, '0')}`,
        fullName: student.full_name,
        membershipType: (student.membership_plan && student.membership_plan.plan_name) || 'Unassigned',
        status: STATUS_LABELS[student.membership_status] || student.membership_status,
        validUntil: student.membership_expiry || ''
      };
    }

    async function loadMemberships() {
      membershipLoading.value = true;
      membershipError.value = '';
      try {
        const data = await apiFetch('/admin/memberships');
        memberships.value = data.map(mapMembership);
      } catch (error) {
        membershipError.value = error.message;
      } finally {
        membershipLoading.value = false;
      }
    }

    const pendingMemberships = computed(() => memberships.value.filter((m) => m.status === 'Pending'));
    const approvedMemberships = computed(() => memberships.value.filter((m) => m.status === 'Approved'));
    const suspendedMemberships = computed(() => memberships.value.filter((m) => m.status === 'Suspended'));

    async function approveMembership(m) {
      membershipError.value = '';
      try {
        await apiFetch(`/admin/memberships/${m.student_id}/approve`, { method: 'POST' });
        await loadMemberships();
      } catch (error) {
        membershipError.value = error.message;
      }
    }

    async function rejectMembership(m) {
      membershipError.value = '';
      try {
        await apiFetch(`/admin/memberships/${m.student_id}/reject`, { method: 'POST' });
        await loadMemberships();
      } catch (error) {
        membershipError.value = error.message;
      }
    }

    async function suspendMembership(m) {
      membershipError.value = '';
      try {
        await apiFetch(`/admin/memberships/${m.student_id}/disapprove`, { method: 'POST' });
        await loadMemberships();
      } catch (error) {
        membershipError.value = error.message;
      }
    }

    async function reactivateMembership(m) {
      membershipError.value = '';
      try {
        await apiFetch(`/admin/memberships/${m.student_id}/approve`, { method: 'POST' });
        await loadMemberships();
      } catch (error) {
        membershipError.value = error.message;
      }
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
    const holidayClosures = ref([]);
    const newHoliday = reactive({ date: '', reason: '' });

    function applyToAllDays(sourceDay) {
      operatingHours.forEach((d) => {
        d.openTime = sourceDay.openTime;
        d.closeTime = sourceDay.closeTime;
      });
    }

    function hoursPayload() {
      const openDays = operatingHours.filter((d) => d.isOpen);
      const firstOpenDay = openDays[0];
      return {
        open_time: firstOpenDay ? firstOpenDay.openTime : undefined,
        close_time: firstOpenDay ? firstOpenDay.closeTime : undefined,
        weekly_hours: operatingHours.map((d) => ({
          day: d.day,
          is_open: d.isOpen,
          open_time: d.openTime,
          close_time: d.closeTime
        })),
        holiday_closures: holidayClosures.value.map((h) => ({
          date: h.date,
          reason: h.reason
        }))
      };
    }

    function applySettings(data) {
      const weekly = data.settings ? data.settings.weekly_hours : data.weekly_hours;
      const closures = data.settings ? data.settings.holiday_closures : data.holiday_closures;
      const openTime = data.settings ? data.settings.open_time : data.open_time;
      const closeTime = data.settings ? data.settings.close_time : data.close_time;

      if (Array.isArray(weekly) && weekly.length) {
        operatingHours.forEach((day) => {
          const saved = weekly.find((item) => item.day === day.day);
          if (!saved) return;
          day.isOpen = Boolean(saved.is_open);
          day.openTime = saved.open_time || day.openTime;
          day.closeTime = saved.close_time || day.closeTime;
        });
      } else if (openTime && closeTime) {
        operatingHours.forEach((day) => {
          day.openTime = openTime;
          day.closeTime = closeTime;
        });
      }

      if (Array.isArray(closures)) {
        holidayClosures.value = closures.map((h) => ({
          date: h.date,
          reason: h.reason
        }));
      }
    }

    async function loadOperatingHours() {
      try {
        const data = await apiFetch('/admin/settings');
        applySettings(data);
      } catch (error) {
        console.error('Failed to load operating hours:', error);
        hoursError.value = error.message || 'Unable to load operating hours.';
      }
    }

    async function persistOperatingHours() {
      const data = await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(hoursPayload())
      });
      applySettings(data);
    }

    async function saveOperatingHours() {
      const openDays = operatingHours.filter((d) => d.isOpen);

      if (openDays.length === 0) {
        hoursError.value = 'At least one day must be open.';
        hoursSuccess.value = false;
        return;
      }

      if (openDays.some((d) => d.openTime >= d.closeTime)) {
        hoursError.value = 'Closing time must be after opening time for every open day.';
        hoursSuccess.value = false;
        return;
      }

      try {
        hoursError.value = '';
        await persistOperatingHours();
        hoursSuccess.value = true;
        setTimeout(() => {
          hoursSuccess.value = false;
        }, 2500);
      } catch (error) {
        console.error('Failed to save operating hours:', error);
        hoursError.value = error.message || 'Unable to save operating hours.';
        hoursSuccess.value = false;
      }
    }

    async function addHolidayClosure() {
      if (!newHoliday.date || !newHoliday.reason) return;
      if (holidayClosures.value.some((h) => h.date === newHoliday.date)) {
        hoursError.value = 'A closure already exists for that date.';
        return;
      }

      holidayClosures.value.push({ date: newHoliday.date, reason: newHoliday.reason });
      holidayClosures.value.sort((a, b) => a.date.localeCompare(b.date));
      newHoliday.date = '';
      newHoliday.reason = '';

      try {
        hoursError.value = '';
        await persistOperatingHours();
        hoursSuccess.value = true;
        setTimeout(() => {
          hoursSuccess.value = false;
        }, 2500);
      } catch (error) {
        hoursError.value = error.message || 'Unable to save holiday closure.';
        await loadOperatingHours();
      }
    }

    async function removeHolidayClosure(index) {
      holidayClosures.value.splice(index, 1);
      try {
        hoursError.value = '';
        await persistOperatingHours();
      } catch (error) {
        hoursError.value = error.message || 'Unable to remove holiday closure.';
        await loadOperatingHours();
      }
    }

    const openDaysCount = computed(() => operatingHours.filter((d) => d.isOpen).length);

    

    const bookingLimits = reactive({
      totalSeats: 0,
      minBookingMinutes: 15,
      maxBookingHours: 4,
      maxBookingsPerDay: 1,
      advanceBookingDays: 7,
      cancellationWindowHours: 2,
      waitlistEnabled: false
    });

    const seats = ref([]);
    const seatsLoading = ref(false);
    const seatZones = ref([]);
    const zoneSeatTotal = computed(() =>
      seatZones.value.reduce((sum, zone) => sum + Number(zone.seats || 0), 0)
    );
    const zoneSeatMismatch = computed(
      () => zoneSeatTotal.value > 0 && zoneSeatTotal.value !== Number(bookingLimits.totalSeats)
    );

    async function loadSeats() {
      seatsLoading.value = true;
      try {
        const data = await apiFetch('/admin/seats');
        seats.value = data;
        bookingLimits.totalSeats = seats.value.filter((seat) => seat.is_active).length;
      } catch (error) {
        bookingLimitsError.value = error.message;
      } finally {
        seatsLoading.value = false;
      }
    }

    async function loadBookingLimits() {
      try {
        const data = await apiFetch('/admin/settings');
        if (data.min_booking_minutes != null) {
          bookingLimits.minBookingMinutes = data.min_booking_minutes;
        }
        if (data.max_booking_hours != null) {
          bookingLimits.maxBookingHours = data.max_booking_hours;
        }
        if (data.max_bookings_per_day != null) {
          bookingLimits.maxBookingsPerDay = data.max_bookings_per_day;
        }
        if (data.max_booking_days_ahead != null) {
          bookingLimits.advanceBookingDays = data.max_booking_days_ahead;
        }
        if (data.cancellation_period != null) {
          bookingLimits.cancellationWindowHours = data.cancellation_period;
        }
        bookingLimits.waitlistEnabled = Boolean(data.waitlist_enabled);
        if (Array.isArray(data.seat_zones)) {
          seatZones.value = data.seat_zones.map((zone) => ({
            zone: zone.zone,
            seats: Number(zone.seats)
          }));
        }
      } catch (error) {
        console.error('Failed to load booking limits:', error);
      }
    }

    const newZone = reactive({ zone: '', seats: null });

    async function persistSeatZones() {
      await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          seat_zones: seatZones.value.map((zone) => ({
            zone: zone.zone,
            seats: Number(zone.seats)
          }))
        })
      });
    }

    async function addSeatZone() {
      if (!newZone.zone || !newZone.seats || newZone.seats <= 0) return;
      if (seatZones.value.some((zone) => zone.zone.toLowerCase() === newZone.zone.toLowerCase())) {
        bookingLimitsError.value = 'A zone with that name already exists.';
        return;
      }

      seatZones.value.push({ zone: newZone.zone, seats: Number(newZone.seats) });
      newZone.zone = '';
      newZone.seats = null;

      try {
        bookingLimitsError.value = '';
        await persistSeatZones();
        bookingLimitsSuccess.value = true;
        setTimeout(() => {
          bookingLimitsSuccess.value = false;
        }, 2500);
      } catch (error) {
        bookingLimitsError.value = error.message || 'Unable to save seat zone.';
        await loadBookingLimits();
      }
    }

    async function removeSeatZone(index) {
      seatZones.value.splice(index, 1);
      try {
        bookingLimitsError.value = '';
        await persistSeatZones();
      } catch (error) {
        bookingLimitsError.value = error.message || 'Unable to remove seat zone.';
        await loadBookingLimits();
      }
    }

    const bookingLimitsError = ref('');
    const bookingLimitsSuccess = ref(false);

    function nextUnusedSeatNumbers(count) {
      const used = new Set(seats.value.map((seat) => seat.seat_number));
      const numbers = [];
      let n = 1;
      while (numbers.length < count) {
        const label = `S${String(n).padStart(2, '0')}`;
        if (!used.has(label)) {
          numbers.push(label);
        }
        n += 1;
      }
      return numbers;
    }

    async function saveBookingLimits() {
      if (!bookingLimits.totalSeats || bookingLimits.totalSeats <= 0) {
        bookingLimitsError.value = 'Total seats must be greater than zero.';
        bookingLimitsSuccess.value = false;
        return;
      }

      if (
        bookingLimits.minBookingMinutes &&
        bookingLimits.maxBookingHours &&
        bookingLimits.minBookingMinutes >= bookingLimits.maxBookingHours * 60
      ) {
        bookingLimitsError.value = 'Minimum booking duration must be less than the maximum.';
        bookingLimitsSuccess.value = false;
        return;
      }

      bookingLimitsError.value = '';
      bookingLimitsSuccess.value = false;

      try {
        const activeSeats = seats.value.filter((seat) => seat.is_active);
        const currentCount = activeSeats.length;
        const requiredCount = Number(bookingLimits.totalSeats);

        if (requiredCount > currentCount) {
          const labels = nextUnusedSeatNumbers(requiredCount - currentCount);
          for (const seatNumber of labels) {
            await apiFetch('/admin/seats', {
              method: 'POST',
              body: JSON.stringify({
                seat_number: seatNumber,
                seat_type: 'Standard',
                is_active: true
              })
            });
          }
        } else if (requiredCount < currentCount) {
          const seatsToDeactivate = activeSeats.slice(requiredCount);
          for (const seat of seatsToDeactivate) {
            await apiFetch(`/admin/seats/${seat.seat_id}`, {
              method: 'PUT',
              body: JSON.stringify({ is_active: false })
            });
          }
        }

        await apiFetch('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({
            total_seats: requiredCount,
            min_booking_minutes: bookingLimits.minBookingMinutes,
            max_booking_hours: bookingLimits.maxBookingHours,
            max_bookings_per_day: bookingLimits.maxBookingsPerDay,
            max_booking_days_ahead: bookingLimits.advanceBookingDays,
            cancellation_period: bookingLimits.cancellationWindowHours,
            waitlist_enabled: Boolean(bookingLimits.waitlistEnabled),
            seat_zones: seatZones.value.map((zone) => ({
              zone: zone.zone,
              seats: Number(zone.seats)
            }))
          })
        });

        await loadSeats();
        await loadBookingLimits();

        bookingLimitsSuccess.value = true;
        setTimeout(() => {
          bookingLimitsSuccess.value = false;
        }, 2500);
      } catch (error) {
        bookingLimitsError.value = error.message;
      }
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
        totalBookings: 342,
        newMemberships: 18,
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
        totalBookings: 1486,
        newMemberships: 64,
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
        totalBookings: 4210,
        newMemberships: 178,
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

    // Extra report stats pulled from other parts of the admin dashboard
    // (and the shared dummy dataset) so Reports & Analytics gives a
    // fuller picture, not just occupancy and revenue.
    const totalStaffCount = computed(() => staffAccounts.value.length);
    const activePlansCount = computed(() => membershipPlans.value.filter((p) => p.active).length);
    const complaintsSnapshot = ref(LibraryData.seedComplaints());
    const openComplaintsCount = computed(
      () => complaintsSnapshot.value.filter((c) => c.status !== 'resolved').length
    );

    function exportReport() {
      // TODO: GET /api/admin/reports/export?range={reportRange} once the backend endpoint exists.
      console.log('Exporting report for range:', reportRange.value);
    }

    function handleLogout() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }

    onMounted(() => {
      loadStaffAccounts();
      loadBookingLimits();
      loadSeats();
      loadMemberships();
      loadOperatingHours();
    });

    // ---------------------------------------------------------------
    // Story 6.3 — Announcements & Notifications (Admin)
    // ---------------------------------------------------------------
    const announcements = ref(LibraryData.seedAnnouncements());
    const ANNOUNCEMENT_AUDIENCES = LibraryData.ANNOUNCEMENT_AUDIENCES;
    const ANNOUNCEMENT_PRIORITIES = LibraryData.ANNOUNCEMENT_PRIORITIES;

    const sortedAnnouncements = computed(() =>
      [...announcements.value].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    );

    function announcementAudienceLabel(audience) {
      const found = ANNOUNCEMENT_AUDIENCES.find((a) => a.id === audience);
      return found ? found.label : audience;
    }

    function announcementPriorityBadgeClass(priority) {
      return LibraryData.announcementPriorityBadgeClass(priority);
    }

    const emptyAnnouncement = () => ({
      title: '',
      message: '',
      audience: 'all',
      priority: 'Normal'
    });

    const newAnnouncement = reactive(emptyAnnouncement());
    const announcementError = ref('');
    const announcementSuccess = ref(false);
    let announcementCounter = 103;

    function createAnnouncement() {
      if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
        announcementError.value = 'Please provide both a title and a message.';
        announcementSuccess.value = false;
        return;
      }

      announcementCounter += 1;
      const record = {
        id: `ANN-${announcementCounter}`,
        title: newAnnouncement.title.trim(),
        message: newAnnouncement.message.trim(),
        audience: newAnnouncement.audience,
        priority: newAnnouncement.priority,
        createdBy: admin.fullName,
        createdAt: LibraryData.todayStr(),
        active: true
      };

      // TODO: POST /api/admin/announcements once the backend endpoint exists
      console.log('Announcement created:', record);

      announcements.value.unshift(record);
      announcementError.value = '';
      announcementSuccess.value = true;
      Object.assign(newAnnouncement, emptyAnnouncement());

      setTimeout(() => { announcementSuccess.value = false; }, 2500);
    }

    const editingAnnouncementId = ref(null);
    const announcementEditDraft = reactive({ title: '', message: '', audience: 'all', priority: 'Normal' });

    function startEditAnnouncement(announcement) {
      editingAnnouncementId.value = announcement.id;
      announcementEditDraft.title = announcement.title;
      announcementEditDraft.message = announcement.message;
      announcementEditDraft.audience = announcement.audience;
      announcementEditDraft.priority = announcement.priority;
    }

    function cancelEditAnnouncement() {
      editingAnnouncementId.value = null;
    }

    function saveEditAnnouncement(announcement) {
      // TODO: PATCH /api/admin/announcements/{id} once the backend endpoint exists
      announcement.title = announcementEditDraft.title;
      announcement.message = announcementEditDraft.message;
      announcement.audience = announcementEditDraft.audience;
      announcement.priority = announcementEditDraft.priority;
      editingAnnouncementId.value = null;
    }

    function toggleAnnouncementStatus(announcement) {
      // TODO: PATCH /api/admin/announcements/{id}/status once the backend endpoint exists
      announcement.active = !announcement.active;
    }

    function deleteAnnouncement(announcement) {
      // TODO: DELETE /api/admin/announcements/{id} once the backend endpoint exists
      announcements.value = announcements.value.filter((a) => a.id !== announcement.id);
    }

    // ---------------------------------------------------------------
    // Overview — a quick, read-only snapshot pulled from the other tabs.
    // Shows: staff/membership/occupancy/revenue stats, a preview of
    // pending membership approvals, the occupancy chart, and the
    // latest announcements.
    // ---------------------------------------------------------------
    const overviewPendingMemberships = computed(() => pendingMemberships.value.slice(0, 4));
    const overviewAnnouncements = computed(() => sortedAnnouncements.value.slice(0, 3));
    const publishedAnnouncementsCount = computed(() => announcements.value.filter((a) => a.active).length);

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
      staffLoading,
      loadStaffAccounts,
      createStaffAccount,
      editingStaffId,
      editDraft,
      startEditStaff,
      cancelEditStaff,
      saveEditStaff,
      toggleStaffStatus,

      memberships,
      membershipError,
      membershipLoading,
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
      totalStaffCount,
      activePlansCount,
      openComplaintsCount,
      exportReport,

      // 6.3 Announcements
      announcements,
      sortedAnnouncements,
      ANNOUNCEMENT_AUDIENCES,
      ANNOUNCEMENT_PRIORITIES,
      announcementAudienceLabel,
      announcementPriorityBadgeClass,
      newAnnouncement,
      announcementError,
      announcementSuccess,
      createAnnouncement,
      editingAnnouncementId,
      announcementEditDraft,
      startEditAnnouncement,
      cancelEditAnnouncement,
      saveEditAnnouncement,
      toggleAnnouncementStatus,
      deleteAnnouncement,

      // Overview
      overviewPendingMemberships,
      overviewAnnouncements,
      publishedAnnouncementsCount,

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
});

app.component('toggle-switch', ToggleSwitch);
app.component('stat-card', StatCard);
app.component('bar-chart', BarChart);
app.component('donut-chart', DonutChart);

app.mount('#app');