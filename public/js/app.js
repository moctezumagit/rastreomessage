/**
 * SocialTrack CRM - Controlador Principal de la Aplicación
 * Equilibrio Bienestar y Nutrición
 */

// Estado Global de la Aplicación
const AppState = {
  currentView: 'inbox',
  activeConversationId: null,
  activeFilterChannel: 'all',
  activeFilterStatus: 'all',
  activeFilterStage: 'all',
  searchQuery: '',
  theme: 'dark',
  settings: {},
  channels: {}
};

// Utilidad para llamadas API
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return await res.json();
  } catch (error) {
    console.error(`Error en API (${endpoint}):`, error);
    showToast('Error de conexión con el servidor', 'error');
    return { success: false, error: error.message };
  }
}

// Sistema de Notificaciones Toast
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'fa-circle-check',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation',
    error: 'fa-circle-exclamation'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initThemeToggle();
  initSettings();

  // Cargar vista inicial
  await window.InboxModule?.loadConversations();
  await window.InboxModule?.loadQuickReplies();

  // Iniciar sondeo en segundo plano (polling cada 6 segundos)
  setInterval(() => {
    if (AppState.currentView === 'inbox') {
      window.InboxModule?.refreshConversationsSilently();
    }
  }, 6000);
});

// Control de Navegación entre Vistas
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetView = link.getAttribute('data-view');
      switchView(targetView);
    });
  });

  const btnQuickAi = document.getElementById('btn-quick-config-ai');
  if (btnQuickAi) {
    btnQuickAi.addEventListener('click', () => switchView('rules'));
  }
}

function switchView(viewName) {
  AppState.currentView = viewName;

  // Actualizar botones del Sidebar
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-view') === viewName);
  });

  // Alternar vistas
  document.querySelectorAll('.app-view').forEach(v => {
    v.classList.remove('active');
  });

  const activeViewEl = document.getElementById(`view-${viewName}`);
  if (activeViewEl) {
    activeViewEl.classList.add('active');
  }

  // Cargar datos según la vista
  if (viewName === 'inbox') {
    window.InboxModule?.loadConversations();
  } else if (viewName === 'pipeline') {
    window.PipelineModule?.loadPipeline();
  } else if (viewName === 'rules') {
    window.RulesModule?.loadRules();
    window.RulesModule?.loadSettings();
  } else if (viewName === 'analytics') {
    window.AnalyticsModule?.loadAnalytics();
  } else if (viewName === 'channels') {
    window.ChannelsModule?.loadChannels();
  }
}

// Toggle Modo Oscuro / Claro
function initThemeToggle() {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  const html = document.documentElement;

  toggleBtn.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    AppState.theme = newTheme;

    toggleBtn.innerHTML = newTheme === 'dark' 
      ? '<i class="fa-solid fa-moon"></i>' 
      : '<i class="fa-solid fa-sun"></i>';
    
    showToast(`Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`, 'info', 2000);
  });
}

// Cargar Configuración Inicial
async function initSettings() {
  const res = await apiFetch('/api/settings');
  if (res.success && res.settings) {
    AppState.settings = res.settings;
  }
}

// Formateador de fechas amigable
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}
