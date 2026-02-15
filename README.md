## Asset Manager (Vite + React)

Pure **client-side React SPA on Vite**.  
There is **no backend or database** – all “requests” are mocked and data is stored only in `localStorage`.

### Requirements

- Node.js 18+ (recommended: 20+)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the URL printed by Vite in the console (usually `http://localhost:5173`).

### Production build

```bash
npm run build
```

The static files will be generated into the `dist/` folder.

### Preview production build

```bash
npm run preview
```

### Project structure (main parts)

- `src/` – all client code (pages, components, hooks).
- `src/lib/mockApi.ts` – mock API layer backed by `localStorage`.
- `src/lib/schema.ts` – Zod schemas and TypeScript types (no Drizzle/DB).
- `vite.config.ts` – standard Vite config with React and `@` → `src` alias.

