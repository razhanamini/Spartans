# 🥊 MMA Betting Backend API

A robust Node.js backend service for a Telegram-based MMA betting platform with TON blockchain integration.

## 🌟 Features

- 🔐 **Telegram Authentication** - Seamless login via Telegram WebApp
- 💰 **TON Wallet Integration** - Connect and manage TON wallets
- 🥋 **Fight Management** - Sync fights from Strapi CMS with Redis caching
- 🎯 **Pool-Based Betting** - Winner-takes-all betting pools with fair distribution
- ⛓️ **Blockchain Escrow** - Secure funds in TON smart contracts
- 💸 **Automated Payouts** - Process winnings when fights complete
- 📱 **Telegram Notifications** - Real-time updates to users
- 🚀 **Admin Webhooks** - Automatic updates from Strapi CMS

## 🏗️ Architecture

```
┌─────────────────┐
│  Telegram Bot   │
│   (WebApp UI)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│   API Gateway   │◄────►│    Redis     │
│   (Express)     │      │   (Cache)    │
└────────┬────────┘      └──────────────┘
         │
         ├──► Auth Module ────────┐
         │                        │
         ├──► Wallet Module ──────┤
         │                        │
         ├──► Fights Module ──────┼──► PostgreSQL
         │                        │    (Neon)
         ├──► Betting Module ─────┤
         │                        │
         ├──► Escrow Module ──────┤
         │                        │
         ├──► Payments Module ────┤
         │                        │
         └──► Notifications ──────┘
                  │
                  ▼
         ┌────────────────┐
         │ TON Blockchain │
         │   (Escrow)     │
         └────────────────┘
                  ▲
                  │
         ┌────────────────┐
         │  Strapi CMS    │
         │  (Webhooks)    │
         └────────────────┘
```

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL (Neon recommended)
- Redis (Upstash recommended)
- Telegram Bot Token
- Strapi CMS instance
- TON wallet and testnet access

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd backend
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/mma_betting?sslmode=require

# Redis (Upstash)
REDIS_URL=redis://default:pass@xxx.upstash.io:6379

# Strapi CMS
STRAPI_URL=https://your-strapi.com
STRAPI_API_TOKEN=your_strapi_api_token

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=your_bot_username

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars

# TON Blockchain
TON_NETWORK=testnet
TON_ESCROW_CONTRACT_ADDRESS=EQD...
TON_API_KEY=your_toncenter_api_key
```

### 3. Run Database Migrations

Execute the SQL schema in your Neon dashboard (see `database-setup.sql`)

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection
│   │   └── redis.js          # Redis client
│   │
│   ├── middleware/
│   │   └── auth.middleware.js # JWT verification
│   │
│   ├── modules/
│   │   ├── auth.module.js         # Telegram authentication
│   │   ├── wallet.module.js       # TON wallet management
│   │   ├── fights.module.js       # Fight data & sync
│   │   ├── betting.module.js      # Bet placement & pools
│   │   ├── escrow.module.js       # Blockchain interactions
│   │   ├── payments.module.js     # Payout processing
│   │   └── notifications.module.js # Telegram messages
│   │
│   ├── routes/
│   │   ├── auth.routes.js     # /api/auth/*
│   │   ├── fights.routes.js   # /api/fights/*
│   │   ├── bets.routes.js     # /api/bets/*
│   │   └── admin.routes.js    # /api/admin/*
│   │
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
│
├── package.json
├── Dockerfile
└── .env
```

## 🔌 API Endpoints

### Authentication

```http
POST /api/auth/telegram
Body: { initData: string }
Response: { token: string, user: Object }

POST /api/auth/wallet/connect
Headers: { Authorization: "Bearer <token>" }
Body: { walletAddress: string, proof: string }
Response: { success: boolean, walletAddress: string }

GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { id, telegramId, username, walletAddress, ... }
```

### Fights

```http
GET /api/fights/organizations
Headers: { Authorization: "Bearer <token>" }
Response: [{ id, name, logo_url, country }]

GET /api/fights/upcoming
Headers: { Authorization: "Bearer <token>" }
Response: [{ id, org_name, fighter_a_name, fighter_b_name, fight_date, pools, ... }]

GET /api/fights/:fightId
Headers: { Authorization: "Bearer <token>" }
Response: { id, fighters, pools, status, ... }
```

### Betting

```http
POST /api/bets
Headers: { Authorization: "Bearer <token>" }
Body: { fightId: uuid, fighterId: uuid, amount: number, txHash: string }
Response: { success: boolean, bet: Object }

GET /api/bets/my-bets
Headers: { Authorization: "Bearer <token>" }
Response: [{ id, fight, fighter, amount, status, payout, ... }]

GET /api/bets/fight/:fightId
Headers: { Authorization: "Bearer <token>" }
Response: { total_bets, pool_a_total, pool_b_total, user_has_bet }
```

### Admin (Webhooks)

```http
POST /api/admin/fight-result
Body: { data: StrapiWebhookPayload }
Response: { success: boolean }

POST /api/admin/sync-fights
Response: { success: boolean, message: string }
```

