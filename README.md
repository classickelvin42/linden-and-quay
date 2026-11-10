# Precious and Things

A sample storefront for a women’s boutique. It is a static site: HTML, CSS, and a few JavaScript modules. There is no build step and no package install.

The catalog, prices, stock, announcement, and policies are placeholders. They are not the boutique’s live facts.

## Run it

From this folder:

```bash
python3 server.py
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). The shop server loads the catalog and stores orders, contact messages, and newsletter emails in `data/shop.db`. Opening the HTML files directly will leave the shop empty and the forms unable to save.

## Edit the shop

| What | Where |
| --- | --- |
| Name, currency, locale, announcement, contact placeholders | `data/store.json` |
| Products, prices, sizes, colours, stock, copy, image paths | `data/products.json` |
| Photographs | `images/products/` and `images/brand/` |
| Colours and type | `css/styles.css` |

Prices are minor units of the currency in `data/store.json`. With `USD`, `16800` displays as $168.00. Change `currency` and `locale` together if the boutique sells in another currency. The site does not assume a country or a shipping region.

Apparel uses letter sizes. Footwear uses EU sizes. Watches use an empty `sizes` array, so the product page does not ask for a size.

## Before accepting orders

- Replace the sample catalog and photographs with the studio’s own.
- Rewrite the announcement, about page, privacy page, and terms.
- Put a real email and address in `data/store.json` and on the contact page.
- Connect a payment provider (Stripe, Shopify, or similar) at checkout. Do not add a form that collects card numbers.
- Newsletter emails and contact messages are saved in `data/shop.db`. They are not emailed. Connect a mail service before launch if someone should receive them.
- Connect accounts if you want sign-in. The account button explains that none is configured.
- Confirm shipping and tax rules, then show real rates. This demo leaves them unpriced on purpose.

The bag is stored in this browser under the key `precious-cart`. Saved pieces use `precious-wishlist`. Clearing site data empties both.

Other pages: `wishlist.html`, `size-guide.html`, `journal.html`, and `track.html`. Checkout saves an order and returns a reference. Lookup finds that order. Payment is not taken.

## Photographs

Product and brand images are stock photographs from Unsplash and Pexels, saved locally so the shop does not depend on those CDNs at view time. Replace them before launch. Credits and source pages are in `data/image-credits.json`.
