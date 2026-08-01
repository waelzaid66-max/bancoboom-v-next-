#!/bin/bash
# ─────────────────────────────────────────────────────────
# BANCO Status Dashboard — Replit Setup Script
# Run once after importing this project into a new Replit.
# ─────────────────────────────────────────────────────────

echo "📦 Installing dependencies..."
npm install

echo "✅ Done. Configure VITE_API_BASE_URL in Replit Secrets, then run:"
echo "   npm run dev"
echo ""
echo "🔗 API URL options:"
echo "   Production:  https://banco.autos"
echo "   Replit Dev:  https://\$REPLIT_DEV_DOMAIN"
echo "   Local:       http://localhost:8080"
