#!/bin/bash
# Script pour créer le Board Kanban dans Notion + tâches initiales
# Usage: NOTION_TOKEN=ntn_xxx bash scripts/notion-setup-board.sh

if [ -z "$NOTION_TOKEN" ]; then
  echo "❌ Variable NOTION_TOKEN manquante."
  echo "Usage: NOTION_TOKEN=ntn_xxx bash scripts/notion-setup-board.sh"
  exit 1
fi

PARENT_PAGE="33abf0a6-d5d2-8007-9e5a-e4a285b7b0f3"
API="https://api.notion.com/v1"
H_AUTH="Authorization: Bearer $NOTION_TOKEN"
H_VERSION="Notion-Version: 2022-06-28"
H_JSON="Content-Type: application/json"

echo "📋 Création de la base de données Board..."

DB_RESPONSE=$(curl -s -X POST "$API/databases" \
  -H "$H_AUTH" -H "$H_VERSION" -H "$H_JSON" \
  -d '{
  "parent": { "type": "page_id", "page_id": "'"$PARENT_PAGE"'" },
  "icon": { "type": "emoji", "emoji": "📋" },
  "title": [{ "type": "text", "text": { "content": "Board des tâches" } }],
  "properties": {
    "Tâche": { "title": {} },
    "Statut": {
      "select": {
        "options": [
          { "name": "Backlog", "color": "default" },
          { "name": "À faire", "color": "blue" },
          { "name": "En cours", "color": "yellow" },
          { "name": "Review", "color": "orange" },
          { "name": "Terminé", "color": "green" }
        ]
      }
    },
    "Priorité": {
      "select": {
        "options": [
          { "name": "🔴 Critique", "color": "red" },
          { "name": "🟠 Haute", "color": "orange" },
          { "name": "🟡 Moyenne", "color": "yellow" },
          { "name": "🟢 Basse", "color": "green" }
        ]
      }
    },
    "Catégorie": {
      "select": {
        "options": [
          { "name": "📱 Mobile", "color": "blue" },
          { "name": "✨ Feature", "color": "purple" },
          { "name": "🎨 Design", "color": "pink" },
          { "name": "🐛 Bug", "color": "red" },
          { "name": "🔧 Refacto", "color": "brown" },
          { "name": "📝 Documentation", "color": "default" }
        ]
      }
    },
    "Assigné": { "people": {} },
    "Échéance": { "date": {} }
  }
}')

DB_ID=$(echo "$DB_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DB_ID" ]; then
  echo "❌ Erreur lors de la création de la base de données:"
  echo "$DB_RESPONSE"
  exit 1
fi

echo "✅ Base de données créée: $DB_ID"
echo ""
echo "📝 Ajout des tâches..."

add_task() {
  local title="$1" statut="$2" priorite="$3" categorie="$4"
  curl -s -X POST "$API/pages" \
    -H "$H_AUTH" -H "$H_VERSION" -H "$H_JSON" \
    -d '{
    "parent": { "database_id": "'"$DB_ID"'" },
    "properties": {
      "Tâche": { "title": [{ "text": { "content": "'"$title"'" } }] },
      "Statut": { "select": { "name": "'"$statut"'" } },
      "Priorité": { "select": { "name": "'"$priorite"'" } },
      "Catégorie": { "select": { "name": "'"$categorie"'" } }
    }
  }' > /dev/null
  echo "  ✓ $title"
}

add_task "Audit mobile - Landing page" "Backlog" "🔴 Critique" "📱 Mobile"
add_task "Audit mobile - Liste des jeux" "Backlog" "🔴 Critique" "📱 Mobile"
add_task "Audit mobile - Page détail jeu" "Backlog" "🔴 Critique" "📱 Mobile"
add_task "Audit mobile - Personnages" "Backlog" "🟠 Haute" "📱 Mobile"
add_task "Audit mobile - Profil joueur" "Backlog" "🟠 Haute" "📱 Mobile"
add_task "Audit mobile - Admin (sidebar + pages)" "Backlog" "🟠 Haute" "📱 Mobile"
add_task "Audit mobile - Auth (login/register)" "Backlog" "🟡 Moyenne" "📱 Mobile"
add_task "Audit mobile - Footer et navigation" "Backlog" "🟡 Moyenne" "📱 Mobile"
add_task "Refonte responsive composants shared" "Backlog" "🟠 Haute" "🎨 Design"
add_task "Modales/Dialogs responsive" "Backlog" "🟡 Moyenne" "🎨 Design"
add_task "Tableaux admin vers cartes mobile" "Backlog" "🟡 Moyenne" "🔧 Refacto"
add_task "Documentation patterns responsive" "Backlog" "🟢 Basse" "📝 Documentation"

echo ""
echo "🎉 Terminé ! 12 tâches ajoutées au Board."
echo "👉 Ouvre Notion et passe en vue Board groupé par 'Statut'"
