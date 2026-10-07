# 🏗️ Mama's House Budget Tracker

A beautiful web app to track every shilling spent building the house —
cement, tiles, paint, plumbing, labour, and more.

---

## ✅ Requirements

- Python 3.8+
- MySQL 5.7+ (or MariaDB 10.3+)
- pip

---

## 🚀 Setup Instructions

### 1. Set up the database

Open your MySQL terminal and run:

```bash
mysql -u root -p < setup.sql
```

This creates the `house_tracker` database, tables, and default categories.

---

### 2. Configure database credentials

Open `app.py` and update these lines near the top:

```python
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'your_password'   # ← change this
app.config['MYSQL_DB'] = 'house_tracker'
```

---

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

> On Linux you may need: `sudo apt-get install libmysqlclient-dev` first.

---

### 4. Run the app

```bash
python app.py
```

Then open your browser and go to: **http://127.0.0.1:5000**

---

## 📱 Features

| Feature | Description |
|---|---|
| 📊 Dashboard | Visual overview: donut chart by category, monthly bar chart, recent expenses |
| 💸 All Expenses | Browse, search, and filter all records; edit or delete any entry |
| 🗂️ Categories | Default categories (cement, paint, tiles, etc.) + add your own with custom emoji & colour |
| ➕ Add Expense | Record date, category, amount, supplier, and notes |
| ✏️ Edit / Delete | Update any expense or remove it with one click |

---

## 📂 Project Structure

```
house-tracker/
├── app.py              ← Flask backend + all API routes
├── setup.sql           ← Run once to create the DB
├── requirements.txt    ← Python packages
├── templates/
│   └── index.html      ← Single-page app shell
└── static/
    ├── css/style.css   ← All styles
    └── js/app.js       ← All frontend logic + Chart.js charts
```

---

## 💡 Tips

- The currency is set to **KES (Kenyan Shillings)** — to change it, search for `KES` in `app.js` and `style.css`.
- Categories can be added, but **default ones cannot be deleted** without first deleting their expenses.
- The app works great on mobile too — just open the browser on your phone while connected to the same Wi-Fi.
