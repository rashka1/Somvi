# Somvi - Construction Materials Platform

## Overview
Somvi is a full-stack web application for managing construction materials, logistics, and deals in Somalia. It provides a platform for ordering materials, connecting with suppliers, and tracking deliveries in real-time.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (local instance)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS + Radix UI components

## Architecture
- **Frontend**: Runs on port 5000 (Vite dev server)
- **Backend API**: Runs on port 5001 (Express server)
- **Database**: Local PostgreSQL on localhost:5432
- **Development**: Frontend proxies `/api` requests to backend on port 5001

## Database Setup
The project uses a local PostgreSQL database initialized and managed by the `start-postgres.sh` script:
- Database name: `somvi`
- User: `postgres`
- Password: `postgres`
- Connection: `postgresql://postgres:postgres@localhost:5432/somvi`

The startup script automatically:
1. Initializes PostgreSQL if not present
2. Starts the PostgreSQL server
3. Creates the postgres role and somvi database
4. Exports DATABASE_URL for the application

## Running the Application

### Development
```bash
npm install           # Install dependencies
npm run dev          # Start both frontend and backend
```

The dev script automatically:
- Initializes and starts PostgreSQL
- Starts the backend server on port 5001
- Starts the Vite frontend on port 5000

### Database Migrations
```bash
npm run db:push      # Push schema changes to database
```

### Default Admin Account
Email: `admin@somvi.so`
Password: `somvi123`

This account is automatically created on first server startup.

## Project Structure
```
├── server/              # Backend code
│   ├── index.ts        # Express server entry point
│   ├── routes.ts       # API routes
│   ├── db.ts           # Database connection
│   ├── auth.ts         # Authentication logic
│   └── seed.ts         # Database seeding
├── src/                # Frontend code
├── shared/             # Shared types and schemas
│   └── schema.ts       # Drizzle database schema
├── start-postgres.sh   # PostgreSQL initialization script
└── package.json        # Dependencies and scripts
```

## Recent Changes (November 02, 2025)
### GitHub Import and Setup
- Imported from GitHub repository (master branch)
- Removed Neon DB dependency, replaced with local PostgreSQL
- Installed PostgreSQL system package in Replit
- Created startup script for PostgreSQL management
- Configured separate ports for frontend (5000) and backend (5001)
- Added health check endpoint at `/api/health`
- Updated Vite config to proxy API requests to backend
- Pushed database migrations to local PostgreSQL
- Verified default admin user creation

### Configuration Updates
- **server/db.ts**: Replaced `@neondatabase/serverless` with `pg` (node-postgres)
- **server/index.ts**: Backend now runs on port 5001 (localhost)
- **vite.config.ts**: Frontend on port 5000 with proxy to backend
- **package.json**: Added pg driver, updated dev script to run both servers
- **.gitignore**: Added Node.js project ignores

## Features
- User authentication and authorization
- Material ordering and management
- Supplier connections
- Delivery tracking
- Client and project management
- Deal management
- Dashboard with analytics

## Health Check
The backend provides a health check endpoint:
```
GET /api/health
Response: {"status": "ok", "timestamp": "2025-11-02T..."}
```

## Notes
- PostgreSQL must be running before starting the application (handled automatically by npm run dev)
- The application uses local PostgreSQL instead of Neon DB for development
- Frontend and backend run as separate processes connected via proxy
- Database schema is defined in `shared/schema.ts` using Drizzle ORM
