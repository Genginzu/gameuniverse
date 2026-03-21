# Features
* Comparaison de bibliothèques entre joueurs — "X jeux en commun avec ce joueur". Sympa pour le côté social.
* Notifications (in-app ou email via Resend, que vous avez déjà configuré) — notifier quand quelqu'un commente un personnage qu'on a aussi commenté, ou quand un admin répond à une review.
* Système de session de jeu - Le joueur rentre ses sessions de jeu avec le temps passé, la date et le ou les jeux auxquels il a joué
* Système d'Objectifs - Un joueur se fixe des objectifs dans un temps imparti et peu les marquer comme complété un peu à la manière d'une todo un peu plus ciblé gaming
* Système de connexion aux différents comptes pour récupérer les jeux possédés
* Système pour proposer la création de collection selon les infos du joueur
* Mettre en place un système de publicité
* Système de rajout de jeu ou de personnage qui n'existe pas.
* Quand on clique sur un tags dans un poste, on est envoyé sur une page des posts qui ont ce tag 
* Revoir la manière dont les tags sont géré dans la création d'un post (# directement dans le texte par exemple et notification d'un joueur quand on le tag)

# Idées
* Elaborer le côté social
* Elaborer le magasin
* Elaborer l'esport
* Elaborer le training des joueurs
* Mettre en place un système de paiement pour débloquer des avatars et des bannières et en débloquer avec des succès

# Corrections
* Refaire une passe pour optimiser les requêtes et faire du lazy loading
* Refaire une passe pour s'assurer que tout est rangé proprement.
* Remplacer Lucide-react par iconify et créer un steering
* Rajouter SWR au projet

Peux-tu prendre <page> et faire une passe pour regarder ce qui pourrait être améliorer en terme de perfromance, de lazy loading et d'affichage skeleton ? Dans un premier temps fait moi un etat des lieux et je te confirmerais les points à mettre en place par la suite


#	Point	Impact	Priorité
1	Batch des statuts library (20 requêtes → 1)	Perf réseau	Haute
2	Supprimer le double chargement d'image	Perf réseau + LCP	Haute
3	Cache client (SWR/react-query)	UX navigation	Moyenne
4	Duplication du code de fetch initial	Maintenabilité	Moyenne
5	Lazy load des filtres et pagination	Taille du bundle	Moyenne
6	Iconify chargé pour chaque carte	Perf réseau	Faible
7	Skeleton de la zone de filtres manquant	UX visuelle	Faible
8	Transition animée skeleton → contenu	UX visuelle	Faible
9	Skeleton count adaptatif	UX visuelle	Faible
10	Scroll to top au changement de page	UX navigation	Faible