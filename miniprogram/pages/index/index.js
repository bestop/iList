var app = getApp();
var api = require('../../utils/api');
var auth = require('../../utils/auth');
var util = require('../../utils/util');

Page({
  data: {
    items: [],
    filteredItems: [],
    search: '',
    categories: ['全部分类', '数码', '家具', '服饰', '食品', '其他'],
    categoryIdx: 0,
    statuses: ['全部状态', '待发货', '已发货', '已收货', '已完成'],
    statusIdx: 0,
    total: '0.00',
    loading: true,
    isLoggedIn: false
  },

  onShow: function () {
    this.setData({ isLoggedIn: app.isLoggedIn() });
    this.loadItems();
  },

  onPullDownRefresh: function () {
    this.loadItems().then(function () {
      wx.stopPullDownRefresh();
    });
  },

  loadItems: function () {
    var that = this;
    this.setData({ loading: true });

    if (!app.isLoggedIn()) {
      var mockItems = util.getMockItems();
      that.setData({ items: mockItems, loading: false });
      that.filterItems();
      return Promise.resolve();
    }

    return api.get('/items').then(function (res) {
      var items = (res.data || []).map(util.normalizeItem);
      that.setData({ items: items, loading: false });
      that.filterItems();
    }).catch(function () {
      that.setData({ loading: false });
      if (!app.isLoggedIn()) {
        var mockItems = util.getMockItems();
        that.setData({ items: mockItems });
        that.filterItems();
      }
    });
  },

  filterItems: function () {
    var items = this.data.items;
    var search = this.data.search.toLowerCase();
    var catIdx = this.data.categoryIdx;
    var statIdx = this.data.statusIdx;

    var filtered = items.filter(function (item) {
      var matchSearch = !search ||
        item.name.toLowerCase().indexOf(search) > -1 ||
        (item.note && item.note.toLowerCase().indexOf(search) > -1) ||
        (item.shop && item.shop.toLowerCase().indexOf(search) > -1);
      var matchCat = catIdx === 0 || item.category === this.data.categories[catIdx];
      var matchStatus = statIdx === 0 || item.status === this.data.statuses[statIdx];
      return matchSearch && matchCat && matchStatus;
    }.bind(this));

    var total = items.reduce(function (s, i) {
      return s + (i.price || 0) * (i.qty || 0);
    }, 0);

    this.setData({
      filteredItems: filtered,
      total: total.toFixed(2)
    });
  },

  onSearch: function (e) {
    this.setData({ search: e.detail.value });
    this.filterItems();
  },

  onFilterCategory: function (e) {
    this.setData({ categoryIdx: parseInt(e.detail.value) });
    this.filterItems();
  },

  onFilterStatus: function (e) {
    this.setData({ statusIdx: parseInt(e.detail.value) });
    this.filterItems();
  },

  onPreviewImage: function (e) {
    var images = e.currentTarget.dataset.images;
    var idx = parseInt(e.currentTarget.dataset.idx) || 0;
    if (images && images.length > 0) {
      wx.previewImage({
        current: images[idx],
        urls: images
      });
    }
  },

  onToggleStatus: function (e) {
    if (!app.isLoggedIn()) return;
    var id = e.currentTarget.dataset.id;
    var status = e.currentTarget.dataset.status;
    var order = ['待发货', '已发货', '已收货', '已完成'];
    var idx = order.indexOf(status);
    var newStatus = order[(idx + 1) % order.length];

    var that = this;
    api.put('/items/' + id, { status: newStatus }).then(function () {
      var items = that.data.items.map(function (item) {
        if (item.id === id) {
          item.status = newStatus;
        }
        return item;
      });
      that.setData({ items: items });
      that.filterItems();
    }).catch(function () {
      wx.showToast({ title: '操作失败', icon: 'none' });
    });
  },

  onEdit: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/add/add?id=' + id });
  },

  onDelete: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    var that = this;

    wx.showModal({
      title: '确认删除',
      content: '确定删除「' + name + '」？',
      success: function (res) {
        if (res.confirm) {
          api.del('/items/' + id).then(function () {
            var items = that.data.items.filter(function (item) {
              return item.id !== id;
            });
            that.setData({ items: items });
            that.filterItems();
            wx.showToast({ title: '已删除', icon: 'success' });
          }).catch(function () {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  onSnapshot: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    var images = e.currentTarget.dataset.images;
    var that = this;

    wx.showLoading({ title: '生成快照...' });

    this.generateSnapshot(name, images, function (tempFilePath) {
      wx.hideLoading();
      if (tempFilePath) {
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: function () {
            wx.showToast({ title: '快照已保存', icon: 'success' });
          },
          fail: function () {
            wx.previewImage({ urls: [tempFilePath] });
          }
        });
      } else {
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    });
  },

  generateSnapshot: function (name, images, callback) {
    if (!images || images.length === 0) {
      callback(null);
      return;
    }

    var scale = 2;
    var baseW = 750;
    var pad = 40;
    var gap = 16;
    var nameH = 50;

    var cols;
    if (images.length <= 1) {
      cols = 1;
    } else if (images.length <= 2) {
      cols = 2;
    } else {
      cols = 3;
    }

    var imgW = (baseW - pad * 2 - gap * (cols - 1)) / cols;
    var imgH = imgW * 0.75;

    var rows = Math.ceil(images.length / cols);
    var canvasW = baseW * scale;
    var canvasH = (pad + nameH + gap + rows * imgH + (rows - 1) * gap + pad) * scale;

    var canvasId = 'snapshot-canvas';
    var ctx = wx.createCanvasContext(canvasId);

    ctx.scale(scale, scale);
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, baseW, canvasH / scale);
    ctx.setFillStyle('#1a1a2e');
    ctx.setFontSize(32);
    ctx.fillText(name, pad, pad + 36);

    var loaded = 0;
    var total = images.length;
    var imgData = [];

    images.forEach(function (url, i) {
      wx.getImageInfo({
        src: url,
        success: function (info) {
          imgData[i] = info;
          loaded++;
          if (loaded === total) {
            var y = pad + nameH + gap;
            for (var r = 0; r < rows; r++) {
              for (var c = 0; c < cols; c++) {
                var idx = r * cols + c;
                if (idx >= imgData.length) break;
                var info = imgData[idx];
                if (!info) continue;
                var x = pad + c * (imgW + gap);
                var drawW = imgW;
                var drawH = imgW * (info.height / info.width);
                if (drawH > imgH) {
                  drawH = imgH;
                  drawW = imgH * (info.width / info.height);
                }
                ctx.drawImage(info.path, x + (imgW - drawW) / 2, y + (imgH - drawH) / 2, drawW, drawH);
              }
              y += imgH + gap;
            }
            ctx.draw(false, function () {
              wx.canvasToTempFilePath({
                canvasId: canvasId,
                success: function (res) {
                  callback(res.tempFilePath);
                },
                fail: function () {
                  callback(null);
                }
              });
            });
          }
        },
        fail: function () {
          loaded++;
          if (loaded === total) {
            ctx.draw(false, function () {
              wx.canvasToTempFilePath({
                canvasId: canvasId,
                success: function (res) { callback(res.tempFilePath); },
                fail: function () { callback(null); }
              });
            });
          }
        }
      });
    });
  }
});