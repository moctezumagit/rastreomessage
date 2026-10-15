const db = require('./db');

/**
 * Motor de Respuestas Automáticas y Clasificación Inteligente de Leads
 */
const autoResponder = {
  /**
   * Procesa un mensaje entrante de cualquier red social
   * @param {Object} params
   * @param {string} params.convId
   * @param {string} params.channel - 'facebook' | 'instagram' | 'tiktok' | 'youtube'
   * @param {string} params.messageText
   * @param {boolean} params.isNewConversation
   */
  processIncomingMessage: async ({ convId, channel, messageText, isNewConversation = false }) => {
    const settings = db.getSettings();
    const rules = db.getRules();
    const textLower = messageText.toLowerCase().trim();

    // 1. Detección y extracción inteligente de datos del prospecto
    const extractedData = autoResponder.extractLeadSignals(messageText);
    if (extractedData.hasPhone || extractedData.suggestedStage || extractedData.tags.length > 0) {
      const conv = db.getConversationById(convId);
      if (conv) {
        const updateObj = {
          tags: Array.from(new Set([...(conv.lead.tags || []), ...extractedData.tags])),
          score: Math.min(100, Math.max(conv.lead.score || 50, extractedData.suggestedScore))
        };
        if (extractedData.suggestedStage) {
          updateObj.stage = extractedData.suggestedStage;
        }
        if (extractedData.detectedPhone && !conv.contact.phone) {
          updateObj.contactUpdate = { phone: extractedData.detectedPhone };
        }
        db.updateLead(convId, updateObj);
      }
    }

    if (!settings.autoResponderEnabled) {
      return { triggered: false, reason: 'auto_responder_disabled' };
    }

    // 2. Verificar si está fuera de horario de atención
    if (settings.businessHours && settings.businessHours.enabled) {
      const isOffHours = autoResponder.checkIfOffHours(settings.businessHours);
      if (isOffHours) {
        const offHoursRule = rules.find(r => r.triggerType === 'off_hours' && r.isActive && r.channels.includes(channel));
        if (offHoursRule) {
          const reply = db.addMessage(convId, {
            text: offHoursRule.response,
            sender: 'bot',
            ruleTriggered: offHoursRule.title
          });
          return { triggered: true, rule: offHoursRule, reply };
        }
      }
    }

    // 3. Reglas de coincidencia de palabras clave (Keywords)
    const keywordRules = rules.filter(r => r.triggerType === 'keyword' && r.isActive && r.channels.includes(channel));
    for (const rule of keywordRules) {
      const match = rule.keywords.some(kw => {
        const cleanKw = kw.toLowerCase().trim();
        if (rule.matchType === 'exact') {
          return textLower === cleanKw;
        } else if (rule.matchType === 'regex') {
          try {
            return new RegExp(cleanKw, 'i').test(textLower);
          } catch (e) {
            return textLower.includes(cleanKw);
          }
        }
        return textLower.includes(cleanKw);
      });

      if (match) {
        // Enviar respuesta automática del bot
        const reply = db.addMessage(convId, {
          text: rule.response,
          sender: 'bot',
          ruleTriggered: rule.title
        });

        // Actualizar etapa de lead si la regla lo especifica
        if (rule.autoLeadStage) {
          const conv = db.getConversationById(convId);
          const currentStage = conv.lead.stage;
          // Solo avanzar etapa, no retroceder de 'won' o 'appointment'
          if (currentStage !== 'won' && currentStage !== 'appointment') {
            db.updateLead(convId, {
              stage: rule.autoLeadStage,
              tags: Array.from(new Set([...(conv.lead.tags || []), ...(rule.addTags || [])]))
            });
          }
        }

        return { triggered: true, rule, reply };
      }
    }

    // 4. Si es conversación nueva y no hubo coincidencia de palabras clave, disparar bienvenida
    if (isNewConversation) {
      const welcomeRule = rules.find(r => r.triggerType === 'welcome' && r.isActive && r.channels.includes(channel));
      if (welcomeRule) {
        const reply = db.addMessage(convId, {
          text: welcomeRule.response,
          sender: 'bot',
          ruleTriggered: welcomeRule.title
        });
        return { triggered: true, rule: welcomeRule, reply };
      }
    }

    // 5. Si la IA está activa en modo auto-pilot
    if (settings.aiEnabled && settings.aiAutoPilot) {
      const aiResponse = await autoResponder.generateAiReply({
        convId,
        messageText,
        systemPrompt: settings.aiSystemPrompt
      });
      if (aiResponse) {
        const reply = db.addMessage(convId, {
          text: aiResponse,
          sender: 'bot',
          ruleTriggered: '🤖 Asistente IA Equilibrio'
        });
        return { triggered: true, aiGenerated: true, reply };
      }
    }

    return { triggered: false };
  },

  /**
   * Extrae señales de compra, teléfono y califica el prospecto
   */
  extractLeadSignals: (text) => {
    const textLower = text.toLowerCase();
    const tags = [];
    let suggestedScore = 60;
    let suggestedStage = null;
    let detectedPhone = null;

    // Extracción de número telefónico (10 a 13 dígitos)
    const phoneRegex = /(?:\+?52\s?)?(?:1\s?)?([0-9]{2,3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4})/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      detectedPhone = phoneMatch[0].replace(/[-.\s]/g, '');
      tags.push('#TeléfonoDetectado');
      suggestedScore += 25;
    }

    // Señales de alta intención de compra
    if (/precio|costo|cuanto|cotiz|comprar|pedir|envio|paquete|costos/.test(textLower)) {
      tags.push('#PreguntóPrecios');
      suggestedScore = Math.max(suggestedScore, 85);
      suggestedStage = 'proposal';
    }

    if (/cita|agendar|consulta|doctor|nutriologa|horario|apartar/.test(textLower)) {
      tags.push('#PideCita');
      suggestedScore = Math.max(suggestedScore, 90);
      suggestedStage = 'appointment';
    }

    if (/glutation|glutatión|immunocal|inmunocal|celular|inmune/.test(textLower)) {
      tags.push('#InterésGlutatión');
      suggestedScore = Math.max(suggestedScore, 80);
    }

    if (/negocio|distribui|afiliar|vender|ganar|comision/.test(textLower)) {
      tags.push('#InterésNegocio');
      suggestedScore = Math.max(suggestedScore, 90);
    }

    return {
      hasPhone: !!detectedPhone,
      detectedPhone,
      tags,
      suggestedScore,
      suggestedStage
    };
  },

  /**
   * Genera una respuesta con IA (utilizando Gemini API o motor inteligente integrado)
   */
  generateAiReply: async ({ convId, messageText, systemPrompt }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const conv = db.getConversationById(convId);
    const history = conv ? conv.messages.slice(-5).map(m => `${m.sender === 'customer' ? 'Prospecto' : 'Asesor'}: ${m.text}`).join('\n') : '';

    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const prompt = `${systemPrompt || 'Eres la asistente experta de Equilibrio Bienestar y Nutrición.'}
Historial de conversación:
${history}

Último mensaje recibido: "${messageText}"

Responde en español de forma empática, profesional y enfocada en ayudar y cerrar la venta o agendar cita:`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (err) {
        console.warn('Fallo llamada directa a Gemini API, usando motor de IA local:', err.message);
      }
    }

    // Motor de respuestas contextuales de alta conversión (Fallback inteligente)
    return autoResponder.localAiHeuristic(messageText, conv);
  },

  /**
   * Motor heurístico local entrenado específicamente para "Equilibrio Bienestar y Nutrición"
   */
  localAiHeuristic: (text, conv) => {
    const q = text.toLowerCase();
    const contactName = conv && conv.contact && conv.contact.name ? conv.contact.name.split(' ')[0] : 'amig@';

    if (/hola|buen(as|os)|saludos|que tal/i.test(q)) {
      return `¡Hola ${contactName}! 🌿 Un gusto saludarte desde Equilibrio Bienestar y Nutrición. Con gusto te ayudamos a mejorar tu salud, energía y bienestar digestivo. ¿Qué objetivo te gustaría lograr hoy?`;
    }

    if (/precio|costo|cuanto|cotiz/i.test(q)) {
      return `¡Hola ${contactName}! 💰 En Equilibrio manejamos planes a tu medida: la Videoconsulta Nutricional personalizada tiene un costo de $650 MXN (con menú y recetario incluido) y contamos con paquetes de Nutrición Celular Glutatión desde $1,850 MXN con envío gratis. ¿Te gustaría agendar una cita o prefieres que te enviemos el catálogo completo a WhatsApp?`;
    }

    if (/glutation|glutatión|immunocal|inmunocal/i.test(q)) {
      return `El Glutatión es el antioxidante maestro que revitaliza tus células y eleva las defensas 🧬. En Equilibrio manejamos suplementación con respaldo clínico comprobado (+85 estudios en PubMed). ¿Es para atender algún padecimiento en particular o para prevención y vitalidad?`;
    }

    if (/peso|bajar|kilos|grasa|adelgazar/i.test(q)) {
      return `¡Excelente meta ${contactName}! 🥑 Nuestro enfoque no se basa en dietas restrictivas ni rebotes, sino en reprogramar tu metabolismo y desinflamar tu cuerpo con nutrición real y balance celular. ¿Cuántos kilos te gustaría perder aproximadamente?`;
    }

    if (/cita|agendar|horario/i.test(q)) {
      return `¡Con mucho gusto te apartamos tu lugar! 📅 Tenemos horarios disponibles de Lunes a Sábado tanto por la mañana como por la tarde. ¿Qué día de esta semana te acomodaría mejor para tu videoconsulta?`;
    }

    if (/negocio|distribu|afiliar|ingreso/i.test(q)) {
      return `¡Excelente visión! 💼 Manejamos un modelo de distribución y asesoría en nutrición celular en más de 30 países. Te podemos capacitar desde cero sin descuidar tu empleo actual. ¿En qué ciudad te encuentras actualmente?`;
    }

    // Respuesta general inteligente
    return `¡Gracias por tu mensaje ${contactName}! 🌿 Con gusto resolvemos todas tus dudas sobre nuestros planes nutricionales y fórmulas de bienestar celular. ¿Prefieres que te llamemos o te compartimos la información detallada por WhatsApp? 📲`;
  },

  /**
   * Valida si la hora actual está fuera del horario de atención
   */
  checkIfOffHours: (hours) => {
    try {
      const now = new Date();
      // Obtener hora local en formato HH:MM
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.

      if (hours.activeDays && !hours.activeDays.includes(currentDay)) {
        return true; // Es día de descanso
      }

      const [startH, startM] = (hours.start || '09:00').split(':').map(Number);
      const [endH, endM] = (hours.end || '20:00').split(':').map(Number);

      const currentTotalMin = currentHour * 60 + currentMin;
      const startTotalMin = startH * 60 + startM;
      const endTotalMin = endH * 60 + endM;

      return currentTotalMin < startTotalMin || currentTotalMin > endTotalMin;
    } catch (e) {
      return false;
    }
  }
};

module.exports = autoResponder;
