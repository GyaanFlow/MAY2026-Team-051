// gaurav: fix - block direct/unauthenticated access to dashboard pages
const DASHBOARD_BY_ROLE = {
  Admin: '/admin/dashboard',
  Staff: '/staff/dashboard',
  Student: '/dashboard'
};

(function enforceAuth() {
  const token = localStorage.getItem('access_token');
  const rawUser = localStorage.getItem('user');
  let user = null;

  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch (err) {
    user = null;
  }

  const requiredRole = document.body ? document.body.dataset.requiredRole : null;

  if (!requiredRole) {
    return;
  }

  if (!token || !user || !user.role) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.replace('/');
    return;
  }

  if (user.role !== requiredRole) {
    window.location.replace(DASHBOARD_BY_ROLE[user.role] || '/');
  }
})();
