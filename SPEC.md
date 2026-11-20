# SPEC — Liste de courses (B3)

Application web de liste de courses en **React + TypeScript** (Vite), qui utilise l'API
**DummyJSON** (https://dummyjson.com). Déployée sur **Red Hat OpenShift** (Developer Sandbox).

Statut : v1 + v1.1 **validées le 2026-11-20**. v2 **validée le 2026-11-20** (+ R57 demandée à la validation).
Ajouts de l'étape 4 (Favoris, coupons, icônes, ordre des produits : R58 à R70) : **validés le 2026-11-20**.

Les règles gardent leur numéro d'origine (les tests les citent). Une règle changée en v2 est marquée
**(v2)** ; une règle qui n'existe plus est ~~barrée~~ avec sa remplaçante. Une règle changée par l'étape 4 est marquée **(v2.1)**.

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
- **Favoris** : une liste spéciale, toujours présente ; un produit est « favori » s'il a une ligne dans Favoris.
- **Coupon** : une réduction (en % ou en €) sur toute la liste ou sur une catégorie, qu'on coche dans une liste.

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

- **R35 (v2.1)** : l'app a **trois pages** avec leur propre adresse : **Produits** (`/`), **Ma liste** (`/liste`)
  et **Coupons** (`/coupons`).
  On passe de l'une à l'autre par un menu en haut, toujours visible ; la page courante y est mise en évidence.
- **R36** : le lien « Ma liste » affiche le **nombre d'articles** de la liste active (somme des quantités).
- **R37** : recharger la page ou ouvrir directement `/liste` (ou `/coupons`) fonctionne (le serveur renvoie l'app, pas une
  erreur 404). Une adresse inconnue affiche la page Produits.

## Page Produits (v2)

- **R38** : les produits sont affichés en **grille de cartes** : image, nom français, catégorie française, prix.
- **R39** : un champ **Rechercher** filtre les produits par nom français ou anglais (sans tenir compte
  des majuscules ni des accents : « epice » trouve « Épices »), et le filtre **Catégorie** (R69) filtre par catégorie
  (« Toutes » par défaut). Les deux filtres se combinent. Aucun résultat → « Aucun produit trouvé ».
- **R40** : chaque carte a un **sélecteur de quantité X** (voir R43) et un bouton « Ajouter ».
  La page indique la liste dans laquelle on ajoute : « Ajouter à : <nom de la liste active> ».
- **R41** : une carte dont le produit est déjà dans la liste active affiche « Dans la liste : N ».
- **R70** : les produits sont triés **par catégorie, dans l'ordre alphabétique du nom français** de la catégorie
  (« Accessoires mobiles » d'abord ; « É » est rangé avec les « E »). Dans une catégorie, l'ordre de DummyJSON
  est gardé. Les boutons du filtre Catégorie (R69) suivent le même ordre.
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

- **R5 (v2.1)** : au tout premier lancement, il existe deux listes vides : « Favoris » (R58) et « Ma liste »,
  qui est la liste active. Une liste vide
  affiche « La liste est vide » et un lien vers la page Produits.
- **R6 (v2.1)** : chaque ligne affiche : image, icône de catégorie (R68), nom français, prix unitaire, quantité,
  sous-total (prix × quantité), une case « acheté », le bouton licorne des favoris (R59), un sélecteur de
  quantité X (R43) et deux boutons « Ajouter » et « Retirer ».
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
- **R46 (v2.1)** : sous la liste, un récapitulatif affiche : le nombre d'**articles**, **Total** (toutes les lignes),
  **Réductions** (R66, seulement si au moins un coupon est coché), **Total après réductions** (idem),
  **Déjà acheté** (lignes cochées) et **Reste à payer** = Total après réductions − Déjà acheté, jamais
  en dessous de 0,00 €.
- **R47** : les calculs sont exacts au centime (pas d'erreur du type 0,1 + 0,2 = 0,30000000000000004).

## Déjà acheté (v2)

- **R48** : cocher la case d'une ligne la marque « acheté » : elle est **barrée**, passe dans la section
  « Déjà acheté » (R7) et son sous-total passe de « Reste à payer » à « Déjà acheté » (R46).
  Décocher fait l'inverse. Cocher ne fait pas d'appel à l'API.

## Plusieurs listes (v2)

- **R49** : un menu en haut de l'app (visible sur les deux pages) choisit la **liste active**.
- **R50 (v2.1)** : **Créer** une liste : on donne un nom ; la nouvelle liste reçoit les favoris (R61) et devient
  la liste active.
- **R51** : **Renommer** la liste active.
- **R52** : un nom de liste est nettoyé des espaces au début et à la fin, fait entre **1 et 40 caractères**,
  et doit être **unique** (sans tenir compte des majuscules). Sinon un message explique le problème et
  rien n'est créé / renommé.
- **R53 (v2.1)** : **Supprimer** la liste active, après une confirmation (« Supprimer la liste « X » ? »).
  La première des autres listes (hors Favoris) devient active ; s'il n'y en a plus, c'est Favoris. On ne peut pas
  supprimer **Favoris** (R58). Supprimer une liste ne fait pas d'appel à l'API.

## Favoris (étape 4)

- **R58** : la liste **« Favoris »** existe toujours. Elle apparaît en premier dans le menu des listes (R49).
  C'est une liste comme les autres (on peut la choisir comme liste active, y ajouter des produits avec R9,
  changer les quantités, cocher, appliquer des coupons), mais on ne peut **ni la renommer ni la supprimer**
  (boutons désactivés quand elle est active). Le nom « Favoris » est donc déjà pris (R52).
- **R59** : chaque **carte** (page Produits) et chaque **ligne** (Ma liste) a un **bouton licorne** :
  licorne **en couleur** si le produit est dans Favoris, **grise** sinon. Pour les lecteurs d'écran, le bouton
  s'appelle « Ajouter aux favoris » ou « Retirer des favoris ».
- **R60** : cliquer la licorne d'un produit **pas favori** ajoute une ligne de quantité 1 dans Favoris ;
  cliquer celle d'un produit **favori** enlève sa ligne de Favoris (quelle que soit sa quantité). Pas d'appel
  à l'API, pas de hennissement ni de licorne au caddie. La liste active n'est pas changée (sauf si c'est
  Favoris elle-même : la ligne y apparaît / disparaît).
- **R61** : quand on **crée une liste** (R50), elle reçoit **une ligne par favori**, avec la quantité **1**,
  non cochée, dans l'ordre de Favoris. Pas d'appel à l'API. Sans favori, la nouvelle liste est vide.
  Les listes déjà créées ne changent pas quand Favoris change.

## Coupons (étape 4)

- **R62** : la page **Coupons** (`/coupons`) a un formulaire pour **créer un coupon** :
  **Nom** (ex : « LICORNE10 »), **Type** (« % » ou « € »), **Valeur**, **S'applique à** (« Toute la liste »
  ou une des 24 catégories).
- **R63** : un coupon est refusé, avec un message qui explique pourquoi, si : le nom (nettoyé des espaces au
  début et à la fin) est vide, fait plus de 30 caractères, ou existe déjà (sans tenir compte des majuscules) ;
  une valeur en % n'est pas un entier entre 1 et 100 ; une valeur en € n'est pas entre 0,01 et 999,99
  (virgule ou point acceptés, 2 chiffres après la virgule au plus).
- **R64** : la page liste les coupons créés, chacun avec sa description (« −10 % sur Épicerie »,
  « −5,00 € sur toute la liste ») et un bouton « Supprimer » (sans confirmation). Supprimer un coupon le
  retire aussi des listes où il était coché. Aucun coupon → « Aucun coupon pour l'instant ».
- **R65** : sur Ma liste, une section **Coupons** montre tous les coupons avec une case à cocher : un coupon
  coché s'applique à **cette liste seulement**. Aucun coupon créé → un lien vers la page Coupons.
- **R66** : calcul de la réduction d'un coupon coché, sur **toute la liste** (lignes cochées « acheté »
  comprises) : la base est la somme des sous-totaux des lignes concernées (toutes, ou celles de la catégorie).
  % → base × valeur ÷ 100, arrondi au centime ; € → la valeur, sans dépasser la base (un coupon −5 € sur une
  catégorie à 3 € enlève 3 €). Les réductions de plusieurs coupons s'additionnent (chacune calculée sur les
  prix d'origine), sans jamais dépasser le Total. Une catégorie absente de la liste → 0,00 €.
