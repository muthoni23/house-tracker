/* ── Helpers ──────────────────────────────────────────────────── */
const fmt = n => 'KES ' + parseFloat(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 });
const today = () => new Date().toISOString().split('T')[0];

let categories = [];
let donutChart = null;
let barChart = null;
let searchTimer = null;

/* ── Navigation ───────────────────────────────────────────────── */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const page = btn.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    // Close sidebar on mobile
    document.querySelector('.sidebar').classList.remove('open');
    if (page === 'dashboard') loadDashboard();
    if (page === 'expenses') loadExpenses();
    if (page === 'categories') loadCategories();
    if (page === 'add-expense') { resetForm(); document.getElementById('f-date').value = today(); }
  });
});

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

/* ── Toast ────────────────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

/* ── API ──────────────────────────────────────────────────────── */
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  return res.json();
}

/* ── Categories ───────────────────────────────────────────────── */
async function loadCategories() {
  categories = await api('/api/categories');
  renderCategoryGrid();
  populateCategorySelects();
}

function renderCategoryGrid() {
  const grid = document.getElementById('cat-grid');
  if (!categories.length) {
    grid.innerHTML = '<p class="empty-msg">No categories yet.</p>';
    return;
  }
  grid.innerHTML = categories.map(c => `
    <div class="cat-card">
      <div class="cat-card-top">
        <div class="cat-emoji" style="background:${c.color}22">${c.icon}</div>
        <div>
          <div class="cat-name">${c.name}</div>
        </div>
      </div>
      <div class="cat-total-row">
        <span class="cat-total-label">Total spent</span>
        <span class="cat-total">${fmt(c.total)}</span>
      </div>
      <div class="cat-actions">
        <button class="cat-edit" onclick='openCatModal(${JSON.stringify(c)})'>✏️ Edit</button>
        <button class="cat-delete" onclick="deleteCategory(${c.id}, '${c.name}')">🗑 Remove</button>
      </div>
    </div>
  `).join('');
}

/* ── Edit Category Modal ──────────────────────────────────────────── */
function openCatModal(c) {
  document.getElementById('ec-id').value = c.id;
  document.getElementById('ec-name').value = c.name;
  document.getElementById('ec-icon').value = c.icon;
  document.getElementById('ec-color').value = c.color;
  document.getElementById('edit-cat-modal').classList.remove('hidden');
}

function closeCatModal() {
  document.getElementById('edit-cat-modal').classList.add('hidden');
}

async function updateCategory() {
  const id = document.getElementById('ec-id').value;
  const name = document.getElementById('ec-name').value.trim();
  const icon = document.getElementById('ec-icon').value.trim() || '📦';
  const color = document.getElementById('ec-color').value;
  if (!name) return toast('Category name cannot be empty', 'error');
  await api(`/api/categories/${id}`, 'PUT', { name, icon, color });
  closeCatModal();
  toast('Category updated ✅');
  await loadCategories();
}

function populateCategorySelects() {
  const opts = categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  document.getElementById('f-category').innerHTML = '<option value="">Select category…</option>' + opts;
  document.getElementById('m-category').innerHTML = opts;
  const filter = document.getElementById('filter-category');
  filter.innerHTML = '<option value="">All Categories</option>' + opts;
}

async function addCategory() {
  const name = document.getElementById('cat-name').value.trim();
  const icon = document.getElementById('cat-icon').value.trim() || '📦';
  const color = document.getElementById('cat-color').value;
  if (!name) return toast('Please enter a category name', 'error');
  await api('/api/categories', 'POST', { name, icon, color });
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-icon').value = '';
  toast('Category added! ✅');
  loadCategories();
}

async function deleteCategory(id, name) {
  if (!confirm(`Delete "${name}"? This will also remove all its expenses.`)) return;
  await api(`/api/categories/${id}`, 'DELETE');
  toast('Category removed');
  loadCategories();
}

/* ── Expenses ─────────────────────────────────────────────────── */
async function loadExpenses() {
  const catId = document.getElementById('filter-category').value;
  let url = '/api/expenses';
  if (catId) url += `?category_id=${catId}`;
  const expenses = await api(url);
  renderExpenseTable(expenses);
}

