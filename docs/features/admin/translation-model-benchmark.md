# Comparatif des modèles de traduction (admin)

Test du 28 octobre 2026 : quel modèle Vercel AI Gateway, éligible au free tier, traduit le mieux
les fiches de l'admin pour le prix le plus bas, face à `openai/gpt-5.4-nano` (modèle actuel).

## Verdict

**Recommandation : `deepseek/deepseek-v3.1`.**

- Meilleur respect de la terminologie officielle française des jeux, de loin.
- Moins cher que nano (−15 % sur le test).
- 11 traductions sur 11 réussies.
- Contrepartie : lent (11 s en moyenne par fiche, contre 5 s pour nano). Sans gêne pour la
  traduction par lot, perceptible pour « Traduire et relire ».

Deuxième choix : `mistral/mistral-large-3`, le français le plus fluide, mais un échec par timeout,
du Markdown inséré dans le texte et un titre officiel traduit à tort.

À écarter : `alibaba/qwen-3-235b` (titres de jeux inventés, 2 timeouts) et
`google/gemini-2.5-flash` (8 fois plus cher que nano à cause des tokens de raisonnement).

## Protocole

- Script : `scripts/dev/benchmark-translation-models.ts`, lecture seule sur la base, rien n'est
  sauvegardé.
- Même code que l'admin : prompt et schéma de `translateFieldsDetailed`
  (`src/lib/services/aiTranslateService.ts`), timeout de 30 s.
- Coût : celui renvoyé par la gateway pour chaque appel (`providerMetadata.gateway.cost`).
- 11 fiches EN → FR : 8 jeux parmi les plus populaires, 3 personnages. Les plateformes et genres
  prévus ont été écartés : aucune fiche anglaise n'avait d'abréviation ou de description.
- Coût total du test : 0,06 $.

## Chiffres

| Modèle | Réussite | Coût des 11 fiches | ≈ 1 000 fiches | Temps moyen | Remarque |
| --- | --- | --- | --- | --- | --- |
| `openai/gpt-5.4-nano` (actuel) | 11/11 | 0,00475 $ | 0,43 $ | 5,2 s | Référence |
| `deepseek/deepseek-v3.1` | 11/11 | 0,00403 $ | 0,37 $ | 11,0 s | Meilleure terminologie |
| `mistral/mistral-large-3` | 10/11 | 0,00561 $ | 0,56 $ | 9,0 s | 1 timeout (Aion 2) |
| `openai/gpt-4.1-mini` | 11/11 | 0,00610 $ | 0,55 $ | 3,7 s | Le plus rapide |
| `alibaba/qwen-3-235b` | 10/11 | 0,00193 $ | 0,19 $ | 16,9 s | 1 timeout, hallucinations |
| `google/gemini-2.5-flash` | 11/11 | 0,03731 $ | 3,39 $ | 6,6 s | 14 389 tokens de sortie (raisonnement) |

Avec les 5 $ mensuels du free tier : environ 13 500 fiches avec DeepSeek, 11 600 avec nano.

## Terminologie officielle

Le point qui départage les modèles : un joueur français reconnaît les noms de sa version du jeu.

