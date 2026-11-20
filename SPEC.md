# SPEC — Liste de courses (B3)

Application web de liste de courses en **React + TypeScript** (Vite), qui utilise l'API
**DummyJSON** (https://dummyjson.com). Déployée sur **Red Hat OpenShift** (Developer Sandbox).

Statut : **validée le 2026-11-20**, modifiée le 2026-11-20 (ajout par catalogue + quantité).

## Rappel important sur DummyJSON

DummyJSON **simule** les écritures : `POST /products/add` et `DELETE /products/:id` répondent
comme si c'était fait, mais rien n'est enregistré sur le serveur. `POST /products/add` renvoie
toujours `id: 195`, et les champs inconnus (comme `quantity`) sont ignorés.

## Vocabulaire

- **Catalogue** : les produits DummyJSON qu'on peut choisir.
- **Liste** : ma liste de courses, ce que j'ai choisi, avec une quantité par produit.

## v1 — Catalogue

- **R1** : au démarrage, l'app charge le catalogue depuis
  `GET https://dummyjson.com/products/category/groceries` (27 produits).
- **R2** : pendant le chargement, un message « Chargement… » est affiché.
- **R3** : si le chargement échoue (réseau ou réponse HTTP non OK), un message d'erreur est affiché
  et on ne peut rien ajouter.
- **R4** : le catalogue est présenté dans un **menu déroulant** (nom de chaque produit) avec un bouton
  « Ajouter ». Tous les produits restent toujours proposés, même ceux déjà dans la liste.

## v1 — Liste

- **R5** : la liste **commence vide** ; le message « La liste est vide » est alors affiché.
- **R6** : chaque ligne de la liste affiche le nom du produit et sa quantité (ex : « Apple × 2 »).
- **R7** : les lignes sont dans l'ordre où les produits ont été ajoutés pour la première fois.

## v1 — Ajouter

- **R8** : on ne peut ajouter **que des produits du catalogue** (pas de texte libre). Sans produit
  choisi, le bouton « Ajouter » ne fait rien.
- **R9** : ajouter un produit **absent** de la liste envoie `POST https://dummyjson.com/products/add`
  avec `{ "title": <nom> }`. Si la réponse est OK, le produit apparaît en bas de la liste avec la quantité 1.
- **R10** : ajouter un produit **déjà présent** augmente sa quantité de 1, sans appel à l'API
  (DummyJSON ne garde pas la quantité). Aucune nouvelle ligne n'est créée.
- **R11** : chaque produit de la liste est identifié par **son id du catalogue** (ex : 16 pour Apple),
  pas par l'id renvoyé par `POST` (toujours 195).
- **R12** : si l'ajout échoue, un message d'erreur est affiché et la liste ne change pas.

## v1 — Supprimer

- **R13** : chaque ligne a un bouton « Supprimer ».
- **R14** : supprimer envoie `DELETE https://dummyjson.com/products/:id` (id du catalogue). Si la réponse
  est OK, la **ligne entière** disparaît (quelle que soit la quantité).
- **R15** : si la suppression échoue, un message d'erreur est affiché et la ligne reste.

## v1 — Comportement général

- **R16** : la liste vit uniquement dans la mémoire de React. Après un rechargement de la page,
  elle redevient vide. C'est voulu.
- **R17** : un message d'erreur disparaît dès que l'action suivante (ajout ou suppression) réussit.
- **R18** : pendant un appel à l'API (ajout ou suppression), les boutons sont désactivés pour éviter
  les doubles clics.

## v1 — Design, favicon

- **R19** : l'app a un favicon SVG personnalisé en forme de **caddie** (`public/favicon.svg`),
  jamais le logo par défaut de Vite.
- **R20** : la page s'affiche correctement sur mobile (largeur 360px) et sur ordinateur.
- **R21** : l'interface est en français ; le titre de l'onglet est « Liste de courses ».

## v1 — Outils, Git, déploiement

- **R22** : tests automatiques avec **Vitest** + **React Testing Library** ; les appels à DummyJSON sont
  simulés dans les tests (pas d'appel réseau réel). Chaque règle testable a au moins un test qui cite son numéro.
- **R23** : code sur un dépôt GitHub **public** `SinfulDice/b3-liste-de-courses`, avec un commit à la fin
  de chaque étape importante.
- **R24** : l'app est construite (`npm run build`) puis servie par un serveur web dans un conteneur
  compatible OpenShift (pas de root, port 8080), et déployée sur le Developer Sandbox.

## v1.1 — Licornes (ajouté le 2026-11-20)

- **R25** : en fond d'écran, **6 licornes ailées dessinées en SVG** traversent l'écran de gauche à droite
  en ondulant, en boucle, à des hauteurs, tailles et vitesses différentes. Elles sont **derrière** le contenu,
  ne bloquent jamais les clics, sont ignorées par les lecteurs d'écran (décoratives) et ne créent pas
  de barre de défilement horizontale.
- **R26** : si le système demande « moins d'animations » (`prefers-reduced-motion: reduce`), les licornes
  du fond restent **visibles mais immobiles**.
- **R27** : après un **ajout réussi** (nouveau produit ou quantité + 1), on entend un **hennissement** et une
  **licorne poussant un caddie** traverse l'écran de gauche à droite ; le caddie porte le nom du produit.
- **R28** : après une **suppression réussie**, même hennissement et même licorne au caddie, mais le nom du
  produit sur le caddie est **barré** (elle emporte le produit).
- **R29** : si l'ajout ou la suppression **échoue**, pas de hennissement ni de licorne au caddie.
- **R30** : le son est le fichier `public/sounds/neigh.ogg` (« Wiehern.ogg », Wikimedia Commons,
  **domaine public**). Si le navigateur ne peut pas le jouer, rien ne casse et aucune erreur n'est affichée.
  Pas de bouton pour couper le son.
- **R31** : chaque licorne au caddie disparaît après **4 secondes**. Plusieurs actions rapides = plusieurs
  licornes au caddie en même temps. Elles passent devant le contenu mais ne bloquent pas les clics.
  Avec « moins d'animations », elle apparaît immobile puis disparaît après 4 secondes (le son est joué).

## Plus tard (pas en v1)

- Diminuer la quantité de 1 (bouton « − »).
- Rechercher dans tout le catalogue DummyJSON (`/products/search?q=`), pas seulement les groceries.
- Afficher prix et image ; total du panier.
- Cocher un produit « acheté ».
- Garder la liste après rechargement (localStorage).
