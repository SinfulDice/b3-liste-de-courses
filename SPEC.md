# SPEC — Liste de courses (B3)

Application web de liste de courses en **React + TypeScript** (Vite), qui utilise l'API
**DummyJSON** (https://dummyjson.com). Déployée sur **Red Hat OpenShift** (Developer Sandbox).

Statut : v1 + v1.1 **validées le 2026-11-20**. v2 **validée le 2026-11-20** (+ R57 demandée à la validation).

Les règles gardent leur numéro d'origine (les tests les citent). Une règle changée en v2 est marquée
**(v2)** ; une règle qui n'existe plus est ~~barrée~~ avec sa remplaçante.

## Rappel important sur DummyJSON

DummyJSON **simule** les écritures : `POST /products/add` et `DELETE /products/:id` répondent
comme si c'était fait, mais rien n'est enregistré sur le serveur. `POST /products/add` renvoie
toujours `id: 195`, et les champs inconnus (comme `quantity`) sont ignorés. Les noms des produits
et des catégories sont en anglais, les prix en dollars.

## Vocabulaire

- **Catalogue** : tous les produits DummyJSON (194, dans 24 catégories).
- **Liste** : une liste de courses nommée (ex : « Courses de la semaine »). Il peut y en avoir plusieurs.
- **Liste active** : celle dans laquelle la page Produits ajoute, et que la page Ma liste affiche.
- **Ligne** : un produit dans une liste, avec sa quantité et sa case « acheté ».

## Catalogue

- **R1 (v2)** : au démarrage, l'app charge **tout le catalogue** depuis
  `GET https://dummyjson.com/products?limit=0&select=title,price,thumbnail,category` (194 produits).
- **R2** : pendant le chargement, un message « Chargement… » est affiché.
- **R3** : si le chargement échoue (réseau ou réponse HTTP non OK), un message d'erreur est affiché
  et on ne peut rien ajouter.
- ~~**R4**~~ : menu déroulant → remplacé par la page Produits (R38 à R41).

## Traduction (v2)

- **R32** : les noms des produits sont affichés **en français**, grâce à un dictionnaire écrit à la main
  (`src/i18n/products.ts`), indexé par l'id du produit. Les marques et noms de modèles ne sont pas
  traduits (ex : « iPhone 9 » reste « iPhone 9 », « Apple » devient « Pomme »).
- **R33** : les **24 catégories** sont aussi traduites (`src/i18n/categories.ts`, ex : `groceries` → « Épicerie »).
- **R34** : si un nom ou une catégorie manque dans le dictionnaire, on affiche le texte anglais de DummyJSON
  (rien ne casse). Un test vérifie que les 194 produits et les 24 catégories sont bien traduits.
- **R57** : un interrupteur **« Noms en français »** (en haut, visible sur les deux pages) active ou désactive
  la traduction des noms de produits et de catégories ; désactivé, on voit les noms anglais de DummyJSON.
  Activé par défaut. Le reste de l'interface reste en français. Le choix est sauvegardé (comme R54).
  La recherche (R39) marche dans les deux langues quel que soit le choix.

## Deux pages (v2)

- **R35** : l'app a **deux pages** avec leur propre adresse : **Produits** (`/`) et **Ma liste** (`/liste`).
  On passe de l'une à l'autre par un menu en haut, toujours visible ; la page courante y est mise en évidence.
- **R36** : le lien « Ma liste » affiche le **nombre d'articles** de la liste active (somme des quantités).
- **R37** : recharger la page ou ouvrir directement `/liste` fonctionne (le serveur renvoie l'app, pas une
  erreur 404). Une adresse inconnue affiche la page Produits.

## Page Produits (v2)

- **R38** : les produits sont affichés en **grille de cartes** : image, nom français, catégorie française, prix.
- **R39** : un champ **Rechercher** filtre les produits par nom français ou anglais (sans tenir compte
  des majuscules ni des accents : « epice » trouve « Épices »), et un menu **Catégorie** filtre par catégorie
  (« Toutes » par défaut). Les deux filtres se combinent. Aucun résultat → « Aucun produit trouvé ».
- **R40** : chaque carte a un **sélecteur de quantité X** (voir R43) et un bouton « Ajouter ».
  La page indique la liste dans laquelle on ajoute : « Ajouter à : <nom de la liste active> ».
- **R41** : une carte dont le produit est déjà dans la liste active affiche « Dans la liste : N ».
- ~~**R13**~~ : bouton « Supprimer » → remplacé par « Retirer X » (R44).

## Quantité X (v2)

- **R43** : le sélecteur de quantité est `[−] [ X ] [+]` : un nombre entier entre **1 et 99**, 1 par défaut.
  « − » est désactivé à 1, « + » à 99. Si on tape une valeur invalide (vide, 0, lettres, > 99), elle est
  ramenée entre 1 et 99 quand on quitte le champ. Après un ajout ou un retrait réussi, X revient à 1
  (évite d'ajouter 2 MacBook par erreur au produit suivant).

## Ajouter

- **R8 (v2)** : on ne peut ajouter **que des produits du catalogue** (pas de texte libre).
- **R9 (v2)** : ajouter X d'un produit **absent** de la liste active envoie `POST https://dummyjson.com/products/add`
  avec `{ "title": <nom anglais> }`. Si la réponse est OK, la ligne apparaît dans la liste avec la quantité X.
- **R10 (v2)** : ajouter X d'un produit **déjà présent** augmente sa quantité de X, sans appel à l'API.
  Si la ligne était cochée « acheté », elle est **décochée** (il en faut à nouveau).
- **R11** : chaque ligne est identifiée par **l'id du produit dans le catalogue**, pas par l'id renvoyé par `POST`.
- **R12** : si l'ajout échoue, un message d'erreur est affiché et la liste ne change pas.

## Page Ma liste (v2)

- **R5 (v2)** : au tout premier lancement, il existe une liste vide nommée « Ma liste ». Une liste vide
  affiche « La liste est vide » et un lien vers la page Produits.
- **R6 (v2)** : chaque ligne affiche : image, nom français, prix unitaire, quantité, sous-total
  (prix × quantité), une case « acheté », un sélecteur de quantité X (R43) et deux boutons
  « Ajouter » et « Retirer ».
- **R7 (v2)** : les lignes **à acheter** sont en haut, dans l'ordre de leur premier ajout ; les lignes
  **cochées** sont en bas dans une section « Déjà acheté ».
- **R44** : « Ajouter » sur une ligne ajoute X (comme R10, sans appel à l'API). « Retirer » enlève X :
  s'il reste au moins 1, la quantité baisse sans appel à l'API ; si X ≥ quantité, c'est une suppression
  de la ligne (R14).
- **R14 (v2)** : supprimer une ligne envoie `DELETE https://dummyjson.com/products/:id` (id du catalogue).
  Si la réponse est OK, la ligne disparaît.
- **R15** : si la suppression échoue, un message d'erreur est affiché et la ligne reste.

## Prix et total (v2)

- **R45** : les prix sont affichés **en euros, avec le même nombre que DummyJSON** (1.99 $ → « 1,99 € »),
  au format français (virgule, espace avant €, espace pour les milliers : « 36 999,99 € »).
- **R46** : sous la liste, un récapitulatif affiche : **Total** (toutes les lignes), **Déjà acheté**
  (lignes cochées) et **Reste à payer** (Total − Déjà acheté), plus le nombre d'articles.
- **R47** : les calculs sont exacts au centime (pas d'erreur du type 0,1 + 0,2 = 0,30000000000000004).

## Déjà acheté (v2)

- **R48** : cocher la case d'une ligne la marque « acheté » : elle est **barrée**, passe dans la section
  « Déjà acheté » (R7) et son sous-total passe de « Reste à payer » à « Déjà acheté » (R46).
  Décocher fait l'inverse. Cocher ne fait pas d'appel à l'API.

## Plusieurs listes (v2)

- **R49** : un menu en haut de l'app (visible sur les deux pages) choisit la **liste active**.
- **R50** : **Créer** une liste : on donne un nom ; la nouvelle liste est vide et devient la liste active.
- **R51** : **Renommer** la liste active.
- **R52** : un nom de liste est nettoyé des espaces au début et à la fin, fait entre **1 et 40 caractères**,
  et doit être **unique** (sans tenir compte des majuscules). Sinon un message explique le problème et
  rien n'est créé / renommé.
- **R53** : **Supprimer** la liste active, après une confirmation (« Supprimer la liste « X » ? »).
  La première liste restante devient active. On ne peut pas supprimer la **dernière** liste
  (le bouton est désactivé). Supprimer une liste ne fait pas d'appel à l'API.

## Sauvegarde (v2)

- ~~**R16**~~ : liste perdue au rechargement → remplacée par R54.
- **R54** : les listes (noms, lignes, quantités, cases cochées) et la liste active sont **sauvegardées dans
  le navigateur** (localStorage) à chaque changement, et retrouvées au rechargement. Seulement sur cet
  appareil et ce navigateur.
- **R55** : si la sauvegarde est absente, illisible ou abîmée, l'app démarre comme au premier lancement (R5),
  sans planter. Si le navigateur refuse la sauvegarde, l'app marche quand même (sans sauvegarde).

## Comportement général

- **R17** : un message d'erreur disparaît dès que l'action suivante (ajout ou suppression) réussit.
- **R18** : pendant un appel à l'API, les boutons « Ajouter » et « Retirer » sont désactivés.

## Design, favicon

- **R19** : l'app a un favicon SVG personnalisé en forme de **caddie** (`public/favicon.svg`).
- **R20** : les pages s'affichent correctement sur mobile (largeur 360px) et sur ordinateur.
- **R21** : l'interface est en français ; le titre de l'onglet est « Liste de courses ».

## Outils, Git, déploiement

- **R22** : tests automatiques avec **Vitest** + **React Testing Library** ; les appels à DummyJSON sont
  simulés dans les tests. Chaque règle testable a au moins un test qui cite son numéro.
- **R23** : dépôt GitHub **public** `SinfulDice/b3-liste-de-courses`, un commit à la fin de chaque étape.
- **R24** : conteneur compatible OpenShift (pas de root, port 8080), déployé sur le Developer Sandbox.
- **R56** : les deux pages utilisent **React Router** ; nginx est configuré pour renvoyer l'app sur toutes
  les adresses (R37).

## Licornes

- **R25** : en fond, **6 licornes ailées dessinées en SVG** traversent l'écran de gauche à droite en ondulant,
  derrière le contenu, sans bloquer les clics ni créer de défilement horizontal. Leurs ailes partent du dos
  vers l'**arrière** (pointe vers la queue).
- **R26** : avec « moins d'animations » (`prefers-reduced-motion: reduce`), elles restent visibles mais immobiles.
- **R27 (v2)** : après un **ajout réussi** (depuis les Produits ou depuis une ligne), hennissement + une licorne
  poussant un caddie traverse l'écran **de gauche à droite** ; le caddie porte « X × nom français ».
- **R28 (v2)** : après un **retrait réussi** (« Retirer », partiel ou complet), même hennissement, mais la licorne
  est **tournée vers la gauche** et traverse **de droite à gauche** ; le nom sur le caddie est barré.
- **R29** : si l'action échoue, pas de hennissement ni de licorne au caddie. Cocher « acheté », créer,
  renommer ou supprimer une liste ne déclenche pas de licorne.
- **R30** : le son est `public/sounds/neigh.ogg` (« Wiehern.ogg », Wikimedia Commons, domaine public).
  S'il ne peut pas être joué, rien ne casse. Pas de bouton pour couper le son.
- **R31** : chaque licorne au caddie disparaît après **4 secondes** ; plusieurs peuvent passer en même temps.

## Plus tard

- Synchroniser les listes entre appareils (il faudrait un vrai serveur avec une base de données).
- Partager une liste.
- Dupliquer une liste.
- Mettre le son en MP3 en plus de l'OGG (Safari sur iPhone).
