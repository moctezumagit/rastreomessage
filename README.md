# 🌿 SocialTrack Pro - Equilibrio Bienestar y Nutrición
### Centro Omnicanal de Rastreoc de Mensajes, Respuestas Automáticas con IA y CRM de Ventas

Plataforma integral diseñada especialmente para **Equilibrio Bienestar y Nutrición** para centralizar, automatizar y monetizar todas las interacciones de clientes potenciales recibidas en sus 4 canales oficiales:

1. **Facebook Page & Messenger**: [https://www.facebook.com/share/1EtoMYvYTw/](https://www.facebook.com/share/1EtoMYvYTw/)
2. **Instagram Business & DMs**: [@equilibrionutricion8](https://instagram.com/equilibrionutricion8?cplk=MWJmeXAwYzJiaHFhYw%3D%3D)
3. **TikTok Business**: [@equilibriobienestarynutricion](https://vt.tiktok.com/ZSgdKyBQL/)
4. **YouTube Channel & Comentarios**: [@equilibriobienestarynutricion](https://youtube.com/@equilibriobienestarynutricion?si=ZlD8i8gBh1qzU0XS)

---

## 🚀 Características Principales

### 1. 📥 Bandeja Social Unificada (Unified Social Inbox)
- **4 Canales en un solo lugar**: Visualiza y responde mensajes directos y comentarios de Facebook, Instagram, TikTok y YouTube sin cambiar de aplicación.
- **Filtros por Canal y Estado**: Filtra conversaciones por red social (`FB`, `IG`, `TikTok`, `YouTube`), mensajes no leídos, en seguimiento o cerrados.
- **Buscador en Tiempo Real**: Encuentra prospectos al instante por nombre, usuario, palabras clave o etiquetas (`#Glutatión`, `#ControlDePeso`, `#CitaConfirmada`).
- **Contexto de Origen**: Muestra de qué publicación, video o anuncio proviene el cliente potencial.

### 2. 🤖 Respuestas Automáticas Inteligentes & Asistente IA
- **Reglas por Palabras Clave (Keywords Triggers)**:
  - Detecta preguntas frecuentes como *"precio"*, *"costo"*, *"información"*, *"cita"*, *"glutatión"*, *"immunocal"*, *"donde están"*, *"whatsapp"*.
  - Envía la respuesta configurada de forma instantánea 24/7.
- **Asistente de Ventas con IA (Gemini API & Heurístico Local)**:
  - Redacta respuestas empáticas y orientadas al cierre de ventas con solo presionar **"Sugerir con IA"**.
  - Entrenado con la base de conocimiento de nutrición personalizada, bienestar celular y suplementación de Glutatión.
- **Mensaje de Bienvenida Instantáneo**: Saluda y califica a los usuarios en su primer contacto.
- **Fuera de Horario de Atención**: Envía mensaje cordial en horarios no laborales invitando a dejar su WhatsApp.

### 3. 📊 Embudo de Ventas & CRM de Prospectos (Pipeline Kanban)
- **6 Etapas de Maduración de Clientes**:
  1. `Nuevo Prospecto`: Mensaje entrante recién recibido.
  2. `En Conversación`: Calificando objetivos de salud y necesidades.
  3. `Cita Agendada`: Videoconsulta o evaluación pactada.
  4. `Propuesta / Cotización`: Paquete de suplementación o plan enviado.
  5. `Venta Cerrada 🎉`: Compra concretada y pago confirmado.
  6. `Descartado`: Prospecto no interesado.
- **Ficha CRM Detallada**:
  - Calificación de compra (*Lead Score* de 0 a 100).
  - Valor estimado en pesos ($ MXN).
  - Teléfono, WhatsApp y correo del cliente.
  - Bitácora de notas de seguimiento y recordatorios.
- **📲 Cierre Directo en WhatsApp**:
  - Botón de un solo clic que abre WhatsApp Web o App con un mensaje precargado personalizado para cerrar la venta inmediatamente.

### 4. 🧪 Simulador en Vivo Integrado (Test Sandbox)
- Permite probar el sistema al instante simulando mensajes entrantes desde Facebook, Instagram, TikTok o YouTube.
- Observa en tiempo real cómo el bot auto-responde y cómo el prospecto se registra automáticamente en el embudo Kanban sin necesidad de esperar aprobaciones de desarrollador.

### 5. 📈 Métricas & Dashboard de Conversión
- Tasa de conversión (% de mensajes convertidos en ventas).
- Valor total generado por cada red social.
- Tiempo promedio de respuesta del equipo.
- Desglose de volumen de interacción por plataforma.

---

## 🛠️ Requisitos Previos e Instalación

### Requisitos:
- **Node.js** v18 o superior ([Descargar Node.js](https://nodejs.org/))
- **npm** (incluido con Node.js)

### Pasos de Instalación:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/moctezumagit/rastreomessage.git
   cd rastreomessage
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   *(El archivo `.env` ya viene precargado con valores por defecto funcionales para pruebas inmediatas).*

4. **Iniciar la aplicación**:
   ```bash
   npm start
   ```
   O en modo desarrollo con recarga automática:
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**:
   Visita: **`http://localhost:3000`**

---

## 📡 Configuración de Webhooks Oficiales de Redes Sociales

Cuando desees conectar las APIs en producción:

### 1. Facebook & Instagram (Meta for Developers)
- **URL del Webhook**: `https://tu-dominio.com/api/webhooks/facebook`
- **Verify Token**: `equilibrio_social_token_2026` (o el que definas en tu `.env`)
- **Campos a suscribir en Meta**:
  - `messages`
  - `messaging_postbacks`
  - `feed` / `comments`
  - `mention`

### 2. TikTok for Business API
- **URL del Webhook**: `https://tu-dominio.com/api/webhooks/tiktok`
- **Eventos**: Direct Messages (`im_receive_msg`), Video Comments (`comment_create`).

### 3. YouTube Data API v3
- **URL de Notificaciones / Endpoint**: `https://tu-dominio.com/api/webhooks/youtube`
- Permite recibir comentarios de la comunidad y responder directamente a videos del canal `@equilibriobienestarynutricion`.

---

## 📁 Estructura del Código

```text
rastreomessage/
├── package.json              # Configuración y dependencias del proyecto
├── .env.example              # Plantilla de variables de entorno
├── .env                      # Variables de entorno activas
├── .gitignore                # Archivos ignorados por git
├── README.md                 # Documentación técnica y comercial
├── server.js                 # Servidor Express, Webhooks y API REST
│
├── services/
│   ├── db.js                 # Almacén de datos persistente (JSON DB)
│   ├── autoResponder.js      # Motor de reglas automáticas e IA
│   ├── metaService.js        # Integración Facebook & Instagram Graph API
│   ├── tiktokService.js      # Integración TikTok for Business
│   └── youtubeService.js     # Integración YouTube Data API v3
│
├── public/                   # Frontend SPA Ultra-Rápido & Responsivo
│   ├── index.html            # Dashboard principal
│   ├── css/
│   │   ├── style.css         # Sistema de diseño, tokens y modo oscuro/claro
│   │   ├── inbox.css         # Bandeja unificada y chat
│   │   ├── pipeline.css      # Tablero Kanban del embudo de ventas
│   │   └── rules.css         # Administrador de auto-respuestas y analíticas
│   └── js/
│       ├── app.js            # Router, estado global y notificaciones
│       ├── inbox.js          # Lógica de mensajes, respuestas rápidas e IA
│       ├── pipeline.js       # Control del embudo Kanban y WhatsApp
│       ├── rules.js          # CRUD de reglas y configuración de horarios
│       ├── channels.js       # Asistente de conexión y pruebas de API
│       ├── analytics.js      # Gráficas y cálculo de KPIs
│       └── simulator.js      # Inyector de mensajes de prueba en vivo
│
└── data/
    └── store.json            # Base de datos local persistente con prospectos iniciales
```

---

## 🌿 Desarrollado para
**Equilibrio Bienestar y Nutrición**  
Cuidando tu salud, optimizando tu energía y maximizando tus ventas digitales.
