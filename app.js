(function () {
  "use strict";

  const STORAGE_KEY = "renovation-purchase-list-v2";
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_IMAGES = 9;

  const page = document.body.getAttribute("data-page");

  // 通用元素
  const dateInput = document.getElementById("date");

  // 图片弹窗元素（两页都有）
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-img");
  const modalPrev = document.getElementById("modal-prev");
  const modalNext = document.getElementById("modal-next");
  const modalCounter = document.getElementById("modal-counter");

  // 添加页专用元素
  const addForm = document.getElementById("item-form");
  const addFileInput = document.getElementById("image");
  const addPreviewGrid = document.getElementById("image-preview-grid");
  const resetBtn = document.getElementById("reset-btn");

  // 清单页专用元素
  const itemList = document.getElementById("item-list");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search");
  const filterCategory = document.getElementById("filter-category");
  const filterStatus = document.getElementById("filter-status");
  const countChip = document.getElementById("count-chip");
  const totalChip = document.getElementById("total-chip");
  const exportBtn = document.getElementById("export-btn");
  const importFile = document.getElementById("import-file");

  // 草稿图片（添加页使用）
  let draftImages = [];
  let items = loadItems();

  // 默认日期
  if (dateInput && !dateInput.value) {
    dateInput.value = todayStr();
  }

  // ===== 添加页逻辑 =====
  if (page === "add") {
    renderDraftImages();

    if (addFileInput) {
      addFileInput.addEventListener("change", function (e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        let added = 0;
        let processed = 0;

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
          const reader = new FileReader();
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
          const qtyInput = document.getElementById("qty");
          if (qtyInput) qtyInput.value = 1;
        }, 0);
      });
    }

    // 删除草稿缩略图
    if (addPreviewGrid) {
      addPreviewGrid.addEventListener("click", function (e) {
        const delBtn = e.target.closest(".img-thumb-del");
        if (delBtn) {
          const idx = parseInt(delBtn.getAttribute("data-idx"), 10);
          draftImages.splice(idx, 1);
          renderDraftImages();
          return;
        }
        const img = e.target.closest(".img-thumb-wrap img");
        if (img) {
          const idx = parseInt(img.getAttribute("data-idx"), 10);
          openModal(draftImages.slice(), idx);
        }
      });
    }

    if (addForm) {
      addForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        if (!name) return;

        const item = {
          id: genId(),
          name,
          category: document.getElementById("category").value || "其他",
          status: document.getElementById("status").value || "待发货",
          price: parseFloat(document.getElementById("price").value) || 0,
          qty: parseInt(document.getElementById("qty").value, 10) || 1,
          date: dateInput.value || todayStr(),
          shop: document.getElementById("shop").value.trim(),
          note: document.getElementById("note").value.trim(),
          images: draftImages.slice(),
          createdAt: Date.now(),
        };

        items.unshift(item);
        saveItems();

        // 短暂提示后跳转回清单
        window.location.href = "index.html";
      });
    }
  }

  // ===== 清单页逻辑 =====
  if (page === "list") {
    render();

    if (searchInput) searchInput.addEventListener("input", render);
    if (filterCategory) filterCategory.addEventListener("change", render);
    if (filterStatus) filterStatus.addEventListener("change", render);

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        const blob = new Blob([JSON.stringify(items, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "已购清单-" + todayStr() + ".json";
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    if (importFile) {
      importFile.addEventListener("change", function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
          try {
            const data = JSON.parse(reader.result);
            if (!Array.isArray(data)) throw new Error("格式不对");
            if (confirm("将导入 " + data.length + " 条记录并合并到现有清单，是否继续？")) {
              items = data.concat(items);
              items.sort(function (a, b) {
                return (b.createdAt || 0) - (a.createdAt || 0);
              });
              saveItems();
              render();
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

    // 商品卡片点击事件
    if (itemList) {
      itemList.addEventListener("click", function (e) {
        const delBtn = e.target.closest("[data-del]");
        const statusBtn = e.target.closest(".status-btn");
        const galleryPrev = e.target.closest(".item-gallery-prev");
        const galleryNext = e.target.closest(".item-gallery-next");
        const galleryImg = e.target.closest(".item-gallery-img");

        if (delBtn) {
          const id = delBtn.getAttribute("data-del");
          if (confirm("确定删除此商品？")) {
            items = items.filter(function (i) { return i.id !== id; });
            saveItems();
            render();
          }
          return;
        }

        // 点击状态角标切换下一个状态
        if (statusBtn) {
          const id = statusBtn.getAttribute("data-id");
          const target = items.find(function (i) { return i.id === id; });
          if (target) {
            const order = ["待发货", "已发货", "已收货", "已完成"];
            const idx = order.indexOf(target.status);
            target.status = order[(idx + 1) % order.length];
            saveItems();
            render();
          }
          return;
        }

        if (galleryPrev || galleryNext) {
          const li = e.target.closest("li.item");
          const idx = parseInt(li.getAttribute("data-gallery-idx") || "0", 10);
          const images = JSON.parse(li.getAttribute("data-images") || "[]");
          const total = images.length;
          if (!total) return;
          let newIdx = idx + (galleryPrev ? -1 : 1);
          if (newIdx < 0) newIdx = total - 1;
          if (newIdx >= total) newIdx = 0;
          li.setAttribute("data-gallery-idx", newIdx);
          const imgEl = li.querySelector(".item-gallery-img");
          if (imgEl) imgEl.src = images[newIdx];
          const cntEl = li.querySelector(".item-gallery-counter");
          if (cntEl) cntEl.textContent = (newIdx + 1) + "/" + total;
          return;
        }

        if (galleryImg) {
          const li = e.target.closest("li.item");
          const idx = parseInt(li.getAttribute("data-gallery-idx") || "0", 10);
          const images = JSON.parse(li.getAttribute("data-images") || "[]");
          openModal(images, idx);
        }
      });
    }
  }

  // ===== 图片弹窗（两页共用） =====
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

  // ===== 草稿缩略图渲染 =====
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

  // ===== 清单页渲染 =====
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

    var images = item.images || [];
    var imagesJson = JSON.stringify(images);

    if (images.length === 0) {
      var imgBox = document.createElement("div");
      imgBox.className = "item-image";
      var ph = document.createElement("span");
      ph.className = "placeholder";
      ph.textContent = "🖼️";
      imgBox.appendChild(ph);
      li.appendChild(imgBox);
    } else {
      var gallery = document.createElement("div");
      gallery.className = "item-gallery";

      var galleryImg = document.createElement("img");
      galleryImg.className = "item-gallery-img";
      galleryImg.src = images[0];
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

      li.setAttribute("data-images", imagesJson);
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
    statusBadge.title = "点击切换下一个状态";
    statusBadge.textContent = item.status;
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

    var footer = document.createElement("div");
    footer.className = "item-footer";
    var del = document.createElement("button");
    del.className = "btn-danger";
    del.setAttribute("data-del", item.id);
    del.textContent = "删除";
    del.type = "button";
    footer.appendChild(del);

    li.appendChild(body);
    li.appendChild(footer);
    return li;
  }

  // ===== 数据存取 =====
  function loadItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return arr.map(function (i) {
        if (i.image && !i.images) {
          i.images = [i.image];
          delete i.image;
        }
        if (!i.status) i.status = "待发货";
        return i;
      });
    } catch (e) {
      return [];
    }
  }

  function saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      alert("保存失败，可能是图片太多导致存储溢出。请删除一些带图商品后重试。");
    }
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
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
