# EduCore - Mobile-First School Administration Monorepo

EduCore is a production-ready school management ecosystem architected to build and scale seamlessly directly from your mobile phone or browser-based cloud IDE environments.

## Development Strategies & Operations

### 1. Cloud IDE Architecture Integration (StackBlitz / Codespaces / Replit)
- **Vite Proxy Engine**: Configured to channel traffic directly through `/api` paths locally inside development run loops. This bypasses structural mobile CORS errors when environments map forwarded cross-subdomain ports.
- **Pure JavaScript Cryptography**: Utilizes `bcryptjs` intentionally. It completely avoids compiling native platform binaries, preventing the container sandbox crashes that commonly occur when using standard `bcrypt`.

### 2. Neon Serverless Setup Execution
1. Navigate to your [Neon Console](https://neon.tech).
2. Grab the connection string marked **Connection Pooling** (this string includes the `-pooler` routing indicator and handles dynamic serverless scalability seamlessly).
3. Apply this identifier value straight into `server/.env` under the variable assignment name `DATABASE_URL`.

---

## Command Reference Registry

### First-Time Initialization
```bash
# Pull and register dependencies across all monorepo scopes
npm run install:all
```
