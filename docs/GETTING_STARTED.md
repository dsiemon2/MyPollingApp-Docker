# Getting Started with MyPollingApp

This guide will help you get MyPollingApp up and running quickly.

## Prerequisites

- Docker and Docker Compose installed
- 4GB RAM minimum
- Ports 8610 (app) and 5432 (PostgreSQL) available

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository>
cd MyPollingApp-Docker
```

### 2. Start with Docker

```bash
docker-compose up -d --build
```

This will:
- Build the Next.js application
- Start PostgreSQL database
- Run database migrations automatically
- Seed demo data (users, polls, poll types)
- Start the application on port 8610

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:8610
```

## Demo Accounts

PollChat comes with pre-configured demo accounts for testing:

| Email | Password | Role | Plan |
|-------|----------|------|------|
| admin@mypollingapp.com | password123 | Super Admin | Enterprise |
| polladmin@mypollingapp.com | password123 | Poll Admin | Professional |
| user@mypollingapp.com | password123 | User | Free |

## First Steps

### As a Regular User

1. **Login** at `/login` using a demo account or register a new account
2. **Browse Polls** at `/polls` to see all available polls
3. **Vote** on any open poll
4. **Chat** with the AI assistant on poll pages (requires Starter+ plan)

### As an Admin

1. **Login** with `admin@pollchat.com` or `polladmin@pollchat.com`
2. **Access Admin Panel** at `/admin` or click "Admin" in the navbar
3. **Dashboard** - View statistics and recent activity
4. **Manage Polls** - Create, edit, and delete polls
5. **Configure AI** - Set up Hugging Face or OpenAI integration
6. **Manage Subscriptions** - Upgrade/downgrade user plans

## Creating Your First Poll

1. Login as an admin user
2. Go to Admin Panel → Polls → Create New Poll
3. Fill in:
   - **Title**: Your poll question
   - **Description**: Additional context
   - **Poll Type**: Single Choice, Multiple Choice, Rating, etc.
   - **Options**: Add choices (for choice-based polls)
4. Click "Create Poll"
5. Share the poll URL with participants

## Poll Types Available

| Type | Description | Best For |
|------|-------------|----------|
| Single Choice | Select one option | Clear preferences |
| Multiple Choice | Select multiple options | Feature requests |
| Yes/No | Binary choice | Quick decisions |
| Rating Scale | 1-5 stars | Satisfaction surveys |
| NPS | 0-10 score | Customer loyalty |
| Ranked Choice | Order preferences | Elections |
| Open Text | Free-form responses | Feedback |

## Environment Variables

Create a `.env` file for custom configuration:

```env
# Database
DATABASE_URL=postgresql://pollchat:pollchat123@localhost:5432/pollchat

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:8610

# AI Providers (optional)
HUGGINGFACE_API_KEY=your-hf-key
OPENAI_API_KEY=your-openai-key

# Payment Gateways (optional)
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_PUBLISHABLE_KEY=your-stripe-pk
```

## Docker Commands

```bash
# Start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset database (deletes all data)
docker-compose down -v
docker-compose up -d --build

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Database Connection Issues

If you see "Connection refused" errors:

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres
```

### Application Not Starting

```bash
# Check application logs
docker-compose logs app

# Ensure all dependencies are installed
docker-compose build --no-cache
```

### Port Already in Use

Change the port in `docker-compose.yml`:

```yaml
ports:
  - "8620:8600"  # Change 8610 to another port
```

## Next Steps

- [Subscription Plans](./SUBSCRIPTIONS.md) - Learn about plan tiers and features
- [Payment Processing](./PAYMENT_PROCESSING.md) - Configure payment gateways
- [API Reference](./API.md) - Build integrations
- [Implementation Details](./IMPLEMENTATION.md) - Technical architecture
