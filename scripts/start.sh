#!/bin/bash
# ─────────────────────────────────────────────
# BOLERO — Inizio sessione di lavoro
# Uso: bolero-start
# ─────────────────────────────────────────────
set -e

PROJECT="$HOME/bolero-gestionale"
cd "$PROJECT"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   BOLERO — Inizio sessione           ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Sincronizza da GitHub
echo "▶ Scarico aggiornamenti da GitHub..."
git pull origin main
echo ""

# 2. Mostra lo stato
BRANCH=$(git branch --show-current)
LAST=$(git log -1 --format="%h %s (%ar)")
echo "  Branch: $BRANCH"
echo "  Ultimo commit: $LAST"
echo ""

# 3. Controlla se ci sono dipendenze nuove
if git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -q "package.json"; then
  echo "▶ package.json cambiato — aggiorno dipendenze..."
  npm install
  echo ""
fi

# 4. Avvia il server di sviluppo in background
echo "▶ Avvio il server locale..."
npm run dev &
DEV_PID=$!
echo $DEV_PID > /tmp/bolero_dev_pid

# 5. Aspetta che il server sia pronto
echo "  Attendo che il server sia pronto..."
for i in {1..20}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# 6. Apre il browser automaticamente
open http://localhost:3000

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Pronto! Il gestionale è aperto.   ║"
echo "║   Quando hai finito: bolero-stop     ║"
echo "╚══════════════════════════════════════╝"
echo ""
