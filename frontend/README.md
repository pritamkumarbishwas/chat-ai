# Chat AI frontend

This is the React, TypeScript, and Vite client for Chat AI. For the full project overview, architecture diagram, screenshot, and end-to-end setup, see the [project README](../README.md).

## Development

From this directory:

```bash
npm install
npm run dev
```

The Vite server runs at `http://localhost:5173` by default and connects to the backend at `http://localhost:8000`. To point it at another backend, create `.env.local`:

```env
VITE_API_URL=https://your-backend.example.com
```

## Checks

```bash
npm run build
npm run lint
```
