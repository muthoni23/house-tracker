import pymysql
pymysql.install_as_MySQLdb()
from flask import Flask, render_template, request, jsonify
from flask_mysqldb import MySQL
from datetime import datetime
import json

app = Flask(__name__)

# ── MySQL Configuration ──────────────────────────────────────────────────────
# Update these values to match your MySQL setup
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Muthoni1234!'
app.config['MYSQL_DB'] = 'house_tracker'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)


# ── Database Setup ───────────────────────────────────────────────────────────
def init_db():
    with app.app_context():
        cur = mysql.connection.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                icon VARCHAR(50) DEFAULT '🏗️',
                color VARCHAR(20) DEFAULT '#4f7ef8',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category_id INT NOT NULL,
                description VARCHAR(255) NOT NULL,
                amount DECIMAL(12,2) NOT NULL,
                supplier VARCHAR(150),
                date DATE NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
            )
        """)
        # Seed default categories
        defaults = [
            ('Cement & Concrete', '🧱', '#e67e22'),
            ('Paint & Finishes', '🎨', '#9b59b6'),
            ('Tiles & Flooring', '🪟', '#1abc9c'),
            ('Roofing', '🏠', '#e74c3c'),
            ('Plumbing', '🚿', '#3498db'),
            ('Electrical', '⚡', '#f39c12'),
            ('Steel & Iron', '🔩', '#7f8c8d'),
            ('Windows & Doors', '🚪', '#2ecc71'),
            ('Sand & Ballast', '⛏️', '#d35400'),
            ('Labour & Wages', '👷', '#2980b9'),
            ('Timber & Wood', '🌲', '#27ae60'),
            ('Other', '📦', '#95a5a6'),
        ]
        for name, icon, color in defaults:
            cur.execute(
                "INSERT IGNORE INTO categories (name, icon, color) VALUES (%s, %s, %s)",
                (name, icon, color)
            )
        mysql.connection.commit()
        cur.close()


# ── Routes ───────────────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


# Categories
@app.route('/api/categories', methods=['GET'])
def get_categories():
    cur = mysql.connection.cursor()
    cur.execute("""
        SELECT c.*, COALESCE(SUM(e.amount), 0) AS total
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id
        GROUP BY c.id
        ORDER BY c.name
    """)
    rows = cur.fetchall()
    cur.close()
    return jsonify(rows)


@app.route('/api/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    cur = mysql.connection.cursor()
    cur.execute(
        "INSERT INTO categories (name, icon, color) VALUES (%s, %s, %s)",
        (data['name'], data.get('icon', '📦'), data.get('color', '#4f7ef8'))
    )
    mysql.connection.commit()
    new_id = cur.lastrowid
    cur.close()
    return jsonify({'id': new_id, 'message': 'Category added'})


@app.route('/api/categories/<int:cat_id>', methods=['PUT'])
def update_category(cat_id):
    data = request.get_json()
    cur = mysql.connection.cursor()
    cur.execute(
        "UPDATE categories SET name=%s, icon=%s, color=%s WHERE id=%s",
        (data['name'], data.get('icon', '📦'), data['color'], cat_id)
    )
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Category updated'})


@app.route('/api/categories/<int:cat_id>', methods=['DELETE'])
def delete_category(cat_id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM categories WHERE id = %s", (cat_id,))
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Category deleted'})


# Expenses
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    cat_id = request.args.get('category_id')
    search = request.args.get('search', '')
    cur = mysql.connection.cursor()
    if cat_id:
        cur.execute("""
            SELECT e.*, c.name AS category_name, c.icon, c.color
            FROM expenses e JOIN categories c ON e.category_id = c.id
            WHERE e.category_id = %s
            ORDER BY e.date DESC
        """, (cat_id,))
    elif search:
        cur.execute("""
            SELECT e.*, c.name AS category_name, c.icon, c.color
            FROM expenses e JOIN categories c ON e.category_id = c.id
            WHERE e.description LIKE %s OR e.supplier LIKE %s OR c.name LIKE %s
            ORDER BY e.date DESC
        """, (f'%{search}%', f'%{search}%', f'%{search}%'))
    else:
        cur.execute("""
            SELECT e.*, c.name AS category_name, c.icon, c.color
            FROM expenses e JOIN categories c ON e.category_id = c.id
            ORDER BY e.date DESC
        """)
    rows = cur.fetchall()
    cur.close()
    # Convert Decimal to float for JSON
    for row in rows:
        row['amount'] = float(row['amount'])
        if row.get('date'):
            row['date'] = str(row['date'])
    return jsonify(rows)


@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.get_json()
    cur = mysql.connection.cursor()
    cur.execute("""
        INSERT INTO expenses (category_id, description, amount, supplier, date, notes)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        data['category_id'],
        data['description'],
        data['amount'],
        data.get('supplier', ''),
        data['date'],
        data.get('notes', '')
    ))
    mysql.connection.commit()
    new_id = cur.lastrowid
    cur.close()
    return jsonify({'id': new_id, 'message': 'Expense recorded'})


@app.route('/api/expenses/<int:exp_id>', methods=['PUT'])
def update_expense(exp_id):
    data = request.get_json()
    cur = mysql.connection.cursor()
    cur.execute("""
        UPDATE expenses
        SET category_id=%s, description=%s, amount=%s, supplier=%s, date=%s, notes=%s
        WHERE id=%s
    """, (
        data['category_id'], data['description'], data['amount'],
        data.get('supplier', ''), data['date'], data.get('notes', ''), exp_id
    ))
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Expense updated'})


@app.route('/api/expenses/<int:exp_id>', methods=['DELETE'])
def delete_expense(exp_id):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM expenses WHERE id = %s", (exp_id,))
    mysql.connection.commit()
    cur.close()
    return jsonify({'message': 'Expense deleted'})


# Summary / Analytics
@app.route('/api/summary', methods=['GET'])
def get_summary():
    cur = mysql.connection.cursor()
    # Total spent
    cur.execute("SELECT COALESCE(SUM(amount), 0) AS grand_total FROM expenses")
    grand_total = float(cur.fetchone()['grand_total'])

    # By category
    cur.execute("""
        SELECT c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) AS total
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id
        GROUP BY c.id
        ORDER BY total DESC
    """)
    by_category = cur.fetchall()
    for row in by_category:
        row['total'] = float(row['total'])

    # By month
    cur.execute("""
        SELECT DATE_FORMAT(date, '%Y-%m') AS month,
               SUM(amount) AS total
        FROM expenses
        GROUP BY month
        ORDER BY month
    """)
    by_month = cur.fetchall()
    for row in by_month:
        row['total'] = float(row['total'])

    # Recent 5 expenses
    cur.execute("""
        SELECT e.description, e.amount, e.date, c.name AS category, c.icon
        FROM expenses e JOIN categories c ON e.category_id = c.id
        ORDER BY e.created_at DESC LIMIT 5
    """)
    recent = cur.fetchall()
    for row in recent:
        row['amount'] = float(row['amount'])
        row['date'] = str(row['date'])

    cur.close()
    return jsonify({
        'grand_total': grand_total,
        'by_category': by_category,
        'by_month': by_month,
        'recent': recent
    })


if __name__ == '__main__':
    init_db()
    app.run(debug=True)