- **R67** : créer, supprimer, cocher ou décocher un coupon ne fait pas d'appel à l'API et ne déclenche pas de
  licorne.

## Icônes de catégories (étape 4)

- **R68** : chacune des 24 catégories a une **icône SVG** de la bibliothèque **Lucide** (`lucide-react`), choisie
  pour la représenter (ex : Épicerie → panier, Smartphones → téléphone). Une catégorie inconnue a une icône
  générique (R34). L'icône est sur les **cartes** (à côté de la catégorie), les **lignes** (à côté du nom) et
  les **boutons du filtre**. Elle est décorative (cachée aux lecteurs d'écran, le nom est écrit à côté).
- **R69** : le filtre **Catégorie** (R39) est une **rangée de boutons** « icône + nom », « Toutes » en premier,
  puis les catégories (R70). Le bouton choisi est mis en évidence. Sur mobile, la rangée défile de côté
  sans créer de défilement horizontal de la page.

## Sauvegarde (v2)

- ~~**R16**~~ : liste perdue au rechargement → remplacée par R54.
- **R54 (v2.1)** : les listes (noms, lignes, quantités, cases cochées, coupons cochés), la liste active et les coupons sont **sauvegardées dans
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
- **R29 (v2.1)** : si l'action échoue, pas de hennissement ni de licorne au caddie. Cocher « acheté », créer,
  renommer ou supprimer une liste, les favoris (R60) et les coupons (R67) ne déclenchent pas de licorne.
- **R30** : le son est `public/sounds/neigh.ogg` (« Wiehern.ogg », Wikimedia Commons, domaine public).
  S'il ne peut pas être joué, rien ne casse. Pas de bouton pour couper le son.
- **R31** : chaque licorne au caddie disparaît après **4 secondes** ; plusieurs peuvent passer en même temps.

## Plus tard

- Synchroniser les listes entre appareils (il faudrait un vrai serveur avec une base de données).
- Partager une liste.
- Coupons avec date d'expiration ou montant minimum d'achat.
- Dupliquer une liste.
- Mettre le son en MP3 en plus de l'OGG (Safari sur iPhone).
