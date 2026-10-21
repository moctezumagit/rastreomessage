const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./services/db');
const autoResponder = require('./services/autoResponder');
const metaService = require('./services/metaService');
const tiktokService = require('./services/tiktokService');
const youtubeService = require('./services/youtubeService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// ========================================================
// RUTAS DE WEBHOOKS OFICIALES PARA LAS REDES SOCIALES
// ========================================================

// 1. Facebook & Instagram (Meta Graph API)
app.get('/api/webhooks/facebook', metaService.verifyWebhook);
app.post('/api/webhooks/facebook', metaService.handleWebhookEvent);
app.get('/api/webhooks/instagram', metaService.verifyWebhook);
app.post('/api/webhooks/instagram', metaService.handleWebhookEvent);

// 2. TikTok for Business API
app.post('/api/webhooks/tiktok', tiktokService.handleWebhook);

// 3. YouTube Data API v3 (Comentarios y menciones)
app.post('/api/webhooks/youtube', youtubeService.handleCommentWebhook);

// ========================================================
// RUTAS DE LA API (REST API PARA EL DASHBOARD)
// ========================================================

// Canales y estado de conexión
app.get('/api/channels', (req, res) => {
  const channels = db.getChannels();
  res.json({ success: true, channels });
});

app.post('/api/channels/test', async (req, res) => {
  const { channel } = req.body;
  let result = { connected: false, message: 'Canal desconocido' };

  if (channel === 'facebook' || channel === 'instagram') {
    result = await metaService.testConnection();
  } else if (channel === 'tiktok') {
    result = await tiktokService.testConnection();
  } else if (channel === 'youtube') {
    result = await youtubeService.testConnection();
  }

  res.json({ success: true, result });
});

// Guardar credenciales de API desde la interfaz
app.post('/api/channels/credentials', async (req, res) => {
  const { channel, credentials } = req.body;
  if (!channel || !credentials) {
    return res.status(400).json({ success: false, message: 'Canal y credenciales requeridos' });
  }

  const settings = db.getSettings();
  if (!settings.apiCredentials) settings.apiCredentials = {};
  settings.apiCredentials[channel] = {
    ...settings.apiCredentials[channel],
    ...credentials,
    isConfigured: true
  };

  db.updateSettings({ apiCredentials: settings.apiCredentials });

  // Actualizar variables de proceso en memoria para uso inmediato
  if (channel === 'facebook' && credentials.pageAccessToken) {
    process.env.META_PAGE_ACCESS_TOKEN = credentials.pageAccessToken;
    // Resolver y sincronizar en vivo de inmediato
    metaService.getPageCredentials().then(creds => {
      if (creds && creds.pageAccessToken) {
        metaService.syncFacebookConversations();
      }
    });
  }
  if (channel === 'tiktok' && credentials.accessToken) {
    process.env.TIKTOK_ACCESS_TOKEN = credentials.accessToken;
  }
  if (channel === 'youtube' && credentials.apiKey) {
    process.env.YOUTUBE_API_KEY = credentials.apiKey;
  }

  res.json({ success: true, apiCredentials: settings.apiCredentials });
});

// Sincronización manual en vivo de Facebook
app.post('/api/channels/facebook/sync', async (req, res) => {
  const result = await metaService.syncFacebookConversations();
  const conversations = db.getConversations();
  res.json({ success: true, result, conversations });
});

// Sincronización manual en vivo de Instagram
app.post('/api/channels/instagram/sync', async (req, res) => {
  const result = await metaService.syncInstagramConversations();
  const conversations = db.getConversations();
  res.json({ success: true, result, conversations });
});

// Sincronización unificada de Meta (Facebook + Instagram)
app.post('/api/channels/sync', async (req, res) => {
  const result = await metaService.syncAllMetaConversations();
  const conversations = db.getConversations();
  res.json({ success: true, result, conversations });
});

// Conversaciones (Bandeja unificada)
app.get('/api/conversations', (req, res) => {
  const { channel, status, stage, search } = req.query;
  const conversations = db.getConversations({ channel, status, stage, search });
  res.json({ success: true, conversations });
});

app.get('/api/conversations/:id', (req, res) => {
  const conv = db.getConversationById(req.params.id);
  if (!conv) {
    return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
  }
  res.json({ success: true, conversation: conv });
});

app.post('/api/conversations/:id/read', (req, res) => {
  const conv = db.markAsRead(req.params.id);
  res.json({ success: true, conversation: conv });
});

// Enviar mensaje manual desde el panel
app.post('/api/conversations/:id/messages', async (req, res) => {
  const { text, mediaUrl } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'El texto del mensaje es requerido' });
  }

  const conv = db.getConversationById(req.params.id);
  if (!conv) {
    return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
  }

  // 1. Registrar en la base de datos local
  const result = db.addMessage(conv.id, {
    text,
    sender: 'agent',
    mediaUrl
  });

  // 2. Si las claves de API están configuradas, intentar enviar a la red social
  let deliveryResult = { success: true };
  if (conv.channel === 'facebook' || conv.channel === 'instagram') {
    deliveryResult = await metaService.sendMessage({
      recipientId: conv.contact.id,
      messageText: text,
      channel: conv.channel
    });
  } else if (conv.channel === 'tiktok') {
    deliveryResult = await tiktokService.sendMessage({
      openId: conv.contact.id,
      text
    });
  } else if (conv.channel === 'youtube') {
    deliveryResult = await youtubeService.replyToComment({
      commentId: conv.contact.id,
      replyText: text
    });
  }

  let deliveryWarning = null;
  if (deliveryResult && deliveryResult.success === false) {
    if (deliveryResult.subcode === 2534022) {
      deliveryWarning = 'Meta rechazó la entrega en Instagram (código 2534022): La cuenta debe estar agregada como "Instagram Tester" en developers.facebook.com (si la App está en Modo Desarrollo) y haber aceptado la invitación en Instagram. Además, verifica tener activo "Permitir acceso a los mensajes" en la app móvil de Instagram (@equilibrionutricion8).';
    } else {
      deliveryWarning = `No se pudo entregar en ${conv.channel}: ${deliveryResult.error || 'Error de API'}`;
    }
    if (result && result.message) {
      db.updateMessageDeliveryStatus(conv.id, result.message.id, {
        deliveryStatus: 'failed',
        deliveryError: deliveryWarning,
        deliverySubcode: deliveryResult.subcode
      });
    }
  } else if (deliveryResult && deliveryResult.success && result && result.message) {
    db.updateMessageDeliveryStatus(conv.id, result.message.id, {
      deliveryStatus: 'delivered',
      metaMessageId: deliveryResult.data?.message_id
    });
  }

  const updatedConv = db.getConversationById(conv.id);

  res.json({ 
    success: true, 
    deliveredToMeta: deliveryResult?.success !== false,
    deliveryWarning,
    conversation: updatedConv,
    message: result.message
  });
});

