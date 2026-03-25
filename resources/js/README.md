# Frontend (resources/js)

This folder contains the React + Inertia frontend used by Laravel.

## Entry points
- `app.jsx`: Inertia app bootstrap + page resolver.
- `bootstrap.js`: Axios setup and global JS bootstrapping.
- `firebase.js`: Firebase client initialization (Auth providers).

## Main folders
- `Components/`: Reusable UI and feature components.
- `Layouts/`: Shared page layouts.
- `Pages/`: Inertia pages. Server-side routes call `Inertia::render('<Folder/PageName>')` which maps to `Pages/<Folder>/<PageName>.jsx`.
- `config/`: Frontend configuration objects.
- `utils/`: Reusable utilities (Firebase login helpers, country lists, etc).

### Components structure
`Components/` is organized by domain (e.g. `Components/ui`, `Components/auth`, `Components/cart`, etc.).

Import components directly from their domain folder (no re-export “shims” in `Components/` root):
- `@/Components/ui/InputLabel`
- `@/Components/cart/CartDropdown`
- `@/Components/navigation/Header`

## Housekeeping
- `_legacy/`: Old/backup files kept for reference. Not included in the Inertia resolver.
- `_dev/`: Small demos / experiments. Not included in the Inertia resolver.

## Import aliases
This repo uses an alias:
- `@/` → `resources/js/` (configured in `jsconfig.json`)
