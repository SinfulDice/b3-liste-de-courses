import { CategoryIcon } from './CategoryIcon'
import { categoryName } from './i18n/translate'
import { ALL_CATEGORIES } from './search'

type Props = {
  categories: string[] // déjà triées (R70)
  value: string
  french: boolean
  onChange: (slug: string) => void
}

// R69 : le filtre Catégorie en rangée de boutons « icône + nom ».
// aria-pressed dit aux lecteurs d'écran quel bouton est « enfoncé » (= choisi).
export function CategoryFilter({ categories, value, french, onChange }: Props) {
  return (
    <div className="chips-wrap">
      <span id="category-label" className="chips-label">
        Catégorie
      </span>
      {/* role="group" + aria-labelledby : les boutons forment un groupe nommé « Catégorie ». */}
      <div className="chips" role="group" aria-labelledby="category-label">
        <button
          type="button"
          className="chip"
          aria-pressed={value === ALL_CATEGORIES}
          onClick={() => onChange(ALL_CATEGORIES)}
        >
          Toutes
        </button>
        {categories.map((slug) => (
          <button
            key={slug}
            type="button"
            className="chip"
            aria-pressed={value === slug}
            onClick={() => onChange(slug)}
          >
            <CategoryIcon slug={slug} size={16} />
            {categoryName(slug, french)}
          </button>
        ))}
      </div>
    </div>
  )
}
