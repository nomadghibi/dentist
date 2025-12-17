# Setup Guide for Windows PowerShell

## Step-by-Step Setup

### 1. Install Dependencies

```powershell
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Start PostgreSQL

```powershell
# Start Docker container
docker-compose up -d

# Verify it's running
docker ps
```

### 3. Create Environment File

```powershell
# Copy example file
Copy-Item .env.example .env

# Edit .env with your values
notepad .env
```

### 4. Generate and Run Migrations

```powershell
# Generate migration files
pnpm db:generate

# Push schema to database (or use migrations)
pnpm db:push
```

### 5. Create Admin User

You can create an admin user via SQL or add a seed script. For now, use a SQL client or add this to a seed file.

### 6. Run Ingestion

```powershell
# Ingest dentists for Palm Bay
Invoke-WebRequest -Uri "http://localhost:3000/api/jobs/ingest" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"city":"palm-bay","secret":"your-job-secret-token"}'

# Repeat for other cities
Invoke-WebRequest -Uri "http://localhost:3000/api/jobs/ingest" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"city":"melbourne","secret":"your-job-secret-token"}'

Invoke-WebRequest -Uri "http://localhost:3000/api/jobs/ingest" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"city":"space-coast","secret":"your-job-secret-token"}'
```

### 7. Start Development Server

```powershell
pnpm dev
```

Visit `http://localhost:3000`

## Common Commands

```powershell
# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start

# Database
pnpm db:generate    # Generate migrations
pnpm db:push        # Push schema
pnpm db:migrate     # Run migrations
pnpm db:studio      # Open Drizzle Studio

# Testing
pnpm test           # Run tests
pnpm test:watch     # Watch mode
```

## Troubleshooting

### Database Connection Issues

```powershell
# Check if PostgreSQL is running
docker ps

# Check logs
docker-compose logs postgres

# Restart container
docker-compose restart postgres
```

### Port Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Migration Errors

```powershell
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
pnpm db:push
```

