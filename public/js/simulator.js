/**
 * Módulo de Simulación en Vivo para Pruebas Inmediatas
 */

const SimulatorModule = (() => {
  function init() {
    const btnOpen = document.getElementById('btn-open-simulator');
    const modal = document.getElementById('modal-simulator');
    const btnClose = document.getElementById('btn-close-simulator');
    const btnCancel = document.getElementById('btn-cancel-simulator');
    const btnSubmit = document.getElementById('btn-submit-simulator');

    if (btnOpen && modal) {
      btnOpen.addEventListener('click', () => {
        modal.classList.add('active');
      });
    }

    if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.classList.remove('active'));
    }
    if (btnCancel && modal) {
      btnCancel.addEventListener('click', () => modal.classList.remove('active'));
    }

    // Pastillas de mensajes de ejemplo rápidos
    const samplePills = document.querySelectorAll('.sample-pill');
    const msgTextarea = document.getElementById('sim-message-text');
    samplePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const msg = pill.getAttribute('data-msg');
        if (msg && msgTextarea) {
          msgTextarea.value = msg;
          msgTextarea.focus();
        }
      });
    });

    if (btnSubmit) {
      btnSubmit.addEventListener('click', handleSubmitSimulation);
    }
  }

  async function handleSubmitSimulation() {
    const channelInput = document.querySelector('input[name="sim-channel"]:checked');
    const channel = channelInput ? channelInput.value : 'instagram';
    const contactName = document.getElementById('sim-contact-name').value.trim() || 'Prospecto Simulado';
    const contactUsername = document.getElementById('sim-contact-username').value.trim() || '@prospecto';
    const messageText = document.getElementById('sim-message-text').value.trim();

    if (!messageText) {
      showToast('Por favor escribe un mensaje para simular', 'warning');
      return;
    }

    const btnSubmit = document.getElementById('btn-submit-simulator');
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Simulando...';
    btnSubmit.disabled = true;

    const res = await apiFetch('/api/simulator/send', {
      method: 'POST',
      body: JSON.stringify({
        channel,
        contactName,
        contactUsername,
        messageText,
        simulatedPost: `Simulación en vivo desde ${channel.toUpperCase()}`
      })
    });

    btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Mensaje Simulado';
    btnSubmit.disabled = false;

    if (res.success && res.conversation) {
      document.getElementById('modal-simulator')?.classList.remove('active');
      
      let toastMsg = `Mensaje de ${channel.toUpperCase()} recibido.`;
      if (res.autoReply && res.autoReply.triggered) {
        toastMsg += ` 🤖 Bot auto-respondió al instante con regla: "${res.autoReply.rule?.title || 'Smart Reply'}".`;
      }
      showToast(toastMsg, 'success', 5000);

      // Cambiar a la vista de bandeja y abrir el chat generado
      switchView('inbox');
      await window.InboxModule?.loadConversations();
      setTimeout(() => {
        window.InboxModule?.selectConversation(res.conversation.id);
      }, 200);
    }
  }

  return {
    init
  };
})();

window.SimulatorModule = SimulatorModule;
document.addEventListener('DOMContentLoaded', () => SimulatorModule.init());
