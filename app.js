(function () {
  "use strict";

  var API_BASE = '/api';
  var MAX_IMAGE_SIZE = 2 * 1024 * 1024;
  var MAX_IMAGES = 9;
  var STORAGE_KEY = 'ilist_items';
  var TOKEN_KEY = 'ilist_token';

  var page = document.body.getAttribute("data-page");

  var dateInput = document.getElementById("date");

  var modal = document.getElementById("image-modal");
  var modalImg = document.getElementById("modal-img");
  var modalPrev = document.getElementById("modal-prev");
  var modalNext = document.getElementById("modal-next");
  var modalCounter = document.getElementById("modal-counter");

  var addForm = document.getElementById("item-form");
  var addFileInput = document.getElementById("image");
  var addPreviewGrid = document.getElementById("image-preview-grid");
  var resetBtn = document.getElementById("reset-btn");

  var itemList = document.getElementById("item-list");
  var emptyState = document.getElementById("empty-state");
  var searchInput = document.getElementById("search");
  var filterCategory = document.getElementById("filter-category");
  var filterStatus = document.getElementById("filter-status");
  var countChip = document.getElementById("count-chip");
  var totalChip = document.getElementById("total-chip");
  var exportBtn = document.getElementById("export-btn");
  var importFile = document.getElementById("import-file");

  var draftImages = [];
  var items = [];
  var useApi = false;
  var currentUser = null;

  var MOCK_ITEMS = [
    { id: 'mock1', name: '无线蓝牙耳机', category: '数码', status: '待发货', price: 299, qty: 1, date: '2026-06-18', shop: '京东', note: '降噪款', images: ['https://picsum.photos/seed/earbuds1/600/400', 'https://picsum.photos/seed/earbuds2/600/400'], createdAt: Date.now() },
    { id: 'mock2', name: '机械键盘', category: '数码', status: '已发货', price: 459, qty: 1, date: '2026-06-17', shop: '淘宝', note: '红轴', images: ['https://picsum.photos/seed/keyboard1/600/400', 'https://picsum.photos/seed/keyboard2/600/400', 'https://picsum.photos/seed/keyboard3/600/400'], createdAt: Date.now() - 1000 },
    { id: 'mock3', name: '显示器支架', category: '家具', status: '已收货', price: 128, qty: 2, date: '2026-06-16', shop: '拼多多', note: '', images: ['https://picsum.photos/seed/stand1/600/400'], createdAt: Date.now() - 2000 },
    { id: 'mock4', name: 'USB-C 扩展坞', category: '数码', status: '已完成', price: 189, qty: 1, date: '2026-06-15', shop: '京东', note: '7合1', images: ['https://picsum.photos/seed/hub1/600/400', 'https://picsum.photos/seed/hub2/600/400'], createdAt: Date.now() - 3000 },
    { id: 'mock5', name: '台灯', category: '家具', status: '待发货', price: 79, qty: 1, date: '2026-06-14', shop: '', note: '护眼款', images: ['https://picsum.photos/seed/lamp1/600/400'], createdAt: Date.now() - 4000 }
  ];

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }

  function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { }
  }

  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { }
  }

  function authHeaders() {
    var token = getToken();
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  async function checkAuth() {
    var token = getToken();
    if (!token) { currentUser = null; return null; }
    try {
      var response = await fetch(API_BASE + '/auth/me', { headers: authHeaders() });
      var data = await response.json();
      currentUser = data.user;
      return currentUser;
    } catch {
      currentUser = null;
      return null;
    }
  }

  function updateAuthUI() {
    var loginBtn = document.getElementById('auth-login-btn');
    var userInfo = document.getElementById('user-info');
    var addBtn = document.getElementById('btn-add');
    var guestBanner = document.getElementById('guest-banner');
    var adminBtn = document.getElementById('btn-admin');

    if (currentUser) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (userInfo) {
        userInfo.classList.remove('hidden');
        var nameEl = userInfo.querySelector('.user-name');
        if (nameEl) nameEl.textContent = currentUser.username;
        var roleEl = userInfo.querySelector('.user-role');
        if (roleEl) roleEl.textContent = currentUser.role === 'admin' ? '管理员' : '用户';
      }
      if (addBtn) addBtn.classList.remove('hidden');
      if (guestBanner) guestBanner.classList.add('hidden');
      if (adminBtn) {
        if (currentUser.role === 'admin') {
          adminBtn.classList.remove('hidden');
        } else {
          adminBtn.classList.add('hidden');
        }
      }
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (userInfo) userInfo.classList.add('hidden');
      if (addBtn) addBtn.classList.add('hidden');
      if (guestBanner) guestBanner.classList.remove('hidden');
      if (adminBtn) adminBtn.classList.add('hidden');
    }
  }

  async function loadUsers() {
    var userList = document.getElementById('user-list');
    if (!userList) return;
    try {
      var response = await fetch(API_BASE + '/auth/users', { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed');
      var users = await response.json();
      renderUsers(users);
    } catch (e) {
      console.error('Load users error:', e);
    }
  }

  function renderUsers(users) {
    var userList = document.getElementById('user-list');
    if (!userList) return;
    userList.innerHTML = '';
    var countChip = document.getElementById('user-count-chip');
    if (countChip) countChip.textContent = '共 ' + users.length + ' 人';
    var adminEmpty = document.getElementById('admin-empty');
    if (adminEmpty) {
      if (users.length === 0) adminEmpty.classList.remove('hidden');
      else adminEmpty.classList.add('hidden');
    }
    users.forEach(function (u) {
      var tr = document.createElement('tr');
      tr.className = 'user-row';
      var dateStr = '';
      if (u.created_at) {
        var d = new Date(u.created_at);
        dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      }
      tr.innerHTML =
        '<td class="user-cell-name">' + escapeHtml(u.username) + '</td>' +
        '<td class="user-cell-role"><span class="role-badge role-' + u.role + '">' + (u.role === 'admin' ? '管理员' : '用户') + '</span></td>' +
        '<td class="user-cell-items">' + (u.item_count || 0) + ' 件</td>' +
        '<td class="user-cell-date">' + dateStr + '</td>' +
        '<td class="user-cell-actions">' +
          (u.id !== currentUser.userId ?
            '<button class="btn-sm btn-toggle-role" data-id="' + u.id + '" data-role="' + u.role + '" type="button">' +
              (u.role === 'admin' ? '降为用户' : '升为管理员') +
            '</button>' +
            '<button class="btn-sm btn-del-user" data-id="' + u.id + '" data-name="' + escapeHtml(u.username) + '" type="button">删除</button>'
            : '<span class="user-self">当前用户</span>') +
        '</td>';
      userList.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showAuthModal(mode) {
    var overlay = document.getElementById('auth-modal');
    var loginForm = document.getElementById('login-form');
    var registerForm = document.getElementById('register-form');
    var tabLogin = document.getElementById('tab-login');
    var tabRegister = document.getElementById('tab-register');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    if (mode === 'register') {
      if (loginForm) loginForm.classList.add('hidden');
      if (registerForm) registerForm.classList.remove('hidden');
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabRegister) tabRegister.classList.add('active');
    } else {
      if (loginForm) loginForm.classList.remove('hidden');
      if (registerForm) registerForm.classList.add('hidden');
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
    }
  }

  function hideAuthModal() {
    var overlay = document.getElementById('auth-modal');
    if (overlay) overlay.classList.add('hidden');
  }

  if (dateInput && !dateInput.value) {
    dateInput.value = todayStr();
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function normalizeItem(item) {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status,
      price: parseFloat(item.price) || 0,
      qty: parseInt(item.qty, 10) || 1,
      date: item.date ? String(item.date).slice(0, 10) : '',
      shop: item.shop || '',
      note: item.note || '',
      images: Array.isArray(item.images) ? item.images : [],
      createdAt: item.created_at || item.createdAt || Date.now()
    };
  }

  function localLoad() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      items = data ? JSON.parse(data) : [];
    } catch (e) {
      items = [];
    }
    return items;
  }

  function localSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('localStorage save error:', e);
    }
  }

  async function loadItems() {
    if (!currentUser) {
      items = MOCK_ITEMS.map(normalizeItem);
      useApi = false;
      return items;
    }
    try {
      var response = await fetch(API_BASE + '/items', { headers: authHeaders() });
      if (!response.ok) throw new Error('API not available');
      var data = await response.json();
      items = data.map(normalizeItem);
      useApi = true;
      return items;
    } catch (error) {
      console.log('API not available, using localStorage');
      useApi = false;
      return localLoad();
    }
  }

  async function saveItem(item) {
    if (useApi) {
      try {
        var response = await fetch(API_BASE + '/items', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
          body: JSON.stringify(item)
        });
        if (response.status === 401) { handleAuthError(); return null; }
        if (!response.ok) throw new Error('Failed to save item');
        return normalizeItem(await response.json());
      } catch (error) {
        console.error('API save error:', error);
        return null;
      }
    } else {
      item.id = generateId();
      item.createdAt = Date.now();
      items.unshift(item);
      localSave();
      return item;
    }
  }

  async function deleteItem(id) {
    if (useApi) {
      try {
        var response = await fetch(API_BASE + '/items/' + id, {
          method: 'DELETE',
          headers: authHeaders()
        });
        if (response.status === 401) { handleAuthError(); return false; }
        if (!response.ok) throw new Error('Failed to delete item');
        return true;
      } catch (error) {
        console.error('API delete error:', error);
        return false;
      }
    } else {
      items = items.filter(function (i) { return i.id !== id; });
      localSave();
      return true;
    }
  }

  async function updateItem(id, data) {
    if (useApi) {
      try {
        var response = await fetch(API_BASE + '/items/' + id, {
          method: 'PUT',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
          body: JSON.stringify(data)
        });
        if (response.status === 401) { handleAuthError(); return null; }
        if (!response.ok) throw new Error('Failed to update item');
        return normalizeItem(await response.json());
      } catch (error) {
        console.error('API update error:', error);
        return null;
      }
    } else {
      var idx = items.findIndex(function (i) { return i.id === id; });
      if (idx !== -1) {
        Object.assign(items[idx], data);
        localSave();
        return items[idx];
      }
      return null;
    }
  }

  async function importItems(data) {
    if (useApi) {
      try {
        var response = await fetch(API_BASE + '/import', {
          method: 'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
          body: JSON.stringify(data)
        });
        if (response.status === 401) { handleAuthError(); return null; }
        if (!response.ok) throw new Error('Failed to import items');
        return await response.json();
      } catch (error) {
        console.error('API import error:', error);
        return null;
      }
    } else {
      data.forEach(function (item) {
        if (!item.id) item.id = generateId();
        if (!item.createdAt) item.createdAt = Date.now();
      });
      var existingIds = items.map(function (i) { return i.id; });
      data.forEach(function (item) {
        if (existingIds.indexOf(item.id) === -1) {
          items.push(item);
        } else {
          var idx = items.findIndex(function (i) { return i.id === item.id; });
          if (idx !== -1) Object.assign(items[idx], item);
        }
      });
      localSave();
      return { message: 'Data imported successfully', count: data.length };
    }
  }

  function handleAuthError() {
    clearToken();
    currentUser = null;
    updateAuthUI();
    alert('登录已过期，请重新登录');
  }

  async function loadItemForEdit(id) {
    var target;
    if (useApi) {
      try {
        var response = await fetch(API_BASE + '/items', { headers: authHeaders() });
        if (!response.ok) throw new Error('Failed to load items');
        var allItems = await response.json();
        target = allItems.find(function (i) { return i.id === id; });
        if (target) target = normalizeItem(target);
      } catch (error) {
        console.error('Error loading item:', error);
        alert('加载商品失败，请重试');
        return;
      }
    } else {
      target = items.find(function (i) { return i.id === id; });
    }

    if (target) {
      document.getElementById("name").value = target.name || "";
      document.getElementById("category").value = target.category || "其他";
      document.getElementById("status").value = target.status || "待发货";
      document.getElementById("price").value = target.price || "";
      document.getElementById("qty").value = target.qty || 1;
      document.getElementById("date").value = target.date || todayStr();
      document.getElementById("shop").value = target.shop || "";
      document.getElementById("note").value = target.note || "";

      draftImages = (target.images || []).slice();
      renderDraftImages();

      document.querySelector('.header-left h1').textContent = "编辑商品";
      document.querySelector('.header-left .subtitle').textContent = "修改商品信息";
      document.querySelector('button[type="submit"]').textContent = "保存修改";
    } else {
      alert('未找到该商品');
      window.location.href = "index.html";
    }
  }

  if (page === "add") {
    checkAuth().then(function (user) {
      if (!user) {
        alert('请先登录');
        window.location.href = "index.html";
        return;
      }
      var urlParams = new URLSearchParams(window.location.search);
      var editId = urlParams.get('id');

      loadItems().then(function () {
        if (editId) {
          loadItemForEdit(editId);
        }
      });
    });

    renderDraftImages();

    if (addFileInput) {
      addFileInput.addEventListener("change", function (e) {
        var files = Array.from(e.target.files || []);
        if (!files.length) return;

        var added = 0;
        var processed = 0;

        files.forEach(function (file) {
          if (draftImages.length + added >= MAX_IMAGES) {
            alert("最多上传 " + MAX_IMAGES + " 张图片");
            return;
          }
          if (!file.type.startsWith("image/")) return;
          if (file.size > MAX_IMAGE_SIZE) {
            alert("图片「" + file.name + "」过大（>2MB），已跳过");
            return;
          }
          var reader = new FileReader();
          reader.onload = function (ev) {
            compressImage(ev.target.result, 900, 0.82, function (dataUrl) {
              draftImages.push(dataUrl);
              added++;
              processed++;
              if (processed === files.length || draftImages.length >= MAX_IMAGES) {
                addFileInput.value = "";
                renderDraftImages();
              }
            });
          };
          reader.readAsDataURL(file);
        });
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        setTimeout(function () {
          draftImages = [];
          renderDraftImages();
          if (dateInput) dateInput.value = todayStr();
          var qtyInput = document.getElementById("qty");
          if (qtyInput) qtyInput.value = 1;
        }, 0);
      });
    }

    if (addPreviewGrid) {
      addPreviewGrid.addEventListener("click", function (e) {
        var delBtn = e.target.closest(".img-thumb-del");
        if (delBtn) {
          var idx = parseInt(delBtn.getAttribute("data-idx"), 10);
          draftImages.splice(idx, 1);
          renderDraftImages();
          return;
        }
        var img = e.target.closest(".img-thumb-wrap img");
        if (img) {
          var idx2 = parseInt(img.getAttribute("data-idx"), 10);
          openModal(draftImages.slice(), idx2);
        }
      });
    }

    if (addForm) {
      addForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        var name = document.getElementById("name").value.trim();
        if (!name) return;

        var item = {
          name: name,
          category: document.getElementById("category").value || "其他",
          status: document.getElementById("status").value || "待发货",
          price: parseFloat(document.getElementById("price").value) || 0,
          qty: parseInt(document.getElementById("qty").value, 10) || 1,
          date: dateInput.value || todayStr(),
          shop: document.getElementById("shop").value.trim(),
          note: document.getElementById("note").value.trim(),
          images: draftImages.slice()
        };

        if (editId) {
          var updatedItem = await updateItem(editId, item);
          if (updatedItem) {
            window.location.href = "index.html";
          } else {
            alert('保存失败，请重试');
          }
        } else {
          var savedItem = await saveItem(item);
          if (savedItem) {
            window.location.href = "index.html";
          } else {
            alert('添加失败，请重试');
          }
        }
      });
    }
  }

  if (page === "list") {
    checkAuth().then(function () {
      updateAuthUI();
      loadItems().then(function () { render(); });
    });

    var loginBtn = document.getElementById('auth-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function () { showAuthModal('login'); });
    }

    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        clearToken();
        currentUser = null;
        updateAuthUI();
        loadItems().then(function () { render(); });
      });
    }

    var authModal = document.getElementById('auth-modal');
    if (authModal) {
      authModal.addEventListener('click', function (e) {
        if (e.target === authModal || e.target.classList.contains('auth-modal-backdrop')) {
          hideAuthModal();
        }
      });

      var tabLogin = document.getElementById('tab-login');
      var tabRegister = document.getElementById('tab-register');
      if (tabLogin) tabLogin.addEventListener('click', function () { showAuthModal('login'); });
      if (tabRegister) tabRegister.addEventListener('click', function () { showAuthModal('register'); });

      var loginForm = document.getElementById('login-form');
      if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
          e.preventDefault();
          var username = document.getElementById('login-username').value.trim();
          var password = document.getElementById('login-password').value;
          if (!username || !password) return;
          try {
            var response = await fetch(API_BASE + '/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: username, password: password })
            });
            var data = await response.json();
            if (data.error) {
              alert(data.error);
              return;
            }
            setToken(data.token);
            currentUser = data.user;
            hideAuthModal();
            updateAuthUI();
            loadItems().then(function () { render(); });
          } catch (err) {
            alert('登录失败，请重试');
          }
        });
      }

      var registerForm = document.getElementById('register-form');
      if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
          e.preventDefault();
          var username = document.getElementById('register-username').value.trim();
          var password = document.getElementById('register-password').value;
          if (!username || !password) return;
          try {
            var response = await fetch(API_BASE + '/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: username, password: password })
            });
            var data = await response.json();
            if (data.error) {
              alert(data.error);
              return;
            }
            setToken(data.token);
            currentUser = data.user;
            hideAuthModal();
            updateAuthUI();
            loadItems().then(function () { render(); });
            if (data.user.role === 'admin') {
              alert('欢迎！你是第一个注册的用户，已自动成为管理员');
            }
          } catch (err) {
            alert('注册失败，请重试');
          }
        });
      }
    }

    if (searchInput) searchInput.addEventListener("input", render);
    if (filterCategory) filterCategory.addEventListener("change", render);
    if (filterStatus) filterStatus.addEventListener("change", render);

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        var blob = new Blob([JSON.stringify(items, null, 2)], {
          type: "application/json",
        });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "采购清单-" + todayStr() + ".json";
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (importFile) {
      importFile.addEventListener("change", async function (e) {
        if (!currentUser) { alert('请先登录'); return; }
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = async function () {
          try {
            var data = JSON.parse(reader.result);
            if (!Array.isArray(data)) throw new Error("格式不对");
            if (confirm("将导入 " + data.length + " 条记录并合并到现有清单，是否继续？")) {
              var result = await importItems(data);
              if (result) {
                items = await loadItems();
                render();
              }
            }
          } catch (err) {
            alert("导入失败：文件不是有效的清单数据");
          } finally {
            importFile.value = "";
          }
        };
        reader.readAsText(file);
      });
    }

    if (itemList) {
      itemList.addEventListener("click", async function (e) {
        var galleryPrev = e.target.closest(".item-gallery-prev");
        var galleryNext = e.target.closest(".item-gallery-next");
        var galleryImg = e.target.closest(".item-gallery-img");

        if (galleryPrev || galleryNext) {
          var li = e.target.closest("li.item");
          var gIdx = parseInt(li.getAttribute("data-gallery-idx") || "0", 10);
          var images = JSON.parse(li.getAttribute("data-images") || "[]");
          var total = images.length;
          if (!total) return;
          var newIdx = gIdx + (galleryPrev ? -1 : 1);
          if (newIdx < 0) newIdx = total - 1;
          if (newIdx >= total) newIdx = 0;
          li.setAttribute("data-gallery-idx", newIdx);
          var imgEl = li.querySelector(".item-gallery-img");
          if (imgEl) imgEl.src = images[newIdx];
          var cntEl = li.querySelector(".item-gallery-counter");
          if (cntEl) cntEl.textContent = (newIdx + 1) + "/" + total;
          return;
        }

        if (galleryImg) {
          var li2 = e.target.closest("li.item");
          var gIdx2 = parseInt(li2.getAttribute("data-gallery-idx") || "0", 10);
          var images2 = JSON.parse(li2.getAttribute("data-images") || "[]");
          openModal(images2, gIdx2);
          return;
        }

        if (!currentUser) return;

        var snapBtn = e.target.closest("[data-snap]");
        var delBtn = e.target.closest("[data-del]");
        var editBtn = e.target.closest("[data-edit]");
        var statusBtn = e.target.closest(".status-btn");

        if (snapBtn) {
          var snapId = snapBtn.getAttribute("data-snap");
          var snapItem = items.find(function (i) { return i.id === snapId; });
          if (snapItem) {
            snapBtn.textContent = "⏳";
            snapBtn.disabled = true;
            try {
              await generateSnapshot(snapItem);
            } catch (err) {
              alert('生成快照失败：' + err.message);
            }
            snapBtn.textContent = "📷";
            snapBtn.disabled = false;
          }
          return;
        }

        if (editBtn) {
          var editId2 = editBtn.getAttribute("data-edit");
          window.location.href = "add.html?id=" + editId2;
          return;
        }

        if (delBtn) {
          var delId = delBtn.getAttribute("data-del");
          if (confirm("确定删除此商品？")) {
            var success = await deleteItem(delId);
            if (success) {
              items = items.filter(function (i) { return i.id !== delId; });
              render();
            }
          }
          return;
        }

        if (statusBtn) {
          var statusId = statusBtn.getAttribute("data-id");
          var target = items.find(function (i) { return i.id === statusId; });
          if (target) {
            var order = ["待发货", "已发货", "已收货", "已完成"];
            var idx3 = order.indexOf(target.status);
            var newStatus = order[(idx3 + 1) % order.length];

            var updatedItem = await updateItem(statusId, { status: newStatus });
            if (updatedItem) {
              target.status = newStatus;
              render();
            }
          }
          return;
        }
      });
    }
  }

  if (page === "admin") {
    checkAuth().then(function (user) {
      if (!user || user.role !== 'admin') {
        alert('需要管理员权限');
        window.location.href = "index.html";
        return;
      }
      var userInfo = document.getElementById('user-info');
      if (userInfo) {
        userInfo.classList.remove('hidden');
        var nameEl = userInfo.querySelector('.user-name');
        if (nameEl) nameEl.textContent = currentUser.username;
        var roleEl = userInfo.querySelector('.user-role');
        if (roleEl) roleEl.textContent = '管理员';
      }
      loadUsers();
    });

    var userList = document.getElementById('user-list');
    if (userList) {
      userList.addEventListener('click', async function (e) {
        var toggleBtn = e.target.closest('.btn-toggle-role');
        var delBtn = e.target.closest('.btn-del-user');

        if (toggleBtn) {
          var userId = toggleBtn.getAttribute('data-id');
          var currentRole = toggleBtn.getAttribute('data-role');
          var newRole = currentRole === 'admin' ? 'user' : 'admin';
          if (confirm('确定将此用户角色改为' + (newRole === 'admin' ? '管理员' : '普通用户') + '？')) {
            try {
              var response = await fetch(API_BASE + '/auth/users', {
                method: 'PUT',
                headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                body: JSON.stringify({ id: userId, role: newRole })
              });
              var data = await response.json();
              if (data.error) { alert(data.error); return; }
              loadUsers();
            } catch (err) { alert('操作失败'); }
          }
          return;
        }

        if (delBtn) {
          var delId = delBtn.getAttribute('data-id');
          var delName = delBtn.getAttribute('data-name');
          if (confirm('确定删除用户「' + delName + '」及其所有商品？此操作不可撤销！')) {
            try {
              var response2 = await fetch(API_BASE + '/auth/users', {
                method: 'DELETE',
                headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
                body: JSON.stringify({ id: delId })
              });
              var data2 = await response2.json();
              if (data2.error) { alert(data2.error); return; }
              loadUsers();
            } catch (err) { alert('操作失败'); }
          }
          return;
        }
      });
    }
  }

  var _modalImages = [];
  var _modalIdx = 0;

  function openModal(images, startIdx) {
    if (!images || !images.length) return;
    _modalImages = images;
    _modalIdx = startIdx || 0;
    updateModal();
    modal.classList.remove("hidden");
  }

  function updateModal() {
    modalImg.src = _modalImages[_modalIdx];
    modalCounter.textContent = (_modalIdx + 1) + " / " + _modalImages.length;
    modalPrev.style.display = _modalImages.length > 1 ? "" : "none";
    modalNext.style.display = _modalImages.length > 1 ? "" : "none";
  }

  function modalNav(dir) {
    var n = _modalImages.length;
    if (n <= 1) return;
    _modalIdx = (_modalIdx + dir + n) % n;
    updateModal();
  }

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target.getAttribute("data-close") !== null) {
        modal.classList.add("hidden");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (modal.classList.contains("hidden")) return;
      if (e.key === "Escape") {
        modal.classList.add("hidden");
      } else if (e.key === "ArrowLeft") {
        modalNav(-1);
      } else if (e.key === "ArrowRight") {
        modalNav(1);
      }
    });

    if (modalPrev) modalPrev.addEventListener("click", function (e) { e.stopPropagation(); modalNav(-1); });
    if (modalNext) modalNext.addEventListener("click", function (e) { e.stopPropagation(); modalNav(1); });
  }

  function renderDraftImages() {
    if (!addPreviewGrid) return;
    addPreviewGrid.innerHTML = "";
    if (!draftImages.length) return;
    draftImages.forEach(function (url, i) {
      var wrap = document.createElement("div");
      wrap.className = "img-thumb-wrap";

      var img = document.createElement("img");
      img.src = url;
      img.alt = "第" + (i + 1) + "张";
      img.setAttribute("data-idx", i);

      var del = document.createElement("button");
      del.className = "img-thumb-del";
      del.setAttribute("data-idx", i);
      del.textContent = "×";
      del.title = "删除此图";
      del.type = "button";

      wrap.appendChild(img);
      wrap.appendChild(del);
      addPreviewGrid.appendChild(wrap);
    });
  }

  function render() {
    var kw = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var cat = filterCategory ? filterCategory.value : "";
    var status = filterStatus ? filterStatus.value : "";

    var filtered = items.filter(function (i) {
      var matchKw =
        !kw ||
        i.name.toLowerCase().includes(kw) ||
        (i.note && i.note.toLowerCase().includes(kw)) ||
        (i.shop && i.shop.toLowerCase().includes(kw));
      var matchCat = !cat || i.category === cat;
      var matchStatus = !status || i.status === status;
      return matchKw && matchCat && matchStatus;
    });

    if (itemList) {
      itemList.innerHTML = "";
      if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove("hidden");
      } else {
        if (emptyState) emptyState.classList.add("hidden");
        var frag = document.createDocumentFragment();
        filtered.forEach(function (item) {
          frag.appendChild(buildItem(item));
        });
        itemList.appendChild(frag);
      }
    }

    var total = items.reduce(function (s, i) { return s + (i.price || 0) * (i.qty || 0); }, 0);
    var totalQty = items.reduce(function (s, i) { return s + (i.qty || 0); }, 0);
    if (countChip) countChip.textContent = "共 " + totalQty + " 件";
    if (totalChip) totalChip.textContent = "总计 ¥" + total.toFixed(2);
  }

  function buildItem(item) {
    var li = document.createElement("li");
    li.className = "item";
    if (!currentUser) li.classList.add("item-readonly");

    var images = item.images || [];

    if (images.length === 0) {
      var imgBox = document.createElement("div");
      imgBox.className = "item-image";
      var ph = document.createElement("span");
      ph.className = "placeholder";
      ph.textContent = "📦";
      imgBox.appendChild(ph);
      li.appendChild(imgBox);
    } else {
      var gallery = document.createElement("div");
      gallery.className = "item-gallery";

      var galleryImg = document.createElement("img");
      galleryImg.className = "item-gallery-img";
      galleryImg.src = images[0];
      galleryImg.loading = "lazy";
      gallery.appendChild(galleryImg);

      if (images.length > 1) {
        var prevBtn = document.createElement("button");
        prevBtn.className = "item-gallery-nav item-gallery-prev";
        prevBtn.textContent = "‹";
        prevBtn.type = "button";
        gallery.appendChild(prevBtn);

        var nextBtn = document.createElement("button");
        nextBtn.className = "item-gallery-nav item-gallery-next";
        nextBtn.textContent = "›";
        nextBtn.type = "button";
        gallery.appendChild(nextBtn);

        var counter = document.createElement("span");
        counter.className = "item-gallery-counter";
        counter.textContent = "1/" + images.length;
        gallery.appendChild(counter);
      }

      li.setAttribute("data-images", JSON.stringify(images));
      li.setAttribute("data-gallery-idx", "0");
      li.appendChild(gallery);
    }

    var body = document.createElement("div");
    body.className = "item-body";

    var title = document.createElement("div");
    title.className = "item-title";
    var nameSpan = document.createElement("span");
    nameSpan.textContent = item.name;
    var priceSpan = document.createElement("span");
    priceSpan.className = "item-price";
    priceSpan.textContent = "¥" + (item.price * item.qty).toFixed(2);
    title.appendChild(nameSpan);
    title.appendChild(priceSpan);

    var meta = document.createElement("div");
    meta.className = "item-meta";

    var tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.category;
    meta.appendChild(tag);

    var statusBadge = document.createElement("button");
    statusBadge.className = "status-badge status-" + item.status + " status-btn";
    statusBadge.setAttribute("data-id", item.id);
    statusBadge.type = "button";
    statusBadge.title = currentUser ? "点击切换下一个状态" : "登录后可操作";
    statusBadge.textContent = item.status;
    if (!currentUser) statusBadge.style.cursor = "default";
    meta.appendChild(statusBadge);

    var priceInfo = document.createElement("span");
    priceInfo.textContent = "¥" + item.price.toFixed(2) + " × " + item.qty;
    meta.appendChild(priceInfo);

    if (item.date) {
      var d = document.createElement("span");
      d.textContent = "📅 " + item.date;
      meta.appendChild(d);
    }
    if (item.shop) {
      var s = document.createElement("span");
      s.textContent = "🏪 " + item.shop;
      meta.appendChild(s);
    }

    body.appendChild(title);
    body.appendChild(meta);

    if (item.note) {
      var note = document.createElement("div");
      note.className = "item-note";
      note.textContent = item.note;
      body.appendChild(note);
    }

    li.appendChild(body);

    if (currentUser) {
      var footer = document.createElement("div");
      footer.className = "item-footer";

      var snapBtn = document.createElement("button");
      snapBtn.className = "btn-snap";
      snapBtn.setAttribute("data-snap", item.id);
      snapBtn.textContent = "📷";
      snapBtn.type = "button";
      snapBtn.title = "生成商品快照图片";
      footer.appendChild(snapBtn);

      var editBtn = document.createElement("button");
      editBtn.className = "btn-edit";
      editBtn.setAttribute("data-edit", item.id);
      editBtn.textContent = "编辑";
      editBtn.type = "button";
      editBtn.title = "编辑此商品";
      footer.appendChild(editBtn);

      var del = document.createElement("button");
      del.className = "btn-danger";
      del.setAttribute("data-del", item.id);
      del.textContent = "删除";
      del.type = "button";
      footer.appendChild(del);

      li.appendChild(footer);
    }

    return li;
  }

  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  async function generateSnapshot(item) {
    var images = (item.images || []).slice();
    var scale = 2;
    var baseW = 800;
    var pad = 40;
    var gap = 16;
    var nameH = 50;

    var canvasW = baseW * scale;
    var padS = pad * scale;
    var gapS = gap * scale;
    var nameHS = nameH * scale;

    var cols, imgMaxW, imgMaxH;
    if (images.length <= 1) {
      cols = 1;
      imgMaxW = baseW - pad * 2;
      imgMaxH = 600;
    } else if (images.length <= 2) {
      cols = 2;
      imgMaxW = (baseW - pad * 2 - gap) / 2;
      imgMaxH = 400;
    } else {
      cols = 3;
      imgMaxW = (baseW - pad * 2 - gap * 2) / 3;
      imgMaxH = 300;
    }

    var imgMaxWS = imgMaxW * scale;
    var imgMaxHS = imgMaxH * scale;

    var loadedImgs = [];
    for (var i = 0; i < images.length; i++) {
      try {
        var img = await loadImage(images[i]);
        var s = fitSize(img.naturalWidth || img.width, img.naturalHeight || img.height, imgMaxWS, imgMaxHS);
        loadedImgs.push({ el: img, w: s.w, h: s.h });
      } catch (e) { }
    }

    var rows = Math.ceil(loadedImgs.length / cols);
    var rowHeights = [];
    for (var r = 0; r < rows; r++) {
      var rh = 0;
      for (var c = 0; c < cols; c++) {
        var idx = r * cols + c;
        if (idx < loadedImgs.length && loadedImgs[idx].h > rh) rh = loadedImgs[idx].h;
      }
      rowHeights.push(rh);
    }

    var imagesH = rowHeights.reduce(function (s, h) { return s + h; }, 0) + (rows > 0 ? (rows - 1) * gapS : 0);
    var canvasH = padS + nameHS + (imagesH > 0 ? gapS + imagesH : 0) + padS;

    var canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    var ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, baseW, canvasH / scale);

    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(item.name, pad, pad);

    var imgY = pad + nameH + gap;
    for (var r = 0; r < rows; r++) {
      var xOff = pad;
      for (var c = 0; c < cols; c++) {
        var idx2 = r * cols + c;
        if (idx2 >= loadedImgs.length) break;
        var di = loadedImgs[idx2];
        var dx = xOff + (imgMaxW - di.w / scale) / 2;
        var dy = imgY + (rowHeights[r] / scale - di.h / scale) / 2;
        ctx.drawImage(di.el, dx, dy, di.w / scale, di.h / scale);
        xOff += imgMaxW + gap;
      }
      imgY += rowHeights[r] / scale + gap;
    }

    var dataUrl = canvas.toDataURL("image/png");
    var a = document.createElement("a");
    a.href = dataUrl;
    a.download = (item.name || "快照") + "-快照.png";
    a.click();
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      if (!src.startsWith('data:')) img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function fitSize(w, h, maxW, maxH) {
    var ratio = Math.min(maxW / Math.max(w, 1), maxH / Math.max(h, 1), 1);
    return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
  }

  function compressImage(dataUrl, maxEdge, quality, callback) {
    var img = new Image();
    img.onload = function () {
      var w = img.width;
      var h = img.height;
      if (w > maxEdge || h > maxEdge) {
        if (w >= h) {
          h = Math.round((h * maxEdge) / w);
          w = maxEdge;
        } else {
          w = Math.round((w * maxEdge) / h);
          h = maxEdge;
        }
      }
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  }
})();
