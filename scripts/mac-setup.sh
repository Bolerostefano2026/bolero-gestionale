#!/bin/bash
# ─────────────────────────────────────────────
# BOLERO — Setup MacBook (esegui UNA SOLA VOLTA)
# ─────────────────────────────────────────────
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   BOLERO Gestionale — Setup Mac      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Homebrew
if ! command -v brew &>/dev/null; then
  echo "▶ Installo Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✓ Homebrew già installato"
fi

# 2. Node.js
if ! command -v node &>/dev/null; then
  echo "▶ Installo Node.js..."
  brew install node
else
  echo "✓ Node.js già installato ($(node -v))"
fi

# 3. Git
if ! command -v git &>/dev/null; then
  echo "▶ Installo Git..."
  brew install git
else
  echo "✓ Git già installato ($(git --version))"
fi

# 4. Claude Code
if ! command -v claude &>/dev/null; then
  echo "▶ Installo Claude Code..."
  npm install -g @anthropic/claude-code
else
  echo "✓ Claude Code già installato"
fi

# 5. Clona il progetto
DEST="$HOME/bolero-gestionale"
if [ ! -d "$DEST" ]; then
  echo "▶ Clono il progetto in $DEST..."
  git clone https://github.com/danykiller/bolero-gestionale.git "$DEST"
else
  echo "✓ Progetto già clonato in $DEST"
fi

# 6. Dipendenze npm
echo "▶ Installo dipendenze npm..."
cd "$DEST"
npm install

# 7. Variabili d'ambiente
if [ ! -f "$DEST/.env.local" ]; then
  echo ""
  echo "⚠️  AZIONE MANUALE RICHIESTA"
  echo "   Crea il file: $DEST/.env.local"
  echo "   Copialo da 1Password (nota: BOLERO env.local)"
  echo "   Poi esegui: nano $DEST/.env.local"
  echo ""
else
  echo "✓ .env.local già presente"
fi

# 8. Crea alias globali per start/stop
PROFILE="$HOME/.zshrc"
if ! grep -q "bolero-start" "$PROFILE" 2>/dev/null; then
  echo "" >> "$PROFILE"
  echo "# BOLERO Gestionale shortcuts" >> "$PROFILE"
  echo 'alias bolero-start="bash $HOME/bolero-gestionale/scripts/start.sh"' >> "$PROFILE"
  echo 'alias bolero-stop="bash $HOME/bolero-gestionale/scripts/stop.sh"' >> "$PROFILE"
  echo "✓ Alias aggiunti: bolero-start / bolero-stop"
  echo "  (riavvia il terminale per usarli)"
else
  echo "✓ Alias già presenti"
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Setup completato!                  ║"
echo "║   Usa: bolero-start per lavorare     ║"
echo "║   Usa: bolero-stop  per finire       ║"
echo "╚══════════════════════════════════════╝"
echo ""
