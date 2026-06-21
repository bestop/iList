var app = getApp();
var api = require('../../utils/api');
var auth = require('../../utils/auth');

Page({
  data: {
    isLoggedIn: false,
    user: null,
    activeTab: 'login',
    loginUsername: '',
    loginPassword: '',
    regUsername: '',
    regPassword: ''
  },

  onShow: function () {
    var user = app.getUser();
    this.setData({
      isLoggedIn: !!user,
      user: user
    });
  },

  onSwitchTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  onInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var data = {};
    data[field] = e.detail.value;
    this.setData(data);
  },

  onLogin: function () {
    var username = this.data.loginUsername.trim();
    var password = this.data.loginPassword;
    if (!username || !password) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    var that = this;
    api.post('/auth/login', { username: username, password: password }).then(function (res) {
      if (res.data.error) {
        wx.showToast({ title: res.data.error, icon: 'none' });
        return;
      }
      auth.setToken(res.data.token);
      app.setUser(res.data.user);
      that.setData({
        isLoggedIn: true,
        user: res.data.user,
        loginUsername: '',
        loginPassword: ''
      });
      wx.showToast({ title: '登录成功', icon: 'success' });
      wx.switchTab({ url: '/pages/index/index' });
    }).catch(function () {
      wx.showToast({ title: '登录失败', icon: 'none' });
    });
  },

  onRegister: function () {
    var username = this.data.regUsername.trim();
    var password = this.data.regPassword;
    if (!username || !password) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    var that = this;
    api.post('/auth/register', { username: username, password: password }).then(function (res) {
      if (res.data.error) {
        wx.showToast({ title: res.data.error, icon: 'none' });
        return;
      }
      auth.setToken(res.data.token);
      app.setUser(res.data.user);
      that.setData({
        isLoggedIn: true,
        user: res.data.user,
        regUsername: '',
        regPassword: ''
      });
      if (res.data.user.role === 'admin') {
        wx.showToast({ title: '欢迎！你已成为管理员', icon: 'success' });
      } else {
        wx.showToast({ title: '注册成功', icon: 'success' });
      }
      wx.switchTab({ url: '/pages/index/index' });
    }).catch(function () {
      wx.showToast({ title: '注册失败', icon: 'none' });
    });
  },

  onLogout: function () {
    var that = this;
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: function (res) {
        if (res.confirm) {
          auth.clearToken();
          app.setUser(null);
          that.setData({ isLoggedIn: false, user: null });
          wx.showToast({ title: '已退出', icon: 'success' });
          wx.switchTab({ url: '/pages/index/index' });
        }
      }
    });
  },

  onGoAdmin: function () {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  onExport: function () {
    var that = this;
    api.get('/items').then(function (res) {
      var items = res.data || [];
      var fs = wx.getFileSystemManager();
      var filePath = wx.env.USER_DATA_PATH + '/ilist-export.json';
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
      wx.shareFileMessage({
        filePath: filePath,
        fileName: '采购清单.json',
        success: function () { },
        fail: function () {
          wx.showToast({ title: '导出失败', icon: 'none' });
        }
      });
    }).catch(function () {
      wx.showToast({ title: '获取数据失败', icon: 'none' });
    });
  },

  onImport: function () {
    wx.showToast({ title: '请在网页端使用导入功能', icon: 'none' });
  }
});