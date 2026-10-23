# GameUniverse

Plateforme communautaire de jeux vidéo (catalogue, joueurs, esport, coaching).
Ce glossaire fixe le vocabulaire partagé entre code, issues et revues.

## Interface utilisateur

**Dismissable layer**:
Surface d'interface temporaire (menu, dropdown, panneau, overlay, dialog) qui se ferme
sur Escape ou sur un pointeur posé en dehors de ses inside regions.
_Avoid_: popup, popover (sauf composant précis), click-outside

**Layer stack**:
Ordre des dismissable layers ouverts à un instant donné ; le dernier ouvert est le calque du dessus.
_Avoid_: z-index, empilement de modales

**Top layer**:
Le dismissable layer le plus récemment ouvert ; seul destinataire d'Escape.
_Avoid_: calque actif, modal courante

**Inside region**:
Zone de l'écran qui compte comme intérieure à un dismissable layer (son container, plus ses régions
déclarées comme le déclencheur) ; un pointeur dans cette zone ne le ferme pas.
_Avoid_: zone ignorée, exclusion

**Trigger**:
L'élément qui avait le focus à l'ouverture d'un dismissable layer, et qui le récupère à la fermeture.
_Avoid_: anchor, opener

**Scroll lock**:
Blocage du défilement de la page tant qu'au moins un dismissable layer le demande.
_Avoid_: body lock, overflow hidden

**Focus trap**:
Contrainte qui garde la navigation clavier (Tab, Shift+Tab) à l'intérieur d'un dismissable layer.
_Avoid_: focus lock, focus scope
