// R30 : hennissement ("Wiehern.ogg", Wikimedia Commons, domaine public).
// Le fichier est dans public/ : Vite le sert tel quel à l'adresse /sounds/neigh.ogg.
export const NEIGH_URL = '/sounds/neigh.ogg'

export function playNeigh(): void {
  try {
    // Un nouvel objet Audio à chaque fois : deux hennissements rapprochés peuvent se superposer.
    const audio = new Audio(NEIGH_URL)
    // play() renvoie une "promesse" qui échoue si le navigateur refuse ou ne sait pas lire le fichier.
    // On attrape cet échec et on l'ignore : un son raté ne doit jamais casser l'app (R30).
    audio.play()?.catch(() => {})
  } catch {
    // Navigateur sans support audio : on ne fait rien.
  }
}
