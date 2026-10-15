const db = require('./db');
const autoResponder = require('./autoResponder');

/**
 * Servicio de Integración para TikTok for Business
 * Perfil: @equilibriobienestarynutricion
 * Enlace: https://vt.tiktok.com/ZSgdKyBQL/
 */
const tiktokService = {
  /**
   * Verificación y recepción de Webhooks de TikTok
   */
  handleWebhook: async (req, res) => {
    const event = req.body;

    // TikTok envía validación o eventos de mensaje / comentario
    if (event && (event.event === 'im_receive_msg' || event.event === 'comment_create' || event.type === 'message')) {
      const senderInfo = event.data?.sender || event.user || {};
      const messageText = event.data?.content || event.text || event.comment_text || '';

      if (messageText) {
        const contactName = senderInfo.nickname || senderInfo.display_name || 'Usuario TikTok';
        const contactUsername = senderInfo.username ? `@${senderInfo.username}` : '@usuario_tiktok';

        const result = db.createConversationFromWebhook({
          channel: 'tiktok',
          contact: {
            id: senderInfo.open_id || `tt-${Date.now()}`,
            name: contactName,
            username: contactUsername,
            avatar: senderInfo.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            profileUrl: 'https://vt.tiktok.com/ZSgdKyBQL/'
          },
          messageText,
          sourceContext: event.event === 'comment_create' ? 'Comentario en video de TikTok' : 'Mensaje Directo de TikTok'
        });

        if (result && result.conversation) {
          await autoResponder.processIncomingMessage({
            convId: result.conversation.id,
            channel: 'tiktok',
            messageText,
            isNewConversation: !!result.isNew
          });
        }
      }
    }

    // TikTok espera respuesta 200 con código 0 o mensaje de éxito
    return res.status(200).json({ code: 0, message: 'success' });
  },

  /**
   * Enviar respuesta o comentario a TikTok
   */
  sendMessage: async ({ openId, text }) => {
    const settings = db.getSettings();
    const token = process.env.TIKTOK_ACCESS_TOKEN || settings?.apiCredentials?.tiktok?.accessToken;
    if (!token) {
      console.log(`[TikTok Mock] Token no configurado. Mensaje simulado a ${openId}: "${text}"`);
      return { success: true, simulated: true };
    }

    try {
      const url = `https://business-api.tiktok.com/open_api/v1.3/im/message/send/`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Access-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to_user_id: openId,
          msg_type: 'text',
          content: { text }
        })
      });
      const data = await response.json();
      return { success: response.ok, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Verificar estado de la conexión
   */
  testConnection: async () => {
    const settings = db.getSettings();
    const token = process.env.TIKTOK_ACCESS_TOKEN || settings?.apiCredentials?.tiktok?.accessToken;
    if (!token) {
      return {
        connected: false,
        message: 'No se ha configurado TIKTOK_ACCESS_TOKEN en las variables de entorno o panel de ajustes.'
      };
    }
    return { connected: true, account: '@equilibriobienestarynutricion' };
  }
};

module.exports = tiktokService;
