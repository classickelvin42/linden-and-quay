# Linden & Quay

Demonstration website for a fictional Bristol estate agency. Listings, staff, and contact details are sample content.

## Run

From this folder:

```bash
ruby -run -ehttpd . -p 8080
```

Open http://127.0.0.1:8080

The pages use ES modules, so open them through a local server rather than as files.

## Replace before a real launch

- `data/properties.json` — the only catalogue. Prices are GBP. Dates are `YYYY-MM-DD`.
- Company name, phone, email, and address. Search for `0117 496 0148` and `hello@lindenandquay.example`.
- The sample banner at the top of each page, and the `noindex` meta tag.
- `https://lindenandquay.example` in the social metadata.
- Photographs. The contemporary stand-ins are listed in `data/image-credits.json`.
- Agent profiles on `about.html`. None are invented.

## Not connected

- Forms do not send email. The hook is the comment at the top of `js/forms.js`.
- There is no property pin. The hook is the comment in `js/property.js`.
- There is no analytics.

The phone number is in the Ofcom Bristol drama range. The email uses the reserved `.example` domain.
