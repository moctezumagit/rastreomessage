const db = require('./db');
const autoResponder = require('./autoResponder');

/**
 * Servicio de Integración Oficial con Meta Graph API (Facebook Messenger & Instagram Direct)
 * Páginas:
 * Facebook: https://www.facebook.com/share/1EtoMYvYTw/
 * Instagram: https://instagram.com/equilibrionutricion8
 */
const metaService = {
  /**
   * Verificación del Webhook de Meta (Handshake inicial en developers.facebook.com)
   */
  verifyWebhook: (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = process.env.META_VERIFY_TOKEN || 'equilibrio_social_token_2026';

    if (mode && token) {
      if (mode === 'subscribe' && token === expectedToken) {
        console.log('✅ Webhook de Meta verificado exitosamente!');
        return res.status(200).send(challenge);
      } else {
        console.warn('❌ Token de verificación de Meta inválido');
        return res.sendStatus(403);
      }
    }
    return res.sendStatus(400);
  },

  /**
   * Procesamiento de eventos entrantes de Webhooks de Facebook e Instagram
   */
  handleWebhookEvent: async (req, res) => {
    const body = req.body;

    if (body.object === 'page' || body.object === 'instagram') {
      const channel = body.object === 'instagram' ? 'instagram' : 'facebook';

      for (const entry of body.entry || []) {
        // 1. Mensajes Directos (Messenger / Instagram DM)
        if (entry.messaging) {
          for (const event of entry.messaging) {
            const senderId = event.sender && event.sender.id;
            const message = event.message;

            // Ignorar mensajes enviados por la propia página (echo)
            if (message && !message.is_echo && message.text) {
              const contactName = channel === 'instagram' ? `@user_${senderId.slice(-4)}` : `Usuario FB ${senderId.slice(-4)}`;
              
              const result = db.createConversationFromWebhook({
                channel,
                contact: {
                  id: senderId,
                  name: contactName,
                  username: contactName,
                  avatar: channel === 'instagram' 
                    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' 
                    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                  profileUrl: channel === 'instagram' 
                    ? 'https://instagram.com/equilibrionutricion8' 
                    : 'https://www.facebook.com/share/1EtoMYvYTw/'
                },
                messageText: message.text,
                sourceContext: channel === 'instagram' ? 'Mensaje directo de Instagram' : 'Mensaje directo de Facebook Messenger'
              });

              if (result && result.conversation) {
                // Ejecutar motor de respuestas automáticas
                await autoResponder.processIncomingMessage({
                  convId: result.conversation.id,
                  channel,
                  messageText: message.text,
                  isNewConversation: !!result.isNew
                });
              }
            }
          }
        }

        // 2. Comentarios en Publicaciones / Feed
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'feed' || change.field === 'comments') {
              const value = change.value;
              if (value && value.item === 'comment' && value.verb === 'add' && value.message) {
                const commentUser = value.from || {};
                const result = db.createConversationFromWebhook({
                  channel,
                  contact: {
                    id: commentUser.id || `fb-user-${Date.now()}`,
                    name: commentUser.name || 'Usuario en Publicación',
                    username: commentUser.name || '@usuario_fb',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                    profileUrl: 'https://www.facebook.com/share/1EtoMYvYTw/'
                  },
                  messageText: value.message,
                  sourceContext: `Comentario en publicación: "${(value.post_id || '').slice(-6)}"`
                });

                if (result && result.conversation) {
                  await autoResponder.processIncomingMessage({
                    convId: result.conversation.id,
                    channel,
                    messageText: value.message,
                    isNewConversation: !!result.isNew
                  });
                }
              }
            }
          }
        }
      }

      return res.status(200).send('EVENT_RECEIVED');
    }

    return res.sendStatus(404);
  },

  /**
   * Enviar mensaje de respuesta a través de Meta Graph API
   */
  sendMessage: async ({ recipientId, messageText, channel = 'facebook' }) => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    if (!token) {
      console.log(`[Meta Mock] Token no configurado. Mensaje simulado a ${recipientId}: "${messageText}"`);
      return { success: true, simulated: true };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${token}`;
      const payload = {
        recipient: { id: recipientId },
        message: { text: messageText }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.error('Error al enviar mensaje vía Meta Graph API:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Probar conexión con las credenciales de Facebook / Instagram
   */
  testConnection: async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    if (!token) {
      return {
        connected: false,
        message: 'No se ha configurado META_PAGE_ACCESS_TOKEN en las variables de entorno o panel de ajustes.'
      };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${token}`);
      const data = await res.json();
      if (res.ok) {
        return { connected: true, pageId: data.id, pageName: data.name };
      }
      return { connected: false, error: data.error };
    } catch (e) {
      return { connected: false, error: e.message };
    }
  }
};

module.exports = metaService;
