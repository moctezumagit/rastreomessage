/**
 * Módulo de Bandeja Unificada (Inbox) y Chat con Prospectos
 */

const InboxModule = (() => {
  let conversations = [];
  let quickReplies = [];

  const icons = {
    facebook: '<i class="fa-brands fa-facebook"></i>',
    instagram: '<i class="fa-brands fa-instagram"></i>',
    tiktok: '<i class="fa-brands fa-tiktok"></i>',
    youtube: '<i class="fa-brands fa-youtube"></i>'
  };

  const channelClass = {
    facebook: 'fb',
    instagram: 'ig',
    tiktok: 'tt',
    youtube: 'yt'
  };

  const stageBadgeClasses = {
    new: 'badge-new',
    contacted: 'badge-contacted',
    appointment: 'badge-appointment',
    proposal: 'badge-proposal',
    won: 'badge-won',
    lost: 'badge-lost'
  };

  function init() {
    // Filtros de Red Social
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        AppState.activeFilterChannel = tab.getAttribute('data-channel');
        loadConversations();
      });
    });

    // Filtros de Estado
    const pillFilters = document.querySelectorAll('.pill-filter');
    pillFilters.forEach(pill => {
      pill.addEventListener('click', () => {
        pillFilters.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        AppState.activeFilterStatus = pill.getAttribute('data-status');
        loadConversations();
      });
    });

    // Buscador
    const searchInput = document.getElementById('inbox-search-input');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          AppState.searchQuery = e.target.value.trim();
          loadConversations();
        }, 300);
      });
    }

    // Envío de Mensaje
    const btnSend = document.getElementById('btn-send-message');
    const textarea = document.getElementById('composer-textarea');
    if (btnSend && textarea) {
      btnSend.addEventListener('click', handleSendMessage);
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      });
    }

    // Sugerencia con IA
    const btnAi = document.getElementById('btn-ai-suggest-reply');
    if (btnAi) {
      btnAi.addEventListener('click', handleAiSuggestion);
    }

    // Guardar Ficha Lead
    const btnSaveLead = document.getElementById('btn-save-lead-details');
    if (btnSaveLead) {
      btnSaveLead.addEventListener('click', handleSaveLeadDetails);
    }

    // Agregar Nota Interna
    const btnAddNote = document.getElementById('btn-add-note');
    const inputNote = document.getElementById('dossier-new-note-input');
    if (btnAddNote && inputNote) {
      btnAddNote.addEventListener('click', handleAddNote);
      inputNote.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddNote();
        }
      });
    }

    // Lanzar WhatsApp
    const btnWa = document.getElementById('btn-launch-whatsapp-chat');
    if (btnWa) {
      btnWa.addEventListener('click', handleLaunchWhatsApp);
    }

    // Alternar Ficha Lead en móvil/escritorio
    const btnToggleDossier = document.getElementById('btn-toggle-lead-details');
    const btnCloseDossier = document.getElementById('btn-close-dossier');
    const dossierPanel = document.getElementById('lead-dossier-panel');
    if (btnToggleDossier && dossierPanel) {
      btnToggleDossier.addEventListener('click', () => {
        dossierPanel.classList.toggle('hidden-panel');
      });
    }
    if (btnCloseDossier && dossierPanel) {
      btnCloseDossier.addEventListener('click', () => {
        dossierPanel.classList.add('hidden-panel');
      });
    }
  }

  // Cargar lista de conversaciones
  async function loadConversations() {
    let url = `/api/conversations?channel=${AppState.activeFilterChannel}&status=${AppState.activeFilterStatus}`;
    if (AppState.searchQuery) {
      url += `&search=${encodeURIComponent(AppState.searchQuery)}`;
    }

    const res = await apiFetch(url);
    if (res.success) {
      conversations = res.conversations || [];
      renderConversationList(conversations);
      updateTotalUnreadBadge(conversations);

      // Si no hay chat seleccionado, seleccionar el primero automáticamente
      if (!AppState.activeConversationId && conversations.length > 0) {
        selectConversation(conversations[0].id);
      } else if (AppState.activeConversationId) {
        // Mantener selección actual
        const currentStillExists = conversations.find(c => c.id === AppState.activeConversationId);
        if (currentStillExists) {
          highlightSelectedChat(AppState.activeConversationId);
        } else if (conversations.length > 0) {
          selectConversation(conversations[0].id);
        }
      }
    }
  }

  // Actualización en segundo plano sin interrumpir lo que el usuario escribe
  async function refreshConversationsSilently() {
    let url = `/api/conversations?channel=${AppState.activeFilterChannel}&status=${AppState.activeFilterStatus}`;
    if (AppState.searchQuery) {
      url += `&search=${encodeURIComponent(AppState.searchQuery)}`;
    }

    const res = await apiFetch(url);
    if (res.success && res.conversations) {
      conversations = res.conversations;
      updateTotalUnreadBadge(conversations);

      // Si hay mensajes nuevos en la conversación activa, refrescar chat
      if (AppState.activeConversationId) {
        const active = conversations.find(c => c.id === AppState.activeConversationId);
        if (active) {
          const container = document.getElementById('chat-messages-container');
          if (container && container.children.length !== active.messages.length) {
            renderMessages(active.messages);
          }
        }
      }
    }
  }

  // Renderizar la lista de chats en el sidebar
  function renderConversationList(convs) {
    const listEl = document.getElementById('conversation-list');
    if (!listEl) return;

    if (convs.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: var(--text-dim);">
          <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 8px;"></i>
          <p style="font-size: 0.85rem;">No se encontraron mensajes con estos filtros.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = convs.map(c => {
      const isUnread = c.status === 'unread' || c.unreadCount > 0;
      const isActive = c.id === AppState.activeConversationId;
      const channelIcon = icons[c.channel] || '<i class="fa-solid fa-message"></i>';
      const cClass = channelClass[c.channel] || 'fb';
      const lastMsgText = c.lastMessage?.text || 'Sin mensajes';
      const timeStr = formatRelativeTime(c.lastMessage?.timestamp);

      return `
        <div class="conv-item ${isActive ? 'active' : ''}" data-id="${c.id}" onclick="InboxModule.selectConversation('${c.id}')">
          <div class="conv-avatar-wrap">
            <img src="${c.contact.avatar}" alt="${c.contact.name}" class="conv-avatar">
            <span class="channel-sub-icon ${cClass}">
              ${channelIcon}
            </span>
          </div>
          <div class="conv-details">
            <div class="conv-top-row">
              <span class="conv-name">${c.contact.name}</span>
              <span class="conv-time">${timeStr}</span>
            </div>
            <div class="conv-message-row">
              <span class="conv-snippet" style="${isUnread ? 'font-weight: 700; color: var(--text-main);' : ''}">${lastMsgText}</span>
              ${isUnread ? '<span class="conv-unread-pill"></span>' : ''}
            </div>
            <div class="conv-stage-row">
              <span class="mini-stage-badge">${c.lead?.stageName || 'Nuevo'}</span>
              ${c.lead?.estimatedValue ? `<span class="mini-stage-badge" style="color: var(--primary); font-weight:700;">$${c.lead.estimatedValue.toLocaleString()}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function highlightSelectedChat(convId) {
    document.querySelectorAll('.conv-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-id') === convId);
    });
  }

  function updateTotalUnreadBadge(convs) {
    const unreadCount = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    const badgeEl = document.getElementById('unread-total-badge');
    if (badgeEl) {
      badgeEl.textContent = unreadCount;
      badgeEl.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
  }

  // Seleccionar conversación y cargar en el viewport
  async function selectConversation(convId) {
    AppState.activeConversationId = convId;
    highlightSelectedChat(convId);

    const res = await apiFetch(`/api/conversations/${convId}`);
    if (!res.success || !res.conversation) return;

    const conv = res.conversation;

    // Marcar como leída en backend
    apiFetch(`/api/conversations/${convId}/read`, { method: 'POST' });

    // Actualizar encabezado del chat
    document.getElementById('chat-contact-name').textContent = conv.contact.name;
    document.getElementById('chat-contact-handle').textContent = conv.contact.username || '@usuario';
    document.getElementById('chat-contact-avatar').src = conv.contact.avatar;
    document.getElementById('chat-lead-stage-badge').textContent = conv.lead.stageName || 'Nuevo Prospecto';

    const channelBadgeEl = document.getElementById('chat-channel-badge');
    const cClass = channelClass[conv.channel] || 'fb';
    channelBadgeEl.className = `channel-sub-icon ${cClass}`;
    channelBadgeEl.innerHTML = icons[conv.channel] || '';

    // Enlace a perfil original
    const profileLink = document.getElementById('chat-external-profile-link');
    if (conv.contact.profileUrl) {
      profileLink.href = conv.contact.profileUrl;
      profileLink.style.display = 'inline-flex';
    } else {
      profileLink.style.display = 'none';
    }

    // Banner de contexto
    const sourceBanner = document.getElementById('message-source-banner');
    const sourceText = document.getElementById('message-source-text');
    if (conv.sourceContext) {
      sourceBanner.style.display = 'flex';
      sourceText.textContent = `Origen: ${conv.sourceContext}`;
    } else {
      sourceBanner.style.display = 'none';
    }

    // Renderizar mensajes
    renderMessages(conv.messages || []);

    // Actualizar Ficha CRM (Dossier)
    renderLeadDossier(conv);
  }

  // Renderizar burbujas de chat
  function renderMessages(messages) {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    container.innerHTML = messages.map(m => {
      const isCustomer = m.sender === 'customer';
      const isBot = m.sender === 'bot';
      const senderRoleClass = isCustomer ? 'customer' : (isBot ? 'bot' : 'agent');
      const timeStr = new Date(m.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

      let senderLabel = '';
      if (isCustomer) {
        senderLabel = `<span>Prospecto</span>`;
      } else if (isBot) {
        senderLabel = `<span class="bot-tag"><i class="fa-solid fa-robot"></i> ${m.ruleTriggered || 'Auto-Responder'}</span>`;
      } else {
        senderLabel = `<span>Asesor Equilibrio Nutrición</span>`;
      }

      return `
        <div class="message-bubble-row ${senderRoleClass}">
          <div class="bubble-sender-name">${senderLabel}</div>
          <div class="message-bubble">
            ${escapeHtml(m.text)}
          </div>
          <div class="bubble-meta">
            <span>${timeStr}</span>
            ${!isCustomer ? '<i class="fa-solid fa-check-double" style="color: #10b981;"></i>' : ''}
          </div>
        </div>
      `;
    }).join('');

    // Auto-scroll al fondo
    container.scrollTop = container.scrollHeight;
  }

  // Cargar y renderizar Respuestas Rápidas (Templates)
  async function loadQuickReplies() {
    const res = await apiFetch('/api/quick-replies');
    if (res.success && res.quickReplies) {
      quickReplies = res.quickReplies;
      const pillsContainer = document.getElementById('quick-replies-pills');
      if (!pillsContainer) return;

      pillsContainer.innerHTML = quickReplies.map(qr => `
        <button class="qr-pill-btn" onclick="InboxModule.insertQuickReply('${qr.id}')" title="${escapeHtml(qr.text)}">
          ${escapeHtml(qr.title)}
        </button>
      `).join('');
    }
  }

  function insertQuickReply(qrId) {
    const qr = quickReplies.find(q => q.id === qrId);
    if (!qr) return;

    const textarea = document.getElementById('composer-textarea');
    if (textarea) {
      textarea.value = qr.text;
      textarea.focus();
    }
  }

  // Envío manual de mensaje
  async function handleSendMessage() {
    const textarea = document.getElementById('composer-textarea');
    if (!textarea || !textarea.value.trim() || !AppState.activeConversationId) return;

    const text = textarea.value.trim();
    textarea.value = '';

    const res = await apiFetch(`/api/conversations/${AppState.activeConversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    if (res.success && res.conversation) {
      renderMessages(res.conversation.messages);
      loadConversations();
      showToast('Mensaje enviado al prospecto', 'success', 2000);
    }
  }

  // Sugerencia de respuesta con IA
  async function handleAiSuggestion() {
    if (!AppState.activeConversationId) return;

    const btnAi = document.getElementById('btn-ai-suggest-reply');
    btnAi.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
    btnAi.disabled = true;

    const res = await apiFetch(`/api/conversations/${AppState.activeConversationId}/suggest-ai`, {
      method: 'POST'
    });

    btnAi.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Sugerir con IA';
    btnAi.disabled = false;

    if (res.success && res.suggestion) {
      const textarea = document.getElementById('composer-textarea');
      if (textarea) {
        textarea.value = res.suggestion;
        textarea.focus();
        showToast('Respuesta sugerida con IA lista para revisar y enviar', 'info');
      }
    }
  }

  // Renderizar Ficha CRM del Lead
  function renderLeadDossier(conv) {
    const lead = conv.lead || {};
    const contact = conv.contact || {};

    // Calificación
    document.getElementById('dossier-score').textContent = lead.score || 50;
    const scoreLabelEl = document.getElementById('dossier-score-label');
    if (lead.score >= 85) {
      scoreLabelEl.textContent = '🔥 Muy Alta Intención de Compra';
      scoreLabelEl.style.color = '#10b981';
    } else if (lead.score >= 70) {
      scoreLabelEl.textContent = '⚡ Prospecto Calificado';
      scoreLabelEl.style.color = '#0ea5e9';
    } else {
      scoreLabelEl.textContent = '❄️ En Calificación';
      scoreLabelEl.style.color = '#94a3b8';
    }

    // Campos
    document.getElementById('dossier-stage-select').value = lead.stage || 'new';
    document.getElementById('dossier-interest-input').value = lead.interest || '';
    document.getElementById('dossier-value-input').value = lead.estimatedValue || '';
    document.getElementById('dossier-phone-input').value = contact.phone || '';
    document.getElementById('dossier-email-input').value = contact.email || '';

    // Tags
    const tagsContainer = document.getElementById('dossier-tags-container');
    if (tagsContainer) {
      tagsContainer.innerHTML = (lead.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('') || '<span style="font-size:0.75rem; color:var(--text-dim);">Sin etiquetas</span>';
    }

    // Notas
    const notesTimeline = document.getElementById('dossier-notes-timeline');
    if (notesTimeline) {
      notesTimeline.innerHTML = (lead.notes || []).map(n => `
        <div class="note-item">
          <div>${escapeHtml(n.text)}</div>
          <span class="note-time">${formatRelativeTime(n.date)}</span>
        </div>
      `).join('') || '<span style="font-size:0.75rem; color:var(--text-dim);">Sin notas previas</span>';
    }
  }

  // Guardar Cambios en la Ficha del Lead
  async function handleSaveLeadDetails() {
    if (!AppState.activeConversationId) return;

    const stage = document.getElementById('dossier-stage-select').value;
    const interest = document.getElementById('dossier-interest-input').value.trim();
    const estimatedValue = parseFloat(document.getElementById('dossier-value-input').value) || 0;
    const phone = document.getElementById('dossier-phone-input').value.trim();
    const email = document.getElementById('dossier-email-input').value.trim();

    const payload = {
      stage,
      interest,
      estimatedValue,
      contactUpdate: { phone, email }
    };

    const res = await apiFetch(`/api/conversations/${AppState.activeConversationId}/lead`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    if (res.success && res.conversation) {
      showToast('Ficha de prospecto actualizada exitosamente', 'success');
      document.getElementById('chat-lead-stage-badge').textContent = res.conversation.lead.stageName;
      loadConversations();
    }
  }

  // Añadir Nota Interna
  async function handleAddNote() {
    const input = document.getElementById('dossier-new-note-input');
    if (!input || !input.value.trim() || !AppState.activeConversationId) return;

    const text = input.value.trim();
    input.value = '';

    const res = await apiFetch(`/api/conversations/${AppState.activeConversationId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    if (res.success) {
      showToast('Nota de seguimiento guardada', 'info');
      // Recargar conversación activa
      selectConversation(AppState.activeConversationId);
    }
  }

  // Abrir WhatsApp directo con mensaje personalizado para el prospecto
  function handleLaunchWhatsApp() {
    if (!AppState.activeConversationId) return;
    const conv = conversations.find(c => c.id === AppState.activeConversationId);
    if (!conv) return;

    const clientPhone = conv.contact.phone ? conv.contact.phone.replace(/[^0-9]/g, '') : '';
    const clientName = conv.contact.name || 'amigo';
    const interest = conv.lead.interest || 'planes de nutrición y bienestar';

    const defaultMsg = encodeURIComponent(`¡Hola ${clientName}! 🌿 Te saludamos de Equilibrio Bienestar y Nutrición. Con gusto le damos seguimiento a tu consulta sobre ${interest} para enviarte tu propuesta personalizada.`);

    if (clientPhone && clientPhone.length >= 10) {
      // Abrir chat directo al número del cliente
      window.open(`https://wa.me/${clientPhone}?text=${defaultMsg}`, '_blank');
    } else {
      // Abrir con el número de negocio para compartir enlace
      const bizPhone = (AppState.settings.businessPhone || '+5215500000000').replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${bizPhone}?text=${defaultMsg}`, '_blank');
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    init,
    loadConversations,
    refreshConversationsSilently,
    selectConversation,
    loadQuickReplies,
    insertQuickReply
  };
})();

window.InboxModule = InboxModule;
document.addEventListener('DOMContentLoaded', () => InboxModule.init());
