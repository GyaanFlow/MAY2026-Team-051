(function () {
  const CONTAINER_ID = 'app-toast-container';

  function ensureContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'status');
      Object.assign(container.style, {
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '360px',
        pointerEvents: 'none'
      });
      document.body.appendChild(container);
    }
    return container;
  }

  const PALETTE = {
    success: { bg: '#0f5132', border: '#0f9d58', icon: '✓' },
    error: { bg: '#5c1a1a', border: '#e0392b', icon: '✕' },
    warning: { bg: '#5c4300', border: '#e0a72b', icon: '!' },
    info: { bg: '#1a2c5c', border: '#3b6be0', icon: 'i' }
  };

  function showToast(message, type, duration) {
    if (!message) return;
    const level = PALETTE[type] ? type : 'info';
    const colors = PALETTE[level];
    const container = ensureContainer();

    const toast = document.createElement('div');
    toast.setAttribute('role', level === 'error' ? 'alert' : 'status');
    Object.assign(toast.style, {
      pointerEvents: 'auto',
      background: colors.bg,
      borderLeft: `4px solid ${colors.border}`,
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
      fontSize: '14px',
      lineHeight: '1.4',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      opacity: '0',
      transform: 'translateX(20px)',
      transition: 'opacity 180ms ease, transform 180ms ease'
    });

    toast.innerHTML = `
      <span style="font-weight:700;flex-shrink:0;">${colors.icon}</span>
      <span style="flex:1;">${message}</span>
      <button type="button" aria-label="Dismiss" style="background:none;border:none;color:#fff;opacity:0.7;cursor:pointer;font-size:14px;line-height:1;padding:0;">&times;</button>
    `;

    const remove = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 200);
    };

    toast.querySelector('button').addEventListener('click', remove);
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    setTimeout(remove, duration || (level === 'error' ? 6000 : 4000));
  }

  window.appToast = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
    info: (msg, duration) => showToast(msg, 'info', duration)
  };

  document.addEventListener('DOMContentLoaded', () => {
    const pending = sessionStorage.getItem('flash_toast');
    if (pending) {
      sessionStorage.removeItem('flash_toast');
      try {
        const { message, level } = JSON.parse(pending);
        showToast(message, level);
      } catch (err) {
        /* ignore malformed flash payload */
      }
    }
  });

  window.flashToastOnNextLoad = function (message, level) {
    sessionStorage.setItem('flash_toast', JSON.stringify({ message, level: level || 'info' }));
  };
})();
