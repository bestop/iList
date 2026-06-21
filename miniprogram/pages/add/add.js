var app = getApp();
var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    isEdit: false,
    editId: null,
    name: '',
    categories: ['数码', '家具', '服饰', '食品', '其他'],
    categoryIdx: 0,
    statuses: ['待发货', '已发货', '已收货', '已完成'],
    statusIdx: 0,
    price: '',
    qty: '1',
    date: '',
    shop: '',
    note: '',
    images: []
  },

  onLoad: function (options) {
    if (!app.isLoggedIn()) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(function () {
        wx.switchTab({ url: '/pages/login/login' });
      }, 1500);
      return;
    }

    this.setData({ date: util.todayStr() });

    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑商品' });
      this.loadItem(options.id);
    }
  },

  loadItem: function (id) {
    var that = this;
    api.get('/items').then(function (res) {
      var items = res.data || [];
      var item = items.find(function (i) { return i.id === id; });
      if (item) {
        var normalized = util.normalizeItem(item);
        that.setData({
          name: normalized.name,
          categoryIdx: that.data.categories.indexOf(normalized.category),
          statusIdx: that.data.statuses.indexOf(normalized.status),
          price: normalized.price ? String(normalized.price) : '',
          qty: String(normalized.qty),
          date: normalized.date,
          shop: normalized.shop,
          note: normalized.note,
          images: normalized.images
        });
      } else {
        wx.showToast({ title: '未找到商品', icon: 'none' });
      }
    }).catch(function () {
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    var data = {};
    data[field] = value;
    this.setData(data);
  },

  onCategoryChange: function (e) {
    this.setData({ categoryIdx: parseInt(e.detail.value) });
  },

  onStatusChange: function (e) {
    this.setData({ statusIdx: parseInt(e.detail.value) });
  },

  onDateChange: function (e) {
    this.setData({ date: e.detail.value });
  },

  onChooseImage: function () {
    var that = this;
    var remaining = 9 - this.data.images.length;
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFiles = res.tempFilePaths;
        var loaded = 0;
        var newImages = [];

        tempFiles.forEach(function (filePath) {
          api.uploadImage(filePath).then(function (base64) {
            newImages.push(base64);
            loaded++;
            if (loaded === tempFiles.length) {
              that.setData({
                images: that.data.images.concat(newImages)
              });
            }
          }).catch(function () {
            loaded++;
          });
        });
      }
    });
  },

  onRemoveImage: function (e) {
    var idx = parseInt(e.currentTarget.dataset.idx);
    var images = this.data.images.slice();
    images.splice(idx, 1);
    this.setData({ images: images });
  },

  onPreviewImage: function (e) {
    var idx = parseInt(e.currentTarget.dataset.idx);
    wx.previewImage({
      current: this.data.images[idx],
      urls: this.data.images
    });
  },

  onCancel: function () {
    wx.navigateBack({ delta: 1 });
  },

  onSubmit: function () {
    var name = this.data.name.trim();
    if (!name) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }

    var item = {
      name: name,
      category: this.data.categories[this.data.categoryIdx],
      status: this.data.statuses[this.data.statusIdx],
      price: parseFloat(this.data.price) || 0,
      qty: parseInt(this.data.qty) || 1,
      date: this.data.date,
      shop: this.data.shop.trim(),
      note: this.data.note.trim(),
      images: this.data.images.slice()
    };

    var that = this;

    if (this.data.isEdit) {
      api.put('/items/' + this.data.editId, item).then(function () {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(function () {
          wx.navigateBack({ delta: 1 });
        }, 1000);
      }).catch(function () {
        wx.showToast({ title: '保存失败', icon: 'none' });
      });
    } else {
      api.post('/items', item).then(function () {
        wx.showToast({ title: '添加成功', icon: 'success' });
        setTimeout(function () {
          wx.navigateBack({ delta: 1 });
        }, 1000);
      }).catch(function () {
        wx.showToast({ title: '添加失败', icon: 'none' });
      });
    }
  }
});