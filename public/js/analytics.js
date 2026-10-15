/**
 * Módulo de Métricas y Analíticas Comerciales
 */

const AnalyticsModule = (() => {
  async function loadAnalytics() {
    const res = await apiFetch('/api/analytics');
    if (!res.success || !res.analytics) return;

    const a = res.analytics;

    // Renderizar KPIs
    const kpiGrid = document.getElementById('analytics-kpi-grid');
    if (kpiGrid) {
      kpiGrid.innerHTML = `
        <div class="kpi-card">
          <div class="kpi-icon-circle" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            <i class="fa-solid fa-users"></i>
          </div>
          <div>
            <div class="kpi-val">${a.totalLeads}</div>
            <div class="kpi-label">Prospectos Totales</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-circle" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);">
            <i class="fa-solid fa-trophy"></i>
          </div>
          <div>
            <div class="kpi-val" style="color:#10b981;">$${(a.totalWonValue || 0).toLocaleString()} <span style="font-size:0.8rem;">MXN</span></div>
            <div class="kpi-label">Ventas Cerradas</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-circle" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div>
            <div class="kpi-val">${a.conversionRate}</div>
            <div class="kpi-label">Tasa de Conversión</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-circle" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
            <i class="fa-solid fa-stopwatch"></i>
          </div>
          <div>
            <div class="kpi-val">${a.avgResponseTime}</div>
            <div class="kpi-label">Tiempo Promedio Respuesta</div>
          </div>
        </div>
      `;
    }

    // Desglose por Red Social
    const breakdownEl = document.getElementById('analytics-channels-breakdown');
    if (breakdownEl) {
      const channels = [
        { name: 'Instagram DM & Reels', count: a.byChannel.instagram || 0, color: 'linear-gradient(90deg, #f09433, #dc2743, #bc1888)', icon: 'fa-brands fa-instagram' },
        { name: 'TikTok Videos & DMs', count: a.byChannel.tiktok || 0, color: '#fe2c55', icon: 'fa-brands fa-tiktok' },
        { name: 'Facebook Fan Page', count: a.byChannel.facebook || 0, color: '#1877f2', icon: 'fa-brands fa-facebook' },
        { name: 'YouTube Comentarios', count: a.byChannel.youtube || 0, color: '#ff0000', icon: 'fa-brands fa-youtube' }
      ];

      const maxCount = Math.max(...channels.map(c => c.count), 1);

      breakdownEl.innerHTML = channels.map(ch => {
        const pct = Math.round((ch.count / maxCount) * 100);
        return `
          <div class="channel-bar-row">
            <div class="channel-bar-meta">
              <span><i class="${ch.icon}"></i> ${ch.name}</span>
              <span>${ch.count} mensajes</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${pct}%; background: ${ch.color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Embudo de Conversión Comercial
    const funnelEl = document.getElementById('analytics-funnel-visual');
    if (funnelEl) {
      const stages = [
        { name: '1. Nuevos Mensajes Recibidos', count: a.totalLeads, color: '#6366f1' },
        { name: '2. En Conversación / Calificados', count: (a.byStage.contacted || 0) + (a.byStage.appointment || 0) + (a.byStage.proposal || 0) + (a.byStage.won || 0), color: '#0ea5e9' },
        { name: '3. Citas & Cotizaciones Enviadas', count: (a.byStage.appointment || 0) + (a.byStage.proposal || 0) + (a.byStage.won || 0), color: '#f59e0b' },
        { name: '4. Clientes Cerrados / Venta Ganada 🎉', count: a.byStage.won || 0, color: '#10b981' }
      ];

      funnelEl.innerHTML = stages.map(s => `
        <div class="funnel-step" style="border-left-color: ${s.color};">
          <span style="font-size:0.84rem; font-weight:600;">${s.name}</span>
          <span style="font-family:var(--font-heading); font-size:1.1rem; font-weight:800; color:${s.color};">${s.count}</span>
        </div>
      `).join('');
    }
  }

  return {
    loadAnalytics
  };
})();

window.AnalyticsModule = AnalyticsModule;
