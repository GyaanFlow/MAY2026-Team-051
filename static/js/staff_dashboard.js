const { createApp, reactive, ref, computed } = Vue;

const icons = {
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>',
  addStudent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1.2-3.6 3.7-5.5 6.5-5.5s5.3 1.9 6.5 5.5"/><path d="M18.5 8v6M15.5 11h6"/></svg>',
  verify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/><path d="M8 17.5l2 2 3.5-3.5"/></svg>',
  students: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c1-3.4 3.2-5.2 5.5-5.2s4.5 1.8 5.5 5.2"/><path d="M14.5 20c.6-2.3 2-3.7 4-3.9"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>'
};

createApp({
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: false },
      { id: 'createStudent', label: 'Create Student Account', icon: icons.addStudent, enabled: true },
      { id: 'verifyMemberships', label: 'Verify Memberships', icon: icons.verify, enabled: true },
      { id: 'students', label: 'Students', icon: icons.students, enabled: false },
      { id: 'settings', label: 'Settings', icon: icons.settings, enabled: false }
    ]);

    const activeTab = ref('createStudent');

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

    return {
      icons,
      tabs,
      activeTab,
      setActiveTab,
      currentTabLabel,
      staff,
      initials,
      initialsOf,
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