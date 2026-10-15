/**
 * Módulo de Conexión de Redes Sociales (Facebook, Instagram, TikTok, YouTube)
 */

const ChannelsModule = (() => {
  function init() {
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
            showToast(`ℹ️ ${res.result.message || 'Canal listo para recibir Webhooks oficiales.'}`, 'info', 4500);
          }
        }
      });
    });
  }

  async function loadChannels() {
    const res = await apiFetch('/api/channels');
    if (res.success && res.channels) {
      AppState.channels = res.channels;
    }
  }

  return {
    init,
    loadChannels
  };
})();

window.ChannelsModule = ChannelsModule;
document.addEventListener('DOMContentLoaded', () => ChannelsModule.init());
