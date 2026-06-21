var app = getApp();
var api = require('../../utils/api');
var util = require('../../utils/util');

Page({
  data: {
    users: [],
    currentUserId: null,
    loading: true
  },

  onLoad: function () {
    if (!app.isAdmin()) {
      wx.showToast({ title: '需要管理员权限', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack({ delta: 1 });
      }, 1500);
      return;
    }
    this.setData({ currentUserId: app.getUser().userId });
    this.loadUsers();
  },

  loadUsers: function () {
    var that = this;
    this.setData({ loading: true });

    api.get('/auth/users').then(function (res) {
      var users = (res.data || []).map(function (u) {
        u.created_at_formatted = '';
        if (u.created_at) {
          var ts = Number(u.created_at);
          if (ts > 0) {
            u.created_at_formatted = util.formatDate(new Date(ts));
          }
        }
        return u;
      });
      that.setData({ users: users, loading: false });
    }).catch(function () {
      that.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    });
  },

  onToggleRole: function (e) {
    var id = e.currentTarget.dataset.id;
    var role = e.currentTarget.dataset.role;
    var newRole = role === 'admin' ? 'user' : 'admin';
    var label = newRole === 'admin' ? '管理员' : '普通用户';

    var that = this;
    wx.showModal({
      title: '确认操作',
      content: '确定将此用户角色改为「' + label + '」？',
      success: function (res) {
        if (res.confirm) {
          api.put('/auth/users', { id: id, role: newRole }).then(function (res2) {
            if (res2.data.error) {
              wx.showToast({ title: res2.data.error, icon: 'none' });
              return;
            }
            that.loadUsers();
            wx.showToast({ title: '已更新', icon: 'success' });
          }).catch(function () {
            wx.showToast({ title: '操作失败', icon: 'none' });
          });
        }
      }
    });
  },

  onDeleteUser: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;

    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定删除用户「' + name + '」及其所有商品？此操作不可撤销！',
      success: function (res) {
        if (res.confirm) {
          api.del('/auth/users', { id: id }).then(function (res2) {
            if (res2.data.error) {
              wx.showToast({ title: res2.data.error, icon: 'none' });
              return;
            }
            that.loadUsers();
            wx.showToast({ title: '已删除', icon: 'success' });
          }).catch(function () {
            wx.showToast({ title: '操作失败', icon: 'none' });
          });
        }
      }
    });
  }
});