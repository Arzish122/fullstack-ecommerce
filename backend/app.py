import sqlite3
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow frontend requests

DATABASE = 'products.db'

# ---------- DATABASE CONNECTION ----------
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# ---------- INITIALIZE DATABASE ----------
def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()

        # Create products table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                current_price REAL NOT NULL,
                old_price REAL,
                rating REAL,
                star_count INTEGER,
                orders INTEGER,
                image TEXT NOT NULL,
                category TEXT
            )
        ''')

        # Create cart_items table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        ''')

        db.commit()

# ---------- ADMIN DASHBOARD ADD PRODUCT ----------
@app.route('/add_product', methods=['POST'])
def add_product():
    try:
        data = request.json
        required = ['title', 'description', 'current_price', 'image', 'category']
        if not all(key in data for key in required):
            return jsonify({"error": "Missing required fields"}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO products (title, description, current_price, old_price, rating, star_count, orders, image, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['title'],
            data['description'],
            data['current_price'],
            data.get('old_price'),
            data.get('rating'),
            data.get('star_count'),
            data.get('orders'),
            data['image'],
            data['category']
        ))
        db.commit()
        return jsonify({"message": "Product added successfully", "id": cursor.lastrowid}), 201
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

# ---------- ADMIN DASHBOARD UPDATE PRODUCT ----------
@app.route('/update_product/<int:id>', methods=['PUT'])
def update_product(id):
    try:
        data = request.json
        required = ['title', 'description', 'current_price', 'image', 'category']
        if not all(key in data for key in required):
            return jsonify({"error": "Missing required fields"}), 400

        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            UPDATE products
            SET title = ?, description = ?, current_price = ?, old_price = ?, 
                rating = ?, star_count = ?, orders = ?, image = ?, category = ?
            WHERE id = ?
        """, (
            data['title'],
            data['description'],
            data['current_price'],
            data.get('old_price'),
            data.get('rating', 0),
            data.get('star_count', 0),
            data.get('orders', 0),
            data['image'],
            data['category'],
            id
        ))

        db.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Product not found"}), 404
        return jsonify({"message": "Product updated successfully"}), 200
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

# ---------- ADMIN DASHBOARD DELETE PRODUCT ----------
@app.route('/delete_product/<int:id>', methods=['DELETE'])
def delete_product(id):
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM products WHERE id = ?", (id,))
        db.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Product not found"}), 404
        return jsonify({"message": "Product deleted successfully"}), 200
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

# ---------- PRODUCTS ----------
@app.route('/products', methods=['GET'])
def get_products():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    return jsonify([dict(row) for row in products])

@app.route('/product/<int:id>', methods=['GET'])
def get_product(id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (id,))
    product = cursor.fetchone()
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(dict(product))

# ---------- CART ----------
@app.route('/cart', methods=['GET'])
def get_cart():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT 
            ci.id, 
            ci.product_id, 
            ci.quantity, 
            p.title, 
            p.image,
            p.current_price
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
    """)
    cart_items = cursor.fetchall()
    return jsonify([dict(row) for row in cart_items])

@app.route('/cart/add', methods=['POST'])
def add_to_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity')

    if not product_id or not quantity:
        return jsonify({"error": "product_id and quantity are required"}), 400

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("SELECT id FROM products WHERE id = ?", (product_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Product not found"}), 404

        cursor.execute("SELECT id, quantity FROM cart_items WHERE product_id = ?", (product_id,))
        cart_item = cursor.fetchone()

        if cart_item:
            new_quantity = cart_item['quantity'] + quantity
            cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (new_quantity, cart_item['id']))
            message = "Product quantity updated in cart."
        else:
            cursor.execute("INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)", (product_id, quantity))
            message = "Product added to cart successfully."

        db.commit()
        return jsonify({"message": message}), 200

    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/cart/update/<int:id>', methods=['PUT'])
def update_cart_item(id):
    data = request.get_json()
    new_quantity = data.get('quantity')

    if not new_quantity or new_quantity < 1:
        return jsonify({"error": "Valid quantity is required"}), 400

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (new_quantity, id))
        db.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Cart item not found"}), 404
        return jsonify({"message": "Cart item updated successfully"}), 200
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/cart/remove/<int:id>', methods=['DELETE'])
def remove_from_cart(id):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM cart_items WHERE id = ?", (id,))
        db.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Cart item not found"}), 404
        return jsonify({"message": "Item removed from cart"}), 200
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

# ---------- IMAGES ----------
@app.route('/images/<filename>')
def get_image(filename):
    return send_from_directory('imgs', filename)

# ---------- MAIN ----------
if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
