async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // gaurav: fix - handle network failures instead of throwing raw fetch errors
  let response;
  try {
    response = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkError) {
    const error = new Error('Unable to reach the server. Check your connection and try again.');
    error.status = 0;
    if (window.appToast) window.appToast.error(error.message);
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || data.error || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;

    // gaurav: fix - auto logout on expired/invalid token instead of silent failure
    if (response.status === 401 && token) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (window.flashToastOnNextLoad) {
        window.flashToastOnNextLoad('Your session has expired. Please log in again.', 'warning');
      }
      window.location.replace('/');
      return new Promise(() => {});
    }

    if (response.status >= 500 && window.appToast) {
      window.appToast.error('Something went wrong on our end. Please try again shortly.');
    }

    throw error;
  }

  return data;
}
