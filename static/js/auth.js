const { createApp, reactive, ref } = Vue;

createApp({
  setup() {
    const isLogin = ref(true);

    const loginForm = reactive({
      username: '',
      password: ''
    });

    const registerForm = reactive({
      username: '',
      fullname: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      confirmPassword: '',
      address: ''
    });

    const loginError = ref('');
    const registerError = ref('');

    function switchToRegister() {
      isLogin.value = false;
      loginError.value = '';
    }

    function switchToLogin() {
      isLogin.value = true;
      registerError.value = '';
    }

    function handleLogin() {
      if (!loginForm.username || !loginForm.password) {
        loginError.value = 'Please enter both username and password.';
        return;
      }
      loginError.value = '';
      // TODO: POST to /api/login once the backend endpoint exists
      console.log('Login submitted:', { ...loginForm });
      window.location.href = '/dashboard';
    }

    function handleRegister() {
      const requiredFields = ['username', 'fullname', 'email', 'phone', 'role', 'password', 'address'];
      const missing = requiredFields.some((field) => !registerForm[field]);

      if (missing) {
        registerError.value = 'Please fill in all fields.';
        return;
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        registerError.value = 'Passwords do not match.';
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(registerForm.email)) {
        registerError.value = 'Please enter a valid email address.';
        return;
      }

      const phoneDigits = registerForm.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        registerError.value = 'Please enter a valid 10-digit phone number.';
        return;
      }

      registerError.value = '';
      // TODO: POST to /api/register once the backend endpoint exists
      console.log('Register submitted:', { ...registerForm });
    }

    return {
      isLogin,
      loginForm,
      registerForm,
      loginError,
      registerError,
      switchToRegister,
      switchToLogin,
      handleLogin,
      handleRegister
    };
  }
}).mount('#app');