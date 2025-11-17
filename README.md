# Hookin-Up

Open-connection dating platform where users create their own spaces for authentic connections.

## 🚀 Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Cache:** Redis (Upstash)
- **Storage:** Cloudflare R2
- **Email:** Postmark
- **Deployment:** Vercel (Frontend) + Railway (Backend)

## 📁 Project Structure

```
hookin-up/
├── backend/          # Express API server
├── frontend/         # React application
├── shared/           # Shared types and utilities
├── docs/             # Documentation
└── infrastructure/   # IaC and deployment configs
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm 10+

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/hookin-up.git
   cd hookin-up
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit the .env files with your credentials
   ```

4. **Run database migrations:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   cd ..
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## 📚 Documentation

- [Requirements](./docs/requirements.md)
- [Architecture](./docs/architecture.md)
- [API Design](./docs/api-design.md)
- [Database Schema](./docs/database-schema.md)
- [E2E Encryption](./docs/e2e-encryption.md)

## 🎯 MVP Roadmap

- [x] Project setup
- [ ] M0: Foundations (Auth, Infrastructure)
- [ ] M1: City & Spaces
- [ ] M2: Discover & Connect
- [ ] M3: Messaging & Safety
- [ ] M4: Polish (PWA, Observability)

See [GitHub Projects](https://github.com/yourusername/hookin-up/projects) for detailed progress.

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
npm test --workspace=backend

# Frontend tests only
npm test --workspace=frontend
```

## 📦 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (Railway)
```bash
cd backend
railway up
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./docs/contributing.md) first.

## 📧 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
EOF
```

### Step 9: Create Docker Compose (Local Development)

```bash
mkdir -p infrastructure/docker

cat > infrastructure/docker/docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    container_name: hookin-up-db
    environment:
      POSTGRES_DB: hookin_up_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: hookin-up-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data: