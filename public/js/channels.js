/**
 * Módulo de Conexión y Gestión de Credenciales de Redes Sociales
 * (Facebook, Instagram, TikTok, YouTube)
 */

const ChannelsModule = (() => {
  const guideInfo = {
    facebook: {
      title: 'Configurar Meta Graph API (Facebook Page)',
      guide: `
        <strong>Pasos para obtener tu Token de Facebook:</strong>
        <ol style="margin-left: 18px; margin-top: 6px;">
          <li>Entra a <a href="https://developers.facebook.com/tools/explorer/" target="_blank" style="color:#38bdf8; text-decoration:underline;">Meta Graph API Explorer</a>.</li>
          <li>En "Meta App", selecciona tu app de negocio.</li>
          <li>En "User or Page", selecciona tu página oficial: <strong>Equilibrio Bienestar y Nutrición</strong>.</li>
          <li>Añade los permisos: <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_metadata</code>, <code>pages_messaging</code>.</li>
          <li>Haz clic en <strong>Generate Access Token</strong> y copia el Token resultante aquí abajo.</li>
        </ol>
      `,
      primaryLabel: 'META_PAGE_ACCESS_TOKEN (Token de Página):',
      primaryPlaceholder: 'EAA...',
      primaryHint: 'Token de acceso a la página de Facebook de Equilibrio Bienestar y Nutrición.',
      showSecondary: true,
      appIdLabel: 'Meta App ID:',
      appSecretLabel: 'Meta App Secret:'
    },
    instagram: {
      title: 'Configurar Instagram Graph API (@equilibrionutricion8)',
      guide: `
        <strong>Pasos para conectar Instagram Business:</strong>
        <ol style="margin-left: 18px; margin-top: 6px;">
          <li>Asegúrate de que tu cuenta <strong>@equilibrionutricion8</strong> esté vinculada a tu Fan Page de Facebook.</li>
          <li>En <a href="https://developers.facebook.com/tools/explorer/" target="_blank" style="color:#38bdf8; text-decoration:underline;">Graph API Explorer</a>, añade los permisos <code>instagram_basic</code> e <code>instagram_manage_messages</code>.</li>
          <li>El <strong>Page Access Token</strong> de la página vinculada es el mismo que se utiliza para responder mensajes de Instagram.</li>
        </ol>
      `,
      primaryLabel: 'Token de Acceso (Page Access Token con permisos IG):',
      primaryPlaceholder: 'EAA...',
      primaryHint: 'Mismo Token de la página de Facebook vinculada a tu cuenta de Instagram.',
      showSecondary: false
    },
    tiktok: {
      title: 'Configurar TikTok for Business API (@equilibriobienestarynutricion)',
      guide: `
        <strong>Pasos para obtener credenciales de TikTok:</strong>
        <ol style="margin-left: 18px; margin-top: 6px;">
          <li>Ingresa a <a href="https://business-api.tiktok.com/portal/" target="_blank" style="color:#38bdf8; text-decoration:underline;">TikTok Business Developer Portal</a>.</li>
          <li>Crea una aplicación y copia el <strong>Client Key</strong> y <strong>Client Secret</strong>.</li>
          <li>Genera el <strong>Access Token</strong> con permisos de mensajería (IM API).</li>
        </ol>
      `,
      primaryLabel: 'TIKTOK_ACCESS_TOKEN:',
      primaryPlaceholder: 'act.xxxx...',
      primaryHint: 'Token de acceso de TikTok for Business.',
      showSecondary: true,
      appIdLabel: 'Client Key:',
      appSecretLabel: 'Client Secret:'
    },
    youtube: {
      title: 'Configurar YouTube Data API v3 (@equilibriobienestarynutricion)',
      guide: `
        <strong>Pasos para obtener tu API Key de YouTube:</strong>
        <ol style="margin-left: 18px; margin-top: 6px;">
          <li>Entra a <a href="https://console.cloud.google.com/" target="_blank" style="color:#38bdf8; text-decoration:underline;">Google Cloud Console</a> y crea un proyecto.</li>
          <li>Ve a <strong>APIs y Servicios</strong> > <strong>Biblioteca</strong>, busca <em>"YouTube Data API v3"</em> y haz clic en <strong>Habilitar</strong>.</li>
          <li>Ve a <strong>Credenciales</strong> > <strong>Crear Credenciales</strong> > <strong>Clave de API</strong> (API Key).</li>
          <li>Copia la clave generada (empieza con <code>AIzaSy...</code>) y pégala aquí abajo.</li>
        </ol>
      `,
      primaryLabel: 'YOUTUBE_API_KEY (Clave de API de Google):',
      primaryPlaceholder: 'AIzaSy...',
      primaryHint: 'Clave de API pública con acceso a YouTube Data API v3.',
      showSecondary: false
    }
  };

  function init() {
    // Botones de probar conexión
    const testButtons = document.querySelectorAll('.test-channel-btn');
    testButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const channel = btn.getAttribute('data-channel');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando...';
        btn.disabled = true;

        const res = await apiFetch('/api/channels/test', {
          method: 'POST',
          body: JSON.stringify({ channel })
        });

        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-vial"></i> Probar Conexión';

        if (res.success && res.result) {
          if (res.result.connected) {
            showToast(`✅ Conexión con ${channel.toUpperCase()} verificada exitosamente.`, 'success', 4000);
          } else {
            showToast(`ℹ️ ${res.result.message || 'Canal listo para recibir Webhooks oficiales.'}`, 'warning', 5000);
          }
        }
      });
    });

    // Botones de Configurar Token
    const configButtons = document.querySelectorAll('.config-channel-btn');
    configButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const channel = btn.getAttribute('data-channel');
        openCredentialsModal(channel);
      });
    });

    // Cerrar modal
    const modal = document.getElementById('modal-channel-credentials');
    const btnClose = document.getElementById('btn-close-credentials-modal');
    const btnCancel = document.getElementById('btn-cancel-credentials-modal');
    if (btnClose) btnClose.addEventListener('click', () => modal?.classList.remove('active'));
    if (btnCancel) btnCancel.addEventListener('click', () => modal?.classList.remove('active'));
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('active')) {
        modal.classList.remove('active');
      }
    });

    // Guardar credenciales
    const btnSave = document.getElementById('btn-save-credentials-submit');
    if (btnSave) {
      btnSave.addEventListener('click', handleSaveCredentials);
    }
  }

  function openCredentialsModal(channel) {
    const modal = document.getElementById('modal-channel-credentials');
    if (!modal) {
      console.error('[ChannelsModule] No se encontró el modal #modal-channel-credentials');
      return;
    }

    const info = guideInfo[channel] || guideInfo.facebook;
    const settings = (window.AppState && window.AppState.settings && window.AppState.settings.apiCredentials) 
      ? window.AppState.settings.apiCredentials 
      : {};
    const creds = settings[channel] || {};

    const credInput = document.getElementById('cred-channel-id');
    const titleEl = document.getElementById('modal-credentials-title');
    const guideEl = document.getElementById('cred-guide-container');
    const labelToken = document.getElementById('label-primary-token');
    const hintToken = document.getElementById('hint-primary-token');
    const inputToken = document.getElementById('input-primary-token');
    const secGroup = document.getElementById('group-secondary-keys');
    const labelAppId = document.getElementById('label-app-id');
    const labelAppSecret = document.getElementById('label-app-secret');
    const inputAppId = document.getElementById('input-app-id');
    const inputAppSecret = document.getElementById('input-app-secret');

    if (credInput) credInput.value = channel;
    if (titleEl) titleEl.textContent = info.title;
    if (guideEl) guideEl.innerHTML = info.guide;

    // Campo primario
    if (labelToken) labelToken.textContent = info.primaryLabel;
    if (hintToken) hintToken.textContent = info.primaryHint;
    if (inputToken) {
      inputToken.placeholder = info.primaryPlaceholder;
      inputToken.value = creds.pageAccessToken || creds.accessToken || creds.apiKey || '';
    }

    // Campos secundarios
    if (secGroup) {
      if (info.showSecondary) {
        secGroup.style.display = 'flex';
        if (labelAppId) labelAppId.textContent = info.appIdLabel;
        if (labelAppSecret) labelAppSecret.textContent = info.appSecretLabel;
        if (inputAppId) inputAppId.value = creds.appId || creds.clientKey || '';
        if (inputAppSecret) inputAppSecret.value = creds.appSecret || creds.clientSecret || '';
      } else {
        secGroup.style.display = 'none';
      }
    }

    modal.classList.add('active');
    setTimeout(() => {
      if (inputToken) inputToken.focus();
    }, 100);
  }

  async function handleSaveCredentials() {
    const channel = document.getElementById('cred-channel-id').value;
    const tokenVal = document.getElementById('input-primary-token').value.trim();
    const appId = document.getElementById('input-app-id').value.trim();
    const appSecret = document.getElementById('input-app-secret').value.trim();

    if (!tokenVal) {
      showToast('Por favor introduce el Token o API Key', 'warning');
      return;
    }

    const credentials = {};
    if (channel === 'facebook' || channel === 'instagram') {
      credentials.pageAccessToken = tokenVal;
      if (appId) credentials.appId = appId;
      if (appSecret) credentials.appSecret = appSecret;
    } else if (channel === 'tiktok') {
      credentials.accessToken = tokenVal;
      if (appId) credentials.clientKey = appId;
      if (appSecret) credentials.clientSecret = appSecret;
    } else if (channel === 'youtube') {
      credentials.apiKey = tokenVal;
    }

    const btnSave = document.getElementById('btn-save-credentials-submit');
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    btnSave.disabled = true;

    const res = await apiFetch('/api/channels/credentials', {
      method: 'POST',
      body: JSON.stringify({ channel, credentials })
    });

    btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar y Validar Conexión';
    btnSave.disabled = false;

    if (res.success) {
      showToast(`Credenciales de ${channel.toUpperCase()} guardadas exitosamente.`, 'success', 3000);
      document.getElementById('modal-channel-credentials').classList.remove('active');

      // Actualizar estado en AppState
      if (!AppState.settings) AppState.settings = {};
      AppState.settings.apiCredentials = res.apiCredentials;

      // Probar conexión de inmediato
      const testBtn = document.querySelector(`.test-channel-btn[data-channel="${channel}"]`);
      if (testBtn) testBtn.click();
    }
  }

  async function loadChannels() {
    const res = await apiFetch('/api/channels');
    if (res.success && res.channels) {
      AppState.channels = res.channels;
    }

    const settingsRes = await apiFetch('/api/settings');
    if (settingsRes.success && settingsRes.settings) {
      AppState.settings = settingsRes.settings;
      updateCardsStatus(settingsRes.settings.apiCredentials || {});
    }
  }

  function updateCardsStatus(creds) {
    const list = ['facebook', 'instagram', 'tiktok', 'youtube'];
    list.forEach(ch => {
      const c = creds[ch] || {};
      const hasToken = !!(c.pageAccessToken || c.accessToken || c.apiKey);
      const badge = document.getElementById(`channel-badge-${ch}`);
      const statusText = document.getElementById(`token-status-text-${ch}`);

      if (badge) {
        if (hasToken) {
          badge.className = 'status-badge connected';
          badge.style.background = 'rgba(16, 185, 129, 0.15)';
          badge.style.color = '#10b981';
          badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Token Configurado';
        } else {
          badge.className = 'status-badge';
          badge.style.background = 'rgba(245, 158, 11, 0.15)';
          badge.style.color = '#f59e0b';
          badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Requiere Token';
        }
      }

      if (statusText) {
        if (hasToken) {
          statusText.textContent = 'Token guardado y listo para consultas en vivo';
          statusText.style.color = '#10b981';
        } else {
          statusText.textContent = 'Falta ingresar el Token. Haz clic en "Configurar Token" para agregarlo';
          statusText.style.color = '#f59e0b';
        }
      }
    });
  }

  return {
    init,
    loadChannels,
    updateCardsStatus,
    openCredentialsModal
  };
})();

window.ChannelsModule = ChannelsModule;
document.addEventListener('DOMContentLoaded', () => ChannelsModule.init());
