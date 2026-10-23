# GameUniverse

Catalogue de jeux vidéo, personnages et joueurs, administré par une équipe
éditoriale via le panneau `/admin`.

## Administration

**Admin entity**:
Une donnée de référence ou de contenu gérée dans le panneau admin (genre,
plateforme, espèce, avis, jeu…), listée, éditée et supprimée par un admin.
_Avoid_: admin object, CRUD item

**Admin resource**:
La description d'une admin entity côté panneau : où elle se liste, comment une
ligne s'identifie, si elle a un usage et si sa suppression est forcée.
_Avoid_: admin config, entity definition

**Usage**:
Le nombre d'autres données (jeux, personnages, joueurs…) qui référencent une
admin entity. Le consulter ne modifie jamais rien.
_Avoid_: usage check (quand il désigne une suppression), references count

**Forced delete**:
Suppression d'une admin entity qui détache d'abord ses usages au lieu d'être
refusée tant qu'elle est utilisée.
_Avoid_: hard delete, cascade delete

**Delete flow**:
La séquence demander → afficher l'usage → confirmer ou annuler la suppression
d'une admin entity.
_Avoid_: delete dialog logic
