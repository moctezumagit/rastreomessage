const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Crear directorio de datos si no existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Datos iniciales de demostración contextualizados para "Equilibrio Bienestar y Nutrición"
const initialData = {
  channels: {
    facebook: {
      id: 'facebook',
      name: 'Facebook Page & Messenger',
      handle: 'Equilibrio Bienestar y Nutrición',
      url: 'https://www.facebook.com/share/1EtoMYvYTw/',
      status: 'active',
      icon: 'facebook',
      connectedAt: '2026-10-10T12:00:00Z',
      stats: { totalMessages: 148, leadsCaptured: 42, conversionRate: '28.3%' }
    },
    instagram: {
      id: 'instagram',
      name: 'Instagram Business / DM',
      handle: '@equilibrionutricion8',
      url: 'https://instagram.com/equilibrionutricion8?cplk=MWJmeXAwYzJiaHFhYw%3D%3D',
      status: 'active',
      icon: 'instagram',
      connectedAt: '2026-10-10T12:00:00Z',
      stats: { totalMessages: 215, leadsCaptured: 76, conversionRate: '35.4%' }
    },
    tiktok: {
      id: 'tiktok',
      name: 'TikTok Direct Messages & Comments',
      handle: '@equilibriobienestarynutricion',
      url: 'https://vt.tiktok.com/ZSgdKyBQL/',
      status: 'active',
      icon: 'tiktok',
      connectedAt: '2026-10-11T09:30:00Z',
      stats: { totalMessages: 320, leadsCaptured: 89, conversionRate: '27.8%' }
    },
    youtube: {
      id: 'youtube',
      name: 'YouTube Video & Community Comments',
      handle: '@equilibriobienestarynutricion',
      url: 'https://youtube.com/@equilibriobienestarynutricion?si=ZlD8i8gBh1qzU0XS',
      status: 'active',
      icon: 'youtube',
      connectedAt: '2026-10-11T10:00:00Z',
      stats: { totalMessages: 84, leadsCaptured: 28, conversionRate: '33.3%' }
    }
  },

  conversations: [
    {
      id: 'conv-ig-1',
      channel: 'instagram',
      contact: {
        id: 'user-ig-101',
        name: 'Mariana Sánchez',
        username: '@mariana.fitlife',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        phone: '+52 55 4192 8831',
        email: 'mariana.sanchez@gmail.com',
        profileUrl: 'https://instagram.com/mariana.fitlife'
      },
      lead: {
        stage: 'appointment',
        stageName: 'Cita Agendada',
        interest: 'Plan Nutricional + Suplementación Glutatión',
        score: 92,
        estimatedValue: 2400,
        currency: 'MXN',
        tags: ['#InstagramDM', '#ControlDePeso', '#AltaIntención', '#CitaConfirmada'],
        notes: [
          { id: 'n1', text: 'Busca mejorar su energía celular y perder 6kg para su boda.', date: '2026-10-14T18:30:00Z' },
          { id: 'n2', text: 'Cita online agendada para el viernes 11:00 AM vía Zoom.', date: '2026-10-14T19:15:00Z' }
        ],
        lastFollowUp: '2026-10-14T19:15:00Z',
        nextReminder: '2026-10-16T10:30:00Z'
      },
      status: 'unread',
      unreadCount: 1,
      sourceContext: 'Respondió a Story sobre "Glutatión y Desinflamación"',
      lastMessage: {
        id: 'm-ig-4',
        text: '¡Perfecto! Ya aparté la fecha. ¿Me recomiendan algún estudio de sangre previo para llevar a la consulta?',
        timestamp: '2026-10-14T22:45:00Z',
        sender: 'customer'
      },
      messages: [
        {
          id: 'm-ig-1',
          text: 'Hola! Vi su publicación sobre cómo elevar el glutatión para desinflamar el cuerpo y tener más energía. ¿Qué precio tiene la consulta o el tratamiento?',
          timestamp: '2026-10-14T18:10:00Z',
          sender: 'customer'
        },
        {
          id: 'm-ig-2',
          text: '¡Hola Mariana! Bienvenida a Equilibrio Bienestar y Nutrición 🌿✨ Qué gusto saludarte. Contamos con evaluación nutricional 100% personalizada y protocolo de nutrición celular. ¿Te gustaría agendar una videoconsulta o prefieres que te enviemos los detalles por WhatsApp?',
          timestamp: '2026-10-14T18:11:00Z',
          sender: 'bot',
          ruleTriggered: 'Regla: Precios & Planes'
        },
        {
          id: 'm-ig-3',
          text: 'Hola! Me encantaría la videoconsulta este viernes en la mañana si tienen espacio.',
          timestamp: '2026-10-14T18:25:00Z',
          sender: 'customer'
        },
        {
          id: 'm-ig-4',
          text: '¡Perfecto! Ya aparté la fecha. ¿Me recomiendan algún estudio de sangre previo para llevar a la consulta?',
          timestamp: '2026-10-14T22:45:00Z',
          sender: 'customer'
        }
      ]
    },
    {
      id: 'conv-fb-1',
      channel: 'facebook',
      contact: {
        id: 'user-fb-202',
        name: 'Ing. Carlos Valenzuela',
        username: 'Carlos Valenzuela',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '+52 81 1209 4450',
        email: 'carlos.valenzuela.mty@outlook.com',
        profileUrl: 'https://www.facebook.com/share/1EtoMYvYTw/'
      },
      lead: {
        stage: 'proposal',
        stageName: 'Propuesta / Cotización',
        interest: 'Paquete Celular Inmunidad & Rendimiento',
        score: 85,
        estimatedValue: 3850,
        currency: 'MXN',
        tags: ['#FacebookMessenger', '#Deportista', '#Immunocal', '#CotizaciónEnviada'],
        notes: [
          { id: 'n3', text: 'Entrena triatlón, le interesa el rendimiento deportivo y recuperación muscular.', date: '2026-10-13T14:00:00Z' }
        ],
        lastFollowUp: '2026-10-14T15:20:00Z',
        nextReminder: '2026-10-15T12:00:00Z'
      },
      status: 'replied',
      unreadCount: 0,
      sourceContext: 'Mensaje directo en Fan Page de Facebook',
      lastMessage: {
        id: 'm-fb-3',
        text: 'Te enviamos la cotización del Paquete Dúo Rendimiento con envío gratis a Monterrey. Quedamos a tus órdenes para cualquier duda Carlos.',
        timestamp: '2026-10-14T15:20:00Z',
        sender: 'agent'
      },
      messages: [
        {
          id: 'm-fb-1',
          text: 'Buenas tardes, quisiera información del paquete para deportistas y recuperación de fatiga que vi en su página.',
          timestamp: '2026-10-14T14:15:00Z',
          sender: 'customer'
        },
        {
          id: 'm-fb-2',
          text: 'Buenas tardes Carlos, un placer atenderte. En Equilibrio Bienestar y Nutrición manejamos formulaciones con certificación deportiva Clean Sport que optimizan el rendimiento y la recuperación celular.',
          timestamp: '2026-10-14T14:16:00Z',
          sender: 'bot',
          ruleTriggered: 'Regla: Deportistas & Suplementación'
        },
        {
          id: 'm-fb-3',
          text: 'Te enviamos la cotización del Paquete Dúo Rendimiento con envío gratis a Monterrey. Quedamos a tus órdenes para cualquier duda Carlos.',
          timestamp: '2026-10-14T15:20:00Z',
          sender: 'agent'
        }
      ]
    },
    {
      id: 'conv-tt-1',
      channel: 'tiktok',
      contact: {
        id: 'user-tt-303',
        name: 'Dra. Sofía Mendoza',
        username: '@sofia_nutriwellness',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        phone: '+52 33 2190 7712',
        email: 'dra.sofiamendoza@gmail.com',
        profileUrl: 'https://vt.tiktok.com/ZSgdKyBQL/'
      },
      lead: {
        stage: 'new',
        stageName: 'Nuevo Prospecto',
        interest: 'Distribución y Consultorio Nutricional',
        score: 95,
        estimatedValue: 6500,
        currency: 'MXN',
        tags: ['#TikTokViral', '#ProfesionalDeSalud', '#DistribuidorPotencial', '#Urgente'],
        notes: [
          { id: 'n4', text: 'Es nutrióloga clínica en Guadalajara. Quiere recomendar los productos en su consultorio.', date: '2026-10-14T21:00:00Z' }
        ],
        lastFollowUp: '2026-10-14T21:01:00Z',
        nextReminder: '2026-10-15T09:00:00Z'
      },
      status: 'unread',
      unreadCount: 1,
      sourceContext: 'Comentó en TikTok viral: "¿Por qué el glutatión es el antioxidante maestro?"',
      lastMessage: {
        id: 'm-tt-2',
        text: 'Hola! Soy nutrióloga en Jalisco, me interesa saber cómo afiliarme para recetar y distribuir estos suplementos en mi clínica. ¿Tienen paquete profesional?',
        timestamp: '2026-10-14T23:05:00Z',
        sender: 'customer'
      },
      messages: [
        {
          id: 'm-tt-1',
          text: 'Hola! Soy nutrióloga en Jalisco, me interesa saber cómo afiliarme para recetar y distribuir estos suplementos en mi clínica. ¿Tienen paquete profesional?',
          timestamp: '2026-10-14T23:05:00Z',
          sender: 'customer'
        }
      ]
    },
    {
      id: 'conv-yt-1',
      channel: 'youtube',
      contact: {
        id: 'user-yt-404',
        name: 'Roberto Gómez',
        username: '@robertogomez_mx',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        phone: '+52 55 9812 3301',
        email: 'roberto.gomez.salud@gmail.com',
        profileUrl: 'https://youtube.com/@equilibriobienestarynutricion'
      },
      lead: {
        stage: 'won',
        stageName: 'Venta Cerrada',
        interest: 'Tratamiento 3 Meses Adulto Mayor & Vitalidad',
        score: 100,
        estimatedValue: 5400,
        currency: 'MXN',
        tags: ['#YouTubeComunidad', '#ClienteCerrado', '#SaludAdultoMayor', '#Pagado'],
        notes: [
          { id: 'n5', text: 'Compró paquete de 4 cajas para sus papás. Pago confirmado vía transferencia.', date: '2026-10-14T11:00:00Z' }
        ],
        lastFollowUp: '2026-10-14T16:00:00Z',
        nextReminder: '2026-10-28T10:00:00Z'
      },
      status: 'replied',
      unreadCount: 0,
      sourceContext: 'Comentó en video de YouTube: "Cómo recuperar la energía y movilidad en adultos mayores"',
      lastMessage: {
        id: 'm-yt-3',
        text: 'Muchas gracias por la atención tan rápida y el seguimiento en WhatsApp. Ya me llegó mi número de guía de Estafeta.',
        timestamp: '2026-10-14T16:00:00Z',
        sender: 'customer'
      },
      messages: [
        {
          id: 'm-yt-1',
          text: 'Excelente video explicativo. Mi papá tiene 68 años y le cuesta mucho recuperarse tras una cirugía. ¿Esto le puede ayudar?',
          timestamp: '2026-10-13T10:00:00Z',
          sender: 'customer'
        },
        {
          id: 'm-yt-2',
          text: 'Hola Roberto! Sí, la suplementación con precursores de glutatión favorece la regeneración celular y fortalece el sistema inmunológico en adultos mayores. Te contactamos de inmediato.',
          timestamp: '2026-10-13T10:15:00Z',
          sender: 'agent'
        },
        {
          id: 'm-yt-3',
          text: 'Muchas gracias por la atención tan rápida y el seguimiento en WhatsApp. Ya me llegó mi número de guía de Estafeta.',
          timestamp: '2026-10-14T16:00:00Z',
          sender: 'customer'
        }
      ]
    },
    {
      id: 'conv-fb-2',
      channel: 'facebook',
      contact: {
        id: 'user-fb-505',
        name: 'Laura Méndez',
        username: 'Laura Elena Méndez',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: '+52 44 2189 0045',
        email: 'laura.mendez.qro@gmail.com',
        profileUrl: 'https://www.facebook.com/share/1EtoMYvYTw/'
      },
      lead: {
        stage: 'contacted',
        stageName: 'En Conversación',
        interest: 'Plan Pérdida de Peso y Desintoxicación',
        score: 78,
        estimatedValue: 1800,
        currency: 'MXN',
        tags: ['#FacebookPost', '#ControlDePeso', '#Interesada'],
        notes: [
          { id: 'n6', text: 'Preguntó si hacemos envíos a Querétaro y si la asesoría incluye menú semanal.', date: '2026-10-14T17:00:00Z' }
        ],
        lastFollowUp: '2026-10-14T17:05:00Z',
        nextReminder: '2026-10-15T16:00:00Z'
      },
      status: 'unread',
      unreadCount: 1,
      sourceContext: 'Comentó en publicación de Facebook sobre "Plan 21 Días Detox"',
      lastMessage: {
        id: 'm-fb2-2',
        text: '¿El menú semanal se adapta si soy intolerante a la lactosa? Me interesa empezar el lunes.',
        timestamp: '2026-10-14T23:12:00Z',
        sender: 'customer'
      },
      messages: [
        {
          id: 'm-fb2-1',
          text: 'Hola, buenas tardes! Me interesa el plan de 21 días que publicaron. ¿Hacen envíos a Querétaro?',
          timestamp: '2026-10-14T17:00:00Z',
          sender: 'customer'
        },
        {
          id: 'm-fb2-2',
          text: '¡Hola Laura! Sí, hacemos envíos a todo México (Querétaro llega en 24-48 hrs hábiles) y las consultas son online con tu plan 100% a la medida.',
          timestamp: '2026-10-14T17:05:00Z',
          sender: 'agent'
        },
        {
          id: 'm-fb2-3',
          text: '¿El menú semanal se adapta si soy intolerante a la lactosa? Me interesa empezar el lunes.',
          timestamp: '2026-10-14T23:12:00Z',
          sender: 'customer'
        }
      ]
    }
  ],

  rules: [
    {
      id: 'rule-welcome',
      title: '👋 Mensaje de Bienvenida Instantáneo',
      description: 'Envía un saludo cordial y califica al prospecto cuando escribe por primera vez.',
      triggerType: 'welcome',
      keywords: [],
      matchType: 'contains',
      response: '¡Hola! 🌿 Te damos la bienvenida a Equilibrio Bienestar y Nutrición. ¿En qué podemos ayudarte hoy? (1) Consulta nutricional personalizada, (2) Suplementación de nutrición celular y glutatión, (3) Oportunidad de negocio / distribución independiente.',
      channels: ['facebook', 'instagram', 'tiktok', 'youtube'],
      isActive: true,
      autoLeadStage: 'contacted',
      addTags: ['#BienvenidaEnviada']
    },
    {
      id: 'rule-price',
      title: '💰 Preguntas sobre Precios & Costos',
      description: 'Responde automáticamente con información de paquetes y canaliza al asesor.',
      triggerType: 'keyword',
      keywords: ['precio', 'costo', 'cuanto cuesta', 'precios', 'costos', 'cotizacion', 'valor'],
      matchType: 'contains',
      response: '¡Hola! 🌿 En Equilibrio Bienestar y Nutrición tenemos opciones adaptadas a tus objetivos: Consulta online personalizada desde $650 MXN y Paquetes de nutrición celular desde $1,850 MXN con envío directo a tu domicilio. ¿Te gustaría que una especialista revise tu caso por WhatsApp para recomendarte el plan ideal?',
      channels: ['facebook', 'instagram', 'tiktok', 'youtube'],
      isActive: true,
      autoLeadStage: 'proposal',
      addTags: ['#PidióPrecios', '#AltaIntención']
    },
    {
      id: 'rule-whatsapp',
      title: '📲 Solicitud de WhatsApp o Teléfono',
      description: 'Entrega el enlace directo de WhatsApp con mensaje precargado cuando piden contacto.',
      triggerType: 'keyword',
      keywords: ['whatsapp', 'whats', 'telefono', 'celular', 'numero', 'contacto', 'llamar'],
      matchType: 'contains',
      response: '¡Con gusto! Puedes contactarnos directamente en nuestro WhatsApp oficial haciendo clic aquí: https://wa.me/5215500000000?text=Hola%20Equilibrio%20Nutrición,%20quiero%20más%20información. ¡Te respondemos en minutos!',
      channels: ['facebook', 'instagram', 'tiktok', 'youtube'],
      isActive: true,
      autoLeadStage: 'contacted',
      addTags: ['#PidióWhatsApp']
    },
    {
      id: 'rule-appointment',
      title: '📅 Agendar Cita o Consulta',
      description: 'Guía al cliente para reservar su espacio en la agenda nutricional.',
      triggerType: 'keyword',
      keywords: ['cita', 'agendar', 'consulta', 'apartar', 'horario', 'disponibilidad', 'asesoria'],
      matchType: 'contains',
      response: '¡Excelente decisión! 📅 Atendemos videoconsultas de Lunes a Sábado. Por favor indícanos si prefieres horario matutino o vespertino, o déjanos tu WhatsApp para enviarte nuestro calendario de citas disponibles.',
      channels: ['facebook', 'instagram', 'tiktok', 'youtube'],
      isActive: true,
      autoLeadStage: 'appointment',
      addTags: ['#InterésCita']
    },
    {
      id: 'rule-glutathione',
      title: '🛡️ Glutatión e Inmunidad (Immunotec)',
      description: 'Explica los beneficios de elevar el Glutatión y la ciencia de nutrición celular.',
      triggerType: 'keyword',
      keywords: ['glutatión', 'glutation', 'immunocal', 'inmunocal', 'sistema inmune', 'defensas', 'suplemento'],
      matchType: 'contains',
      response: 'El Glutatión es el antioxidante maestro del cuerpo humano 🧬. Ayuda a desintoxicar las células, reforzar el sistema inmunológico y retrasar el envejecimiento celular. Contamos con tecnología patentada con más de 45 años de respaldo científico. ¿Padeces alguna condición en específico que desees mejorar?',
      channels: ['facebook', 'instagram', 'tiktok', 'youtube'],
      isActive: true,
      autoLeadStage: 'contacted',
      addTags: ['#Glutatión', '#SaludCelular']
    },
    {
      id: 'rule-off-hours',
      title: '🌙 Fuera de Horario de Atención',
      description: 'Informa al usuario que su mensaje fue recibido y será atendido a primera hora.',
      triggerType: 'off_hours',
      keywords: [],
      matchType: 'contains',
      response: '¡Gracias por comunicarte con Equilibrio Bienestar y Nutrición! 🌙 Nuestro equipo de especialistas atiende de 9:00 AM a 8:00 PM. Tu mensaje ha quedado registrado con prioridad y te responderemos a primera hora. ¡Que tengas un excelente descanso!',
      channels: ['facebook', 'instagram', 'tiktok', 'youtube'],
      isActive: true,
      autoLeadStage: 'contacted',
      addTags: ['#FueraDeHorario']
    }
  ],

  quickReplies: [
    {
      id: 'qr-1',
      title: '💰 Precios Consulta & Paquetes',
      text: '¡Hola! 🌿 Consulta Nutricional Online: $650 MXN (incluye plan personalizado, recetario y acompañamiento). Paquete Nutrición Celular + Consulta: $2,400 MXN. ¿Cuál se adapta mejor a tu meta?'
    },
    {
      id: 'qr-2',
      title: '📲 Enlace WhatsApp Asesor',
      text: 'Para darte un seguimiento más rápido y personalizado, escríbenos a nuestro WhatsApp oficial: https://wa.me/5215500000000?text=Hola,%20vengo%20de%20redes%20sociales 📲✨'
    },
    {
      id: 'qr-3',
      title: '📅 Enlace Agenda de Citas',
      text: 'Puedes elegir tu día y hora para la videoconsulta nutricional aquí. ¿Prefieres cita esta misma semana?'
    },
    {
      id: 'qr-4',
      title: '📦 Envíos y Métodos de Pago',
      text: 'Manejamos envíos asegurados a toda la República Mexicana por Estafeta/FedEx (2 a 4 días). Aceptamos transferencias SPEI, tarjetas de crédito/débito y pagos en OXXO.'
    },
    {
      id: 'qr-5',
      title: '🧬 Ficha Glutatión / Immunotec',
      text: 'El Glutatión eleva tus defensas y repara tu energía a nivel celular. Cuenta con +85 estudios clínicos publicados y registro en el PDR médico. ¿Para quién sería el suplemento?'
    }
  ],

  settings: {
    businessName: 'Equilibrio Bienestar y Nutrición',
    businessPhone: '+5215500000000',
    businessEmail: 'contacto@equilibrionutricion.com',
    aiEnabled: true,
    aiModel: 'gemini-1.5-flash',
    aiSystemPrompt: `Eres la Asistente de Ventas y Nutrición Inteligente de "Equilibrio Bienestar y Nutrición" (@equilibrionutricion8 / @equilibriobienestarynutricion).
Tu objetivo es atender a los prospectos que escriben por Facebook, Instagram, TikTok o YouTube con empatía, profesionalismo y calidez.
Especialidades:
- Asesoría nutricional personalizada, control de peso saludable, digestión y metabolismo.
- Nutrición celular y elevación de Glutatión (Immunocal, Immunotec, antioxidante maestro, defensas, vitalidad).
- Oportunidad de distribución y negocio independiente para quienes buscan emprender en salud.
Pautas de respuesta:
1. Sé concisa (máximo 2 a 3 párrafos cortos).
2. Usa emojis sutiles y profesionales (🌿, ✨, 🥑, 🧬).
3. Haz siempre una pregunta de cierre para incentivar la conversación.
4. Invita amablemente a continuar por WhatsApp si piden información detallada o precios para enviarles su cotización.`,
    autoResponderEnabled: true,
    businessHours: {
      enabled: true,
      start: '09:00',
      end: '20:00',
      timezone: 'America/Mexico_City',
      activeDays: [1, 2, 3, 4, 5, 6] // Lunes a Sábado
    },
    apiCredentials: {
      facebook: {
        appId: '',
        appSecret: '',
        pageAccessToken: '',
        verifyToken: 'equilibrio_social_token_2026',
        pageId: '1EtoMYvYTw',
        isConfigured: false
      },
      instagram: {
        instagramAccountId: 'equilibrionutricion8',
        accessToken: '',
        isConfigured: false
      },
      tiktok: {
        clientKey: '',
        clientSecret: '',
        accessToken: '',
        isConfigured: false
      },
      youtube: {
        apiKey: '',
        channelId: '@equilibriobienestarynutricion',
        isConfigured: false
      }
    }
  }
};

