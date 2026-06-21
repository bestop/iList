var api = require('./utils/api');
var auth = require('./utils/auth');

App({
  globalData: {
    currentUser: null,
    apiBase: 'https://list.hijoe.net/api'
  },

  onLaunch: function () {
    var token = auth.getToken();
    if (token) {
      this.checkLogin();
    }
  },

  checkLogin: function () {
    var that = this;
    api.get('/auth/me').then(function (res) {
      if (res.data && res.data.user) {
        that.globalData.currentUser = res.data.user;
      }
    }).catch(function () {
      auth.clearToken();
      that.globalData.currentUser = null;
    });
  },

  setUser: function (user) {
    this.globalData.currentUser = user;
  },

  getUser: function () {
    return this.globalData.currentUser;
  },

  isLoggedIn: function () {
    return !!this.globalData.currentUser;
  },

  isAdmin: function () {
    var user = this.globalData.currentUser;
    return user && user.role === 'admin';
  }
});