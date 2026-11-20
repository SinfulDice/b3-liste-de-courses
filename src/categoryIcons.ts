import {
  Car,
  Clock,
  CookingPot,
  Droplet,
  Footprints,
  Gem,
  Glasses,
  Handbag,
  Headphones,
  Lamp,
  Laptop,
  type LucideIcon,
  Motorbike,
  Package,
  Palette,
  Scissors,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  SportShoe,
  SprayCan,
  Tablet,
  Volleyball,
  Watch,
} from 'lucide-react'

// R68 : une icône Lucide par catégorie DummyJSON. Chaque icône est un composant React (<Shirt />…).
// "LucideIcon" est le type commun à toutes ces icônes.
// Pas de robe dans Lucide : les ciseaux (couture) la remplacent ; « Hauts » et « Chemises homme »
// partagent la chemise.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  beauty: Palette,
  fragrances: SprayCan,
  furniture: Sofa,
  groceries: ShoppingBasket,
  'home-decoration': Lamp,
  'kitchen-accessories': CookingPot,
  laptops: Laptop,
  'mens-shirts': Shirt,
  'mens-shoes': SportShoe,
  'mens-watches': Watch,
  'mobile-accessories': Headphones,
  motorcycle: Motorbike,
  'skin-care': Droplet,
  smartphones: Smartphone,
  'sports-accessories': Volleyball,
  sunglasses: Glasses,
  tablets: Tablet,
  tops: Shirt,
  vehicle: Car,
  'womens-bags': Handbag,
  'womens-dresses': Scissors,
  'womens-jewellery': Gem,
  'womens-shoes': Footprints,
  'womens-watches': Clock,
}

// R68 + R34 : catégorie inconnue -> icône générique (un colis).
export const FALLBACK_ICON: LucideIcon = Package

export function iconFor(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? FALLBACK_ICON
}