// Sugerir respuesta con IA para un mensaje
app.post('/api/conversations/:id/suggest-ai', async (req, res) => {
  const conv = db.getConversationById(req.params.id);
  if (!conv) {
    return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
  }

  const lastCustomerMsg = [...conv.messages].reverse().find(m => m.sender === 'customer');
  const messageText = lastCustomerMsg ? lastCustomerMsg.text : 'Información general sobre productos';

  const settings = db.getSettings();
  const suggestion = await autoResponder.generateAiReply({
    convId: conv.id,
    messageText,
    systemPrompt: settings.aiSystemPrompt
  });

  res.json({ success: true, suggestion });
});

// Gestión de Leads (CRM & Prospectos)
app.patch('/api/conversations/:id/lead', (req, res) => {
  const updated = db.updateLead(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
  }
  res.json({ success: true, conversation: updated });
});

app.post('/api/conversations/:id/notes', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, message: 'El texto de la nota es requerido' });
  }
  const note = db.addLeadNote(req.params.id, text);
  res.json({ success: true, note });
});

// Embudo Kanban de Ventas (Pipeline)
app.get('/api/pipeline', (req, res) => {
  const pipeline = db.getPipeline();
  res.json({ success: true, pipeline });
});

app.patch('/api/pipeline/move', (req, res) => {
  const { convId, stage } = req.body;
  if (!convId || !stage) {
    return res.status(400).json({ success: false, message: 'convId y stage son requeridos' });
  }
  const updated = db.updateLead(convId, { stage });
  res.json({ success: true, conversation: updated });
});

// Reglas de Respuestas Automáticas
app.get('/api/rules', (req, res) => {
  const rules = db.getRules();
  res.json({ success: true, rules });
});

