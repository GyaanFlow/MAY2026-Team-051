const { createApp, reactive, ref } = Vue;

createApp({
  setup() {
    const loginForm = reactive({
      username: '',
      password: ''
    });

    const loginError = ref('');

    const DASHBOARD_BY_ROLE = {
      Admin: '/admin/dashboard',
      Staff: '/staff/dashboard',
      Student: '/dashboard'
    };

    async function handleLogin() {
      if (!loginForm.username || !loginForm.password) {
        loginError.value = 'Please enter both username and password.';
        return;
      }

      loginError.value = '';

      try {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            username: loginForm.username,
            password: loginForm.password
          })
        });

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        const destination = DASHBOARD_BY_ROLE[data.user && data.user.role] || '/dashboard';
        window.location.href = destination;
      } catch (err) {
        loginError.value = err.message || 'Login failed.';
      }
    }

    return {
      loginForm,
      loginError,
      handleLogin
    };
  }
}).mount('#app');
