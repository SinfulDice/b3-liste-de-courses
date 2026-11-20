# Liste de courses

Petite application web de liste de courses (projet B3) en **React + TypeScript**, qui utilise
l'API publique [DummyJSON](https://dummyjson.com) comme catalogue de produits.
Déployée sur **Red Hat OpenShift** (Developer Sandbox) : https://liste-de-courses-pierre-antoine-sut-dev.apps.rm1.0a51.p1.openshiftapps.com

- On choisit un produit dans le catalogue (catégorie *groceries* de DummyJSON) et on l'ajoute.
- Ajouter un produit déjà présent augmente sa quantité de 1.
- On peut supprimer une ligne de la liste.
- Des licornes ailées volent en fond ; à chaque ajout ou suppression réussi, une licorne hennit et
  traverse l'écran en poussant un caddie avec le nom du produit (barré pour une suppression).

Les règles exactes sont dans [`SPEC.md`](SPEC.md) (R1 à R31).

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
| `src/api.ts` | Les appels à DummyJSON (catalogue, ajout, suppression) |
| `src/list.ts` | Les règles de la liste (ajouter / quantité / supprimer), en fonctions pures |
| `src/App.tsx` | L'interface : menu du catalogue, liste, messages |
| `src/types.ts` | Les types `Product` et `ListItem` |
| `src/Unicorn.tsx` | Le dessin SVG de la licorne, réutilisé partout |
| `src/UnicornSky.tsx` | Les 6 licornes qui volent en fond |
| `src/CartUnicorn.tsx` | La licorne qui pousse un caddie après un ajout / une suppression |
| `src/unicorns.css` | Les animations des licornes (et leur arrêt si « moins d'animations ») |
| `src/sound.ts` | Joue le hennissement |
| `*.test.ts(x)`, `tests/` | Les tests |
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
