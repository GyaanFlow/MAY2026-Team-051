const { createApp, reactive, ref, computed } = Vue;

const icons = {
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.6 3.7-5.5 6.5-5.5s5.3 1.9 6.5 5.5"/><path d="M18.5 8v6M15.5 11h6"/></svg>',
  memberships: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/><path d="M8 17.5l2 2 3.5-3.5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>'
};

createApp({
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: false },
      { id: 'staffAccounts', label: 'Staff Account Management', icon: icons.staff, enabled: true },
      { id: 'memberships', label: 'Student Membership Management', icon: icons.memberships, enabled: true },
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

      handleLogout
    };
  }
}).mount('#app');