function renderExpenseTable(expenses) {
  const tbody = document.getElementById('expense-tbody');
  const noMsg = document.getElementById('no-expenses');
  if (!expenses.length) {
    tbody.innerHTML = '';
    noMsg.classList.remove('hidden');
    return;
  }
  noMsg.classList.add('hidden');
  tbody.innerHTML = expenses.map(e => `
    <tr>
      <td>${e.date}</td>
      <td>
        <span class="cat-pill" style="background:${e.color}22; color:${e.color}">
          ${e.icon} ${e.category_name}
        </span>
      </td>
      <td>${e.description}</td>
      <td>${e.supplier || '—'}</td>
      <td class="amount-cell">${fmt(e.amount)}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon" onclick='openEditModal(${JSON.stringify(e)})'>✏️</button>
          <button class="btn-icon del" onclick="deleteExpense(${e.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function searchExpenses() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = document.getElementById('search-input').value.trim();
    if (!q) { loadExpenses(); return; }
    const expenses = await api(`/api/expenses?search=${encodeURIComponent(q)}`);
    renderExpenseTable(expenses);
  }, 350);
}

/* ── Add Expense Form ─────────────────────────────────────────── */
function resetForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('f-category').value = '';
  document.getElementById('f-date').value = today();
  document.getElementById('f-desc').value = '';
  document.getElementById('f-amount').value = '';
  document.getElementById('f-supplier').value = '';
  document.getElementById('f-notes').value = '';
  document.getElementById('form-page-title').textContent = 'Add Expense';
}

async function saveExpense() {
  const category_id = document.getElementById('f-category').value;
  const description = document.getElementById('f-desc').value.trim();
  const amount = parseFloat(document.getElementById('f-amount').value);
  const date = document.getElementById('f-date').value;

  if (!category_id || !description || !amount || !date) {
    return toast('Please fill in all required fields ⚠️', 'error');
  }
  const body = {
    category_id, description, amount, date,
    supplier: document.getElementById('f-supplier').value.trim(),
    notes: document.getElementById('f-notes').value.trim()
  };
  await api('/api/expenses', 'POST', body);
  toast('Expense saved! 💰');
  resetForm();
  // Update sidebar total
  loadSidebarTotal();
}

/* ── Edit Modal ───────────────────────────────────────────────── */
function openEditModal(e) {
  document.getElementById('m-id').value = e.id;
  // Populate category options if not yet
  if (!document.getElementById('m-category').options.length) populateCategorySelects();
  document.getElementById('m-category').value = e.category_id;
  document.getElementById('m-date').value = e.date;
  document.getElementById('m-desc').value = e.description;
  document.getElementById('m-amount').value = e.amount;
  document.getElementById('m-supplier').value = e.supplier || '';
  document.getElementById('m-notes').value = e.notes || '';
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

async function updateExpense() {
  const id = document.getElementById('m-id').value;
  const body = {
    category_id: document.getElementById('m-category').value,
    description: document.getElementById('m-desc').value.trim(),
    amount: parseFloat(document.getElementById('m-amount').value),
    date: document.getElementById('m-date').value,
    supplier: document.getElementById('m-supplier').value.trim(),
    notes: document.getElementById('m-notes').value.trim()
  };
  if (!body.category_id || !body.description || !body.amount || !body.date) {
    return toast('Please fill in all required fields', 'error');
  }
  await api(`/api/expenses/${id}`, 'PUT', body);
  closeModal();
  toast('Expense updated ✅');
  loadExpenses();
  loadSidebarTotal();
}

async function deleteExpense(id) {
  if (!confirm('Delete this expense?')) return;
  await api(`/api/expenses/${id}`, 'DELETE');
  toast('Expense deleted');
  loadExpenses();
  loadSidebarTotal();
}

/* ── Dashboard ────────────────────────────────────────────────── */
async function loadDashboard() {
  const data = await api('/api/summary');
  const { grand_total, by_category, by_month, recent } = data;

  document.getElementById('dash-total').textContent = fmt(grand_total);
  document.getElementById('sidebar-total').textContent = fmt(grand_total);

  // Count total transactions
  const allExp = await api('/api/expenses');
  document.getElementById('dash-count').textContent = allExp.length;

  // Top category
  const top = by_category.find(c => c.total > 0);
  document.getElementById('dash-top').textContent = top ? `${top.icon} ${top.name}` : '—';

  // This month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthRow = by_month.find(m => m.month === thisMonth);
  document.getElementById('dash-month').textContent = fmt(monthRow ? monthRow.total : 0);

  // Donut chart
  const cats = by_category.filter(c => c.total > 0);
  const labels = cats.map(c => `${c.icon} ${c.name}`);
  const values = cats.map(c => c.total);
  const colors = cats.map(c => c.color);

  if (donutChart) donutChart.destroy();
  const dCtx = document.getElementById('donut-chart').getContext('2d');
  donutChart = new Chart(dCtx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#1a1d27' }] },
    options: {
      cutout: '70%',
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: ctx => ` ${fmt(ctx.parsed)}` }
      }},
      animation: { animateRotate: true }
    }
  });

  // Legend
  document.getElementById('donut-legend').innerHTML = cats.map(c => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${c.color}"></div>
      <span>${c.icon} ${c.name}</span>
    </div>
  `).join('');

  // Bar chart
  if (barChart) barChart.destroy();
  const bCtx = document.getElementById('bar-chart').getContext('2d');
  barChart = new Chart(bCtx, {
    type: 'bar',
    data: {
      labels: by_month.map(m => m.month),
      datasets: [{
        label: 'Monthly Spend (KES)',
        data: by_month.map(m => m.total),
        backgroundColor: '#f5a62366',
        borderColor: '#f5a623',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#2e3149' }, ticks: { color: '#8e94b0' } },
        y: { grid: { color: '#2e3149' }, ticks: { color: '#8e94b0', callback: v => 'KES ' + v.toLocaleString() } }
      }
    }
  });

  // Recent
  const rl = document.getElementById('recent-list');
  if (!recent.length) {
    rl.innerHTML = '<p class="empty-msg">No expenses recorded yet.</p>';
    return;
  }
  rl.innerHTML = recent.map(r => `
    <div class="recent-item">
      <div class="recent-icon" style="background:#f5a62322">${r.icon}</div>
      <div class="recent-info">
        <div class="recent-desc">${r.description}</div>
        <div class="recent-cat">${r.category} · ${r.date}</div>
      </div>
      <div class="recent-amount">${fmt(r.amount)}</div>
    </div>
  `).join('');
}

async function loadSidebarTotal() {
  const data = await api('/api/summary');
  document.getElementById('sidebar-total').textContent = fmt(data.grand_total);
}

/* ── Init ─────────────────────────────────────────────────────── */
(async () => {
  await loadCategories();
  await loadDashboard();
  document.getElementById('f-date').value = today();
})();
