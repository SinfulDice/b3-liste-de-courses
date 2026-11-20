import type { Summary as SummaryData } from './coupons'
import { formatEuros } from './money'

// R46 : le récapitulatif. <dl> = liste de "termes" (dt) et de leurs "valeurs" (dd).
// Les lignes Réductions et Total après réductions n'apparaissent que si un coupon est coché.
export function Summary({ summary, hasCoupons }: { summary: SummaryData; hasCoupons: boolean }) {
  return (
    <dl className="summary" aria-label="Récapitulatif">
      <div>
        <dt>Articles</dt>
        <dd>{summary.count}</dd>
      </div>
      <div>
        <dt>Total</dt>
        <dd>{formatEuros(summary.total)}</dd>
      </div>
      {hasCoupons && (
        <>
          <div className="summary-discount">
            <dt>Réductions</dt>
            <dd>−{formatEuros(summary.discount)}</dd>
          </div>
          <div>
            <dt>Total après réductions</dt>
            <dd>{formatEuros(summary.afterDiscount)}</dd>
          </div>
        </>
      )}
      <div>
        <dt>Déjà acheté</dt>
        <dd>{formatEuros(summary.bought)}</dd>
      </div>
      <div className="summary-remaining">
        <dt>Reste à payer</dt>
        <dd>{formatEuros(summary.remaining)}</dd>
      </div>
    </dl>
  )
}
