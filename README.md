# 0.1s Dev - Script Sharing Platform

A full-stack script sharing platform similar to ScriptBlox, built with React + Vite + Express.

## Features

- **Script Library**: Browse and search scripts with filtering and sorting
- **User Authentication**: Register/Login with CAPTCHA verification
- **Dark/Light Theme**: Toggle between dark and white themes
- **Script Upload**: Registered users can publish scripts
- **Script Viewer**: Full code viewer with copy-to-clipboard
- **Like System**: Like scripts (requires login)
- **User Profiles**: Public profiles showing user's scripts
- **Dashboard**: Manage your uploaded scripts
- **Platform Stats**: Live stats showing total scripts, users, likes, views

## Tech Stack

- **Frontend**: React + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Express 5 + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **API**: OpenAPI spec with codegen (Orval)
- **Monorepo**: pnpm workspaces

## Setup

\`\`\`bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/scriptforge run dev
\`\`\`

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session cookie signing
- `PORT` - Server port
- `BASE_PATH` - Vite base path

## License

MIT
