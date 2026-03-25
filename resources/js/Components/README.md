# Components

Components are organized by domain folders (feature areas) to keep the codebase easy to navigate.

## Structure
- `auth/`: Login/Register/Forgot password modals.
- `ui/`: Small reusable UI primitives (inputs, buttons, modal, loaders).
- `navigation/`: Header, nav menus, search UI, user menus.
- `cart/`: Cart dropdown/drawer and cart UI.
- `checkout/`: Checkout page components.
- `catalog/`: Product cards/grids/details and category UI.
- `marketing/`: Banners, showcases, promo popups.
- `cookies/`: Cookie consent/settings modals.
- `legal/`: Terms/Privacy modals.
- `avatar/`: Avatar creator/viewer components.

## Import convention (stable)
Prefer importing from the `Components/` root:
- `import Header from '@/Components/navigation\Header.jsx'`
- `import InputLabel from '@/Components/ui\InputLabel.jsx'`

The root files are thin re-export shims, so imports stay stable even if a component is moved between domain folders.
