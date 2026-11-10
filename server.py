#!/usr/bin/env python3
"""Serve Precious and Things and store orders, messages, and newsletter emails."""

import json
import re
import secrets
import sqlite3
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "shop.db"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
HOST = "127.0.0.1"
PORT = 8080


def connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY,
                reference TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                address TEXT NOT NULL,
                subtotal INTEGER NOT NULL,
                currency TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY,
                order_id INTEGER NOT NULL REFERENCES orders(id),
                product_id TEXT NOT NULL,
                name TEXT NOT NULL,
                size TEXT NOT NULL,
                qty INTEGER NOT NULL,
                unit_price INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS subscribers (
                id INTEGER PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )


def timestamp():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_catalog():
    products = json.loads((ROOT / "data" / "products.json").read_text())
    store = json.loads((ROOT / "data" / "store.json").read_text())
    catalog = {product["id"]: product for product in products["products"]}
    return store, catalog


class ShopHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/orders":
            reference = parse_qs(parsed.query).get("reference", [""])[0]
            self.lookup_order(reference)
            return
        if parsed.path.startswith("/api/"):
            self.send_json(404, {"error": "Not found."})
            return
        if self.blocked(parsed.path):
            self.send_error(404)
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length > 100_000:
            self.send_json(413, {"error": "That request is too large."})
            return
        raw = self.rfile.read(length) if length else b""
        try:
            body = json.loads(raw.decode() or "{}")
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Send JSON."})
            return
        if not isinstance(body, dict):
            self.send_json(400, {"error": "Send a JSON object."})
            return
        if parsed.path == "/api/orders":
            self.create_order(body)
        elif parsed.path == "/api/messages":
            self.create_message(body)
        elif parsed.path == "/api/subscribers":
            self.create_subscriber(body)
        else:
            self.send_json(404, {"error": "Not found."})

    def blocked(self, path):
        lowered = path.lower()
        return lowered.startswith("/data/shop.db") or "/.git" in lowered or lowered.startswith("/server.py")

    def send_json(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def create_order(self, body):
        name = str(body.get("name", "")).strip()
        email = str(body.get("email", "")).strip()
        address = str(body.get("address", "")).strip()
        items = body.get("items")
        if len(name) < 2:
            self.send_json(400, {"error": "Enter a full name."})
            return
        if not EMAIL_RE.match(email):
            self.send_json(400, {"error": "Enter an email address like name@example.com."})
            return
        if len(address) < 8:
            self.send_json(400, {"error": "Enter a fuller address."})
            return
        if not isinstance(items, list) or not items:
            self.send_json(400, {"error": "The bag is empty."})
            return

        store, catalog = load_catalog()
        lines = []
        for item in items:
            if not isinstance(item, dict):
                self.send_json(400, {"error": "Each bag line needs a product."})
                return
            product = catalog.get(str(item.get("id", "")))
            if not product or not product.get("inStock", True):
                self.send_json(400, {"error": "A piece in the bag is no longer available."})
                return
            size = str(item.get("size") or "")
            sizes = product.get("sizes") or []
            if sizes and size not in sizes:
                self.send_json(400, {"error": f"Choose a listed size for {product['name']}."})
                return
            if not sizes and size:
                self.send_json(400, {"error": f"{product['name']} does not take a size."})
                return
            try:
                qty = int(item.get("qty"))
            except (TypeError, ValueError):
                self.send_json(400, {"error": "Quantity must be a whole number."})
                return
            if qty < 1 or qty > 8:
                self.send_json(400, {"error": "Quantity must be from 1 to 8."})
                return
            lines.append(
                {
                    "product_id": product["id"],
                    "name": product["name"],
                    "size": size,
                    "qty": qty,
                    "unit_price": int(product["price"]),
                }
            )

        subtotal = sum(line["unit_price"] * line["qty"] for line in lines)
        created = timestamp()
        currency = store.get("currency", "USD")
        with connect() as connection:
            for _ in range(3):
                reference = "PT-" + secrets.token_hex(4).upper()
                try:
                    cursor = connection.execute(
                        """
                        INSERT INTO orders
                            (reference, name, email, address, subtotal, currency, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (reference, name, email, address, subtotal, currency, "placed", created),
                    )
                    break
                except sqlite3.IntegrityError:
                    continue
            else:
                self.send_json(500, {"error": "Could not create an order reference."})
                return
            order_id = cursor.lastrowid
            connection.executemany(
                """
                INSERT INTO order_items
                    (order_id, product_id, name, size, qty, unit_price)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    (order_id, line["product_id"], line["name"], line["size"], line["qty"], line["unit_price"])
                    for line in lines
                ],
            )

        self.send_json(
            201,
            {
                "reference": reference,
                "status": "placed",
                "subtotal": subtotal,
                "currency": currency,
                "createdAt": created,
                "payment": "not_taken",
                "items": lines,
            },
        )

    def lookup_order(self, reference):
        reference = reference.strip()
        if len(reference) < 4:
            self.send_json(400, {"error": "Enter a reference of at least 4 characters."})
            return
        with connect() as connection:
            order = connection.execute(
                "SELECT * FROM orders WHERE reference = ? COLLATE NOCASE",
                (reference,),
            ).fetchone()
            if not order:
                self.send_json(404, {"error": "No order matches that reference."})
                return
            items = connection.execute(
                "SELECT name, size, qty, unit_price FROM order_items WHERE order_id = ?",
                (order["id"],),
            ).fetchall()
        self.send_json(
            200,
            {
                "reference": order["reference"],
                "status": order["status"],
                "subtotal": order["subtotal"],
                "currency": order["currency"],
                "createdAt": order["created_at"],
                "payment": "not_taken",
                "items": [dict(row) for row in items],
            },
        )

    def create_message(self, body):
        name = str(body.get("name", "")).strip()
        email = str(body.get("email", "")).strip()
        message = str(body.get("message", "")).strip()
        if len(name) < 2 or not EMAIL_RE.match(email) or len(message) < 12:
            self.send_json(400, {"error": "Check the name, email, and message."})
            return
        with connect() as connection:
            cursor = connection.execute(
                "INSERT INTO messages (name, email, message, created_at) VALUES (?, ?, ?, ?)",
                (name, email, message, timestamp()),
            )
        self.send_json(201, {"id": cursor.lastrowid})

    def create_subscriber(self, body):
        email = str(body.get("email", "")).strip().lower()
        if body.get("consent") is not True:
            self.send_json(400, {"error": "Consent is required before this email is saved."})
            return
        if not EMAIL_RE.match(email):
            self.send_json(400, {"error": "Enter an email address like name@example.com."})
            return
        with connect() as connection:
            connection.execute(
                """
                INSERT INTO subscribers (email, created_at)
                VALUES (?, ?)
                ON CONFLICT(email) DO NOTHING
                """,
                (email, timestamp()),
            )
        self.send_json(201, {"saved": True})


def main():
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), ShopHandler)
    print(f"Precious and Things at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
