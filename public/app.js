const API_BASE = '';

const state = {
  token: localStorage.getItem('fd_token') || '',
  user: JSON.parse(localStorage.getItem('fd_user') || 'null'),
  recordsPage: 1,
  recordsLimit: 10,
  recordFilters: {}
};

const incomeCategories = ['salary', 'investment', 'freelance', 'bonus', 'other_income'];
const expenseCategories = ['food', 'transportation', 'utilities', 'entertainment', 'healthcare', 'education', 'shopping', 'rent', 'insurance', 'other_expense'];
const allCategories = [...incomeCategories, ...expenseCategories];

const el = (id) => document.getElementById(id);

function showToast(message, isError = false) {
  const toast = el('toast');
  toast.textContent = message;
  toast.style.background = isError ? '#d93025' : '#1f6feb';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    const msg = data.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function setAuth(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('fd_token', token);
  localStorage.setItem('fd_user', JSON.stringify(user));
  renderAuth();
  loadAppData();
}

function clearAuth() {
  state.token = '';
  state.user = null;
  localStorage.removeItem('fd_token');
  localStorage.removeItem('fd_user');
  renderAuth();
}

function canAccessRecords(role) {
  return role === 'analyst' || role === 'admin';
}

function canManageRecords(role) {
  return role === 'admin';
}

function canManageUsers(role) {
  return role === 'admin';
}

function formatMoney(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function renderAuth() {
  const isLoggedIn = Boolean(state.token && state.user);
  el('authSection').classList.toggle('hidden', isLoggedIn);
  el('dashboardSection').classList.toggle('hidden', !isLoggedIn);
  el('logoutBtn').classList.toggle('hidden', !isLoggedIn);

  if (!isLoggedIn) {
    el('recordsSection').classList.add('hidden');
    el('usersSection').classList.add('hidden');
    el('authInfo').innerHTML = '<span class="badge">Guest</span> Not logged in';
    return;
  }

  const role = state.user.role;
  el('authInfo').innerHTML = `<span>${state.user.name} (${state.user.email})</span> <span class="badge">${role}</span>`;

  el('recordsSection').classList.toggle('hidden', !canAccessRecords(role));
  el('usersSection').classList.toggle('hidden', !canManageUsers(role));
  el('recordForm').classList.toggle('hidden', !canManageRecords(role));
  el('deletedRecordsWrap').classList.toggle('hidden', !canManageRecords(role));
}

function toRow(cells) {
  return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
}

async function loadDashboard() {
  const [summaryRes, recentRes] = await Promise.all([
    api('/api/dashboard/summary'),
    api('/api/dashboard/recent?limit=8')
  ]);

  const summary = summaryRes.data;
  el('kpiIncome').textContent = formatMoney(summary.totalIncome);
  el('kpiExpense').textContent = formatMoney(summary.totalExpense);
  el('kpiBalance').textContent = formatMoney(summary.netBalance);

  const categoryHtml = `
    <table>
      <thead><tr><th>Category</th><th>Type</th><th>Total</th><th>Count</th></tr></thead>
      <tbody>
        ${(summary.categoryTotals || []).map((c) => toRow([c.category, c.type, formatMoney(c.total), c.count])).join('') || '<tr><td colspan="4">No data</td></tr>'}
      </tbody>
    </table>
  `;
  el('categoryTotals').innerHTML = categoryHtml;

  const recentList = recentRes.data.recentActivity || summary.recentActivity || [];
  const recentHtml = `
    <table>
      <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Note</th></tr></thead>
      <tbody>
        ${recentList.map((r) => toRow([
          new Date(r.date).toLocaleDateString(),
          r.type,
          r.category,
          formatMoney(r.amount),
          r.note || ''
        ])).join('') || '<tr><td colspan="5">No recent activity</td></tr>'}
      </tbody>
    </table>
  `;
  el('recentActivity').innerHTML = recentHtml;

  renderMonthlyTrends(summary.monthlyTrends?.data || []);
}

async function loadTrendsForYear() {
  const year = el('trendYear').value.trim();
  const qs = year ? `?year=${encodeURIComponent(year)}` : '';
  const res = await api(`/api/dashboard/trends${qs}`);
  renderMonthlyTrends(res.data.data || []);
}

function renderMonthlyTrends(rows) {
  el('monthlyTrends').innerHTML = `
    <table>
      <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr></thead>
      <tbody>
        ${rows.map((m) => toRow([m.monthName, formatMoney(m.income), formatMoney(m.expense), formatMoney(m.net)])).join('') || '<tr><td colspan="4">No trend data</td></tr>'}
      </tbody>
    </table>
  `;
}

function buildRecordQuery() {
  const q = new URLSearchParams({ page: String(state.recordsPage), limit: String(state.recordsLimit) });
  Object.entries(state.recordFilters).forEach(([k, v]) => {
    if (v) q.set(k, v);
  });
  return q.toString();
}

async function loadRecords() {
  if (!canAccessRecords(state.user.role)) return;
  const res = await api(`/api/records?${buildRecordQuery()}`);
  const { records, pagination } = res.data;

  const canEdit = canManageRecords(state.user.role);
  el('recordsTableWrap').innerHTML = `
    <table>
      <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Note</th>${canEdit ? '<th>Actions</th>' : ''}</tr></thead>
      <tbody>
        ${records.map((r) => toRow([
          new Date(r.date).toLocaleDateString(),
          r.type,
          r.category,
          formatMoney(r.amount),
          r.note || '',
          canEdit ? `<button data-edit="${r._id}" class="btn btn-secondary">Edit</button> <button data-del="${r._id}" class="btn btn-secondary">Delete</button>` : ''
        ])).join('') || `<tr><td colspan="${canEdit ? 6 : 5}">No records found</td></tr>`}
      </tbody>
    </table>
  `;

  el('recordsPagination').innerHTML = `
    <span class="badge">Page ${pagination.page} / ${pagination.totalPages || 1}</span>
    <button class="btn btn-secondary" id="prevPage" ${pagination.hasPrevPage ? '' : 'disabled'}>Prev</button>
    <button class="btn btn-secondary" id="nextPage" ${pagination.hasNextPage ? '' : 'disabled'}>Next</button>
  `;

  el('prevPage')?.addEventListener('click', () => {
    state.recordsPage -= 1;
    loadRecords().catch(onError);
  });
  el('nextPage')?.addEventListener('click', () => {
    state.recordsPage += 1;
    loadRecords().catch(onError);
  });

  if (canEdit) {
    el('recordsTableWrap').querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => startEditRecord(records.find((r) => r._id === btn.dataset.edit)));
    });
    el('recordsTableWrap').querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', () => deleteRecord(btn.dataset.del));
    });
  }
}

