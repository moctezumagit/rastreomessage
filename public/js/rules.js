/**
 * Módulo de Reglas de Auto-Respuesta y Configuración de IA
 */

const RulesModule = (() => {
  let currentRules = [];

  const channelIcons = {
    facebook: '<i class="fa-brands fa-facebook" title="Facebook"></i>',
    instagram: '<i class="fa-brands fa-instagram" title="Instagram"></i>',
    tiktok: '<i class="fa-brands fa-tiktok" title="TikTok"></i>',
    youtube: '<i class="fa-brands fa-youtube" title="YouTube"></i>'
  };

  function init() {
    // Abrir Modal de Nueva Regla
    const btnOpenModal = document.getElementById('btn-open-new-rule-modal');
    if (btnOpenModal) {
      btnOpenModal.addEventListener('click', () => openRuleModal());
    }

    // Cerrar Modal
    const btnClose = document.getElementById('btn-close-rule-modal');
    const btnCancel = document.getElementById('btn-cancel-rule-modal');
    if (btnClose) btnClose.addEventListener('click', closeRuleModal);
    if (btnCancel) btnCancel.addEventListener('click', closeRuleModal);

    // Guardar Regla
    const btnSubmit = document.getElementById('btn-save-rule-submit');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', handleSaveRule);
    }

    // Guardar Prompt de IA
    const btnSaveAi = document.getElementById('btn-save-ai-prompt');
    if (btnSaveAi) {
      btnSaveAi.addEventListener('click', handleSaveAiPrompt);
    }

    // Toggle IA
    const toggleAi = document.getElementById('toggle-ai-enabled');
    if (toggleAi) {
      toggleAi.addEventListener('change', async (e) => {
        await apiFetch('/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ aiEnabled: e.target.checked })
        });
        showToast(`Asistente IA ${e.target.checked ? 'activado' : 'desactivado'}`, 'info');
      });
    }

    // Guardar Horario
    const btnSaveHours = document.getElementById('btn-save-hours');
    if (btnSaveHours) {
      btnSaveHours.addEventListener('click', handleSaveHours);
    }

    // Toggle Horario
    const toggleHours = document.getElementById('toggle-hours-enabled');
    if (toggleHours) {
      toggleHours.addEventListener('change', async (e) => {
        const settings = AppState.settings || {};
        const hours = settings.businessHours || {};
        hours.enabled = e.target.checked;
        await apiFetch('/api/settings', {
          method: 'PUT',
          body: JSON.stringify({ businessHours: hours })
        });
        showToast(`Control de horario ${e.target.checked ? 'activado' : 'desactivado'}`, 'info');
      });
    }

    // Cambio de tipo de disparador en modal
    const triggerSelect = document.getElementById('rule-trigger-type');
    const kwGroup = document.getElementById('rule-keywords-group');
    if (triggerSelect && kwGroup) {
      triggerSelect.addEventListener('change', (e) => {
        kwGroup.style.display = e.target.value === 'keyword' ? 'block' : 'none';
      });
    }
  }

  async function loadRules() {
    const res = await apiFetch('/api/rules');
    if (res.success && res.rules) {
      currentRules = res.rules;
      renderRulesList(currentRules);
    }
  }

  function renderRulesList(rules) {
    const grid = document.getElementById('rules-grid');
    if (!grid) return;

    if (rules.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-dim); padding:20px;">No hay reglas creadas aún.</p>';
      return;
    }

    grid.innerHTML = rules.map(rule => {
      const typeLabels = {
        keyword: 'Palabras Clave',
        welcome: 'Bienvenida',
        off_hours: 'Fuera de Horario'
      };

      const cIcons = (rule.channels || []).map(ch => channelIcons[ch] || '').join(' ');

      return `
        <div class="rule-card">
          <div class="rule-card-top">
            <div class="rule-title-group">
              <h4>${escapeHtml(rule.title)}</h4>
              <span class="rule-type-pill">${typeLabels[rule.triggerType] || rule.triggerType}</span>
            </div>
            <label class="switch">
              <input type="checkbox" ${rule.isActive ? 'checked' : ''} onchange="RulesModule.toggleRuleActive('${rule.id}', this.checked)">
              <span class="slider round"></span>
            </label>
          </div>

          ${rule.keywords && rule.keywords.length ? `
            <div class="rule-keywords-wrap">
              ${rule.keywords.map(kw => `<span class="kw-badge">${escapeHtml(kw)}</span>`).join('')}
            </div>
          ` : ''}

          <div class="rule-response-box">
            ${escapeHtml(rule.response)}
          </div>

          <div class="rule-card-footer">
            <div class="rule-channel-icons">
              ${cIcons}
            </div>
            <div class="rule-actions">
              <button class="btn btn-xs btn-secondary" onclick="RulesModule.openRuleModal('${rule.id}')" title="Editar regla">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-xs btn-outline" style="color:#ef4444;" onclick="RulesModule.deleteRule('${rule.id}')" title="Eliminar regla">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function toggleRuleActive(ruleId, isActive) {
    const res = await apiFetch(`/api/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
    if (res.success) {
      showToast(`Regla ${isActive ? 'activada' : 'pausada'}`, 'info', 2000);
    }
  }

  async function deleteRule(ruleId) {
    if (!confirm('¿Deseas eliminar esta regla de auto-respuesta?')) return;

    const res = await apiFetch(`/api/rules/${ruleId}`, {
      method: 'DELETE'
    });
    if (res.success) {
      showToast('Regla eliminada exitosamente', 'info');
      loadRules();
    }
  }

  function openRuleModal(ruleId = null) {
    const modal = document.getElementById('modal-new-rule');
    const titleEl = document.getElementById('modal-rule-title');
    const idInput = document.getElementById('rule-edit-id');
    const titleInput = document.getElementById('rule-title-input');
    const triggerSelect = document.getElementById('rule-trigger-type');
    const kwInput = document.getElementById('rule-keywords-input');
    const respInput = document.getElementById('rule-response-input');
    const stageSelect = document.getElementById('rule-stage-select');
    const tagInput = document.getElementById('rule-tag-input');
    const kwGroup = document.getElementById('rule-keywords-group');

    if (ruleId) {
      const rule = currentRules.find(r => r.id === ruleId);
      if (rule) {
        titleEl.textContent = 'Editar Regla de Auto-Respuesta';
        idInput.value = rule.id;
        titleInput.value = rule.title;
        triggerSelect.value = rule.triggerType;
        kwInput.value = (rule.keywords || []).join(', ');
        respInput.value = rule.response;
        stageSelect.value = rule.autoLeadStage || 'contacted';
        tagInput.value = (rule.addTags || [])[0] || '';
        kwGroup.style.display = rule.triggerType === 'keyword' ? 'block' : 'none';
      }
    } else {
      titleEl.textContent = 'Nueva Regla de Auto-Respuesta';
      idInput.value = '';
      titleInput.value = '';
      triggerSelect.value = 'keyword';
      kwInput.value = '';
      respInput.value = '';
      stageSelect.value = 'contacted';
      tagInput.value = '';
      kwGroup.style.display = 'block';
    }

    modal.classList.add('active');
  }

  function closeRuleModal() {
    document.getElementById('modal-new-rule')?.classList.remove('active');
  }

  async function handleSaveRule() {
    const ruleId = document.getElementById('rule-edit-id').value;
    const title = document.getElementById('rule-title-input').value.trim();
    const triggerType = document.getElementById('rule-trigger-type').value;
    const kwStr = document.getElementById('rule-keywords-input').value.trim();
    const response = document.getElementById('rule-response-input').value.trim();
    const autoLeadStage = document.getElementById('rule-stage-select').value;
    const tag = document.getElementById('rule-tag-input').value.trim();

    if (!title || !response) {
      showToast('Por favor completa el título y la respuesta', 'warning');
      return;
    }

    const keywords = kwStr ? kwStr.split(',').map(k => k.trim()).filter(Boolean) : [];
    const addTags = tag ? [tag] : [];

    const payload = {
      title,
      triggerType,
      keywords,
      response,
      matchType: 'contains',
      channels: ['facebook', 'instagram', 'tiktok', 'youtube'],
      autoLeadStage,
      addTags,
      isActive: true
    };

    let res;
    if (ruleId) {
      res = await apiFetch(`/api/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      res = await apiFetch('/api/rules', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    if (res.success) {
      showToast('Regla guardada correctamente', 'success');
      closeRuleModal();
      loadRules();
    }
  }

  async function loadSettings() {
    const res = await apiFetch('/api/settings');
    if (res.success && res.settings) {
      const s = res.settings;
      AppState.settings = s;

      const promptInput = document.getElementById('ai-system-prompt-input');
      if (promptInput) promptInput.value = s.aiSystemPrompt || '';

      const toggleAi = document.getElementById('toggle-ai-enabled');
      if (toggleAi) toggleAi.checked = !!s.aiEnabled;

      if (s.businessHours) {
        const toggleHours = document.getElementById('toggle-hours-enabled');
        if (toggleHours) toggleHours.checked = !!s.businessHours.enabled;

        const startInput = document.getElementById('hours-start-input');
        if (startInput) startInput.value = s.businessHours.start || '09:00';

        const endInput = document.getElementById('hours-end-input');
        if (endInput) endInput.value = s.businessHours.end || '20:00';
      }
    }
  }

  async function handleSaveAiPrompt() {
    const promptInput = document.getElementById('ai-system-prompt-input');
    if (!promptInput) return;

    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ aiSystemPrompt: promptInput.value.trim() })
    });

    if (res.success) {
      showToast('Prompt del Asistente IA guardado exitosamente', 'success');
    }
  }

  async function handleSaveHours() {
    const start = document.getElementById('hours-start-input').value;
    const end = document.getElementById('hours-end-input').value;

    const res = await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        businessHours: {
          enabled: true,
          start,
          end,
          timezone: 'America/Mexico_City',
          activeDays: [1, 2, 3, 4, 5, 6]
        }
      })
    });

    if (res.success) {
      showToast('Horario comercial guardado exitosamente', 'success');
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    init,
    loadRules,
    loadSettings,
    toggleRuleActive,
    deleteRule,
    openRuleModal,
    closeRuleModal
  };
})();

window.RulesModule = RulesModule;
document.addEventListener('DOMContentLoaded', () => RulesModule.init());
