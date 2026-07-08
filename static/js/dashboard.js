const { createApp, reactive, ref, computed } = Vue;

const icons = {
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.4-4 4.2-6 7.5-6s6.1 2 7.5 6"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 17h4l2-6 3 10 2-7 2 3h5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  soon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>'
};

createApp({
  setup() {
    const tabs = ref([
      { id: 'overview', label: 'Overview', icon: icons.overview, enabled: false },
      { id: 'profile', label: 'Profile Management', icon: icons.profile, enabled: true },
      { id: 'activity', label: 'My Activity', icon: icons.activity, enabled: false },
      { id: 'settings', label: 'Settings', icon: icons.settings, enabled: false }
    ]);

    const activeTab = ref('profile');

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

    // Dummy profile data — replace with data fetched from the backend
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
      // TODO: PUT /api/profile/personal once the backend endpoint exists
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
      // TODO: PUT /api/profile/library once the backend endpoint exists
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
      // TODO: POST /api/account/change-password once the backend endpoint exists
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
      // TODO: POST /api/account/deactivate once the backend endpoint exists
      console.log('Deactivation requested');
      deactivationRequested.value = true;
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
      handleLogout
    };
  }
}).mount('#app');