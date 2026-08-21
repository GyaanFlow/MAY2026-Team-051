const { createApp, reactive, ref, computed, onMounted, onBeforeUnmount, watch } = Vue;

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
    data: { type: Array, required: true } 
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
      fullName: '',
      avatarUrl: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      address: '',

      adminId: '',
      designation: 'Library Administrator',
      dateJoined: '',

      username: '',
      userId: null
    });

    const security = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    const securityError = ref('');
    const personalError = ref('');
    const savedSection = ref('');

    const avatarStyle = computed(() => {
      return admin.avatarUrl ? { backgroundImage: `url(${admin.avatarUrl})` } : {};
    });

    function avatarStorageKey(userId) {
      return userId ? `avatar_user_${userId}` : '';
    }

    function applyProfile(data) {
      admin.userId = data.user_id || null;
      admin.fullName = data.full_name || '';
      admin.email = data.email || '';
      admin.phone = data.phone || '';
      admin.dob = data.dob || '';
      admin.gender = data.gender || '';
      admin.address = data.address || '';
      admin.designation = data.position || 'Library Administrator';
      admin.username = data.username || '';
      admin.adminId = data.user_id ? `ADMIN-${String(data.user_id).padStart(4, '0')}` : '';
      const key = avatarStorageKey(admin.userId);
      admin.avatarUrl = key ? (localStorage.getItem(key) || '') : '';
    }

    async function loadProfile() {
      personalError.value = '';
      try {
        const data = await apiFetch('/profile');
        applyProfile(data);
      } catch (error) {
        personalError.value = error.message || 'Unable to load profile.';
      }
    }

    function flashSaved(section) {
      savedSection.value = section;
      setTimeout(() => {
        if (savedSection.value === section) savedSection.value = '';
      }, 2500);
    }

    async function savePersonal() {
      personalError.value = '';
      if (!admin.fullName || !admin.fullName.trim()) {
        personalError.value = 'Full name is required.';
        return;
      }
      if (!admin.email || !admin.email.trim()) {
        personalError.value = 'Email is required.';
        return;
      }

      try {
        const data = await apiFetch('/profile', {
          method: 'PUT',
          body: JSON.stringify({
            full_name: admin.fullName.trim(),
            email: admin.email.trim(),
            phone: admin.phone || null,
            dob: admin.dob || null,
            gender: admin.gender || null,
            address: admin.address || null,
            position: admin.designation || null
          })
        });
        if (data.user) {
          applyProfile(data.user);
        }
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            user.full_name = admin.fullName;
            user.email = admin.email;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (_) { /* ignore */ }
        }
        flashSaved('personal');
      } catch (error) {
        personalError.value = error.message || 'Unable to save personal details.';
      }
    }

    async function changePassword() {
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
        securityError.value = error.message || 'Unable to update password.';
      }
    }

    function handleAvatarChange(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        admin.avatarUrl = e.target.result;
        const key = avatarStorageKey(admin.userId);
        if (key) localStorage.setItem(key, admin.avatarUrl);
      };
      reader.readAsDataURL(file);
    }

    function removeAvatar() {
      admin.avatarUrl = '';
      const key = avatarStorageKey(admin.userId);
      if (key) localStorage.removeItem(key);
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

  

    const membershipPlans = ref([]);
    const plansLoading = ref(false);
    const plansSaving = ref(false);
    const planError = ref('');
    const planSuccess = ref('');
    const emptyPlan = () => ({
      name: '',
      price: null,
      durationDays: 30
    });
    const newPlan = reactive(emptyPlan());
    const editingPlanId = ref(null);
    const planEditDraft = reactive({
      name: '',
      price: null,
      durationDays: 30
    });

    function mapMembershipPlan(plan) {
      return {
        id: plan.plan_id,
        name: plan.plan_name,
        price: plan.price,
        durationDays: plan.duration_days,
        active: plan.is_active
      };
    }

    function formatPlanDuration(days) {
      const value = Number(days);
      if (!value) return '—';
      return value === 1 ? '1 day' : `${value} days`;
    }

    function flashPlanSuccess(message) {
      planSuccess.value = message;
      setTimeout(() => {
        planSuccess.value = '';
      }, 2500);
    }

    function validatePlanFields(plan) {
      if (!plan.name || !String(plan.name).trim()) {
        return 'Please provide a plan name.';
      }
      if (!plan.durationDays || plan.durationDays <= 0) {
        return 'Duration must be greater than zero.';
      }
      if (plan.price === null || plan.price === '' || Number(plan.price) < 0) {
        return 'Please provide a valid price.';
      }
      return '';
    }

    async function loadMembershipPlans() {
      plansLoading.value = true;
      planError.value = '';

      try {
        const data = await apiFetch('/admin/membership-plans');
        membershipPlans.value = data.map(mapMembershipPlan);
      } catch (error) {
        planError.value = error.message || 'Unable to load membership plans.';
      } finally {
        plansLoading.value = false;
      }
    }

    async function createPlan() {
      const error = validatePlanFields(newPlan);
      if (error) {
        planError.value = error;
        planSuccess.value = '';
        return;
      }

      planError.value = '';
      planSuccess.value = '';
      plansSaving.value = true;

      try {
        const data = await apiFetch('/admin/membership-plans', {
          method: 'POST',
          body: JSON.stringify({
            plan_name: newPlan.name.trim(),
            duration_days: Number(newPlan.durationDays),
            price: Number(newPlan.price)
          })
        });
        membershipPlans.value.push(mapMembershipPlan(data));
        Object.assign(newPlan, emptyPlan());
        flashPlanSuccess('Membership plan created.');
      } catch (err) {
        planError.value = err.message || 'Unable to create membership plan.';
      } finally {
        plansSaving.value = false;
      }
    }

    function startEditPlan(plan) {
      editingPlanId.value = plan.id;
      planEditDraft.name = plan.name;
      planEditDraft.price = plan.price;
      planEditDraft.durationDays = plan.durationDays;
    }

    function cancelEditPlan() {
      editingPlanId.value = null;
    }

    async function saveEditPlan(plan) {
      const error = validatePlanFields(planEditDraft);
      if (error) {
        planError.value = error;
        return;
      }

      planError.value = '';
      plansSaving.value = true;

      try {
        const data = await apiFetch(`/admin/membership-plans/${plan.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            plan_name: planEditDraft.name.trim(),
            duration_days: Number(planEditDraft.durationDays),
            price: Number(planEditDraft.price)
          })
        });
        Object.assign(plan, mapMembershipPlan(data));
        editingPlanId.value = null;
        flashPlanSuccess('Membership plan updated.');
      } catch (err) {
        planError.value = err.message || 'Unable to update membership plan.';
      } finally {
        plansSaving.value = false;
      }
    }

    async function togglePlanStatus(plan) {
      planError.value = '';
      plansSaving.value = true;
      const nextActive = !plan.active;

      try {
        const data = await apiFetch(`/admin/membership-plans/${plan.id}`, {
          method: 'PUT',
          body: JSON.stringify({ is_active: nextActive })
        });
        plan.active = data.is_active;
        flashPlanSuccess(nextActive ? 'Membership plan activated.' : 'Membership plan retired.');
      } catch (error) {
        planError.value = error.message || 'Unable to update plan status.';
      } finally {
        plansSaving.value = false;
      }
    }


    const reportRange = ref('week');
    const reportRanges = ref([
      { id: 'week', label: 'This Week' },
      { id: 'month', label: 'This Month' },
      { id: 'quarter', label: 'This Quarter' }
    ]);

    const emptyHourSeries = () => (
      [8, 10, 12, 14, 16, 18, 20, 22].map((hour) => ({
        label: hour === 12 ? '12pm' : hour < 12 ? `${hour}am` : `${hour - 12}pm`,
        value: 0
      }))
    );

    const occupancyLive = ref({
      current_occupancy_pct: 0,
      avg_occupancy_pct: 0,
      occupied_now: 0,
      active_seats: 0,
      occupancy_by_hour: emptyHourSeries(),
      total_bookings: 0
    });

    const overviewOccupancy = ref({
      current_occupancy_pct: 0,
      occupancy_by_hour: emptyHourSeries()
    });

    const revenueLive = ref({
      total_revenue: 0,
      revenue_trend: [],
      new_memberships: 0,
      payment_count: 0
    });

    const currentReport = computed(() => ({
      avgOccupancyPct: occupancyLive.value.avg_occupancy_pct,
      occupancyByHour: occupancyLive.value.occupancy_by_hour,
      totalBookings: occupancyLive.value.total_bookings,
      totalRevenue: revenueLive.value.total_revenue,
      revenueTrend: revenueLive.value.revenue_trend.length
        ? revenueLive.value.revenue_trend
        : [{ label: '—', value: 0 }],
      newMemberships: revenueLive.value.new_memberships,
      paymentCount: revenueLive.value.payment_count
    }));

    const peakHour = computed(() => {
      const data = currentReport.value.occupancyByHour || emptyHourSeries();
      return data.reduce((max, d) => (d.value > max.value ? d : max), data[0]);
    });

    async function loadOccupancyReport() {
      try {
        const [todayData, rangeData] = await Promise.all([
          apiFetch('/admin/reports/occupancy?range=today'),
          apiFetch(`/admin/reports/occupancy?range=${reportRange.value}`)
        ]);
        overviewOccupancy.value = {
          current_occupancy_pct: Number(todayData.current_occupancy_pct || 0),
          occupancy_by_hour: todayData.occupancy_by_hour || emptyHourSeries()
        };
        occupancyLive.value = {
          current_occupancy_pct: Number(rangeData.current_occupancy_pct || 0),
          avg_occupancy_pct: Number(rangeData.avg_occupancy_pct || 0),
          occupied_now: Number(rangeData.occupied_now || 0),
          active_seats: Number(rangeData.active_seats || 0),
          occupancy_by_hour: rangeData.occupancy_by_hour || emptyHourSeries(),
          total_bookings: Number(rangeData.total_bookings || 0)
        };
      } catch (error) {
        console.error('Failed to load occupancy report:', error);
      }
    }

    async function loadRevenueReport() {
      try {
        const data = await apiFetch(`/admin/reports/revenue?range=${reportRange.value}`);
        revenueLive.value = {
          total_revenue: Number(data.total_revenue || 0),
          revenue_trend: Array.isArray(data.revenue_trend) ? data.revenue_trend : [],
          new_memberships: Number(data.new_memberships || 0),
          payment_count: Number(data.payment_count || 0)
        };
      } catch (error) {
        console.error('Failed to load revenue report:', error);
      }
    }

    async function loadAnalyticsReports() {
      await Promise.all([loadOccupancyReport(), loadRevenueReport()]);
    }

    watch(reportRange, () => {
      loadAnalyticsReports();
    });

    let occupancyTimer = null;

    const membershipDistribution = computed(() => {
      const namedPalette = {
        Premium: '#4f46e5',
        Regular: '#0891b2',
        'Day Pass': '#d97706',
        Unassigned: '#94a3b8'
      };
      const fallbackPalette = [
        '#2563eb', '#059669', '#db2777', '#ea580c',
        '#7c3aed', '#0d9488', '#ca8a04', '#e11d48',
        '#0284c7', '#65a30d'
      ];
      const counts = {};
      memberships.value.forEach((m) => {
        counts[m.membershipType] = (counts[m.membershipType] || 0) + 1;
      });
      return Object.keys(counts).map((type, index) => ({
        label: type,
        value: counts[type],
        color: namedPalette[type] || fallbackPalette[index % fallbackPalette.length]
      }));
    });

    const activeMembershipsCount = computed(() => approvedMemberships.value.length);


    const totalStaffCount = computed(() => staffAccounts.value.length);
    const activePlansCount = computed(() => membershipPlans.value.filter((p) => p.active).length);
    const complaintsSnapshot = ref([]);
    const openComplaintsCount = computed(
      () => complaintsSnapshot.value.filter((c) => c.status !== 'Resolved' && c.status !== 'resolved').length
    );

    async function loadComplaintsSnapshot() {
      try {
        const data = await apiFetch('/staff/complaints');
        complaintsSnapshot.value = data.complaints || [];
      } catch (error) {
        console.error('Failed to load complaint stats:', error);
      }
    }

    function exportReport() {
      console.log('Exporting report for range:', reportRange.value);
    }

    function handleLogout() {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }

    onMounted(() => {
      loadProfile();
      loadStaffAccounts();
      loadBookingLimits();
      loadSeats();
      loadMemberships();
      loadOperatingHours();
      loadMembershipPlans();
      loadComplaintsSnapshot();
      loadAnnouncements();
      loadAnalyticsReports();
      occupancyTimer = setInterval(loadAnalyticsReports, 30000);
    });

    onBeforeUnmount(() => {
      if (occupancyTimer) clearInterval(occupancyTimer);
    });

    const announcements = ref([]);
    const ANNOUNCEMENT_AUDIENCES = LibraryData.ANNOUNCEMENT_AUDIENCES;
    const ANNOUNCEMENT_PRIORITIES = LibraryData.ANNOUNCEMENT_PRIORITIES;

    function mapAnnouncement(announcement) {
      return {
        id: announcement.announcement_id,
        title: announcement.title,
        message: announcement.content,
        audience: announcement.audience || 'all',
        priority: announcement.priority || 'Normal',
        createdBy: announcement.created_by_name || 'Library admin',
        createdAt: (announcement.created_at || '').slice(0, 10),
        active: Boolean(announcement.is_active)
      };
    }

    async function loadAnnouncements() {
      try {
        const data = await apiFetch('/admin/announcements');
        announcements.value = (data.announcements || []).map(mapAnnouncement);
      } catch (error) {
        console.error('Failed to load announcements:', error);
      }
    }

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
    const announcementSaving = ref(false);

    async function createAnnouncement() {
      if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
        announcementError.value = 'Please provide both a title and a message.';
        announcementSuccess.value = false;
        return;
      }

      announcementSaving.value = true;
      announcementError.value = '';
      try {
        const data = await apiFetch('/admin/announcements', {
          method: 'POST',
          body: JSON.stringify({
            title: newAnnouncement.title.trim(),
            content: newAnnouncement.message.trim(),
            audience: newAnnouncement.audience,
            priority: newAnnouncement.priority
          })
        });
        const record = mapAnnouncement(data.announcement);
        announcements.value = [
          record,
          ...announcements.value.filter((item) => item.id !== record.id)
        ];
        announcementSuccess.value = true;
        Object.assign(newAnnouncement, emptyAnnouncement());
        setTimeout(() => { announcementSuccess.value = false; }, 2500);
      } catch (error) {
        announcementError.value = error.message || 'Could not publish this announcement.';
        announcementSuccess.value = false;
      } finally {
        announcementSaving.value = false;
      }
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

    async function saveEditAnnouncement(announcement) {
      if (!announcementEditDraft.title.trim() || !announcementEditDraft.message.trim()) {
        announcementError.value = 'Please provide both a title and a message.';
        return;
      }
      announcementError.value = '';
      try {
        const data = await apiFetch(`/admin/announcements/${announcement.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: announcementEditDraft.title.trim(),
            content: announcementEditDraft.message.trim(),
            audience: announcementEditDraft.audience,
            priority: announcementEditDraft.priority
          })
        });
        const record = mapAnnouncement(data.announcement);
        announcements.value = announcements.value.map((item) =>
          item.id === record.id ? record : item
        );
        editingAnnouncementId.value = null;
      } catch (error) {
        announcementError.value = error.message || 'Could not save this announcement.';
      }
    }

    async function toggleAnnouncementStatus(announcement) {
      announcementError.value = '';
      try {
        const data = await apiFetch(`/admin/announcements/${announcement.id}`, {
          method: 'PUT',
          body: JSON.stringify({ is_active: !announcement.active })
        });
        const record = mapAnnouncement(data.announcement);
        announcements.value = announcements.value.map((item) =>
          item.id === record.id ? record : item
        );
      } catch (error) {
        announcementError.value = error.message || 'Could not update announcement status.';
      }
    }

    async function deleteAnnouncement(announcement) {
      announcementError.value = '';
      try {
        await apiFetch(`/admin/announcements/${announcement.id}`, { method: 'DELETE' });
        announcements.value = announcements.value.filter((a) => a.id !== announcement.id);
        if (editingAnnouncementId.value === announcement.id) {
          editingAnnouncementId.value = null;
        }
      } catch (error) {
        announcementError.value = error.message || 'Could not delete this announcement.';
      }
    }

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
      plansLoading,
      plansSaving,
      newPlan,
      planError,
      planSuccess,
      formatPlanDuration,
      createPlan,
      editingPlanId,
      planEditDraft,
      startEditPlan,
      cancelEditPlan,
      saveEditPlan,
      togglePlanStatus,

      reportRange,
      reportRanges,
      currentReport,
      peakHour,
      overviewOccupancy,
      occupancyLive,
      revenueLive,
      membershipDistribution,
      activeMembershipsCount,
      totalStaffCount,
      activePlansCount,
      openComplaintsCount,
      exportReport,

      announcements,
      sortedAnnouncements,
      ANNOUNCEMENT_AUDIENCES,
      ANNOUNCEMENT_PRIORITIES,
      announcementAudienceLabel,
      announcementPriorityBadgeClass,
      newAnnouncement,
      announcementError,
      announcementSuccess,
      announcementSaving,
      createAnnouncement,
      editingAnnouncementId,
      announcementEditDraft,
      startEditAnnouncement,
      cancelEditAnnouncement,
      saveEditAnnouncement,
      toggleAnnouncementStatus,
      deleteAnnouncement,

      overviewPendingMemberships,
      overviewAnnouncements,
      publishedAnnouncementsCount,

      security,
      securityError,
      personalError,
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