## 🗄️ Database Schema

### Users
```sql
users (
  id UUID PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username VARCHAR(255),
  ton_wallet_address VARCHAR(255) UNIQUE,
  created_at TIMESTAMP
)
```

### Fights
```sql
fights (
  id UUID PRIMARY KEY,
  organization_id UUID FK,
  fighter_a_id UUID FK,
  fighter_b_id UUID FK,
  fight_date TIMESTAMP,
  status VARCHAR(50),
  winner_fighter_id UUID FK,
  pool_a_total DECIMAL(20, 9),
  pool_b_total DECIMAL(20, 9),
  is_locked BOOLEAN
)
```

### Bets
```sql
bets (
  id UUID PRIMARY KEY,
  user_id UUID FK,
  fight_id UUID FK,
  fighter_id UUID FK,
  amount DECIMAL(20, 9),
  status VARCHAR(50),
  payout_amount DECIMAL(20, 9),
  escrow_tx_hash VARCHAR(255),
  created_at TIMESTAMP
)
```

[See full schema in database setup file]

## 🔄 Key Workflows

### Place Bet Flow

```
1. User submits bet via frontend
2. Backend validates fight & user wallet
3. Create bet record (status: pending)
4. Update pool totals
5. Verify escrow transaction on TON
6. Update bet status to 'escrowed'
7. Send Telegram notification
```

### Payout Flow

```
1. Admin updates fight result in Strapi
2. Strapi webhook triggers /api/admin/fight-result
3. Backend syncs fight data
4. Calculate winnings for each winner
   Formula: payout = stake + (stake / winningPool) * losingPool
5. Release funds via TON smart contract
6. Update bet records with payout amounts
7. Send Telegram notifications to all bettors
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Test endpoints with curl
curl -X POST http://localhost:3000/api/admin/sync-fights
```

### Manual Testing Checklist

- [ ] Telegram authentication works
- [ ] Wallet connection successful
- [ ] Fights load from Strapi
- [ ] Bet placement creates transaction
- [ ] Pools update correctly
- [ ] Webhook triggers payout
- [ ] Notifications sent to users

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t mma-betting-backend .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e TELEGRAM_BOT_TOKEN="..." \
  mma-betting-backend
```

### Deploy to Back4app

1. Push code to GitHub
2. Create new Container app on Back4app
3. Connect repository
4. Set environment variables
5. Deploy!

## 🔐 Security Best Practices

- ✅ JWT tokens with 30-day expiration
- ✅ Telegram initData validation
- ✅ PostgreSQL parameterized queries (SQL injection prevention)
- ✅ CORS enabled for frontend domain only
- ✅ Environment variables for secrets
- ⚠️ TODO: Rate limiting on bet endpoints
- ⚠️ TODO: Input validation middleware
- ⚠️ TODO: TON transaction verification

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
# Response: { "status": "ok", "timestamp": "2024-..." }
```

### Logs

```bash
# View application logs
docker logs -f <container-id>

# Database connection logs
# Check PostgreSQL connection in console on startup
```

### Key Metrics to Monitor

- Request latency
- Database connection pool usage
- Redis cache hit rate
- Failed TON transactions
- Webhook delivery failures

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Test Neon connection
psql "postgresql://user:pass@ep-xxx.neon.tech/mma_betting?sslmode=require"

# Check if database is active (Neon auto-pauses after inactivity)
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -u redis://default:pass@xxx.upstash.io:6379 ping
```

### Telegram Bot Issues

```bash
# Verify bot token
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Check webhook status
curl https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

### TON Transaction Issues

- Verify contract address is correct
- Check testnet balance
- Review TON API rate limits
- Inspect transaction hashes on TON explorer

## 🔧 Configuration

### Redis Caching

Cache TTL is set to 5 minutes for:
- Upcoming fights list
- Organizations list

To clear cache:
```bash
redis-cli -u $REDIS_URL FLUSHALL
```

### Database Connection Pool

Default settings in `config/database.js`:
- Max connections: 20
- Idle timeout: 30s
- Connection timeout: 2s

## 📚 Dependencies

### Core
- `express` - Web framework
- `pg` - PostgreSQL client
- `redis` - Redis client
- `jsonwebtoken` - JWT authentication

### Integrations
- `axios` - HTTP client for Strapi
- `node-telegram-bot-api` - Telegram Bot API
- `@ton/ton` - TON blockchain SDK

### Utilities
- `cors` - CORS middleware
- `dotenv` - Environment variables

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- 📧 Email: support@example.com
- 💬 Telegram: @your_support_bot
- 🐛 Issues: GitHub Issues

## 🗺️ Roadmap

- [ ] Implement actual TON smart contract
- [ ] Add rate limiting
- [ ] Implement WebSocket for real-time updates
- [ ] Add automated testing suite
- [ ] Implement bet cancellation/refunds
- [ ] Add analytics endpoints
- [ ] Multi-language support
- [ ] Implement referral system

---

Built with ❤️ for the MMA community | Powered by TON Blockchain