app.post('/api/rules', (req, res) => {
  const newRule = db.saveRule(req.body);
  res.json({ success: true, rule: newRule });
});

app.put('/api/rules/:id', (req, res) => {
  const updated = db.saveRule({ ...req.body, id: req.params.id });
  res.json({ success: true, rule: updated });
});

app.delete('/api/rules/:id', (req, res) => {
  const ok = db.deleteRule(req.params.id);
  res.json({ success: ok });
});

// Respuestas Rápidas (Templates)
app.get('/api/quick-replies', (req, res) => {
  const qrs = db.getQuickReplies();
  res.json({ success: true, quickReplies: qrs });
});

app.post('/api/quick-replies', (req, res) => {
  const qr = db.saveQuickReply(req.body);
  res.json({ success: true, quickReply: qr });
});

// Configuración general
app.get('/api/settings', (req, res) => {
  const settings = db.getSettings();
  res.json({ success: true, settings });
});

app.put('/api/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// Analíticas y Métricas
app.get('/api/analytics', (req, res) => {
  const analytics = db.getAnalytics();
  res.json({ success: true, analytics });
});

// Simulador en vivo para probar mensajes y auto-respuestas al instante
app.post('/api/simulator/send', async (req, res) => {
  const { channel, contactName, contactUsername, messageText, simulatedPost } = req.body;

  if (!channel || !messageText) {
    return res.status(400).json({ success: false, message: 'channel y messageText son requeridos' });
  }

  const avatars = {
    facebook: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    instagram: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    tiktok: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    youtube: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  };

  const profileUrls = {
    facebook: 'https://www.facebook.com/share/1EtoMYvYTw/',
    instagram: 'https://instagram.com/equilibrionutricion8',
    tiktok: 'https://vt.tiktok.com/ZSgdKyBQL/',
    youtube: 'https://youtube.com/@equilibriobienestarynutricion'
  };

  const result = db.createConversationFromWebhook({
    channel,
    contact: {
      id: `sim-${Date.now()}`,
      name: contactName || 'Prospecto Simulado',
      username: contactUsername || `@lead_${Date.now().toString().slice(-4)}`,
      avatar: avatars[channel] || avatars.instagram,
      profileUrl: profileUrls[channel] || ''
    },
    messageText,
    sourceContext: simulatedPost || `Mensaje de prueba en vivo desde ${channel}`
  });

  // Procesar respuesta automática de forma inmediata
  const autoReplyResult = await autoResponder.processIncomingMessage({
    convId: result.conversation.id,
    channel,
    messageText,
    isNewConversation: !!result.isNew
  });

  // Devolver conversación actualizada
  const updatedConv = db.getConversationById(result.conversation.id);
  res.json({
    success: true,
    conversation: updatedConv,
    autoReply: autoReplyResult
  });
});

// Redirección para SPA (Cualquier ruta no API carga index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 SocialTrack Pro - Equilibrio Bienestar y Nutrición`);
  console.log(`🌐 Servidor iniciado en http://localhost:${PORT}`);
  console.log(`📡 Webhooks activos:`);
  console.log(`   - Meta (FB & IG): http://localhost:${PORT}/api/webhooks/facebook`);
  console.log(`   - TikTok:         http://localhost:${PORT}/api/webhooks/tiktok`);
  console.log(`   - YouTube:        http://localhost:${PORT}/api/webhooks/youtube`);
  console.log(`========================================================`);

  // Sincronización inicial si ya existen credenciales guardadas (Facebook e Instagram)
  setTimeout(() => {
    metaService.getPageCredentials().then(creds => {
      if (creds && creds.pageAccessToken) {
        console.log('🔄 Ejecutando sincronización inicial de mensajes de Meta (Facebook e Instagram)...');
        metaService.syncAllMetaConversations().then(res => {
          console.log(`✅ Sincronización inicial completada (${res.totalConversations || 0} conversaciones procesadas).`);
        });
      }
    });
  }, 1500);

  // Sondeo en segundo plano cada 12 segundos para detectar nuevos mensajes de Facebook e Instagram
  setInterval(async () => {
    try {
      const settings = db.getSettings();
      if (settings?.apiCredentials?.facebook?.pageAccessToken || process.env.META_PAGE_ACCESS_TOKEN) {
        await metaService.syncAllMetaConversations();
      }
    } catch (err) {
      // Ignorar errores transitorios en sondeo background
    }
  }, 12000);
});
