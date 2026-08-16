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

    // async function handleLogin() {
    //   if (!loginForm.username || !loginForm.password) {
    //     loginError.value = 'Please enter both username and password.';
    //     return;
    //   }

    //   loginError.value = '';

    //   try {
    //     const data = await apiFetch('/auth/login', {
    //       method: 'POST',
    //       body: JSON.stringify({
    //         username: loginForm.username,
    //         password: loginForm.password
    //       })
    //     });

    //     localStorage.setItem('access_token', data.access_token);
    //     localStorage.setItem('user', JSON.stringify(data.user));

    //     const destination = DASHBOARD_BY_ROLE[data.user && data.user.role] || '/dashboard';
    //     window.location.href = destination;
    //   } catch (err) {
    //     loginError.value = err.message || 'Login failed.';
    //   }
    // }
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

    const role = data.user.role;

    if (role === 'Student') {
      window.location.href = '/dashboard';
    } else if (role === 'Staff') {
      window.location.href = '/staff/dashboard';
    } else if (role === 'Admin') {
      window.location.href = '/admin/dashboard';
    } else {
      loginError.value = 'Unknown user role.';
    }

  } catch (error) {
    console.error('Login failed:', error);
    loginError.value = error.message || 'Invalid username or password.';
  }
}

    return {
      loginForm,
      loginError,
      handleLogin
    };
  }
}).mount('#app');