// Cargar o inicializar la base de datos
function loadData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      saveData(initialData);
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error al leer la base de datos local:', error);
    return initialData;
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error al guardar en la base de datos local:', error);
  }
}

// Métodos de acceso y manipulación
const db = {
  getChannels: () => {
    const data = loadData();
    return data.channels;
  },

  updateChannelStatus: (channelId, status, details = {}) => {
    const data = loadData();
    if (data.channels[channelId]) {
      data.channels[channelId].status = status;
      if (details.stats) {
        data.channels[channelId].stats = { ...data.channels[channelId].stats, ...details.stats };
      }
      saveData(data);
    }
    return data.channels[channelId];
  },

  getConversations: (filter = {}) => {
    const data = loadData();
    let convs = [...data.conversations];

    if (filter.channel && filter.channel !== 'all') {
      convs = convs.filter(c => c.channel === filter.channel);
    }

    if (filter.status && filter.status !== 'all') {
      if (filter.status === 'unread') {
        convs = convs.filter(c => c.status === 'unread' || c.unreadCount > 0);
      } else {
        convs = convs.filter(c => c.status === filter.status);
      }
    }

    if (filter.stage && filter.stage !== 'all') {
      convs = convs.filter(c => c.lead && c.lead.stage === filter.stage);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      convs = convs.filter(c => 
        (c.contact.name && c.contact.name.toLowerCase().includes(q)) ||
        (c.contact.username && c.contact.username.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.text && c.lastMessage.text.toLowerCase().includes(q)) ||
        (c.lead && c.lead.tags && c.lead.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Ordenar por fecha del último mensaje descendente
    convs.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
    return convs;
  },

  getConversationById: (id) => {
    const data = loadData();
    return data.conversations.find(c => c.id === id);
  },

  addMessage: (convId, { text, sender = 'agent', ruleTriggered = null, mediaUrl = null }) => {
    const data = loadData();
    const conv = data.conversations.find(c => c.id === convId);
    if (!conv) return null;

    const newMsg = {
      id: 'msg-' + Date.now(),
      text,
      timestamp: new Date().toISOString(),
      sender, // 'customer', 'agent', 'bot'
      ruleTriggered,
      mediaUrl
    };

    conv.messages.push(newMsg);
    conv.lastMessage = {
      id: newMsg.id,
      text: newMsg.text,
      timestamp: newMsg.timestamp,
      sender: newMsg.sender
    };

    if (sender === 'customer') {
      conv.status = 'unread';
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    } else if (sender === 'agent') {
      conv.status = 'replied';
      conv.unreadCount = 0;
    } else if (sender === 'bot') {
      conv.status = 'auto_replied';
    }

    saveData(data);
    return { conversation: conv, message: newMsg };
  },

  createConversationFromWebhook: ({ channel, contact, messageText, mediaUrl = null, sourceContext = null }) => {
    const data = loadData();
    
    // Verificar si ya existe conversación previa con este contacto
    let conv = data.conversations.find(c => 
      c.channel === channel && (
        (c.contact.id && c.contact.id === contact.id) ||
        (c.contact.username && c.contact.username === contact.username)
      )
    );

    if (conv) {
      // Agregar mensaje a conversación existente
      return db.addMessage(conv.id, { text: messageText, sender: 'customer', mediaUrl });
    }

    // Crear nueva conversación
    const convId = `conv-${channel}-${Date.now().toString().slice(-4)}`;
    const newMsg = {
      id: 'msg-' + Date.now(),
      text: messageText,
      timestamp: new Date().toISOString(),
      sender: 'customer',
      mediaUrl
    };

    const newConv = {
      id: convId,
      channel,
      contact: {
        id: contact.id || `user-${Date.now()}`,
        name: contact.name || 'Nuevo Prospecto',
        username: contact.username || '@usuario',
        avatar: contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        phone: contact.phone || '',
        email: contact.email || '',
        profileUrl: contact.profileUrl || ''
      },
      lead: {
        stage: 'new',
        stageName: 'Nuevo Prospecto',
        interest: 'Consulta General',
        score: 60,
        estimatedValue: 1200,
        currency: 'MXN',
        tags: [`#${channel.toUpperCase()}`, '#NuevoLead'],
        notes: [
          { id: 'n-' + Date.now(), text: `Contacto iniciado vía ${channel}: "${messageText.slice(0, 80)}..."`, date: new Date().toISOString() }
        ],
        lastFollowUp: new Date().toISOString(),
        nextReminder: null
      },
      status: 'unread',
      unreadCount: 1,
      sourceContext: sourceContext || `Mensaje entrante de ${channel}`,
      lastMessage: {
        id: newMsg.id,
        text: newMsg.text,
        timestamp: newMsg.timestamp,
        sender: 'customer'
      },
      messages: [newMsg]
    };

    data.conversations.unshift(newConv);
    saveData(data);
    return { conversation: newConv, message: newMsg, isNew: true };
  },

  insertConversation: (newConv) => {
    const data = loadData();
    const existingIndex = data.conversations.findIndex(c => c.id === newConv.id);
    if (existingIndex >= 0) {
      data.conversations[existingIndex] = newConv;
    } else {
      data.conversations.unshift(newConv);
    }
    saveData(data);
    return newConv;
  },

  saveUpdatedConversation: (updatedConv) => {
    const data = loadData();
    const idx = data.conversations.findIndex(c => c.id === updatedConv.id);
    if (idx >= 0) {
      data.conversations[idx] = updatedConv;
      saveData(data);
      return data.conversations[idx];
    }
    return null;
  },

  markAsRead: (convId) => {
    const data = loadData();
    const conv = data.conversations.find(c => c.id === convId);
    if (conv) {
      conv.unreadCount = 0;
      if (conv.status === 'unread') {
        conv.status = 'read';
      }
      saveData(data);
    }
    return conv;
  },

  updateLead: (convId, leadUpdate) => {
    const data = loadData();
    const conv = data.conversations.find(c => c.id === convId);
    if (!conv) return null;

    conv.lead = { ...conv.lead, ...leadUpdate };

    // Actualizar nombre de etapa
    const stageNames = {
      new: 'Nuevo Prospecto',
      contacted: 'En Conversación',
      appointment: 'Cita Agendada',
      proposal: 'Propuesta / Cotización',
      won: 'Venta Cerrada',
      lost: 'Descartado'
    };
    if (leadUpdate.stage && stageNames[leadUpdate.stage]) {
      conv.lead.stageName = stageNames[leadUpdate.stage];
    }

    if (leadUpdate.contactUpdate) {
      conv.contact = { ...conv.contact, ...leadUpdate.contactUpdate };
    }

    saveData(data);
    return conv;
  },

  addLeadNote: (convId, noteText) => {
    const data = loadData();
    const conv = data.conversations.find(c => c.id === convId);
    if (!conv) return null;

    if (!conv.lead.notes) conv.lead.notes = [];
    const note = {
      id: 'n-' + Date.now(),
      text: noteText,
      date: new Date().toISOString()
    };
    conv.lead.notes.push(note);
    saveData(data);
    return note;
  },

  getPipeline: () => {
    const data = loadData();
    const stages = [
      { id: 'new', name: 'Nuevo Prospecto', color: '#6366f1', items: [] },
      { id: 'contacted', name: 'En Conversación', color: '#0ea5e9', items: [] },
      { id: 'appointment', name: 'Cita Agendada', color: '#f59e0b', items: [] },
      { id: 'proposal', name: 'Propuesta / Cotización', color: '#8b5cf6', items: [] },
      { id: 'won', name: 'Venta Cerrada', color: '#10b981', items: [] },
      { id: 'lost', name: 'Descartado', color: '#64748b', items: [] }
    ];

    data.conversations.forEach(c => {
      const stageId = (c.lead && c.lead.stage) || 'new';
      const col = stages.find(s => s.id === stageId) || stages[0];
      col.items.push({
        convId: c.id,
        channel: c.channel,
        contact: c.contact,
        lead: c.lead,
        lastMessage: c.lastMessage
      });
    });

    return stages;
  },

  getRules: () => {
    const data = loadData();
    return data.rules || [];
  },

  saveRule: (rule) => {
    const data = loadData();
    if (!data.rules) data.rules = [];

    if (rule.id) {
      const idx = data.rules.findIndex(r => r.id === rule.id);
      if (idx !== -1) {
        data.rules[idx] = { ...data.rules[idx], ...rule };
        saveData(data);
        return data.rules[idx];
      }
    }

    const newRule = {
      ...rule,
      id: 'rule-' + Date.now(),
      isActive: rule.isActive !== undefined ? rule.isActive : true
    };
    data.rules.push(newRule);
    saveData(data);
    return newRule;
  },

  deleteRule: (ruleId) => {
    const data = loadData();
    if (!data.rules) return false;
    const initialLen = data.rules.length;
    data.rules = data.rules.filter(r => r.id !== ruleId);
    saveData(data);
    return data.rules.length < initialLen;
  },

  getQuickReplies: () => {
    const data = loadData();
    return data.quickReplies || [];
  },

  saveQuickReply: (qr) => {
    const data = loadData();
    if (!data.quickReplies) data.quickReplies = [];
    if (qr.id) {
      const idx = data.quickReplies.findIndex(q => q.id === qr.id);
      if (idx !== -1) {
        data.quickReplies[idx] = { ...data.quickReplies[idx], ...qr };
        saveData(data);
        return data.quickReplies[idx];
      }
    }
    const newQr = { ...qr, id: 'qr-' + Date.now() };
    data.quickReplies.push(newQr);
    saveData(data);
    return newQr;
  },

  getSettings: () => {
    const data = loadData();
    return data.settings;
  },

  updateSettings: (newSettings) => {
    const data = loadData();
    data.settings = { ...data.settings, ...newSettings };
    saveData(data);
    return data.settings;
  },

  getAnalytics: () => {
    const data = loadData();
    const convs = data.conversations || [];

    const totalLeads = convs.length;
    const wonLeads = convs.filter(c => c.lead && c.lead.stage === 'won');
    const totalWonValue = wonLeads.reduce((acc, c) => acc + (c.lead.estimatedValue || 0), 0);
    const unreadMessages = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

    const byChannel = {
      facebook: convs.filter(c => c.channel === 'facebook').length,
      instagram: convs.filter(c => c.channel === 'instagram').length,
      tiktok: convs.filter(c => c.channel === 'tiktok').length,
      youtube: convs.filter(c => c.channel === 'youtube').length
    };

    const byStage = {
      new: convs.filter(c => c.lead && c.lead.stage === 'new').length,
      contacted: convs.filter(c => c.lead && c.lead.stage === 'contacted').length,
      appointment: convs.filter(c => c.lead && c.lead.stage === 'appointment').length,
      proposal: convs.filter(c => c.lead && c.lead.stage === 'proposal').length,
      won: convs.filter(c => c.lead && c.lead.stage === 'won').length,
      lost: convs.filter(c => c.lead && c.lead.stage === 'lost').length
    };

    return {
      totalLeads,
      wonCount: wonLeads.length,
      totalWonValue,
      unreadMessages,
      conversionRate: totalLeads > 0 ? ((wonLeads.length / totalLeads) * 100).toFixed(1) + '%' : '0%',
      byChannel,
      byStage,
      avgResponseTime: '1.4 min'
    };
  }
};

module.exports = db;
