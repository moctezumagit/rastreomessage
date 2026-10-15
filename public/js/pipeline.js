/**
 * Módulo de Embudo Kanban CRM de Ventas
 */

const PipelineModule = (() => {
  const icons = {
    facebook: '<i class="fa-brands fa-facebook" style="color:var(--color-fb);"></i>',
    instagram: '<i class="fa-brands fa-instagram" style="color:#e1306c;"></i>',
    tiktok: '<i class="fa-brands fa-tiktok" style="color:var(--color-tt);"></i>',
    youtube: '<i class="fa-brands fa-youtube" style="color:var(--color-yt);"></i>'
  };

  const stageOptions = [
    { id: 'new', name: '1. Nuevo Prospecto' },
    { id: 'contacted', name: '2. En Conversación' },
    { id: 'appointment', name: '3. Cita Agendada' },
    { id: 'proposal', name: '4. Propuesta / Cotización' },
    { id: 'won', name: '5. Venta Cerrada 🎉' },
    { id: 'lost', name: '6. Descartado' }
  ];

  async function loadPipeline() {
    const res = await apiFetch('/api/pipeline');
    if (!res.success || !res.pipeline) return;

    const board = document.getElementById('kanban-board');
    if (!board) return;

    let totalPipelineValue = 0;
    let totalWonValue = 0;
    let totalLeadsCount = 0;

    board.innerHTML = res.pipeline.map(col => {
      const colSum = col.items.reduce((sum, item) => sum + (item.lead.estimatedValue || 0), 0);
      totalPipelineValue += colSum;
      totalLeadsCount += col.items.length;
      if (col.id === 'won') totalWonValue = colSum;

      const cardsHtml = col.items.map(item => {
        const contact = item.contact || {};
        const lead = item.lead || {};
        const channelIcon = icons[item.channel] || '';
        const phone = contact.phone ? contact.phone.replace(/[^0-9]/g, '') : '';
        const waMsg = encodeURIComponent(`Hola ${contact.name}! 🌿 Te saludamos de Equilibrio Bienestar y Nutrición para darte seguimiento a tu consulta.`);

        return `
          <div class="kanban-card" data-conv-id="${item.convId}">
            <div class="card-top-row">
              <div class="card-avatar-wrap">
                <img src="${contact.avatar}" alt="${contact.name}" class="card-avatar">
              </div>
              <div class="card-contact-meta">
                <div class="card-name" onclick="PipelineModule.openInChat('${item.convId}')" style="cursor:pointer;" title="Abrir conversación">
                  ${contact.name}
                </div>
                <div class="card-channel-tag">${channelIcon} ${contact.username || ''}</div>
              </div>
              ${lead.estimatedValue ? `<span class="card-value-badge">$${lead.estimatedValue.toLocaleString()}</span>` : ''}
            </div>

            <div class="card-interest">
              <i class="fa-solid fa-bullseye" style="color:var(--primary); font-size:0.75rem;"></i>
              ${lead.interest || 'Interés General'}
            </div>

            ${lead.tags && lead.tags.length ? `
              <div class="card-tags">
                ${lead.tags.slice(0, 3).map(t => `<span class="card-tag">${t}</span>`).join('')}
              </div>
            ` : ''}

            <div class="card-footer">
              ${phone ? `
                <a href="https://wa.me/${phone}?text=${waMsg}" target="_blank" class="btn-card-wa" title="Chatear en WhatsApp">
                  <i class="fa-brands fa-whatsapp"></i> WhatsApp
                </a>
              ` : `
                <span style="font-size:0.7rem; color:var(--text-dim);"><i class="fa-solid fa-phone-slash"></i> Sin tel.</span>
              `}

              <select class="card-stage-switcher" onchange="PipelineModule.moveCardStage('${item.convId}', this.value)" title="Cambiar etapa">
                ${stageOptions.map(opt => `
                  <option value="${opt.id}" ${opt.id === col.id ? 'selected' : ''}>${opt.name}</option>
                `).join('')}
              </select>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="kanban-column" style="--col-accent: ${col.color};">
          <div class="kanban-col-header">
            <div class="col-title-wrap">
              <span class="col-name">${col.name}</span>
              <span class="col-badge">${col.items.length}</span>
            </div>
            <span class="col-total-value">$${colSum.toLocaleString()}</span>
          </div>
          <div class="kanban-cards-list">
            ${cardsHtml.length ? cardsHtml : '<div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.78rem;">Sin prospectos en esta etapa</div>'}
          </div>
        </div>
      `;
    }).join('');

    // Actualizar resumen en cabecera
    const summaryEl = document.getElementById('pipeline-stats-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="stat-chip">
          <span class="stat-chip-label">Total en Embudo</span>
          <span class="stat-chip-val">$${totalPipelineValue.toLocaleString()} MXN</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip-label">Ventas Cerradas</span>
          <span class="stat-chip-val" style="color: #10b981;">$${totalWonValue.toLocaleString()} MXN</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip-label">Prospectos Activos</span>
          <span class="stat-chip-val" style="color: #0ea5e9;">${totalLeadsCount}</span>
        </div>
      `;
    }
  }

  async function moveCardStage(convId, newStage) {
    const res = await apiFetch('/api/pipeline/move', {
      method: 'PATCH',
      body: JSON.stringify({ convId, stage: newStage })
    });

    if (res.success) {
      showToast('Etapa del prospecto actualizada', 'success', 2000);
      loadPipeline();
    }
  }

  function openInChat(convId) {
    switchView('inbox');
    setTimeout(() => {
      window.InboxModule?.selectConversation(convId);
    }, 100);
  }

  return {
    loadPipeline,
    moveCardStage,
    openInChat
  };
})();

window.PipelineModule = PipelineModule;
