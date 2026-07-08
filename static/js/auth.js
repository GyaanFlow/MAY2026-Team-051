const { createApp, reactive, ref } = Vue;

createApp({
  setup() {
    const loginForm = reactive({
      username: '',
      password: ''
    });

    const loginError = ref('');

    function handleLogin() {
      if (!loginForm.username || !loginForm.password) {
        loginError.value = 'Please enter both username and password.';
        return;
      }
      loginError.value = '';
      // TODO: POST to /api/login once the backend endpoint exists.
      // The backend should return the account's role, and this should
      // redirect to '/dashboard' for students, '/staff/dashboard' for
      // staff, or '/admin/dashboard' for admins accordingly instead of
      // always assuming student.
      console.log('Login submitted:', { ...loginForm });
      window.location.href = '/dashboard';
    }

    return {
      loginForm,
      loginError,
      handleLogin
    };
  }
}).mount('#app');