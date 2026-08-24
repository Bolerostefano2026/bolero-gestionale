#!/bin/bash
# ─────────────────────────────────────────────
# BOLERO — Fine sessione di lavoro
# Uso: bolero-stop
# ─────────────────────────────────────────────

PROJECT="$HOME/bolero-gestionale"
cd "$PROJECT"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   BOLERO — Fine sessione             ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Controlla se ci sono modifiche da salvare
STATUS=$(git status --porcelain)

if [ -n "$STATUS" ]; then
  echo "▶ Modifiche rilevate:"
  git status --short
  echo ""

  # Chiede il messaggio di commit
  echo -n "  Descrivi le modifiche (Invio per messaggio automatico): "
  read MSG

  if [ -z "$MSG" ]; then
    MSG="lavoro del $(date '+%d/%m/%Y %H:%M')"
  fi

  git add .
  git commit -m "$MSG"
  echo "  ✓ Commit salvato"
else
  echo "  ✓ Nessuna modifica locale da salvare"
fi

# 2. Pusha su GitHub
echo ""
echo "▶ Carico su GitHub..."
git push origin main
echo "  ✓ GitHub aggiornato — puoi lavorare dal PC fisso"

# 3. Ferma il server di sviluppo
if [ -f /tmp/bolero_dev_pid ]; then
  PID=$(cat /tmp/bolero_dev_pid)
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    rm /tmp/bolero_dev_pid
    echo "  ✓ Server locale fermato"
  fi
else
  # Fallback: cerca il processo Next.js per porta
  PIDS=$(lsof -ti:3000 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill 2>/dev/null
    echo "  ✓ Server locale fermato"
  fi
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Sessione chiusa. Buon viaggio!     ║"
echo "║   Sul PC fisso: git pull origin main  ║"
echo "╚══════════════════════════════════════╝"
echo ""
