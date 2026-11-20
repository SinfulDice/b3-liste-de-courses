# Liste de courses

Petite application web de liste de courses (projet B3) en **React + TypeScript**, qui utilise
l'API publique [DummyJSON](https://dummyjson.com) comme catalogue de produits.
Déployée sur **Red Hat OpenShift** (Developer Sandbox) : https://liste-de-courses-pierre-antoine-sut-dev.apps.rm1.0a51.p1.openshiftapps.com

- **Deux pages** : *Produits* (`/`) et *Ma liste* (`/liste`), avec React Router.
- **Produits** : tout le catalogue DummyJSON (194 produits) en grille de cartes, avec recherche
  (sans accents, en français ou en anglais) et filtre par catégorie. On ajoute X d'un produit.
- **Ma liste** : prix en euros, sous-totaux, récapitulatif (total, déjà acheté, reste à payer).
  Chaque ligne permet d'ajouter ou de retirer X, et de cocher « déjà acheté » (la ligne est barrée
  et descend en bas).
- Noms des produits et catégories traduits en français (dictionnaire écrit à la main), avec un
  interrupteur pour revenir à l'anglais.
- Des licornes ailées volent en fond ; à chaque ajout ou retrait réussi, une licorne hennit et
  traverse l'écran en poussant un caddie « X × produit » (dans l'autre sens pour un retrait).

Les règles exactes sont dans [`SPEC.md`](SPEC.md) (R1 à R57).

## Limites (voulues)

DummyJSON **simule** les ajouts et les suppressions : rien n'est enregistré sur le serveur.
La liste vit dans la mémoire de React et redevient vide quand on recharge la page.

## Crédits

- Hennissement : [« Wiehern.ogg »](https://commons.wikimedia.org/wiki/File:Wiehern.ogg) par Hü,
  Wikimedia Commons, **domaine public**.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests Vitest (un ou plusieurs par règle de SPEC.md)
npm run build      # construit le site dans dist/
```

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/main.tsx` | Démarre React, dans un `BrowserRouter` (les adresses `/` et `/liste`) |
| `src/App.tsx` | L'état de l'app (catalogue, liste, erreurs), l'en-tête, le menu et les routes |
| `src/ProductsPage.tsx`, `src/ProductCard.tsx` | La page Produits et une carte de produit |
| `src/ListPage.tsx`, `src/ShoppingList.tsx`, `src/ListLine.tsx` | La page Ma liste, ses sections et une ligne |
| `src/QuantityPicker.tsx`, `src/quantity.ts` | Le sélecteur [−] X [+] et ses bornes 1–99 |
| `src/api.ts` | Les appels à DummyJSON (catalogue, ajout, suppression) |
| `src/list.ts` | Les règles de la liste (ajouter, retirer, cocher, totaux), en fonctions pures |
| `src/money.ts` | Prix en centimes et affichage en euros |
| `src/search.ts` | Recherche sans accents et filtre par catégorie |
| `src/i18n/` | Dictionnaires français (produits, catégories) et fonctions de traduction |
| `src/storage.ts` | Lecture / écriture sûre dans le localStorage |
| `src/types.ts` | Les types `Product` et `ListItem` |
| `src/Unicorn.tsx` | Le dessin SVG de la licorne, réutilisé partout |
| `src/UnicornSky.tsx` | Les 6 licornes qui volent en fond |
| `src/CartUnicorn.tsx` | La licorne qui pousse un caddie après un ajout / un retrait |
| `src/unicorns.css` | Les animations des licornes (et leur arrêt si « moins d'animations ») |
| `src/sound.ts` | Joue le hennissement |
| `*.test.ts(x)`, `tests/` | Les tests (93) |
| `nginx.conf` | Config du serveur : renvoie l'app pour toutes les adresses (pour React Router) |
| `Dockerfile` | Image du conteneur : build Node puis nginx non-root sur le port 8080 |

## Déployer sur OpenShift

Après `oc login` (commande copiée depuis la console web du sandbox) :

```bash
# OpenShift récupère le code sur GitHub et construit l'image avec le Dockerfile
oc new-app https://github.com/SinfulDice/b3-liste-de-courses --strategy=docker --name=liste-de-courses
oc logs -f bc/liste-de-courses                                     # suivre le build
oc create route edge liste-de-courses --service=liste-de-courses   # adresse publique en HTTPS
oc get route liste-de-courses                                      # afficher l'adresse
```

Après un nouveau `git push` : `oc start-build liste-de-courses --follow`.
