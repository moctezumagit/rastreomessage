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
  /**
   * Resuelve automáticamente si el token ingresado es de usuario o de página,
   * y obtiene el Token de Página oficial con permisos de mensajería
   */
  resolvePageCredentials: async (inputToken) => {
    if (!inputToken) return null;
    try {
      // 1. Probar /me/accounts para ver si es un User Token con páginas administradas
      const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,tasks&access_token=${inputToken}`);
      const accountsData = await accountsRes.json();

      if (accountsData && Array.isArray(accountsData.data) && accountsData.data.length > 0) {
        // Encontrar la página de Equilibrio o la primera disponible
        const targetPage = accountsData.data.find(p => 
          (p.name && (p.name.toLowerCase().includes('equilibrio') || p.name.toLowerCase().includes('bienestar'))) ||
          p.id === '1296082000264195' ||
          p.id === '61594624666731'
        ) || accountsData.data[0];

        console.log(`[Meta] Página resuelta desde User Token: "${targetPage.name}" (ID: ${targetPage.id})`);
        return {
          isPageToken: true,
          pageId: targetPage.id,
          pageName: targetPage.name,
          pageAccessToken: targetPage.access_token,
          userToken: inputToken
        };
      }

      // 2. Si no es User Token, consultar directamente /me
      const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${inputToken}`);
      const meData = await meRes.json();
      if (meData && meData.id) {
        return {
          isPageToken: true,
          pageId: meData.id,
          pageName: meData.name,
          pageAccessToken: inputToken
        };
      }

      return null;
    } catch (e) {
      console.error('[Meta] Error resolviendo credenciales:', e);
      return null;
    }
  },

  /**
   * Obtiene las credenciales de página válidas (resolviendo si es necesario)
   */
  getPageCredentials: async () => {
    const settings = db.getSettings();
    const fbCreds = settings?.apiCredentials?.facebook || {};
    let rawToken = process.env.META_PAGE_ACCESS_TOKEN || fbCreds.pageAccessToken;

    if (!rawToken) return null;

    // Si ya tenemos token resuelto con pageId numérico
    if (fbCreds.resolvedPageAccessToken && fbCreds.pageId && fbCreds.pageId !== '1EtoMYvYTw') {
      return {
        pageAccessToken: fbCreds.resolvedPageAccessToken,
        pageId: fbCreds.pageId,
        pageName: fbCreds.pageName || 'Equilibrio Bienestar y Nutrición'
      };
    }

    // Resolver en tiempo real
    const resolved = await metaService.resolvePageCredentials(rawToken);
    if (resolved && resolved.pageAccessToken) {
      const updatedCreds = {
        ...fbCreds,
        pageId: resolved.pageId,
        pageName: resolved.pageName,
        resolvedPageAccessToken: resolved.pageAccessToken,
        pageAccessToken: resolved.pageAccessToken,
        isConfigured: true
      };

      db.updateSettings({
        apiCredentials: {
          ...(settings.apiCredentials || {}),
          facebook: updatedCreds
        }
      });
      process.env.META_PAGE_ACCESS_TOKEN = resolved.pageAccessToken;

      return {
        pageAccessToken: resolved.pageAccessToken,
        pageId: resolved.pageId,
        pageName: resolved.pageName
      };
    }

    return {
      pageAccessToken: rawToken,
      pageId: fbCreds.pageId || 'me',
      pageName: fbCreds.pageName || 'Página de Facebook'
    };
  },

  /**
   * Sincroniza conversaciones y mensajes reales en vivo desde Meta Graph API
   */
  syncFacebookConversations: async () => {
    const creds = await metaService.getPageCredentials();
    if (!creds || !creds.pageAccessToken) {
      return { success: false, message: 'Token de Facebook no configurado' };
    }

    const { pageAccessToken, pageId } = creds;

    try {
      const endpoint = `https://graph.facebook.com/v19.0/${pageId}/conversations?fields=id,snippet,updated_time,unread_count,senders,messages.limit(20){id,message,created_time,from}&access_token=${pageAccessToken}`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) {
        console.error('[Meta Sync Error]:', data.error);
        return { success: false, error: data.error };
      }

      const rawConversations = data.data || [];
      let newMessagesIngested = 0;
      let newLeadsCreated = 0;

      const currentDbConvs = db.getConversations();

      for (const conv of rawConversations) {
        const senders = conv.senders?.data || [];
        // El cliente es quien no coincide con el ID de la página
        const customer = senders.find(s => s.id !== pageId && s.id !== '1296082000264195') || senders[0];
        if (!customer) continue;

        const rawMsgs = (conv.messages?.data || []).reverse();
        if (rawMsgs.length === 0) continue;

        const formattedMessages = rawMsgs.map(m => {
          const isFromPage = (m.from?.id === pageId || m.from?.id === '1296082000264195');
          return {
            id: m.id,
            metaId: m.id,
            text: m.message || '(Contenido multimedia o adjunto)',
            timestamp: m.created_time,
            sender: isFromPage ? 'agent' : 'customer'
          };
        });

        const lastMsg = formattedMessages[formattedMessages.length - 1];

        // Buscar si ya existe la conversación en la DB
        let existing = currentDbConvs.find(c => 
          c.channel === 'facebook' && (
            c.contact.id === customer.id || 
            c.id === `conv-fb-${customer.id}`
          )
        );

        if (!existing) {
          // Crear conversación nueva en la base de datos
          const newConv = {
            id: `conv-fb-${customer.id}`,
            channel: 'facebook',
            contact: {
              id: customer.id,
              name: customer.name || 'Usuario de Facebook',
              username: customer.name || `@fb_${customer.id.slice(-4)}`,
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              profileUrl: `https://www.facebook.com/${customer.id}`
            },
            lead: {
              stage: 'new',
              stageName: 'Nuevo Prospecto',
              interest: 'Mensaje en Fan Page de Facebook',
              score: 75,
              estimatedValue: 2400,
              currency: 'MXN',
              tags: ['#FacebookMessenger', '#EnVivo', '#ProspectoReal'],
              notes: [
                {
                  id: 'n-' + Date.now(),
                  text: `Prospecto real conectado vía Facebook Messenger. Mensaje: "${lastMsg.text}"`,
                  date: new Date().toISOString()
                }
              ],
              lastFollowUp: lastMsg.timestamp,
              nextReminder: null
            },
            status: lastMsg.sender === 'customer' ? 'unread' : 'replied',
            unreadCount: lastMsg.sender === 'customer' ? 1 : 0,
            sourceContext: 'Facebook Messenger (Conversación Oficial en Vivo)',
            lastMessage: {
              id: lastMsg.id,
              text: lastMsg.text,
              timestamp: lastMsg.timestamp,
              sender: lastMsg.sender
            },
            messages: formattedMessages
          };

          db.insertConversation(newConv);
          newLeadsCreated++;
          newMessagesIngested += formattedMessages.length;

          // Auto-respuesta automática si el último mensaje fue del cliente
          if (lastMsg.sender === 'customer') {
            const autoRes = await autoResponder.processIncomingMessage({
              convId: newConv.id,
              channel: 'facebook',
              messageText: lastMsg.text,
              isNewConversation: true
            });

            const replyText = autoRes?.reply?.message?.text || autoRes?.reply?.text;
            const replyMsgId = autoRes?.reply?.message?.id || autoRes?.reply?.id;
            if (autoRes?.triggered && replyText) {
              const sendRes = await metaService.sendMessage({
                recipientId: customer.id,
                messageText: replyText,
                channel: 'facebook'
              });
              if (sendRes && sendRes.success) {
                if (replyMsgId) {
                  db.updateMessageDeliveryStatus(newConv.id, replyMsgId, {
                    deliveryStatus: 'delivered',
                    metaMessageId: sendRes.data?.message_id
                  });
                }
              } else if (replyMsgId) {
                db.updateMessageDeliveryStatus(newConv.id, replyMsgId, {
                  deliveryStatus: 'failed',
                  deliveryError: sendRes?.error || 'Error al enviar a Facebook Messenger',
                  deliverySubcode: sendRes?.subcode
                });
              }
            }
          }
        } else {
          // Ya existe: anexar únicamente mensajes no registrados
          const existingIds = new Set(existing.messages.map(m => m.metaId || m.id));
          const freshMsgs = formattedMessages.filter(m => !existingIds.has(m.id));

          if (freshMsgs.length > 0) {
            freshMsgs.forEach(m => existing.messages.push(m));
            existing.lastMessage = {
              id: lastMsg.id,
              text: lastMsg.text,
              timestamp: lastMsg.timestamp,
              sender: lastMsg.sender
            };

            if (lastMsg.sender === 'customer') {
              existing.status = 'unread';
              existing.unreadCount = (existing.unreadCount || 0) + freshMsgs.filter(m => m.sender === 'customer').length;
              
              db.saveUpdatedConversation(existing);
              newMessagesIngested += freshMsgs.length;

              // Procesar auto-respuesta
              const autoRes = await autoResponder.processIncomingMessage({
                convId: existing.id,
                channel: 'facebook',
                messageText: lastMsg.text,
                isNewConversation: false
              });

              const replyText = autoRes?.reply?.message?.text || autoRes?.reply?.text;
              const replyMsgId = autoRes?.reply?.message?.id || autoRes?.reply?.id;
              if (autoRes?.triggered && replyText) {
                const sendRes = await metaService.sendMessage({
                  recipientId: customer.id,
                  messageText: replyText,
                  channel: 'facebook'
                });
                if (sendRes && sendRes.success) {
                  if (replyMsgId) {
                    db.updateMessageDeliveryStatus(existing.id, replyMsgId, {
                      deliveryStatus: 'delivered',
                      metaMessageId: sendRes.data?.message_id
                    });
                  }
                } else if (replyMsgId) {
                  db.updateMessageDeliveryStatus(existing.id, replyMsgId, {
                    deliveryStatus: 'failed',
                    deliveryError: sendRes?.error || 'Error al enviar a Facebook Messenger',
                    deliverySubcode: sendRes?.subcode
                  });
                }
              }
            } else {
              db.saveUpdatedConversation(existing);
            }
          }
        }
      }

      return {
        success: true,
        conversationsCount: rawConversations.length,
        newMessagesIngested,
        newLeadsCreated
      };
    } catch (e) {
      console.error('[Meta FB Sync Exception]:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Sincroniza conversaciones y mensajes reales de Instagram Direct
   * usando el endpoint oficial con platform=instagram
   */
  syncInstagramConversations: async () => {
    const creds = await metaService.getPageCredentials();
    if (!creds || !creds.pageAccessToken) {
      return { success: false, message: 'Token de Meta no configurado' };
    }

    const { pageAccessToken, pageId } = creds;

    try {
      const endpoint = `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&fields=id,snippet,updated_time,unread_count,messages.limit(20){id,message,created_time,from}&access_token=${pageAccessToken}`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) {
        console.error('[Meta IG Sync Error]:', data.error);
        return { success: false, error: data.error };
      }

      const rawConversations = data.data || [];
      let newMessagesIngested = 0;
      let newLeadsCreated = 0;

      const currentDbConvs = db.getConversations();

      for (const conv of rawConversations) {
        const rawMsgs = (conv.messages?.data || []).reverse();
        if (rawMsgs.length === 0) continue;

        // Identificar el usuario cliente (que no sea la cuenta oficial de Instagram)
        let customer = null;
        for (const m of rawMsgs) {
          if (m.from && m.from.id !== '17841416180268589' && m.from.username !== 'equilibrionutricion8') {
            customer = m.from;
            break;
          }
        }
        if (!customer) {
          customer = rawMsgs[0]?.from || { id: 'ig-unknown', username: 'usuario_ig' };
        }

        const formattedMessages = rawMsgs.map(m => {
          const isFromBusiness = (m.from?.id === '17841416180268589' || m.from?.username === 'equilibrionutricion8');
          return {
            id: m.id,
            metaId: m.id,
            text: m.message || '(Contenido multimedia o historia)',
            timestamp: m.created_time,
            sender: isFromBusiness ? 'agent' : 'customer'
          };
        });

        const lastMsg = formattedMessages[formattedMessages.length - 1];

        // Buscar si ya existe la conversación en la DB
        let existing = currentDbConvs.find(c => 
          c.channel === 'instagram' && (
            c.contact.id === customer.id || 
            c.id === `conv-ig-${customer.id}` ||
            c.contact.username === `@${customer.username}`
          )
        );

        if (!existing) {
          const newConv = {
            id: `conv-ig-${customer.id}`,
            channel: 'instagram',
            contact: {
              id: customer.id,
              name: `@${customer.username}`,
              username: `@${customer.username}`,
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              profileUrl: `https://instagram.com/${customer.username}`
            },
            lead: {
              stage: 'new',
              stageName: 'Nuevo Prospecto',
              interest: 'Mensaje Directo en Instagram (@equilibrionutricion8)',
              score: 80,
              estimatedValue: 2600,
              currency: 'MXN',
              tags: ['#InstagramDM', '#EnVivo', '#ProspectoReal'],
              notes: [
                {
                  id: 'n-' + Date.now(),
                  text: `Prospecto real conectado vía Instagram Direct. Mensaje: "${lastMsg.text}"`,
                  date: new Date().toISOString()
                }
              ],
              lastFollowUp: lastMsg.timestamp,
              nextReminder: null
            },
            status: lastMsg.sender === 'customer' ? 'unread' : 'replied',
            unreadCount: lastMsg.sender === 'customer' ? 1 : 0,
            sourceContext: 'Instagram Direct (@equilibrionutricion8 en Vivo)',
            lastMessage: {
              id: lastMsg.id,
              text: lastMsg.text,
              timestamp: lastMsg.timestamp,
              sender: lastMsg.sender
            },
            messages: formattedMessages
          };

          db.insertConversation(newConv);
          newLeadsCreated++;
          newMessagesIngested += formattedMessages.length;

          // Auto-respuesta automática
          if (lastMsg.sender === 'customer') {
            const autoRes = await autoResponder.processIncomingMessage({
              convId: newConv.id,
              channel: 'instagram',
              messageText: lastMsg.text,
              isNewConversation: true
            });

            const replyText = autoRes?.reply?.message?.text || autoRes?.reply?.text;
            const replyMsgId = autoRes?.reply?.message?.id || autoRes?.reply?.id;
            if (autoRes?.triggered && replyText) {
              console.log(`[Meta IG AutoReply] Enviando respuesta automática a Instagram ID ${customer.id}: "${replyText.substring(0, 50)}..."`);
              const sendRes = await metaService.sendMessage({
                recipientId: customer.id,
                messageText: replyText,
                channel: 'instagram'
              });
              if (!sendRes.success) {
                console.warn(`[Meta IG AutoReply Warning] No se pudo entregar respuesta automática a Instagram:`, sendRes.error);
                if (replyMsgId) {
                  db.updateMessageDeliveryStatus(newConv.id, replyMsgId, {
                    deliveryStatus: 'failed',
                    deliveryError: sendRes.error,
                    deliverySubcode: sendRes.subcode
                  });
                }
              } else if (replyMsgId) {
                db.updateMessageDeliveryStatus(newConv.id, replyMsgId, {
                  deliveryStatus: 'delivered',
                  metaMessageId: sendRes.data?.message_id
                });
              }
            }
          }
        } else {
          // Ya existe: anexar nuevos mensajes no registrados
          const existingIds = new Set(existing.messages.map(m => m.metaId || m.id));
          const freshMsgs = formattedMessages.filter(m => !existingIds.has(m.id));

          if (freshMsgs.length > 0) {
            freshMsgs.forEach(m => existing.messages.push(m));
            existing.lastMessage = {
              id: lastMsg.id,
              text: lastMsg.text,
              timestamp: lastMsg.timestamp,
              sender: lastMsg.sender
            };

            if (lastMsg.sender === 'customer') {
              existing.status = 'unread';
              existing.unreadCount = (existing.unreadCount || 0) + freshMsgs.filter(m => m.sender === 'customer').length;
              
              db.saveUpdatedConversation(existing);
              newMessagesIngested += freshMsgs.length;

              const autoRes = await autoResponder.processIncomingMessage({
                convId: existing.id,
                channel: 'instagram',
                messageText: lastMsg.text,
                isNewConversation: false
              });

              const replyText = autoRes?.reply?.message?.text || autoRes?.reply?.text;
              const replyMsgId = autoRes?.reply?.message?.id || autoRes?.reply?.id;
              if (autoRes?.triggered && replyText) {
                console.log(`[Meta IG AutoReply] Enviando respuesta automática a Instagram ID ${customer.id}: "${replyText.substring(0, 50)}..."`);
                const sendRes = await metaService.sendMessage({
                  recipientId: customer.id,
                  messageText: replyText,
                  channel: 'instagram'
                });
                if (!sendRes.success) {
                  console.warn(`[Meta IG AutoReply Warning] No se pudo entregar respuesta automática a Instagram:`, sendRes.error);
                  if (replyMsgId) {
                    db.updateMessageDeliveryStatus(existing.id, replyMsgId, {
                      deliveryStatus: 'failed',
                      deliveryError: sendRes.error,
                      deliverySubcode: sendRes.subcode
                    });
                  }
                } else if (replyMsgId) {
                  db.updateMessageDeliveryStatus(existing.id, replyMsgId, {
                    deliveryStatus: 'delivered',
                    metaMessageId: sendRes.data?.message_id
                  });
                }
              }
            } else {
              db.saveUpdatedConversation(existing);
            }
          }
        }
      }

      console.log(`[Meta IG Sync] Sincronización de Instagram: ${rawConversations.length} conversaciones, ${newMessagesIngested} mensajes nuevos.`);
      return {
        success: true,
        conversationsCount: rawConversations.length,
        newMessagesIngested,
        newLeadsCreated
      };
    } catch (e) {
      console.error('[Meta IG Sync Exception]:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Sincroniza tanto Facebook como Instagram en una sola llamada
   */
  syncAllMetaConversations: async () => {
    const [fbRes, igRes] = await Promise.all([
      metaService.syncFacebookConversations(),
      metaService.syncInstagramConversations()
    ]);
    return {
      facebook: fbRes,
      instagram: igRes,
      totalConversations: (fbRes.conversationsCount || 0) + (igRes.conversationsCount || 0),
      totalNewMessages: (fbRes.newMessagesIngested || 0) + (igRes.newMessagesIngested || 0)
    };
  },

  /**
   * Enviar mensaje de respuesta a través de Meta Graph API
   */
  sendMessage: async ({ recipientId, messageText, channel = 'facebook' }) => {
    const creds = await metaService.getPageCredentials();
    const token = creds?.pageAccessToken;
    if (!token) {
      console.log(`[Meta Mock] Token no configurado. Mensaje simulado a ${recipientId}: "${messageText}"`);
      return { success: true, simulated: true };
    }

    try {
      const pageId = creds.pageId || 'me';
      const url = `https://graph.facebook.com/v19.0/${pageId}/messages?access_token=${token}`;
      const payload = {
        recipient: { id: recipientId },
        message: { text: messageText },
        messaging_type: 'RESPONSE'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        console.error(`[Meta Send Error] [${channel.toUpperCase()}]:`, data.error);
        let friendlyError = data.error?.message || 'Error al enviar a Meta';
        if (data.error?.error_subcode === 2534022) {
          friendlyError = 'Rechazado por Meta (2534022 - Fuera de ventana): Si la app está en Modo Desarrollo, la cuenta receptora debe agregarse como "Instagram Tester" en developers.facebook.com y aceptar la invitación en su app de Instagram. También verifica activar "Permitir acceso a los mensajes" en la app móvil de Instagram (@equilibrionutricion8).';
          console.warn(`[Meta Send Hint]: Error 2534022 en Instagram ("fuera del período permitido"). Causa habitual: La cuenta receptora no es Instagram Tester en developers.facebook.com (App en Modo Desarrollo), o la opción "Permitir acceso a los mensajes" no está activa en la app de Instagram (@equilibrionutricion8), o la ventana de 24h ha vencido.`);
        } else if (data.error?.error_subcode === 2534041) {
          friendlyError = 'Rechazado por Meta (2534041): El acceso a mensajes está desactivado en la app móvil de Instagram. Activa "Permitir acceso a los mensajes" en Configuración > Mensajes y respuestas a historias > Controles de mensajes > Herramientas conectadas.';
        }
        return {
          success: false,
          error: friendlyError,
          rawError: data.error?.message,
          code: data.error?.code,
          subcode: data.error?.error_subcode,
          data
        };
      }

      console.log(`[Meta Send Success] [${channel.toUpperCase()}]: Mensaje entregado exitosamente a ${recipientId}. Message ID:`, data.message_id || data.recipient_id);
      return { success: true, data };
    } catch (error) {
      console.error('Error al enviar mensaje vía Meta Graph API:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Probar conexión con las credenciales de Facebook / Instagram
   */
  testConnection: async () => {
    const creds = await metaService.getPageCredentials();
    if (!creds || !creds.pageAccessToken) {
      return {
        connected: false,
        message: 'No se ha configurado META_PAGE_ACCESS_TOKEN en las variables de entorno o panel de ajustes.'
      };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${creds.pageAccessToken}`);
      const data = await res.json();
      if (res.ok) {
        return { 
          connected: true, 
          pageId: creds.pageId || data.id, 
          pageName: creds.pageName || data.name 
        };
      }
      return { connected: false, error: data.error };
    } catch (e) {
      return { connected: false, error: e.message };
    }
  }
};

module.exports = metaService;
