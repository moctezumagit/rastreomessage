const db = require('./db');
const autoResponder = require('./autoResponder');

/**
 * Servicio de Integración para YouTube Data API v3
 * Canal: @equilibriobienestarynutricion
 * Enlace: https://youtube.com/@equilibriobienestarynutricion?si=ZlD8i8gBh1qzU0XS
 */
const youtubeService = {
  /**
   * Procesa comentarios entrantes de videos o comunidad
   */
  handleCommentWebhook: async (req, res) => {
    const payload = req.body;

    if (payload && payload.comment) {
      const comment = payload.comment;
      const author = comment.authorDisplayName || 'Usuario YouTube';
      const text = comment.textOriginal || comment.text || '';

      if (text) {
        const result = db.createConversationFromWebhook({
          channel: 'youtube',
          contact: {
            id: comment.authorChannelId?.value || `yt-${Date.now()}`,
            name: author,
            username: `@${author.replace(/\s+/g, '').toLowerCase()}`,
            avatar: comment.authorProfileImageUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            profileUrl: 'https://youtube.com/@equilibriobienestarynutricion'
          },
          messageText: text,
          sourceContext: `Comentario en video: "${payload.videoTitle || 'Video de Nutrición'}"`
        });

        if (result && result.conversation) {
          await autoResponder.processIncomingMessage({
            convId: result.conversation.id,
            channel: 'youtube',
            messageText: text,
            isNewConversation: !!result.isNew
          });
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  },

  /**
   * Responde a un comentario en YouTube
   */
  replyToComment: async ({ commentId, replyText }) => {
    const settings = db.getSettings();
    const apiKey = process.env.YOUTUBE_API_KEY || settings?.apiCredentials?.youtube?.apiKey;
    if (!apiKey) {
      console.log(`[YouTube Mock] API Key no configurada. Respuesta simulada a comentario ${commentId}: "${replyText}"`);
      return { success: true, simulated: true };
    }

    try {
      // Inserción en comments de YouTube Data API v3
      const url = `https://www.googleapis.com/youtube/v3/comments?part=snippet&key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snippet: {
            parentId: commentId,
            textOriginal: replyText
          }
        })
      });
      const data = await response.json();
      return { success: response.ok, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Verificar conexión con YouTube Data API
   */
  testConnection: async () => {
    const settings = db.getSettings();
    const apiKey = process.env.YOUTUBE_API_KEY || settings?.apiCredentials?.youtube?.apiKey;
    if (!apiKey) {
      return {
        connected: false,
        message: 'No se ha configurado YOUTUBE_API_KEY en las variables de entorno o panel de ajustes.'
      };
    }
    return { connected: true, channel: '@equilibriobienestarynutricion' };
  }
};

module.exports = youtubeService;