| Terme (source EN) | Officiel FR | nano | DeepSeek | Mistral | GPT-4.1 mini | Qwen | Gemini |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Calamity Ganon (Zelda BotW) | Ganon Fléau | Calamity Ganon | Fléau Ganon ≈ | Calamity Ganon | Calamity Ganon | Calamité Ganon | Ganon, la Malice ✗ |
| Wild Hunt (Witcher 3, texte) | la Chasse sauvage | Wild Hunt ✗ | ✓ | ✓ | ✓ | timeout | ✓ |
| Titre « The Witcher 3: Wild Hunt » | inchangé | ✓ | ✓ | ✓ | traduit ✗ | timeout | ✓ |
| Lands Between (Elden Ring) | l'Entre-terre | Terres Intermédiaires ✗ | ✓ | Terres Intermédiaires ✗ | Terres Intermédiaires ✗ | Terres d'Entre ✗ | ✓ |
| Tarnished (Elden Ring) | Sans-éclat | « les Bannis (le Tarnished) » ✗ | ✓ | Éclaté ✗ | Tarnished ✗ | Tarni ✗ | ✓ |
| Mind flayers (Baldur's Gate III) | flagelleurs mentaux | mille-yeux ✗ | ✓ | ✓ | ✓ | Illithides ≈ | illithids ≈ |
| Faerûn (Baldur's Gate III) | Féerûne | Faerûn | Féérune ≈ | Féérune ≈ | Faerûn | Faerûn | Faerûn |
| the Absolute (Baldur's Gate III) | l'Absolu | l'Absolute ✗ | ✓ | ✓ | ✓ | ✓ | l'Absolue ✗ |
| Titre « Minecraft: Java Edition » | inchangé | ✓ | ✓ | traduit ✗ | traduit ✗ | ✓ | ✓ |
| Elyos (Aion) | Élyséens | Élyos | Elyos | timeout | ✓ | Elyos | ✓ |
| Uncharted 3: Drake's Deception | L'Illusion de Drake | inchangé | ✓ | ✓ | inchangé | « L'Arche du destin » ✗ | inchangé |

✓ = terme officiel, ≈ = acceptable, ✗ = faux. Le « Cercle d'Elden » officiel n'a été trouvé par
aucun modèle (« Anneau d'Elden » ou « Elden Ring »).

## Ce que j'en pense

- **DeepSeek V3.1** connaît le mieux les localisations françaises (Entre-terre, Sans-éclat,
  flagelleurs mentaux, L'Illusion de Drake) et ne casse aucun titre. Son français est
  correct, un peu plus littéral que Mistral (« voleuse à louer »). Le seul vrai défaut est la
  lenteur.
- **Mistral Large 3** écrit le français le plus naturel, mais traduit des titres qu'il ne faut pas
  toucher (« Minecraft : Édition Java »), invente des termes (« Éclaté »), ajoute des `*italiques*`
  Markdown qui s'afficheraient tels quels, et a dépassé le timeout une fois.
- **GPT-4.1 mini** est rapide et régulier, mais retraduit lui aussi des titres officiels et laisse
  souvent les termes du jeu en anglais.
- **nano (actuel)** est le plus faible sur la culture jeu vidéo : termes inventés (« mille-yeux »,
  « l'Incendie »), anglais laissé dans le texte, et mélange tutoiement / vouvoiement dans
  Baldur's Gate III.
- **Qwen 3 235B** est le moins cher, mais invente des titres (« Uncharted 2 : Le Syndrome de
  Drake », « L'Héritage perdu ») : rédhibitoire.
- **Gemini 2.5 Flash** traduit bien mais réfléchit trop pour cette tâche : 8 fois le coût de nano.

## Limites

- 11 fiches seulement, presque toutes des jeux très connus : sur des jeux obscurs, tous les modèles
  ont moins de références et l'écart sera plus faible.
- Jugement de la terminologie fait à la main, sur ce que je connais des versions françaises : à
  confirmer sur les termes douteux.
- Free tier : les limites de débit plus basses n'ont pas posé problème ici (appels un par un). Une
  traduction par lot plus rapide pourrait recevoir des 429.
- Le timeout de 30 s était juste pour DeepSeek, Mistral et Qwen sur les longues fiches : relevé
  à 60 s après ce comparatif, en passant à DeepSeek par défaut.

## Traductions complètes

Cliquer sur une fiche pour voir la source et la traduction de chaque modèle.

<details>
<summary><strong>Jeu : Red Dead Redemption 2</strong></summary>

#### Source (EN)

**title**

> Red Dead Redemption 2

**description**

> Red Dead Redemption 2 is the epic tale of outlaw Arthur Morgan and the infamous Van der Linde gang, on the run across America at the dawn of the modern age.

**storyline**

> America, 1899. The end of the wild west era has begun as lawmen hunt down the last remaining outlaw gangs. Those who will not surrender or succumb are killed.
>
> After a robbery goes badly wrong in the western town of Blackwater, Arthur Morgan and the Van der Linde gang are forced to flee. With federal agents and the best bounty hunters in the nation massing on their heels, the gang must rob, steal and fight their way across the rugged heartland of America in order to survive. As deepening internal divisions threaten to tear the gang apart, Arthur must make a choice between his own ideals and loyalty to the gang who raised him.

#### `openai/gpt-5.4-nano` (3.4 s, 0.00040 $)

**title**

> Red Dead Redemption 2

**description**

> Red Dead Redemption 2 raconte l’épopée du hors-la-loi Arthur Morgan et de l’infâme gang Van der Linde, lancés à toute vitesse à travers l’Amérique, à l’aube de l’ère moderne.

**storyline**

> Amérique, 1899. La fin du Far West a commencé : des représentants de la loi traquent les derniers gangs de hors-la-loi encore en activité. Ceux qui ne se rendent pas ou ne plient pas finissent tués.
>
> Après un braquage qui tourne tragiquement mal dans la ville de Blackwater, Arthur Morgan et le gang Van der Linde sont contraints de prendre la fuite. Alors que des agents fédéraux et les meilleurs chasseurs de primes du pays se rapprochent dangereusement, le gang n’a d’autre choix que de voler, dérober et se battre pour traverser le cœur sauvage de l’Amérique et survivre. Mais tandis que les divisions au sein du groupe s’intensifient et menacent de les déchirer, Arthur doit trancher entre ses propres idéaux et sa loyauté envers le gang qui l’a élevé.

#### `mistral/mistral-large-3` (3.8 s, 0.00055 $)

**title**

> Red Dead Redemption 2

**description**

> Red Dead Redemption 2 est l'épopée du hors-la-loi Arthur Morgan et du célèbre gang Van der Linde, en cavale à travers l'Amérique à l'aube de l'ère moderne.

**storyline**

> États-Unis, 1899. La fin de l'ère du Far West commence alors que les forces de l'ordre traquent les derniers gangs de hors-la-loi. Ceux qui refusent de se rendre ou de se soumettre sont éliminés.
>
> Après un braquage qui tourne mal dans la ville occidentale de Blackwater, Arthur Morgan et le gang Van der Linde sont contraints de fuir. Avec les agents fédéraux et les meilleurs chasseurs de primes du pays à leurs trousses, le gang doit voler, piller et se battre à travers les terres sauvages du cœur de l'Amérique pour survivre. Alors que des divisions internes menacent de déchirer le gang, Arthur doit faire un choix entre ses propres idéaux et la loyauté envers le gang qui l'a élevé.

#### `deepseek/deepseek-v3.1` (8.4 s, 0.00036 $)

**title**

> Red Dead Redemption 2

**description**

> Red Dead Redemption 2 raconte l'épopée du hors-la-loi Arthur Morgan et de l'infâme gang Van der Linde, en fuite à travers l'Amérique à l'aube de l'ère moderne.

**storyline**

> Amérique, 1899. La fin de l'ère du Far West commence alors que les forces de l'ordre traquent les derniers gangs de hors-la-loi. Ceux qui ne se rendent pas ou ne succombent pas sont abattus.
>
> Après un braquage qui tourne au désastre dans la ville de Blackwater, Arthur Morgan et le gang Van der Linde sont forcés de prendre la fuite. Poursuivis par des agents fédéraux et les meilleurs chasseurs de primes du pays, le gang doit braquer, voler et se battre à travers le cœur sauvage de l'Amérique pour survivre. Alors que des divisions internes grandissantes menacent de déchirer le gang, Arthur doit faire un choix entre ses propres idéaux et sa loyauté envers la bande qui l'a élevé.

#### `alibaba/qwen-3-235b` (15.7 s, 0.00018 $)

**title**

> Red Dead Redemption 2

**description**

> Red Dead Redemption 2 est l'histoire épique de l'homme hors-la-loi Arthur Morgan et du célèbre gang Van der Linde, en fuite à travers l'Amérique au seuil de l'ère moderne.

**storyline**

> Amérique, 1899. La fin de l'ère du Far West a commencé, alors que les hommes de loi traquent les derniers gangs de hors-la-loi. Ceux qui refusent de se rendre ou de céder sont abattus.
>
> Après un braquage qui tourne mal dans la ville de Blackwater, Arthur Morgan et le gang Van der Linde sont contraints de fuir. Tandis que les agents fédéraux et les meilleurs chasseurs de primes du pays se lancent à leurs trousses, le gang doit voler, piller et se battre pour survivre à travers les régions les plus sauvages de l'Amérique. Alors que des divisions internes menacent de faire éclater le gang, Arthur doit choisir entre ses propres idéaux et sa loyauté envers ceux qui l'ont élevé.

#### `openai/gpt-4.1-mini` (3.1 s, 0.00053 $)

**title**

> Red Dead Redemption 2

**description**

> Red Dead Redemption 2 raconte l'épopée d'Arthur Morgan, hors-la-loi redoutable, et de la célèbre bande Van der Linde, fuyant à travers l’Amérique à l’aube de l’ère moderne.

**storyline**

> Amérique, 1899. La fin de l'époque du Far West sauvage approche, alors que les forces de l'ordre traquent les dernières bandes de hors-la-loi. Ceux qui refusent de se rendre ou de céder sont abattus.
>
> Après un braquage qui tourne mal dans la ville de Blackwater, Arthur Morgan et la bande Van der Linde sont contraints de fuir. Poursuivis par des agents fédéraux et les meilleurs chasseurs de primes du pays, ils doivent voler, combattre et survivre à travers l'Amérique sauvage. Tandis que les divisions internes menacent de briser la bande, Arthur doit choisir entre ses propres idéaux et la loyauté envers la bande qui l’a élevé.

#### `google/gemini-2.5-flash` (7.3 s, 0.00374 $)

**title**

> Red Dead Redemption 2

**description**

> Red Dead Redemption 2 est la saga épique du hors-la-loi Arthur Morgan et du tristement célèbre gang de Van der Linde, en cavale à travers l'Amérique à l'aube de l'ère moderne.

**storyline**

> Amérique, 1899. La fin de l'ère du Far West a commencé, alors que les hommes de loi traquent sans relâche les dernières bandes de hors-la-loi. Ceux qui refusent de se rendre ou de succomber sont impitoyablement abattus.
>
> Suite à un braquage qui tourne mal dans la ville de Blackwater, Arthur Morgan et le gang de Van der Linde sont contraints de fuir. Avec les agents fédéraux et les meilleurs chasseurs de primes du pays à leurs trousses, le gang doit voler, piller et se frayer un chemin à travers le cœur sauvage et impitoyable de l'Amérique pour survivre. Tandis que des divisions internes de plus en plus profondes menacent de déchirer le groupe, Arthur devra faire un choix déchirant entre ses propres idéaux et sa loyauté envers le gang qui l'a élevé.

</details>

<details>
<summary><strong>Jeu : The Legend of Zelda: Breath of the Wild</strong></summary>

#### Source (EN)

**title**

> The Legend of Zelda: Breath of the Wild

**description**

> The Legend of Zelda: Breath of the Wild is the first 3D open-world game in the Zelda series. Link can travel anywhere and be equipped with weapons and armor found throughout the world to grant him various bonuses. Unlike many games in the series, Breath of the Wild does not impose a specific order in which quests or dungeons must be completed. While the game still has environmental obstacles such as weather effects, inhospitable lands, or powerful enemies, many of them can be overcome using the right method. A lot of critics ranked Breath of the Wild as one of the best video games of all time.

**storyline**

> Link is awakened in a room by a voice calling him and learns that he has been asleep for 100 years after failing to stop a monster called Calamity Ganon. Although the monster is being held in Hyrule Castle by Princess Zelda, Calamity Ganon's power continues to grow and if not stopped he will eventually break free with enough power to destroy the entire world. Link embarks on his quest to defeat Calamity Ganon and save Hyrule and Zelda.

#### `openai/gpt-5.4-nano` (3.0 s, 0.00048 $)

**title**

> The Legend of Zelda: Breath of the Wild

**description**

> The Legend of Zelda: Breath of the Wild est le premier jeu d’action-aventure en monde ouvert 3D de la saga Zelda. Link peut explorer librement l’ensemble du monde et s’équiper d’armes et d’armures trouvées un peu partout afin de bénéficier de divers bonus. Contrairement à beaucoup d’autres jeux de la série, Breath of the Wild n’impose aucun ordre précis pour accomplir quêtes et donjons. Même si l’aventure est ponctuée d’obstacles environnementaux comme les effets météo, des terres hostiles ou des ennemis redoutables, la plupart peuvent être surmontés grâce à la bonne méthode. Les critiques ont d’ailleurs souvent classé Breath of the Wild parmi les meilleurs jeux vidéo de tous les temps.

**storyline**

> Link se réveille dans une salle, appelé par une voix, et découvre qu’il a dormi pendant 100 ans après avoir échoué à arrêter une créature nommée Calamity Ganon. Bien que la princesse Zelda maintienne la bête au château d’Hyrule, le pouvoir de Calamity Ganon continue de croître. S’il n’est pas vaincu à temps, il finira par s’échapper avec une force suffisante pour détruire le monde entier. Link se lance alors dans une quête pour terrasser Calamity Ganon et sauver Hyrule et Zelda.

#### `mistral/mistral-large-3` (5.0 s, 0.00059 $)

**title**

> The Legend of Zelda: Breath of the Wild

**description**

> The Legend of Zelda: Breath of the Wild est le premier jeu en 3D en monde ouvert de la série Zelda. Link peut explorer librement le royaume et s'équiper d'armes et d'armures trouvées un peu partout pour bénéficier de divers bonus. Contrairement à beaucoup de jeux de la série, Breath of the Wild ne suit pas un ordre imposé pour les quêtes ou les donjons. Bien que le jeu présente des obstacles environnementaux comme les effets météorologiques, des terres hostiles ou des ennemis redoutables, beaucoup peuvent être surmontés avec la bonne approche. De nombreux critiques ont classé Breath of the Wild parmi les meilleurs jeux vidéo de tous les temps.

**storyline**

> Link se réveille dans une chambre, appelé par une voix mystérieuse, et découvre qu'il a dormi pendant 100 ans après avoir échoué à arrêter un monstre nommé Calamity Ganon. Bien que la créature soit retenue prisonnière dans le château d'Hyrule par la princesse Zelda, son pouvoir ne cesse de grandir et, s'il n'est pas stoppé, il finira par se libérer avec une force suffisante pour détruire le monde entier. Link se lance alors dans une quête épique pour vaincre Calamity Ganon et sauver Hyrule ainsi que Zelda.

#### `deepseek/deepseek-v3.1` (10.9 s, 0.00041 $)

**title**

> The Legend of Zelda: Breath of the Wild

**description**

> The Legend of Zelda: Breath of the Wild est le premier jeu en monde ouvert en 3D de la série Zelda. Link peut voyager partout et s'équiper d'armes et d'armures trouvées à travers le monde pour lui octroyer divers bonus. Contrairement à de nombreux jeux de la série, Breath of the Wild n'impose pas d'ordre spécifique pour accomplir les quêtes ou explorer les donjons. Bien que le jeu comporte encore des obstacles environnementaux comme les effets météorologiques, les terres inhospitalières ou les ennemis puissants, beaucoup peuvent être surmontés en utilisant la bonne méthode. De nombreux critiques ont classé Breath of the Wild parmi les meilleurs jeux vidéo de tous les temps.

**storyline**

> Link est réveillé dans une pièce par une voix qui l'appelle et apprend qu'il a dormi pendant 100 ans après avoir échoué à arrêter un monstre appelé Fléau Ganon. Bien que le monstre soit retenu au château d'Hyrule par la princesse Zelda, le pouvoir de Fléau Ganon continue de croître et, s'il n'est pas arrêté, il finira par se libérer avec assez de puissance pour détruire le monde entier. Link se lance dans sa quête pour vaincre Fléau Ganon et sauver Hyrule et Zelda.

#### `alibaba/qwen-3-235b` (21.6 s, 0.00022 $)

**title**

> The Legend of Zelda: Breath of the Wild

**description**

> The Legend of Zelda: Breath of the Wild est le premier jeu en monde ouvert en 3D de la série Zelda. Link peut explorer librement les terres et s'équiper d'armes et d'armures trouvées dans le monde entier, lui conférant divers bonus. Contrairement à de nombreux épisodes de la série, Breath of the Wild n'impose pas un ordre précis pour accomplir les quêtes ou les donjons. Bien que le jeu comporte des obstacles environnementaux comme les intempéries, les zones hostiles ou les ennemis puissants, la plupart peuvent être surmontés avec la bonne approche. De nombreux critiques ont classé Breath of the Wild parmi les plus grands jeux vidéo de tous les temps.

**storyline**

> Link se réveille dans une pièce, appelé par une voix, et découvre qu'il a été endormi pendant 100 ans après avoir échoué à arrêter une créature nommée Calamité Ganon. Bien que cette dernière soit retenue dans le château d'Hyrule par la princesse Zelda, sa puissance continue de croître, et si rien n'est fait, elle finira par s'échapper avec assez de force pour détruire le monde entier. Link part alors en quête de vaincre la Calamité Ganon et sauver Hyrule ainsi que Zelda.

#### `openai/gpt-4.1-mini` (3.3 s, 0.00066 $)

**title**

> The Legend of Zelda: Breath of the Wild

**description**

> The Legend of Zelda: Breath of the Wild est le premier jeu en monde ouvert en 3D de la série Zelda. Link peut voyager partout et s'équiper d'armes et d'armures trouvées à travers le monde, lui offrant divers bonus. Contrairement à beaucoup de jeux de la série, Breath of the Wild n'impose pas d'ordre précis pour accomplir les quêtes ou les donjons. Bien que le jeu comporte des obstacles environnementaux comme les effets météorologiques, les terres inhospitalières ou des ennemis puissants, beaucoup peuvent être surmontés avec la bonne stratégie. De nombreux critiques considèrent Breath of the Wild comme l'un des meilleurs jeux vidéo de tous les temps.

**storyline**

> Link est réveillé dans une pièce par une voix qui l'appelle et apprend qu'il a dormi pendant 100 ans après avoir échoué à stopper un monstre nommé Calamity Ganon. Bien que ce monstre soit retenu prisonnier dans le château d'Hyrule par la princesse Zelda, la puissance de Calamity Ganon continue de grandir. S'il n'est pas arrêté, il finira par s'échapper avec assez de force pour détruire le monde entier. Link se lance alors dans sa quête pour vaincre Calamity Ganon et sauver Hyrule ainsi que Zelda.

#### `google/gemini-2.5-flash` (7.3 s, 0.00340 $)

**title**

> The Legend of Zelda: Breath of the Wild

**description**

> The Legend of Zelda: Breath of the Wild est le premier jeu en monde ouvert en 3D de la série Zelda. Link peut voyager n'importe où et s'équiper d'armes et d'armures trouvées dans le monde entier pour lui conférer divers bonus. Contrairement à de nombreux jeux de la série, Breath of the Wild n'impose pas d'ordre spécifique pour l'accomplissement des quêtes ou des donjons. Bien que le jeu présente toujours des obstacles environnementaux tels que les effets météorologiques, les terres inhospitalières ou les ennemis puissants, beaucoup d'entre eux peuvent être surmontés en utilisant la bonne méthode. De nombreux critiques ont classé Breath of the Wild parmi les meilleurs jeux vidéo de tous les temps.

**storyline**

> Link est réveillé dans une pièce par une voix l'appelant et apprend qu'il a dormi pendant 100 ans après avoir échoué à arrêter un monstre appelé Ganon, la Malice. Bien que le monstre soit retenu dans le château d'Hyrule par la princesse Zelda, le pouvoir de Ganon, la Malice, ne cesse de croître et, s'il n'est pas arrêté, il finira par se libérer avec suffisamment de puissance pour détruire le monde entier. Link se lance dans sa quête pour vaincre Ganon, la Malice, et sauver Hyrule et Zelda.

</details>

<details>
<summary><strong>Jeu : The Witcher 3: Wild Hunt</strong></summary>

#### Source (EN)

**title**

> The Witcher 3: Wild Hunt

**description**

> The Witcher 3: Wild Hunt is an open-world action role-playing game developed by CD Projekt Red.
>
> Set in a dark fantasy world, the game follows Geralt of Rivia, a monster hunter searching for his adopted daughter, Ciri, while navigating political conflicts and supernatural threats. Gameplay features exploration, combat, character progression, and branching narratives shaped by player choices. Widely acclaimed for its writing, world-building, and depth, it is considered one of the most influential RPGs of its generation.

**storyline**

> The Witcher 3: Wild Hunt concludes the story of the witcher Geralt of Rivia, the series' protagonist, whose story to date has been covered in the previous installments. Geralt's new mission comes in dark times as the mysterious and otherworldly army known as the Wild Hunt invades the Northern Kingdoms, leaving only blood soaked earth and fiery ruin in its wake; and it seems the Witcher is the key to stopping their cataclysmic rampage.

#### `openai/gpt-5.4-nano` (3.5 s, 0.00045 $)

**title**

> The Witcher 3: Wild Hunt

**description**

> The Witcher 3: Wild Hunt est un RPG d’action en monde ouvert développé par CD Projekt Red.
>
> Plongé dans un univers de dark fantasy, le jeu suit Geralt de Riv, un chasseur de monstres à la recherche de sa fille adoptive, Ciri, tout en naviguant entre intrigues politiques et menaces surnaturelles. Au programme : exploration, combat, progression du personnage et récits à embranchements façonnés par les choix du joueur. Très acclamé pour son écriture, son world-building et sa profondeur, le titre est considéré comme l’un des RPG les plus influents de sa génération.

**storyline**

> The Witcher 3: Wild Hunt conclut l’histoire du sorceleur Geralt de Riv, le héros de la saga, dont le destin a déjà été raconté dans les épisodes précédents. Sa nouvelle mission arrive en pleine tourmente : une armée mystérieuse et venue d’un autre monde, connue sous le nom de Wild Hunt, envahit les Royaumes du Nord, ne laissant derrière elle qu’une terre maculée de sang et un chaos embrasé. Et il semble que le sorceleur soit la clé pour stopper la déferlante apocalyptique qui s’annonce.

#### `mistral/mistral-large-3` (4.4 s, 0.00064 $)

**title**

> The Witcher 3: Wild Hunt

**description**

> The Witcher 3: Wild Hunt est un jeu de rôle et d'action en monde ouvert développé par CD Projekt Red. Plongez dans un univers sombre de fantasy où vous incarnez Geralt de Riv, un chasseur de monstres en quête de sa fille adoptive, Ciri, tout en naviguant à travers des conflits politiques et des menaces surnaturelles. Le gameplay allie exploration, combat, progression de personnage et des récits à embranchements façonnés par vos choix. Acclamé pour son écriture, sa construction du monde et sa profondeur, il est considéré comme l'un des RPG les plus influents de sa génération.

**storyline**

> The Witcher 3: Wild Hunt conclut l'histoire du sorceleur Geralt de Riv, protagoniste de la série, dont les aventures ont été racontées dans les opus précédents. Sa nouvelle mission survient en des temps sombres, alors que l'armée mystérieuse et surnaturelle connue sous le nom de la Chasse Sauvage envahit les Royaumes du Nord, ne laissant derrière elle que des terres baignées de sang et des ruines enflammées. Tout porte à croire que le sorceleur est la clé pour arrêter leur marche cataclysmique.

#### `deepseek/deepseek-v3.1` (12.8 s, 0.00039 $)

**title**

> The Witcher 3: Wild Hunt

**description**

> The Witcher 3: Wild Hunt est un jeu de rôle et d'action en monde ouvert développé par CD Projekt Red.
>
> Se déroulant dans un univers de dark fantasy, le jeu suit Geralt de Riv, un chasseur de monstres à la recherche de sa fille adoptive, Ciri, tout en naviguant les conflits politiques et les menaces surnaturelles. Le gameplay propose de l'exploration, du combat, une progression de personnage et des récits bifurquants influencés par les choix du joueur. Acclamé pour son écriture, sa construction du monde et sa profondeur, il est considéré comme l'un des RPG les plus influents de sa génération.

**storyline**

> The Witcher 3: Wild Hunt conclut l'histoire du sorceleur Geralt de Riv, protagoniste de la série, dont le parcours a été narré dans les opus précédents. La nouvelle mission de Geralt survient en des temps sombres, alors que la mystérieuse et surnaturelle armée connue sous le nom de la Chasse sauvage envahit les Royaumes du Nord, ne laissant que terre imbibée de sang et ruines enflammées dans son sillage ; et il semble que le Sorceleur soit la clé pour mettre fin à leur ravage cataclysmique.

#### `alibaba/qwen-3-235b` (échec)

> Échec : Translation timed out after 30s

#### `openai/gpt-4.1-mini` (3.8 s, 0.00063 $)

**title**

> The Witcher 3 : Chasse sauvage

**description**

> The Witcher 3 : Chasse sauvage est un jeu de rôle d'action en monde ouvert développé par CD Projekt Red.
>
> Plongé dans un univers sombre de fantasy, le jeu suit Geralt de Riv, un chasseur de monstres à la recherche de sa fille adoptive, Ciri, tout en naviguant à travers des conflits politiques et des menaces surnaturelles. Le gameplay propose exploration, combat, progression du personnage et récits à embranchements influencés par les choix du joueur. Salué pour son écriture, sa richesse d'univers et sa profondeur, il est considéré comme l'un des RPG les plus influents de sa génération.

**storyline**

> The Witcher 3 : Chasse sauvage conclut l'histoire du sorceleur Geralt de Riv, protagoniste de la série, dont l'aventure a été racontée dans les opus précédents. La nouvelle mission de Geralt débute en des temps sombres, alors qu'une armée mystérieuse et surnaturelle, la Chasse sauvage, envahit les Royaumes du Nord, ne laissant derrière elle que terre ensanglantée et ruines enflammées ; et il semble que le sorceleur soit la clé pour arrêter leur dévastation cataclysmique.

#### `google/gemini-2.5-flash` (5.3 s, 0.00295 $)

**title**

> The Witcher 3: Wild Hunt

**description**

> The Witcher 3: Wild Hunt est un jeu de rôle d'action en monde ouvert, développé par CD Projekt Red.
>
> Plongez dans un monde de dark fantasy où vous incarnez Geralt de Riv, un chasseur de monstres légendaire, lancé à la recherche de sa fille adoptive, Ciri, tout en naviguant entre complots politiques et menaces surnaturelles. Le gameplay propose une exploration riche, des combats dynamiques, une progression de personnage approfondie et des récits à embranchements qui évoluent selon vos choix. Acclamé pour son écriture magistrale, son univers foisonnant et sa profondeur inégalée, il est considéré comme l'un des RPG les plus influents de sa génération.

**storyline**

> The Witcher 3: Wild Hunt clôture l'épopée de Geralt de Riv, le légendaire sorceleur et protagoniste de la série, dont les aventures précédentes ont été contées dans les opus précédents. La nouvelle quête de Geralt survient en des temps sombres : la mystérieuse et surnaturelle armée connue sous le nom de Chasse Sauvage déferle sur les Royaumes du Nord, ne laissant derrière elle que terre souillée de sang et ruines fumantes. Il semblerait que le Sorceleur soit la seule clé pour stopper leur fureur cataclysmique.

</details>

<details>
<summary><strong>Jeu : Elden Ring</strong></summary>

#### Source (EN)

**title**

> Elden Ring

**description**

> Elden Ring is an action RPG developed by FromSoftware and published by Bandai Namco Entertainment, released in February 2022. Directed by Hidetaka Miyazaki, with world-building contributions from novelist George R. R. Martin, the game features an expansive open world called the Lands Between. Players assume the role of a customisable character known as the Tarnished, who must explore this world, battle formidable enemies, and seek to restore the Elden Ring to become the Elden Lord.
>
> The game builds on the challenging gameplay mechanics familiar from the Dark Souls series but introduces a more open-ended structure with vast exploration, dynamic weather, and a day-night cycle. It offers deep lore, complex characters, and an interconnected world filled with secrets, dungeons, and powerful bosses.

**storyline**

> Elden Ring takes place in the Lands Between, a fictional realm over which several demigods rule. It was previously ruled over by the immortal Queen Marika, who acted as keeper of the Elden Ring, a powerful force that manifested itself as the physical concept of order. When Marika shattered the Elden Ring and disappeared, her demigod children began fighting over pieces of the Ring in an event called The Shattering. Each demigod has a shard of the Ring called a Great Rune, which corrupts them with power. In the game, the player character is a Tarnished, one of a group of exiles from the Lands Between who are summoned back after the Shattering. The player must traverse the realm to repair the Elden Ring and become the Elden Lord.

#### `openai/gpt-5.4-nano` (4.0 s, 0.00066 $)

**title**

> Elden Ring

**description**

> Elden Ring est un RPG d’action développé par FromSoftware et édité par Bandai Namco Entertainment, sorti en février 2022. Réalisé par Hidetaka Miyazaki, avec des contributions à la construction du monde signées par le romancier George R. R. Martin, le jeu vous plonge dans un vaste monde ouvert baptisé les Terres Intermédiaires. Vous incarnez un personnage personnalisable, les Bannis (le Tarnished), chargé d’explorer cet univers, d’affronter des ennemis redoutables et de tenter de restaurer l’Elden Ring afin de devenir l’Elden Lord.
>
> Le jeu s’appuie sur les mécaniques de gameplay exigeantes familières de la série Dark Souls, tout en introduisant une structure plus ouverte : exploration massive, météo dynamique et cycle jour/nuit. Il propose une histoire riche, des personnages complexes et un monde interconnecté, truffé de secrets, de donjons et de boss puissants.

**storyline**

> Elden Ring se déroule dans les Terres Intermédiaires, un royaume fictif où plusieurs demi-dieux règnent. Le territoire était auparavant gouverné par la Reine Marika, immortelle, qui agissait en gardienne de l’Elden Ring : une force puissante prenant la forme du concept physique de l’ordre. Lorsque Marika brisa l’Elden Ring et disparut, ses enfants demi-dieux commencèrent à se battre pour récupérer des morceaux de l’artefact lors d’un événement appelé l’Incendie (The Shattering).
>
> Chaque demi-dieu possède un éclat de l’Elden Ring sous forme de Grande Rune, qui le corrompt en lui accordant un pouvoir. Dans le jeu, le personnage du joueur est un Tarnished, issu d’un groupe d’exilés des Terres Intermédiaires, rappelés après l’Incendie. Le joueur doit parcourir le royaume afin de réparer l’Elden Ring et d’accéder au titre d’Elden Lord.

#### `mistral/mistral-large-3` (6.7 s, 0.00083 $)

**title**

> Elden Ring

**description**

> Elden Ring est un RPG d'action développé par FromSoftware et édité par Bandai Namco Entertainment, sorti en février 2022. Réalisé sous la direction d'Hidetaka Miyazaki, avec une contribution à l'univers du jeu par l'écrivain George R. R. Martin, le titre propose un vaste monde ouvert nommé les Terres Intermédiaires. Les joueurs incarnent un personnage personnalisable connu sous le nom d'Éclaté, dont la quête consiste à explorer ce monde, affronter des ennemis redoutables et restaurer l'Anneau d'Elden pour devenir le Seigneur d'Elden.
>
> Le jeu reprend les mécaniques de gameplay exigeantes emblématiques de la série Dark Souls, tout en introduisant une structure plus ouverte avec une exploration étendue, des conditions météorologiques dynamiques et un cycle jour-nuit. Il offre une lore profonde, des personnages complexes et un monde interconnecté regorgeant de secrets, de donjons et de boss puissants.

**storyline**

> Elden Ring se déroule dans les Terres Intermédiaires, un royaume fictif gouverné par plusieurs demi-dieux. Auparavant dirigé par la reine immortelle Marika, gardienne de l'Anneau d'Elden – une force puissante incarnant l'ordre physique –, ce monde sombre dans le chaos lorsque Marika brise l'Anneau et disparaît. Ses enfants demi-dieux se lancent alors dans une guerre sans merci pour s'emparer des fragments de l'Anneau lors d'un événement appelé le Brisement. Chacun d'eux possède un fragment nommé Grande Rune, qui les corrompt par son pouvoir.
> Dans le jeu, le joueur incarne un Éclaté, l'un des exilés des Terres Intermédiaires rappelés après le Brisement. Sa mission : traverser ce royaume déchiré, réparer l'Anneau d'Elden et s'élever au rang de Seigneur d'Elden.

#### `deepseek/deepseek-v3.1` (20.4 s, 0.00056 $)

**title**

> Elden Ring

**description**

> Elden Ring est un jeu de rôle action développé par FromSoftware et édité par Bandai Namco Entertainment, sorti en février 2022. Réalisé par Hidetaka Miyazaki avec des contributions à l'univers par le romancier George R. R. Martin, le jeu propose un vaste monde ouvert appelé l'Entre-Terre. Les joueurs incarnent un personnage personnalisable nommé le Sans-éclat, qui doit explorer ce monde, affronter des ennemis redoutables et tenter de restaurer l'Anneau d'Elden pour devenir le Seigneur d'Elden.
>
> Le jeu reprend les mécaniques de jeu exigeantes propres à la série Dark Souls, mais introduit une structure plus ouverte avec une exploration étendue, une météo dynamique et un cycle jour-nuit. Il offre un lore profond, des personnages complexes et un monde interconnecté rempli de secrets, de donjons et de boss puissants.

**storyline**

> Elden Ring se déroule dans l'Entre-Terre, un royaume fictif gouverné par plusieurs demi-dieux. Il était autrefois dirigé par la Reine Marika l'Immortelle, gardienne de l'Anneau d'Elden, une force puissante qui incarnait le concept physique de l'ordre. Lorsque Marika brisa l'Anneau d'Elden et disparut, ses enfants demi-dieux se disputèrent les fragments de l'Anneau lors d'un événement appelé la Fracture. Chaque demi-dieu possède un éclat de l'Anneau nommé Grande Rune, qui les corrompt par le pouvoir. Dans le jeu, le personnage du joueur est un Sans-éclat, l'un des exilés de l'Entre-Terre rappelés après la Fracture. Le joueur doit traverser le royaume pour réparer l'Anneau d'Elden et devenir le Seigneur d'Elden.

#### `alibaba/qwen-3-235b` (26.6 s, 0.00026 $)

**title**

> Elden Ring

**description**

> Elden Ring est un RPG d'action développé par FromSoftware et publié par Bandai Namco Entertainment, sorti en février 2022. Réalisé par Hidetaka Miyazaki, avec une contribution à l'univers signée par l'écrivain George R. R. Martin, le jeu propose un vaste monde ouvert appelé les Terres d'Entre. Le joueur incarne un personnage personnalisable, connu sous le nom de Tarni, qui doit explorer ce monde, affronter des ennemis redoutables et tenter de restaurer l'Anneau d'Elden afin de devenir le Seigneur d'Elden.

**storyline**

> Elden Ring se déroule dans les Terres d'Entre, un royaume imaginaire autrefois gouverné par la reine immortelle Marika, gardienne de l'Anneau d'Elden — une force puissante incarnant l'ordre. Lorsque Marika brise l'Anneau d'Elden et disparaît, ses enfants demi-dieux s'entre-déchirent pour s'approprier ses fragments dans un événement appelé le Brisement. Chaque demi-dieu possède un fragment de l'Anneau, appelé Grande Rune, qui les corrompt par son pouvoir. Le joueur incarne un Tarni, un banni des Terres d'Entre rappelé après le Brisement. Son destin : parcourir le royaume, restaurer l'Anneau d'Elden et devenir le Seigneur d'Elden.

#### `openai/gpt-4.1-mini` (3.6 s, 0.00069 $)

**title**

> Elden Ring

**description**

> Elden Ring est un RPG d'action développé par FromSoftware et publié par Bandai Namco Entertainment, sorti en février 2022. Sous la direction d'Hidetaka Miyazaki et avec la contribution à l'univers du romancier George R. R. Martin, le jeu propose un vaste monde ouvert appelé les Terres Intermédiaires. Les joueurs incarnent un personnage personnalisable, le Tarnished, qui doit explorer ce monde, affronter des ennemis redoutables et restaurer l'Elden Ring pour devenir le Seigneur d'Elden.

**storyline**

> Elden Ring se déroule dans les Terres Intermédiaires, un royaume fictif gouverné par plusieurs semi-dieux. Il était autrefois dirigé par l'immortelle reine Marika, gardienne de l'Elden Ring, une force puissante incarnant l'ordre. Lorsque Marika a brisé l'Elden Ring puis disparu, ses enfants semi-dieux se sont disputés les fragments du Ring lors d'un événement appelé la Fracture. Chaque semi-dieu possède un éclat appelé une Grande Rune, qui les corrompt par le pouvoir. Le joueur incarne un Tarnished, un exilé des Terres Intermédiaires rappelé après la Fracture. Il doit parcourir ce royaume, réparer l'Elden Ring et devenir le Seigneur d'Elden.

#### `google/gemini-2.5-flash` (8.1 s, 0.00394 $)

**title**

> Elden Ring

**description**

> Elden Ring est un Action-RPG développé par FromSoftware et édité par Bandai Namco Entertainment, sorti en février 2022. Réalisé par Hidetaka Miyazaki, avec des contributions à la construction de l'univers par l'auteur George R. R. Martin, le jeu propose un vaste monde ouvert nommé l'Entre-Terre. Les joueurs incarnent un personnage personnalisable, le Sans-éclat, qui doit explorer ce monde, affronter des ennemis redoutables et chercher à restaurer l'Elden Ring pour devenir le Seigneur d'Elden.
>
> Le jeu s'appuie sur les mécaniques de gameplay exigeantes bien connues de la série Dark Souls, mais introduit une structure plus ouverte, offrant une exploration vaste, une météo dynamique et un cycle jour-nuit. Il propose un lore profond, des personnages complexes et un monde interconnecté rempli de secrets, de donjons et de boss surpuissants.

**storyline**

> L'histoire d'Elden Ring se déroule dans l'Entre-Terre, un royaume fictif dominé par plusieurs demi-dieux. Auparavant, il était dirigé par la reine immortelle Marika, gardienne de l'Elden Ring, une force puissante qui se manifestait comme le concept physique de l'ordre. Lorsque Marika brisa l'Elden Ring et disparut, ses enfants demi-dieux commencèrent à se battre pour les fragments de l'Anneau lors d'un événement appelé la Dislocation. Chaque demi-dieu possède un fragment de l'Anneau, une Grande Rune, qui le corrompt avec son pouvoir. Dans le jeu, le personnage jouable est un Sans-éclat, l'un des exilés de l'Entre-Terre rappelés après la Dislocation. Le joueur doit traverser le royaume pour réparer l'Elden Ring et devenir le Seigneur d'Elden.

</details>

<details>
<summary><strong>Jeu : Baldur's Gate III</strong></summary>

#### Source (EN)

**title**

> Baldur's Gate III

**description**

> An ancient evil has returned to Baldur's Gate, intent on devouring it from the inside out. The fate of Faerun lies in your hands. Alone, you may resist. But together, you can overcome.

**storyline**

> The land of Faerûn is in turmoil. Refugees cross the wilds, fleeing the helltorn stronghold of Elturel. A vicious cult marches across the Sword Coast, uniting every race of monsters and men under the banner of a cryptic god they call the Absolute. Chaos strikes at Faerûn's foundations, and none may escape its talons. Not even you.
>
> The grotesque nautiloid ship appears out of nowhere, blotting out the sun. Its writhing tentacles snatch you from where you stand. The mind flayers have come, imprisoning you on their ship, infecting you with their horrid parasite. You will become one of them.
>
> By fate or fortune, you survive when the nautiloid crashes in the Sword Coast outlands. You set out for civilisation, desperate for a cure for the parasite festering in your brain, only to take centre stage in a conspiracy that runs as deep as the Nine Hells. New enemies await.
>
> As for old foes... the shadows stir.
> And all roads lead to the legendary city of Baldur's Gate.

#### `openai/gpt-5.4-nano` (3.7 s, 0.00062 $)

**title**

> Baldur's Gate III

**description**

> Un mal ancien est de retour à Baldur’s Gate. Il a pour objectif de la dévorer de l’intérieur. Le destin de Faerûn est entre tes mains. Seul, tu peux résister. Mais ensemble, vous pouvez vaincre.

**storyline**

> Le pays de Faerûn est en proie au chaos. Des réfugiés traversent les terres sauvages, fuyant la forteresse d’Elturel, ravagée par les enfers. Une secte impitoyable déferle sur la Côte des Épées, unissant toutes les races de monstres et d’hommes sous la bannière d’un dieu énigmatique qu’ils nomment l’Absolute.
>
> Le chaos frappe les fondations mêmes de Faerûn, et personne ne pourra échapper à ses griffes. Pas même toi.
>
> Le navire nautiloïde, monstrueux, surgit de nulle part, occultant le soleil. Ses tentacules qui se tordent t’arrachent à ta position. Les mille-yeux sont là : ils t’enferment sur leur vaisseau et t’infectent avec leur parasite abominable. Tu deviendras l’un d’eux.
>
> Par le destin — ou par chance — tu survis quand le nautiloïde s’écrase dans les terres sauvages de la Côte des Épées. Tu te mets en route vers la civilisation, désespéré à la recherche d’un remède pour ce parasite qui te ronge le cerveau, pour te retrouver au cœur d’une conspiration qui s’enfonce aussi loin que les Neuf Enfers. De nouveaux ennemis t’attendent.
>
> Quant aux anciens adversaires… les ombres s’agitent.
> Et toutes les routes mènent à la légendaire ville de Baldur’s Gate.

#### `mistral/mistral-large-3` (20.7 s, 0.00082 $)

**title**

> Baldur's Gate III

**description**

> Un mal ancien est de retour à Portes de Baldur, déterminé à le dévorer de l'intérieur. Le destin de Féérune repose entre vos mains. Seul, vous pourriez résister. Mais ensemble, vous pouvez triompher.

**storyline**

> Les terres de Féérune sont en proie au chaos. Des réfugiés traversent les étendues sauvages, fuyant la forteresse ravagée par les enfers d'Elturel. Une secte impitoyable parcourt la Côte des Épées, unissant toutes les races de monstres et d'hommes sous la bannière d'un dieu mystérieux qu'ils appellent l'Absolu. Le chaos frappe aux fondements de Féérune, et personne ne peut échapper à ses griffes. Pas même vous.
>
> Le vaisseau nautiloïde grotesque apparaît de nulle part, obscurcissant le soleil. Ses tentacules frémissants vous arrachent à l'endroit où vous vous tenez. Les flagelleurs mentaux sont là, vous emprisonnant à bord de leur vaisseau, vous infectant avec leur parasite abominable. Vous allez devenir l'un des leurs.
>
> Par un coup du sort ou de la chance, vous survivez lorsque le nautiloïde s'écrase dans les terres sauvages de la Côte des Épées. Vous vous dirigez vers la civilisation, désespéré de trouver un remède au parasite qui ronge votre cerveau, pour vous retrouver au cœur d'une conspiration aussi profonde que les Neuf Enfers. De nouveaux ennemis vous attendent.
>
> Quant aux anciens ennemis... les ombres s'agitent.
> Et toutes les routes mènent à la légendaire cité de Portes de Baldur.

#### `deepseek/deepseek-v3.1` (17.9 s, 0.00051 $)

**title**

> Baldur's Gate III

**description**

> Un mal ancestral est de retour à Baldur's Gate, déterminé à le dévorer de l'intérieur. Le sort de Féérune repose entre vos mains. Seul, vous pourriez résister. Mais ensemble, vous triompherez.

**storyline**

> La terre de Féérune est en pleine tourmente. Des réfugiés traversent les contrées sauvages, fuyant la forteresse dévastée d'Elturel. Un culte vicieux déferle sur la Côte des Épées, unissant toutes les races de monstres et d'humains sous la bannière d'un dieu énigmatique qu'ils nomment l'Absolu. Le chaos frappe aux fondations de Féérune, et nul n'échappe à ses griffes. Pas même vous.
>
> Le vaisseau nautiloïde grotesque apparaît de nulle part, obscurcissant le soleil. Ses tentacules tortueux vous arrachent à votre position. Les flagelleurs mentaux sont arrivés, vous emprisonnant à bord de leur vaisseau, vous infectant de leur horrible parasite. Vous deviendrez l'un des leurs.
>
> Par le destin ou la fortune, vous survivez lorsque le nautiloïde s'écrase dans les terres sauvages de la Côte des Épées. Vous partez en quête de civilisation, désespéré de trouver un remède au parasite qui ronge votre cerveau, pour finalement vous retrouver au cœur d'une conspiration aussi profonde que les Neuf Enfers. De nouveaux ennemis vous attendent.
>
> Quant aux anciens adversaires... les ombres s'agitent.
> Et toutes les routes mènent à la cité légendaire de Baldur's Gate.

#### `alibaba/qwen-3-235b` (20.2 s, 0.00028 $)

**title**

> Baldur's Gate III

**description**

> Un ancien mal est de retour à Baldur's Gate, bien décidé à la dévorer de l'intérieur. Le sort de Faerûn est entre vos mains. Seul, vous pourrez résister. Ensemble, vous pouvez triompher.

**storyline**

> Le royaume de Faerûn est plongé dans le chaos. Des réfugiés errent à travers les terres sauvages, fuyant la forteresse maudite d'Elturel. Une sinistre secte progresse le long de la Côte des Épées, rassemblant sous l'emblème d'un dieu mystérieux appelé l'Absolu, hommes et monstres de toutes races. Le chaos frappe aux fondations de Faerûn, et nul ne peut lui échapper. Pas même vous.
>
> Soudain, un gigantesque vaisseau nautiloïde apparaît, occultant le soleil. Ses tentacules grouillants vous arrachent du sol. Les Illithides sont arrivés. Ils vous emprisonnent à bord de leur navire et vous infectent avec un parasite abominable. Vous deviendrez l'un d'entre eux.
>
> Par destin ou par chance, vous survivez à la chute du nautiloïde dans les terres sauvages de la Côte des Épées. Vous partez alors vers la civilisation, désespéré de trouver un remède au parasite qui pullule dans votre cerveau, mais vous vous retrouvez bientôt au cœur d'une conspiration aussi profonde que les Neufs Enfers. De nouveaux ennemis vous attendent.
>
> Quant aux anciens adversaires... les ombres s'agitent.
> Et tous les chemins mènent à la légendaire cité de Baldur's Gate.

#### `openai/gpt-4.1-mini` (3.5 s, 0.00082 $)

**title**

> Baldur's Gate III

**description**

> Un mal ancien est revenu à Baldur's Gate, prêt à la dévorer de l'intérieur. Le destin de Faerûn repose entre vos mains. Seul, vous pouvez résister. Mais ensemble, vous pouvez triompher.

**storyline**

> La terre de Faerûn est en proie au chaos. Des réfugiés traversent les contrées sauvages, fuyant la forteresse dévastée d'Elturel. Un culte féroce déferle sur la Côte des Épées, unissant toutes les races de monstres et d'hommes sous la bannière d'un dieu énigmatique qu'ils appellent l'Absolu. Le chaos frappe au cœur de Faerûn, et nul ne peut échapper à ses griffes. Pas même vous.
>
> Le grotesque vaisseau nautiloïde surgit de nulle part, occultant le soleil. Ses tentacules ondulants vous attrapent là où vous vous tenez. Les flagelleurs mentaux sont venus, vous emprisonnant à bord, vous infectant avec leur horrible parasite. Vous deviendrez l'un d'eux.
>
> Par destin ou chance, vous survivez au crash du nautiloïde dans les terres sauvages de la Côte des Épées. Vous partez à la recherche de la civilisation, désespéré de trouver un remède à ce parasite qui gangrène votre esprit, pour finalement vous retrouver au cœur d'une conspiration aussi profonde que les Neuf Enfers. De nouveaux ennemis vous attendent.
>
> Quant aux vieux adversaires... les ombres s'éveillent.
> Et tous les chemins mènent à la légendaire cité de Baldur's Gate.

#### `google/gemini-2.5-flash` (8.3 s, 0.00414 $)

**title**

> Baldur's Gate III

**description**

> Un mal ancestral est revenu à Baldur's Gate, déterminé à la dévorer de l'intérieur. Le destin de Faerûn repose entre vos mains. Seul, vous pourriez résister. Mais ensemble, vous pouvez triompher.

**storyline**

> Les terres de Faerûn sont en plein tumulte. Des réfugiés traversent les contrées sauvages, fuyant la forteresse dévastée d'Elturel. Un culte vicieux marche le long de la Côte des Épées, unissant chaque race de monstres et d'hommes sous la bannière d'un dieu cryptique qu'ils appellent l'Absolue. Le chaos frappe aux fondations de Faerûn, et nul ne peut échapper à ses griffes. Pas même vous.
>
> Le grotesque vaisseau nautiloïde apparaît de nulle part, obscurcissant le soleil. Ses tentacules grouillantes vous arrachent là où vous vous tenez. Les illithids sont arrivés, vous emprisonnant sur leur vaisseau, vous infectant de leur horrible parasite. Vous deviendrez l'un d'eux.
>
> Par le destin ou la fortune, vous survivez lorsque le nautiloïde s'écrase dans les confins de la Côte des Épées. Vous partez en quête de civilisation, désespéré de trouver un remède au parasite qui ronge votre cerveau, pour vous retrouver au cœur d'une conspiration aussi profonde que les Neuf Enfers. De nouveaux ennemis vous attendent.
>
> Quant aux anciens ennemis... les ombres s'agitent.
> Et toutes les routes mènent à la légendaire cité de Baldur's Gate.

</details>

<details>
<summary><strong>Jeu : Minecraft: Java Edition</strong></summary>

#### Source (EN)

**title**

> Minecraft: Java Edition

**description**

> Minecraft focuses on allowing the player to explore, interact with, and modify a dynamically generated map made of one-cubic-meter-sized blocks. In addition to blocks, the environment features plants, mobs, and items. Some activities in the game include mining for ore, fighting hostile mobs, and crafting new blocks and tools by gathering various resources found in the game. The game's open-ended model allows players to create structures, creations, and artwork on various multiplayer servers or their single-player maps. Other features include redstone circuits for logic computations and remote actions, minecarts and tracks, and a mysterious underworld called the Nether. A designated but completely optional goal of the game is to travel to a dimension called the End, and defeat the ender dragon.

**storyline**

> Minecraft: Java Edition (previously known as Minecraft) is the original version of Minecraft, developed by Mojang Studios for Windows, macOS, and Linux. Notch began development on May 10, 2009, publicly releasing early builds of Minecraft on May 17, 2009. The full release of the game was on November 18, 2011, at MINECON 2011.

#### Actuellement en base (FR)

**title**

> Minecraft: Java Edition

**description**

> Minecraft permet au joueur d'explorer, d'interagir avec et de modifier une carte générée dynamiquement, composée de blocs d'un mètre cube. En plus des blocs, l'environnement comprend des plantes, des créatures et des objets. Parmi les activités du jeu : miner des minerais, combattre des créatures hostiles et fabriquer de nouveaux blocs et outils en collectant diverses ressources trouvées dans le jeu. Le modèle ouvert du jeu permet aux joueurs de créer des structures, des constructions et des œuvres d'art sur divers serveurs multijoueurs ou sur leurs cartes en solo. Parmi les autres fonctionnalités : les circuits de redstone pour les calculs logiques et les actions à distance, les wagonnets et les rails, ainsi qu'un mystérieux monde souterrain appelé le Nether. Un objectif désigné mais totalement optionnel du jeu est de se rendre dans une dimension appelée l'End et d'y vaincre le dragon de l'End.

#### `openai/gpt-5.4-nano` (3.6 s, 0.00051 $)

**title**

> Minecraft : Java Edition

**description**

> Minecraft met l’accent sur la liberté de parcourir, d’interagir et de modifier une carte générée de manière dynamique, composée de blocs d’un mètre cube. En plus des blocs, l’environnement regorge de plantes, de mobs et d’objets. Parmi les activités du jeu, on retrouve l’extraction de minerais, l’affrontement de créatures hostiles, ainsi que la création de nouveaux blocs et outils en rassemblant diverses ressources disponibles dans le monde. Son approche ouverte permet aux joueurs de bâtir des structures, des créations et même des œuvres d’art sur différents serveurs multijoueur — ou sur leurs cartes solo. Parmi les autres fonctionnalités : des circuits de redstone pour effectuer des calculs logiques et déclencher des actions à distance, des wagonnets et leurs rails, ainsi qu’un monde souterrain mystérieux appelé le Nether. Un objectif précis, mais totalement optionnel, consiste à se rendre dans une dimension nommée l’End et à vaincre le dragon de l’End.

**storyline**

> Minecraft : Java Edition (auparavant connu sous le nom de Minecraft) est la version originale de Minecraft, développée par Mojang Studios sur Windows, macOS et Linux. Notch a commencé le développement le 10 mai 2009, avant une publication publique de premières versions de Minecraft dès le 17 mai 2009. La sortie complète du jeu a eu lieu le 18 novembre 2011, lors de la MINECON 2011.

#### `mistral/mistral-large-3` (23.9 s, 0.00074 $)

**title**

> Minecraft : Édition Java

**description**

> Minecraft met l'accent sur l'exploration, l'interaction et la modification d'une carte générée dynamiquement, composée de blocs d'un mètre cube. En plus des blocs, l'environnement comprend des plantes, des créatures (mobs) et des objets. Parmi les activités du jeu, on trouve l'extraction de minerais, le combat contre des mobs hostiles et la fabrication de nouveaux blocs et outils en collectant diverses ressources. Le modèle ouvert du jeu permet aux joueurs de créer des structures, des œuvres d'art et des constructions sur différents serveurs multijoueurs ou sur leurs propres cartes en solo. D'autres fonctionnalités incluent les circuits de redstone pour les calculs logiques et les actions à distance, les wagonnets et les rails, ainsi qu'un monde souterrain mystérieux appelé le Nether. Un objectif facultatif mais bien défini du jeu est de se rendre dans une dimension appelée l'End pour y affronter le dragon Ender.

**storyline**

> Minecraft : Édition Java (anciennement connu sous le nom de Minecraft) est la version originale de Minecraft, développée par Mojang Studios pour Windows, macOS et Linux. Notch a commencé le développement le 10 mai 2009, publiant les premières versions publiques de Minecraft le 17 mai 2009. La version complète du jeu est sortie le 18 novembre 2011 lors du MINECON 2011.

#### `deepseek/deepseek-v3.1` (14.2 s, 0.00042 $)

**title**

> Minecraft: Java Edition

**description**

> Minecraft permet aux joueurs d'explorer, d'interagir avec et de modifier une carte générée dynamiquement composée de blocs d'un mètre cube. En plus des blocs, l'environnement comprend des plantes, des créatures (mobs) et des objets. Les activités incluent l'extraction de minerais, le combat contre des créatures hostiles et la fabrication de nouveaux blocs et outils en collectant diverses ressources. Le modèle ouvert du jeu permet aux joueurs de créer des structures, des œuvres et des réalisations artistiques sur des serveurs multijoueurs ou leurs cartes en solo. D'autres fonctionnalités incluent les circuits de redstone pour les calculs logiques et les actions à distance, les wagonnets et rails, ainsi qu'un monde souterrain mystérieux appelé le Nether. Un objectif désigné mais totalement optionnel est de voyager vers une dimension appelée l'End et de vaincre le dragon de l'End.

**storyline**

> Minecraft: Java Edition (anciennement connu sous le nom de Minecraft) est la version originale de Minecraft, développée par Mojang Studios pour Windows, macOS et Linux. Notch a commencé le développement le 10 mai 2009, en publiant publiquement les premières versions de Minecraft le 17 mai 2009. La sortie complète du jeu a eu lieu le 18 novembre 2011, lors de la MINECON 2011.

#### `alibaba/qwen-3-235b` (21.4 s, 0.00025 $)

**title**

> Minecraft: Java Edition

**description**

> Minecraft met l'accent sur la liberté du joueur d'explorer, d'interagir avec et de modifier une carte générée de manière dynamique, composée de blocs d'un mètre cube. En plus des blocs, l'environnement inclut des plantes, des créatures (mobs) et des objets. Parmi les activités proposées, on trouve l'exploitation minière pour extraire des minerais, le combat contre des créatures hostiles, ainsi que la création de nouveaux blocs et outils en récoltant diverses ressources présentes dans le jeu. Le modèle ouvert du jeu permet aux joueurs de construire des structures, des œuvres et des créations artistiques sur des serveurs multijoueurs ou sur leurs cartes en solo. D'autres fonctionnalités incluent les circuits redstone pour les calculs logiques et les actions à distance, les wagonnets et les rails, ainsi qu'un mystérieux monde souterrain appelé le Nether. Un objectif désigné, totalement optionnel, consiste à voyager vers une dimension appelée l'End et à vaincre le dragon de l'End.

**storyline**

> Minecraft: Java Edition (auparavant connu sous le nom de Minecraft) est la version originale de Minecraft, développée par Mojang Studios pour Windows, macOS et Linux. Notch a commencé le développement le 10 mai 2009 et a publié publiquement les premières versions le 17 mai 2009. La sortie complète du jeu a eu lieu le 18 novembre 2011 lors de la MINECON 2011.

#### `openai/gpt-4.1-mini` (4.5 s, 0.00066 $)

**title**

> Minecraft : Édition Java

**description**

> Minecraft invite les joueurs à explorer, interagir et transformer une carte générée de manière dynamique, composée de blocs d’un mètre cube. En plus des blocs, l’environnement regorge de plantes, créatures, et objets. Les activités incluent l’extraction de minerais, le combat contre des créatures hostiles, et la fabrication de nouveaux blocs et outils en récoltant diverses ressources. Le modèle ouvert du jeu permet aux joueurs de construire des structures, créations et œuvres d'art sur différents serveurs multijoueurs ou dans leurs mondes solo. Parmi les fonctionnalités, on trouve des circuits de redstone pour réaliser des calculs logiques et actions à distance, des chariots sur rails, ainsi qu’un mystérieux monde souterrain appelé le Nether. Un objectif optionnel désigné est de voyager vers une dimension appelée l’End et de vaincre le dragon de l’End.

**storyline**

> Minecraft : Édition Java (précédemment connu sous le nom de Minecraft) est la version originale développée par Mojang Studios pour Windows, macOS et Linux. Notch a commencé le développement le 10 mai 2009, avec une première version publique sortie le 17 mai 2009. La sortie complète du jeu a eu lieu le 18 novembre 2011 lors de la MINECON 2011.

#### `google/gemini-2.5-flash` (6.6 s, 0.00373 $)

**title**

> Minecraft: Java Edition

**description**

> Minecraft vous plonge dans un monde où vous êtes libre d'explorer, d'interagir et de remodeler une carte générée dynamiquement, entièrement constituée de blocs d'un mètre cube. Au-delà des blocs, l'environnement regorge de plantes, de créatures (mobs) et d'objets à découvrir. Vos aventures peuvent vous mener à extraire du minerai, à affronter des hordes hostiles ou à forger de nouveaux blocs et outils en collectant les innombrables ressources du jeu. Grâce à son modèle ouvert, Minecraft vous invite à bâtir des structures grandioses, des créations ingénieuses et des œuvres d'art, que ce soit sur des serveurs multijoueurs animés ou sur vos propres mondes solo. Le jeu propose également des circuits de redstone pour des logiques complexes et des actions à distance, des wagons et des rails, sans oublier un mystérieux monde souterrain : le Nether. Et si le cœur vous en dit, un objectif (totalement facultatif !) vous attend : vous aventurer dans la dimension de l'End pour y affronter et vaincre l'Ender Dragon.

**storyline**

> Minecraft: Java Edition (précédemment connu sous le nom de Minecraft) est la version originale de Minecraft, développée par Mojang Studios pour Windows, macOS et Linux. Notch a commencé le développement le 10 mai 2009, rendant publiques les premières versions de Minecraft le 17 mai 2009. La version complète du jeu est sortie le 18 novembre 2011, lors de la MINECON 2011.

</details>

<details>
<summary><strong>Jeu : Aion 2</strong></summary>

#### Source (EN)

**title**

> Aion 2

**description**

> Aion 2 takes place 200 years after the PC game, Aion: The Tower of Eternity.
>  One main feature is the appearance of dimensional cracks, allowing players from different servers to engage in large-scale PVP. Gliding and wings will no doubt be there as the IP’s signature element. NCsoft even claimed Aion 2 will have features which could not be realized in the PC game, and that its vision for the game is “no longer a dream”. Such big lofty words.
>  Perhaps the biggest difference is that there are no longer the 2 opposing factions, Elyos and Asmodians (due to the timeline). Players are free to choose to invade others of defend. Another eye-opener is the claim of not having “class segmentation” in Aion 2, with players able to wield different weapons without restrictions and choose their playstyle. NCsoft claims that Aion 2 will “showcase a new battle system that did not exist in the old Aion”.
>  Finally, another huge change is the removal of gliding constraints found in Aion. While this was not explained in detail, NCsoft is aiming to make gliding part of the combat loop to create a “three dimensional battle system”. NCsoft did not mention what engine Aion 2 is developed on, but my guess is Unreal Engine 5. Stay tuned for more updates on the game!

#### `openai/gpt-5.4-nano` (4.9 s, 0.00058 $)

**title**

> Aion 2

**description**

> Aion 2 se déroule 200 ans après le jeu PC, Aion : The Tower of Eternity.
>
> Le gros point fort, ce sont les fissures dimensionnelles apparues dans le jeu, qui permettront aux joueurs de différents serveurs de se lancer dans des affrontements PvP massifs. Le vol en deltaplane et les ailes seront très probablement de la partie, comme élément signature de la licence. D’ailleurs, NCsoft a même affirmé qu’Aion 2 inclurait des fonctionnalités impossibles à réaliser sur la version PC, avec une vision du jeu qui n’est plus “un rêve”. De grandes promesses.
>
> La différence la plus marquante, c’est qu’il n’y a plus les deux factions opposées, les Élyos et les Asmodiens (à cause de la chronologie). Les joueurs pourront choisir librement d’envahir les autres ou de les défendre. Autre surprise : l’annonce qu’il n’y aurait pas de “segmentation des classes” dans Aion 2. Résultat : les joueurs pourront manier différentes armes sans restrictions et choisir leur style de jeu. NCsoft indique également qu’Aion 2 “mettra en avant un nouveau système de combat qui n’existait pas dans l’ancien Aion”.
>
> Enfin, changement majeur : la suppression des contraintes liées au vol qu’on trouvait dans Aion. Sans explications très détaillées, NCsoft vise à intégrer le vol directement dans la boucle de combat pour créer un “système de bataille en trois dimensions”. NCsoft n’a pas précisé sur quel moteur Aion 2 est développé, mais mon pari, c’est Unreal Engine 5. Restez aux aguets pour plus de mises à jour sur le jeu !

#### `mistral/mistral-large-3` (échec)

> Échec : Translation timed out after 30s

#### `deepseek/deepseek-v3.1` (12.0 s, 0.00051 $)

**title**

> Aion 2

**description**

> Aion 2 se déroule 200 ans après le jeu PC, Aion : The Tower of Eternity.
>
> L'une des principales caractéristiques est l'apparition de fissures dimensionnelles, permettant aux joueurs de différents serveurs de s'engager dans des combats PVP à grande échelle. Le vol plané et les ailes seront sans aucun doute présents en tant qu'élément emblématique de la franchise. NCsoft a même affirmé qu'Aion 2 inclura des fonctionnalités qui n'ont pas pu être réalisées dans le jeu PC, et que sa vision pour le jeu est « ce n'est plus un rêve ». De bien grandes déclarations !
>
> Peut-être la plus grande différence est l'absence des deux factions opposées, les Elyos et les Asmodiens (en raison de la chronologie). Les joueurs sont libres de choisir d'envahir ou de défendre. Un autre élément frappant est l'affirmation qu'il n'y aura pas de « segmentation de classes » dans Aion 2, les joueurs pouvant manier différentes armes sans restrictions et choisir leur style de jeu. NCsoft prétend qu'Aion 2 « présentera un nouveau système de combat qui n'existait pas dans l'ancien Aion ».
>
> Enfin, un autre changement majeur est la suppression des contraintes de vol plané présentes dans Aion. Bien que cela n'ait pas été expliqué en détail, NCsoft vise à intégrer le vol plané dans la boucle de combat pour créer un « système de combat tridimensionnel ». NCsoft n'a pas mentionné sur quel moteur Aion 2 est développé, mais mon intuition penche pour Unreal Engine 5. Restez à l'écoute pour plus d'actualités sur le jeu !

#### `alibaba/qwen-3-235b` (20.8 s, 0.00027 $)

**title**

> Aion 2

**description**

> Aion 2 se déroule 200 ans après le jeu PC Aion : The Tower of Eternity. L'une des principales nouveautés est l'apparition de failles dimensionnelles, permettant aux joueurs de serveurs différents de s'affronter dans des combats JcJ à grande échelle. Le vol plané et les ailes seront évidemment présents, fidèles à l'univers emblématique de la série. NCsoft affirme même que Aion 2 inclura des fonctionnalités impossibles à réaliser dans le jeu PC, et que sa vision pour ce titre « n'est plus un rêve ». De grandes promesses. Peut-être la différence la plus marquante est l'absence des deux factions opposées Elyos et Asmodians (en raison de la chronologie). Les joueurs sont désormais libres de choisir s'ils veulent envahir ou défendre. Autre surprise : l'absence annoncée de « segmentation des classes » dans Aion 2, permettant aux joueurs d'utiliser différentes armes sans restriction et de choisir librement leur style de jeu. NCsoft affirme que Aion 2 « présentera un nouveau système de combat inexistant dans l'ancien Aion ». Enfin, un autre changement majeur concerne la suppression des limitations du vol plané présentes dans Aion. Bien que peu détaillé, NCsoft vise à intégrer le vol au cœur des combats, créant ainsi un « système de combat en trois dimensions ». NCsoft n'a pas précisé le moteur utilisé pour Aion 2, mais on peut supposer qu'il s'agit de l'Unreal Engine 5. Restez à l'écoute pour plus d'actualités sur le jeu !

#### `openai/gpt-4.1-mini` (4.6 s, 0.00075 $)

**title**

> Aion 2

**description**

> Aion 2 se déroule 200 ans après le jeu PC original, Aion : La Tour de l’Éternité.
>
> Une des principales nouveautés est l’apparition de failles dimensionnelles, permettant aux joueurs de serveurs différents de s'affronter dans des batailles PVP de grande envergure. Le vol plané et les ailes seront bien sûr présents, éléments emblématiques de la licence. NCsoft affirme même que Aion 2 proposera des fonctionnalités inédites impossibles à réaliser dans le jeu PC, et que leur vision pour ce titre « n’est plus un rêve ». De grandes ambitions !
>
> Peut-être la différence la plus marquante est la disparition des deux factions rivales, les Élyséens et les Asmodiens, à cause de la nouvelle chronologie. Les joueurs seront libres de choisir entre invasion ou défense. Autre innovation majeure : l’absence de « segmentation des classes » ; les joueurs pourront manier différentes armes sans restrictions et définir leur style de jeu eux-mêmes. NCsoft annonce un « tout nouveau système de combat » jamais vu dans l’ancien Aion.
>
> Enfin, un changement important est la suppression des contraintes liées au vol plané présentes dans Aion. Bien que peu détaillée, cette modification vise à intégrer le vol dans le cycle de combat pour créer un « système de combat tridimensionnel ». NCsoft n’a pas précisé le moteur utilisé, mais on imagine qu’il s’agit d’Unreal Engine 5. Restez connectés pour ne rien manquer des prochaines infos sur ce titre !

#### `google/gemini-2.5-flash` (7.1 s, 0.00394 $)

**title**

> Aion 2

**description**

> Aion 2 se déroule 200 ans après l'opus PC, Aion: The Tower of Eternity. L'une de ses principales caractéristiques est l'apparition de failles dimensionnelles, permettant aux joueurs de différents serveurs de s'affronter dans des batailles JcJ (Joueur contre Joueur) massives. Le vol plané et les ailes seront sans aucun doute de la partie, en tant qu'élément emblématique de la licence. NCsoft a même affirmé qu'Aion 2 intégrera des fonctionnalités impossibles à réaliser dans le jeu PC original, et que sa vision du jeu n'est « plus un rêve ». De bien grandes promesses ! La plus grande différence est peut-être l'absence des deux factions opposées, les Élyséens et les Asmodiens (en raison de la chronologie). Les joueurs sont libres de choisir d'envahir d'autres joueurs ou de défendre. Autre révélation surprenante : la suppression de la « segmentation par classe » dans Aion 2. Les joueurs pourront manier différentes armes sans restrictions et choisir leur propre style de jeu. NCsoft assure qu'Aion 2 « présentera un nouveau système de combat qui n'existait pas dans l'ancien Aion ». Enfin, un autre changement majeur est la suppression des contraintes de vol plané présentes dans Aion. Bien que cela n'ait pas été expliqué en détail, NCsoft vise à intégrer le vol plané au cœur du système de combat pour créer un « système de bataille tridimensionnel ». NCsoft n'a pas précisé sur quel moteur Aion 2 est développé, mais je parie sur l'Unreal Engine 5. Restez à l'écoute pour plus d'informations sur le jeu !

</details>

<details>
<summary><strong>Jeu : Cyberpunk 2077</strong></summary>

#### Source (EN)

**title**

> Cyberpunk 2077

**description**

> Cyberpunk 2077 is an open-world action-adventure game set in Night City, a sprawling metropolis driven by power, glamour, and body modification. Players assume the role of V, a mercenary outlaw in pursuit of a unique implant that holds the key to immortality. The game allows extensive customization of cyberware, skills, and playstyle. Choices made throughout the journey influence both the narrative and the world.

**storyline**

> In 2077, following an economic collapse sometime during the early 21st century, the United States is forced to rely on large corporations to survive. These corporations deal in a wide range of areas, such as weapons, robotics, cybernetics, pharmaceuticals, communications and biotechnology, and many of these companies operate above the law. The world in between is where decadence, sex and pop culture mix with violent crime, extreme poverty and the unattainable promise of the American Dream. You play as V, a mercenary outlaw deeply embedded in the crime-ridden city of Night City, going after a one-of-a-kind implant that is the key to immortality.

#### `openai/gpt-5.4-nano` (3.2 s, 0.00051 $)

**title**

> Cyberpunk 2077

**description**

> Cyberpunk 2077 est un jeu d’action-aventure en monde ouvert qui se déroule dans Night City, une mégalopole tentaculaire où se mêlent le pouvoir, le glamour et la modification du corps. Vous incarnez V, un mercenaire hors-la-loi en quête d’un implant unique, porteur de la promesse de l’immortalité. Le jeu propose une personnalisation poussée de la cyberware, des compétences et du style de jeu. Vos choix, tout au long de l’aventure, ont un impact sur le récit comme sur le monde qui vous entoure.

**storyline**

> En 2077, après l’effondrement économique survenu à une période située quelque part au début du XXIe siècle, les États-Unis sont contraints de compter sur de grandes entreprises pour survivre. Ces mastodontes opèrent dans de nombreux secteurs, comme les armes, la robotique, la cybernétique, l’industrie pharmaceutique, les communications et la biotechnologie — et beaucoup d’entre elles évoluent en dehors du cadre de la loi. Là où elles n’ont pas encore tout avalé, la décadence, le sexe et la pop culture se télescopent avec la criminalité violente, la misère extrême et le rêve américain, promis mais inaccessible. Vous incarnez V, un mercenaire profondément ancré dans la ville gangrenée par le crime de Night City, à la poursuite d’un implant unique, la clé de l’immortalité.

#### `mistral/mistral-large-3` (5.0 s, 0.00067 $)

**title**

> Cyberpunk 2077

**description**

> Cyberpunk 2077 est un jeu d'action-aventure en monde ouvert se déroulant dans Night City, une mégalopole tentaculaire rongée par le pouvoir, le glamour et les modifications corporelles. Vous incarnez V, un mercenaire hors-la-loi en quête d'un implant unique, promesse d'immortalité. Le jeu offre une personnalisation poussée de votre cyberware, de vos compétences et de votre style de jeu. Vos choix influencent profondément l'histoire et le monde qui vous entoure.

**storyline**

> En 2077, après un effondrement économique survenu au début du XXIe siècle, les États-Unis dépendent désormais des grandes corporations pour survivre. Ces géants opèrent dans des domaines variés comme les armes, la robotique, la cybernétique, les produits pharmaceutiques, les communications et la biotechnologie, souvent au mépris des lois. Entre ces deux extrêmes, un monde où se mêlent décadence, sexe, culture pop, criminalité violente, pauvreté extrême et le rêve américain, toujours inaccessible. Vous incarnez V, un mercenaire hors-la-loi plongé dans les bas-fonds de Night City, traquant un implant unique, clé de l'immortalité.

#### `deepseek/deepseek-v3.1` (11.5 s, 0.00042 $)

**title**

> Cyberpunk 2077

**description**

> Cyberpunk 2077 est un jeu d'action-aventure en monde ouvert se déroulant à Night City, une métropole tentaculaire gouvernée par le pouvoir, le glamour et la modification corporelle. Les joueurs incarnent V, un mercenaire hors-la-loi en quête d'un implant unique détenant la clé de l'immortalité. Le jeu permet une personnalisation approfondie du cyberware, des compétences et du style de jeu. Les choix effectués au cours de l'aventure influencent à la fois le récit et le monde.

**storyline**

> En 2077, suite à un effondrement économique survenu au début du 21e siècle, les États-Unis sont contraints de dépendre de grandes corporations pour survivre. Ces sociétés opèrent dans de nombreux domaines tels que les armes, la robotique, la cybernétique, les produits pharmaceutiques, les communications et la biotechnologie, et beaucoup agissent au-dessus des lois. Le monde qui en résulte est un mélange de décadence, de sexe et de culture pop avec le crime violent, l'extrême pauvreté et la promesse inaccessible du Rêve Américain. Vous incarnez V, un mercenaire hors-la-loi profondément ancré dans la ville criminelle de Night City, à la poursuite d'un implant unique qui représente la clé de l'immortalité.

#### `alibaba/qwen-3-235b` (20.9 s, 0.00023 $)

**title**

> Cyberpunk 2077

**description**

> Cyberpunk 2077 est un jeu d'action-aventure en monde ouvert se déroulant dans Night City, une mégalopole tentaculaire obsédée par le pouvoir, le glamour et la modification corporelle. Incarnez V, un mercenaire marginalisé aux prises avec un implant unique détenteur de la clé de l'immortalité. Le jeu propose une personnalisation poussée des compétences, du cyberéquipement et du style de jeu. Les choix effectués tout au long de l'aventure influencent à la fois le récit et l'univers du jeu.

**storyline**

> En 2077, à la suite d'un effondrement économique survenu au début du XXIe siècle, les États-Unis doivent compter sur de grandes multinationales pour survivre. Ces entreprises exercent leurs activités dans des domaines variés tels que les armes, la robotique, la cybernétique, les produits pharmaceutiques, les communications et la biotechnologie, et beaucoup d'entre elles agissent en toute impunité. Entre ces géants, le monde oscille entre décadence, sexe, culture populaire, criminalité violente, pauvreté extrême et l'illusion inaccessible du rêve américain. Incarnez V, un mercenaire marginalisé plongé au cœur de la ville corrompue de Night City, lancé à la poursuite d'un implant unique qui renferme le secret de l'immortalité.

#### `openai/gpt-4.1-mini` (4.6 s, 0.00064 $)

**title**

> Cyberpunk 2077

**description**

> Cyberpunk 2077 est un jeu d'action-aventure en monde ouvert se déroulant à Night City, une métropole tentaculaire où règnent pouvoir, glamour et modifications corporelles. Les joueurs incarnent V, un mercenaire hors-la-loi à la recherche d'un implant unique détenant la clé de l'immortalité. Le jeu offre une personnalisation poussée des cyberwares, compétences et styles de jeu. Les choix effectués influencent à la fois le récit et l'univers du jeu.

**storyline**

> En 2077, après un effondrement économique survenu au début du XXIe siècle, les États-Unis doivent compter sur de grandes corporations pour survivre. Ces entreprises œuvrent dans divers domaines tels que l'armement, la robotique, la cybernétique, la pharmacie, les communications et la biotechnologie, souvent au-dessus des lois. C'est dans cet entre-deux que se mêlent décadence, sexe et culture pop à la criminalité violente, à l'extrême pauvreté et à la promesse inaccessible du rêve américain. Vous incarnez V, un mercenaire hors-la-loi profondément ancré dans la ville gangrenée de Night City, à la poursuite d'un implant unique, clé de l'immortalité.

#### `google/gemini-2.5-flash` (6.8 s, 0.00390 $)

**title**

> Cyberpunk 2077

**description**

> Cyberpunk 2077 est un jeu d'action-aventure en monde ouvert qui vous plonge au cœur de Night City, une métropole tentaculaire où règnent le pouvoir, le glamour et la modification corporelle. Les joueurs incarnent V, un mercenaire hors-la-loi à la poursuite d'un implant unique qui détient la clé de l'immortalité. Le jeu offre une personnalisation poussée de votre cyberware, de vos compétences et de votre style de jeu. Vos choix tout au long de votre périple influencent la narration et le monde qui vous entoure.

**storyline**

> En 2077, suite à un effondrement économique survenu au début du 21e siècle, les États-Unis sont contraints de s'appuyer sur de puissantes corporations pour survivre. Ces mégacorporations opèrent dans une multitude de domaines tels que l'armement, la robotique, la cybernétique, la pharmaceutique, les communications et la biotechnologie, et nombre d'entre elles agissent au-dessus des lois. Dans cet entre-deux, la décadence, le sexe et la culture pop se mêlent au crime violent, à l'extrême pauvreté et à la promesse inatteignable du rêve américain. Vous incarnez V, un mercenaire hors-la-loi profondément enraciné dans le milieu criminel de Night City, et vous partez à la recherche d'un implant unique en son genre, la clé de l'immortalité.

</details>

<details>
<summary><strong>Personnage : Chloe Frazer</strong></summary>

#### Source (EN)

**name**

> Chloe Frazer

**description**

> Chloe Frazer is an Indian-Australian treasure hunter and thief for hire; she's a skilled professional whose reputation often makes her highly demanded in the criminal underworld. She was also an associate, a major ally, and a former love interest to fellow treasure hunter Nathan Drake, and has also worked with other people such as Harry Flynn, Charlie Cutter, Nadine Ross, and Samuel Drake.
>   Chloe was introduced in Uncharted 2: Among Thieves, serving as a central character and secondary love interest to Nathan Drake. She subsequently appears in Uncharted 3: Drake's Deception - in which she appears as a supporting character for the first act of the game, and is briefly mentioned in Uncharted 4: A Thief's End, before becoming the main protagonist of Uncharted: The Lost Legacy.
>   In Among Thieves and Drake's Deception, Chloe was voiced and motion-captured by Claudia Black, who also recorded lines for the character in the multiplayer mode of A Thief's End. In The Lost Legacy, Claudia reprises her role as Chloe, while motion-capture was done by Michelle Lee.

#### Actuellement en base (FR)

**name**

> Chloé Frazer

**description**

> Chloé Frazer est une chasseuse de trésors et voleuse d’origine indo-australienne, disponible pour qui paye. C’est une pro aguerrie, dont la réputation la rend souvent très demandée dans le milieu criminel. Elle est aussi devenue une alliée de poids, une ex, voire même un intérêt amoureux important du chasseur de trésors Nathan Drake, et elle a travaillé avec d’autres figures comme Harry Flynn, Charlie Cutter, Nadine Ross et Samuel Drake.
>
> Chloé fait sa première apparition dans Uncharted 2 : Among Thieves, où elle occupe un rôle central et endosse le statut de second intérêt amoureux de Nathan Drake. Elle revient ensuite dans Uncharted 3 : Drake’s Deception : on la voit comme personnage secondaire pendant le premier acte du jeu, avant qu’elle ne soit brièvement mentionnée dans Uncharted 4 : A Thief’s End, avant de devenir la protagoniste principale de Uncharted : The Lost Legacy.
>
> Dans Among Thieves et Drake’s Deception, Chloé est doublée et captée en motion capture par Claudia Black, qui a aussi enregistré des répliques pour le personnage dans le mode multijoueur de A Thief’s End. Dans The Lost Legacy, Claudia reprend son rôle de Chloé, tandis que la motion capture est assurée par Michelle Lee.

#### `openai/gpt-5.4-nano` (3.9 s, 0.00045 $)

**name**

> Chloé Frazer

**description**

> Chloé Frazer est une chasseuse de trésors et voleuse indo-australienne, disponible à la demande. C’est une professionnelle redoutable, dont la réputation fait souvent d’elle une cible très prisée dans le milieu criminel. Elle a également été une alliée de poids, une associée et une ancienne relation amoureuse de Nathan Drake, un autre chasseur de trésors. Elle a aussi travaillé avec d’autres figures comme Harry Flynn, Charlie Cutter, Nadine Ross et Samuel Drake.
>
> Chloé fait sa première apparition dans Uncharted 2 : Among Thieves, où elle occupe un rôle central et devient une romance secondaire pour Nathan Drake. Elle revient ensuite dans Uncharted 3 : Drake’s Deception : elle y apparaît comme personnage d’appui pour le premier acte du jeu, puis est brièvement mentionnée dans Uncharted 4 : A Thief’s End, avant de devenir la protagoniste principale d’Uncharted : The Lost Legacy.
>
> Dans Among Thieves et Drake’s Deception, Chloé est incarnée et captée en motion par Claudia Black, qui a aussi enregistré des répliques pour le personnage dans le mode multijoueur d’A Thief’s End. Dans The Lost Legacy, Claudia reprend le rôle de Chloé, tandis que la capture de mouvement est réalisée par Michelle Lee.

#### `mistral/mistral-large-3` (5.7 s, 0.00062 $)

**name**

> Chloé Frazer

**description**

> Chloé Frazer est une chasseuse de trésors et voleuse à gages indo-australienne, une professionnelle aguerrie dont la réputation en fait une recrue très prisée dans le milieu criminel. Ancienne associée, alliée majeure et ex-petite amie du célèbre chasseur de trésors Nathan Drake, elle a également collaboré avec d'autres figures comme Harry Flynn, Charlie Cutter, Nadine Ross et Samuel Drake.
>
> Introduite dans *Uncharted 2: Among Thieves* en tant que personnage central et intérêt amoureux secondaire de Nathan Drake, Chloé apparaît ensuite dans *Uncharted 3: L'Illusion de Drake* en tant que personnage clé durant le premier acte du jeu. Bien que brièvement mentionnée dans *Uncharted 4: A Thief's End*, elle devient la protagoniste principale d'*Uncharted: The Lost Legacy*.
>
> Dans *Among Thieves* et *L'Illusion de Drake*, Chloé a été doublée et capturée en motion-capture par Claudia Black, qui a également enregistré des répliques pour le mode multijoueur d'*A Thief's End*. Dans *The Lost Legacy*, Claudia reprend son rôle, tandis que la motion-capture est assurée par Michelle Lee.

#### `deepseek/deepseek-v3.1` (10.3 s, 0.00040 $)

**name**

> Chloé Frazer

**description**

> Chloé Frazer est une chasseuse de trésors et voleuse à louer d'origine indienne et australienne ; c'est une professionnelle compétente dont la réputation la rend très demandée dans le milieu criminel. Elle a également été une associée, une alliée majeure et un ancien intérêt amoureux du chasseur de trésors Nathan Drake, et a travaillé avec d'autres personnes comme Harry Flynn, Charlie Cutter, Nadine Ross et Samuel Drake. Chloé a été introduite dans Uncharted 2 : Among Thieves, où elle est un personnage central et un second intérêt amoureux de Nathan Drake. Elle apparaît ensuite dans Uncharted 3 : L'Illusion de Drake — où elle est un personnage secondaire pendant le premier acte du jeu — et est brièvement mentionnée dans Uncharted 4 : A Thief's End, avant de devenir l'héroïne principale d'Uncharted: The Lost Legacy. Dans Among Thieves et L'Illusion de Drake, Chloé a été doublée et capturée en motion capture par Claudia Black, qui a également enregistré des répliques pour le personnage dans le mode multijoueur d'A Thief's End. Dans The Lost Legacy, Claudia reprend son rôle de Chloé, tandis que la capture de mouvement a été réalisée par Michelle Lee.

#### `alibaba/qwen-3-235b` (19.2 s, 0.00021 $)

**name**

> Chloe Frazer

**description**

> Chloe Frazer est une chasseuse de trésors et mercenaire d'origine indo-australienne, une professionnelle chevronnée dont la réputation la rend très recherchée dans le milieu criminel. Elle a été associée, alliée majeure et ancienne flamme du célèbre chasseur de trésors Nathan Drake, et a également collaboré avec d'autres personnages comme Harry Flynn, Charlie Cutter, Nadine Ross et Samuel Drake.
>
> Chloe fait ses débuts dans Uncharted 2 : Le Syndrome de Drake, où elle tient un rôle central et apparaît comme un second intérêt amoureux pour Nathan Drake. Elle réapparaît ensuite dans Uncharted 3 : L'Arche du destin, jouant un rôle secondaire durant la première partie du jeu, puis est brièvement mentionnée dans Uncharted 4 : A Thief's End, avant de devenir le personnage principal d'Uncharted : L'Héritage perdu.
>
> Dans Le Syndrome de Drake et L'Arche du destin, Chloe est doublée et incarnée en performance capture par Claudia Black, qui a également prêté sa voix au personnage dans le mode multijoueur d'A Thief's End. Dans L'Héritage perdu, Claudia Black reprend son rôle de voix, tandis que la performance capture est assurée par Michelle Lee.

#### `openai/gpt-4.1-mini` (3.9 s, 0.00058 $)

**name**

> Chloé Frazer

**description**

> Chloé Frazer est une chasseuse de trésors et voleuse indienne-australienne à louer ; une professionnelle aguerrie dont la réputation la rend très sollicitée dans le milieu criminel. Elle a été associée, alliée majeure et ancienne compagne du chasseur de trésors Nathan Drake, et a également collaboré avec des personnages comme Harry Flynn, Charlie Cutter, Nadine Ross et Samuel Drake.
>
> Chloé a été introduite dans Uncharted 2 : Among Thieves, jouant un rôle central et étant l'intérêt amoureux secondaire de Nathan Drake. Elle apparaît ensuite dans Uncharted 3 : Drake's Deception, où elle tient un rôle de soutien durant le premier acte, et est brièvement mentionnée dans Uncharted 4 : A Thief's End, avant de devenir l'héroïne principale d'Uncharted: The Lost Legacy.
>
> Dans Among Thieves et Drake's Deception, Chloé est doublée et capturée en motion-capture par Claudia Black, qui a aussi enregistré des répliques pour le mode multijoueur d'A Thief's End. Dans The Lost Legacy, Claudia reprend son rôle tandis que la motion-capture est réalisée par Michelle Lee.

#### `google/gemini-2.5-flash` (8.5 s, 0.00460 $)

**name**

> Chloe Frazer

**description**

> Chloe Frazer est une chasseuse de trésors et voleuse à gages indo-australienne. C'est une professionnelle aguerrie dont la réputation la rend souvent très recherchée dans le milieu criminel. Elle fut également associée, une alliée majeure et un ancien intérêt amoureux de son compagnon chasseur de trésors Nathan Drake, et a aussi collaboré avec d'autres personnalités telles que Harry Flynn, Charlie Cutter, Nadine Ross et Samuel Drake. Chloe a été introduite dans Uncharted 2: Among Thieves, où elle tenait un rôle central et était le second intérêt amoureux de Nathan Drake. Elle apparaît ensuite dans Uncharted 3: Drake's Deception en tant que personnage secondaire pour le premier acte du jeu, et est brièvement mentionnée dans Uncharted 4: A Thief's End, avant de devenir la protagoniste principale d'Uncharted: The Lost Legacy. Dans Among Thieves et Drake's Deception, Chloe était doublée et en motion-capture par Claudia Black, qui a également enregistré des répliques pour le personnage dans le mode multijoueur d'A Thief's End. Dans The Lost Legacy, Claudia a repris son rôle de Chloe, tandis que la motion-capture a été réalisée par Michelle Lee.

</details>

<details>
<summary><strong>Personnage : Detective</strong></summary>

#### Source (EN)

**name**

> Detective

#### Actuellement en base (FR)

**name**

> Détective

#### `openai/gpt-5.4-nano` (1.0 s, 0.00005 $)

**name**

> Détective

#### `mistral/mistral-large-3` (0.7 s, 0.00007 $)

**name**

> Inspecteur

#### `deepseek/deepseek-v3.1` (1.7 s, 0.00003 $)

**name**

> Détective

#### `alibaba/qwen-3-235b` (1.3 s, 0.00002 $)

**name**

> Détective

#### `openai/gpt-4.1-mini` (1.5 s, 0.00007 $)

**name**

> Détective

#### `google/gemini-2.5-flash` (1.6 s, 0.00051 $)

**name**

> Détective

</details>

<details>
<summary><strong>Personnage : Beast Rider</strong></summary>

#### Source (EN)

**name**

> Beast Rider

#### `openai/gpt-5.4-nano` (22.9 s, 0.00005 $)

**name**

> Cavalier de la Bête

#### `mistral/mistral-large-3` (13.9 s, 0.00008 $)

**name**

> Cavalier des Bêtes

#### `deepseek/deepseek-v3.1` (1.2 s, 0.00003 $)

**name**

> Cavalier de Bête

#### `alibaba/qwen-3-235b` (1.1 s, 0.00002 $)

**name**

> Cavalier des Bêtes

#### `openai/gpt-4.1-mini` (4.4 s, 0.00007 $)

**name**

> Cavalier Bestial

#### `google/gemini-2.5-flash` (6.0 s, 0.00247 $)

**name**

> Cavalier Bestial

</details>