function startEditRecord(record) {
  const form = el('recordForm');
  form.elements.id.value = record._id;
  form.elements.amount.value = record.amount;
  form.elements.type.value = record.type;
  form.elements.category.value = record.category;
  form.elements.date.value = new Date(record.date).toISOString().slice(0, 10);
  form.elements.note.value = record.note || '';
  el('recordFormTitle').textContent = 'Edit Record';
}

async function saveRecord(evt) {
  evt.preventDefault();
  const form = evt.target;
  const payload = {
    amount: Number(form.elements.amount.value),
    type: form.elements.type.value,
    category: form.elements.category.value,
    date: form.elements.date.value,
    note: form.elements.note.value
  };
  const id = form.elements.id.value;

  if (!allCategories.includes(payload.category)) {
    throw new Error('Category must be one of predefined categories.');
  }

  if (id) {
    await api(`/api/records/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Record updated');
  } else {
    await api('/api/records', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Record created');
  }

  form.reset();
  form.elements.id.value = '';
  el('recordFormTitle').textContent = 'Add Record';
  await Promise.all([loadRecords(), loadDashboard()]);
}

async function deleteRecord(id) {
  if (!confirm('Delete this record?')) return;
  await api(`/api/records/${id}`, { method: 'DELETE' });
  showToast('Record moved to deleted list');
  await Promise.all([loadRecords(), loadDashboard(), loadDeletedRecords()]);
}

async function loadDeletedRecords() {
  if (!canManageRecords(state.user.role)) return;
  const res = await api('/api/records/deleted?page=1&limit=20');
  const records = res.data.records || [];

  el('deletedRecordsTable').innerHTML = `
    <table>
      <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Deleted At</th><th>Actions</th></tr></thead>
      <tbody>
        ${records.map((r) => toRow([
          new Date(r.date).toLocaleDateString(),
          r.type,
          r.category,
          formatMoney(r.amount),
          r.deletedAt ? new Date(r.deletedAt).toLocaleString() : '-',
          `<button class="btn btn-secondary" data-restore="${r._id}">Restore</button> <button class="btn btn-secondary" data-hard-del="${r._id}">Delete Permanently</button>`
        ])).join('') || '<tr><td colspan="6">No deleted records</td></tr>'}
      </tbody>
    </table>
  `;

  el('deletedRecordsTable').querySelectorAll('[data-restore]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api(`/api/records/${btn.dataset.restore}/restore`, { method: 'PATCH' });
      showToast('Record restored');
      await Promise.all([loadRecords(), loadDashboard(), loadDeletedRecords()]);
    });
  });

  el('deletedRecordsTable').querySelectorAll('[data-hard-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Permanently delete this record? This cannot be undone.')) return;
      await api(`/api/records/${btn.dataset.hardDel}/permanent`, { method: 'DELETE' });
      showToast('Record permanently deleted');
      await loadDeletedRecords();
    });
  });
}

async function loadUsers() {
  if (!canManageUsers(state.user.role)) return;
  const res = await api('/api/users?page=1&limit=50');
  const users = res.data.users || [];

  el('usersTableWrap').innerHTML = `
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${users.map((u) => toRow([
          u.name,
          u.email,
          `<select data-role="${u._id}"><option ${u.role === 'viewer' ? 'selected' : ''}>viewer</option><option ${u.role === 'analyst' ? 'selected' : ''}>analyst</option><option ${u.role === 'admin' ? 'selected' : ''}>admin</option></select>`,
          `<select data-status="${u._id}"><option ${u.status === 'active' ? 'selected' : ''}>active</option><option ${u.status === 'inactive' ? 'selected' : ''}>inactive</option><option ${u.status === 'suspended' ? 'selected' : ''}>suspended</option></select>`,
          `<button class="btn btn-secondary" data-save-user="${u._id}">Save</button> <button class="btn btn-secondary" data-delete-user="${u._id}">Delete</button>`
        ])).join('')}
      </tbody>
    </table>
  `;

  el('usersTableWrap').querySelectorAll('[data-save-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.saveUser;
      const role = el('usersTableWrap').querySelector(`[data-role="${id}"]`).value;
      const status = el('usersTableWrap').querySelector(`[data-status="${id}"]`).value;
      await Promise.all([
        api(`/api/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
        api(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      ]);
      showToast('User updated');
    });
  });

  el('usersTableWrap').querySelectorAll('[data-delete-user]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete user and their records?')) return;
      await api(`/api/users/${btn.dataset.deleteUser}`, { method: 'DELETE' });
      showToast('User deleted');
      await loadUsers();
    });
  });
}

