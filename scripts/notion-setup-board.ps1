# Script pour creer le Board Kanban dans Notion + taches initiales
# Usage: $env:NOTION_TOKEN="ntn_xxx"; .\scripts\notion-setup-board.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $env:NOTION_TOKEN) {
    Write-Host "Variable NOTION_TOKEN manquante." -ForegroundColor Red
    Write-Host '$env:NOTION_TOKEN="ntn_xxx"; .\scripts\notion-setup-board.ps1'
    exit 1
}

$Api = "https://api.notion.com/v1"
$Headers = @{
    "Authorization"  = "Bearer $env:NOTION_TOKEN"
    "Notion-Version" = "2022-06-28"
    "Content-Type"   = "application/json; charset=utf-8"
}

Write-Host "Creation de la base de donnees Board..."

$DbJson = @'
{
  "parent": { "type": "page_id", "page_id": "33abf0a6-d5d2-8007-9e5a-e4a285b7b0f3" },
  "icon": { "type": "emoji", "emoji": "\ud83d\udccb" },
  "title": [{ "type": "text", "text": { "content": "Board des t\u00e2ches" } }],
  "properties": {
    "T\u00e2che": { "title": {} },
    "Statut": { "select": { "options": [
      { "name": "Backlog", "color": "default" },
      { "name": "\u00c0 faire", "color": "blue" },
      { "name": "En cours", "color": "yellow" },
      { "name": "Review", "color": "orange" },
      { "name": "Termin\u00e9", "color": "green" }
    ]}},
    "Priorit\u00e9": { "select": { "options": [
      { "name": "\ud83d\udd34 Critique", "color": "red" },
      { "name": "\ud83d\udfe0 Haute", "color": "orange" },
      { "name": "\ud83d\udfe1 Moyenne", "color": "yellow" },
      { "name": "\ud83d\udfe2 Basse", "color": "green" }
    ]}},
    "Cat\u00e9gorie": { "select": { "options": [
      { "name": "\ud83d\udcf1 Mobile", "color": "blue" },
      { "name": "\u2728 Feature", "color": "purple" },
      { "name": "\ud83c\udfa8 Design", "color": "pink" },
      { "name": "\ud83d\udc1b Bug", "color": "red" },
      { "name": "\ud83d\udd27 Refacto", "color": "brown" },
      { "name": "\ud83d\udcdd Documentation", "color": "default" }
    ]}},
    "Assign\u00e9": { "people": {} },
    "\u00c9ch\u00e9ance": { "date": {} }
  }
}
'@

$DbBody = [System.Text.Encoding]::UTF8.GetBytes($DbJson)
$DbResponse = Invoke-RestMethod -Uri "$Api/databases" -Method Post -Headers $Headers -Body $DbBody
$DbId = $DbResponse.id

if (-not $DbId) {
    Write-Host "Erreur lors de la creation de la base de donnees" -ForegroundColor Red
    exit 1
}

Write-Host "Base de donnees creee: $DbId" -ForegroundColor Green
Write-Host ""
Write-Host "Ajout des taches..."

function Add-Task($Title, $Statut, $Priorite, $Categorie) {
    $Json = @"
{
  "parent": { "database_id": "$DbId" },
  "properties": {
    "T\u00e2che": { "title": [{ "text": { "content": "$Title" } }] },
    "Statut": { "select": { "name": "$Statut" } },
    "Priorit\u00e9": { "select": { "name": "$Priorite" } },
    "Cat\u00e9gorie": { "select": { "name": "$Categorie" } }
  }
}
"@
    $Body = [System.Text.Encoding]::UTF8.GetBytes($Json)
    Invoke-RestMethod -Uri "$Api/pages" -Method Post -Headers $Headers -Body $Body | Out-Null
    Write-Host "  + $Title"
}

Add-Task "Audit mobile - Landing page"            "Backlog" "\ud83d\udd34 Critique" "\ud83d\udcf1 Mobile"
Add-Task "Audit mobile - Liste des jeux"           "Backlog" "\ud83d\udd34 Critique" "\ud83d\udcf1 Mobile"
Add-Task "Audit mobile - Page d\u00e9tail jeu"     "Backlog" "\ud83d\udd34 Critique" "\ud83d\udcf1 Mobile"
Add-Task "Audit mobile - Personnages"              "Backlog" "\ud83d\udfe0 Haute"    "\ud83d\udcf1 Mobile"
Add-Task "Audit mobile - Profil joueur"            "Backlog" "\ud83d\udfe0 Haute"    "\ud83d\udcf1 Mobile"
Add-Task "Audit mobile - Admin (sidebar + pages)"  "Backlog" "\ud83d\udfe0 Haute"    "\ud83d\udcf1 Mobile"
Add-Task "Audit mobile - Auth (login/register)"    "Backlog" "\ud83d\udfe1 Moyenne"  "\ud83d\udcf1 Mobile"
Add-Task "Audit mobile - Footer et navigation"     "Backlog" "\ud83d\udfe1 Moyenne"  "\ud83d\udcf1 Mobile"
Add-Task "Refonte responsive composants shared"    "Backlog" "\ud83d\udfe0 Haute"    "\ud83c\udfa8 Design"
Add-Task "Modales/Dialogs responsive"              "Backlog" "\ud83d\udfe1 Moyenne"  "\ud83c\udfa8 Design"
Add-Task "Tableaux admin vers cartes mobile"       "Backlog" "\ud83d\udfe1 Moyenne"  "\ud83d\udd27 Refacto"
Add-Task "Documentation patterns responsive"       "Backlog" "\ud83d\udfe2 Basse"    "\ud83d\udcdd Documentation"

Write-Host ""
Write-Host "Termine ! 12 taches ajoutees au Board." -ForegroundColor Green
Write-Host "Ouvre Notion et passe en vue Board groupe par 'Statut'"
