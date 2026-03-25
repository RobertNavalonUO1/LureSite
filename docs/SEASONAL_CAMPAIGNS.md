# Seasonal Campaign Operations

This guide documents the practical path to switch Limoneo seasonal content without opening a parallel implementation track.

## Source of truth

- Runtime banner and campaign selection is resolved by `app/Services/CampaignBannerResolver.php`.
- The resolver reads the `campaign.mode` and `campaign.manual_slug` settings.
- Static campaign defaults and landing structure live in `config/landing.php`.
- Shared storefront brand assets live in `resources/js/config/site.js` and public assets such as `public/images/logo.png`, `public/favicon.svg`, and `public/site.webmanifest`.

## Modes

### `campaign.mode = seasonal`

- The resolver chooses the active campaign automatically from the current date.
- Use this when a season should roll over without operator intervention.

### `campaign.mode = manual`

- The resolver uses `campaign.manual_slug`.
- Use this when marketing wants to pin a specific campaign regardless of calendar date.

## Recommended change flow

1. Create or update the campaign content in the admin/settings path that feeds the landing banners.
2. Confirm the slug that should become active.
3. Set `campaign.mode` to `manual` and set `campaign.manual_slug` to that slug for forced activation.
4. Review home, category rails, and product spotlight placements because the resolver serves multiple surfaces.
5. When the campaign should return to date-driven rotation, set `campaign.mode` back to `seasonal`.

## Brand surfaces to review with every seasonal change

- Header promo copy and support shortcuts.
- Home hero and banner placements.
- Search and category merchandising blocks.
- Checkout summary messaging if the campaign changes shipping or payment conditions.
- Footer/help copy if support expectations change.
- Browser assets if the campaign requires a temporary favicon or app icon refresh.

## Safe operator checklist

1. Verify translated copy in `resources/js/i18n/es.json`, `resources/js/i18n/en.json`, and `resources/js/i18n/fr.json` if visible text changes.
2. Confirm the active logo/icon set still matches the campaign.
3. Validate home, search, product, cart, and checkout flows after the switch.
4. If production deployment is needed, follow `docs/PRODUCTION.md` and do not use an in-place git pull in the live release path.