# WARLORDS React Frontend

This is the Vite React frontend for WARLORDS Boss Timer.

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## API URL

The API base URL is defined in `src/api/config.js`.

Behavior:

- Development: `http://127.0.0.1:8000`
- Production: `/api`
- Override: `VITE_API_URL`

Example:

```bash
VITE_API_URL=http://127.0.0.1:8000 npm run dev
```

## Important Frontend Areas

```text
src/pages/components/Layout.jsx       Main user layout
src/pages/admin/AdminLayout.jsx       Admin layout
src/hooks/useRealtimeSync.js          WebSocket connection and realtime events
src/utils/dateTime.js                 API timestamp parsing and user timezone display
src/utils/sound.js                    Boss-appearance alert sound handling
src/pages/components/ChatWidget.jsx   Team chat UI
src/pages/components/LeftContent.jsx  Coming Soon Boss list
src/pages/components/RightContent.jsx Recent Boss History list
```

## Styling

Global SCSS entry point:

```text
src/scss/styles.scss
```

Page and feature styles are split into files such as:

```text
src/scss/homepage.scss
src/scss/chat.scss
src/scss/profile.scss
src/scss/navigation.scss
```