async function loadAppData() {
  try {
    await loadDashboard();
    if (canAccessRecords(state.user.role)) await loadRecords();
    if (canManageRecords(state.user.role)) await loadDeletedRecords();
    if (canManageUsers(state.user.role)) await loadUsers();
  } catch (e) {
    onError(e);
  }
}

function onError(e) {
  showToast(e.message || 'Something went wrong', true);
}

function initForms() {
  const loginForm = el('loginForm');
  const registerForm = el('registerForm');

  el('showLogin').addEventListener('click', () => {
    el('showLogin').classList.add('active');
    el('showRegister').classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });

  el('showRegister').addEventListener('click', () => {
    el('showRegister').classList.add('active');
    el('showLogin').classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  loginForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    try {
      const payload = {
        email: loginForm.elements.email.value,
        password: loginForm.elements.password.value
      };
      const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
      setAuth(res.data.token, res.data.user);
      showToast('Login successful');
      loginForm.reset();
    } catch (e) {
      onError(e);
    }
  });

  registerForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    try {
      const payload = {
        name: registerForm.elements.name.value,
        email: registerForm.elements.email.value,
        password: registerForm.elements.password.value
      };
      const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      setAuth(res.data.token, res.data.user);
      showToast('Registration successful');
      registerForm.reset();
    } catch (e) {
      onError(e);
    }
  });

  el('logoutBtn').addEventListener('click', () => {
    clearAuth();
    showToast('Logout successful');
  });

  el('recordFilterForm').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    state.recordFilters = {
      type: evt.target.elements.type.value,
      category: evt.target.elements.category.value,
      startDate: evt.target.elements.startDate.value,
      endDate: evt.target.elements.endDate.value,
      search: evt.target.elements.search.value
    };
    state.recordsPage = 1;
    await loadRecords();
  });

  el('recordForm').addEventListener('submit', (evt) => saveRecord(evt).catch(onError));
  el('cancelEditRecord').addEventListener('click', () => {
    const form = el('recordForm');
    form.reset();
    form.elements.id.value = '';
    el('recordFormTitle').textContent = 'Add Record';
  });

  el('loadTrends').addEventListener('click', () => loadTrendsForYear().catch(onError));
}

function seedCategorySuggestions() {
  const input = el('recordForm').elements.category;
  input.setAttribute('list', 'categoryOptions');
  const dataList = document.createElement('datalist');
  dataList.id = 'categoryOptions';
  dataList.innerHTML = allCategories.map((c) => `<option value="${c}"></option>`).join('');
  document.body.appendChild(dataList);
}

async function bootstrap() {
  initForms();
  seedCategorySuggestions();
  renderAuth();
  if (state.token && state.user) {
    try {
      const me = await api('/api/auth/me');
      state.user = me.data.user;
      localStorage.setItem('fd_user', JSON.stringify(state.user));
      renderAuth();
      await loadAppData();
    } catch {
      clearAuth();
    }
  }
}

bootstrap().catch(onError);
