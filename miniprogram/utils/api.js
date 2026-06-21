var app = getApp();
var auth = require('./auth');

var API_BASE = 'https://list.hijoe.net/api';

function request(method, path, data) {
  return new Promise(function (resolve, reject) {
    var headers = {
      'Content-Type': 'application/json'
    };
    var token = auth.getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    wx.request({
      url: API_BASE + path,
      method: method,
      data: data,
      header: headers,
      success: function (res) {
        if (res.statusCode === 401) {
          auth.clearToken();
          app.setUser(null);
          wx.showToast({ title: '登录已过期', icon: 'none' });
          reject(new Error('Unauthorized'));
          return;
        }
        resolve(res);
      },
      fail: function (err) {
        reject(err);
      }
    });
  });
}

function get(path) {
  return request('GET', path);
}

function post(path, data) {
  return request('POST', path, data);
}

function put(path, data) {
  return request('PUT', path, data);
}

function del(path, data) {
  return request('DELETE', path, data);
}

function uploadImage(filePath) {
  return new Promise(function (resolve, reject) {
    var token = auth.getToken();
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: function (res) {
        var ext = filePath.split('.').pop().toLowerCase();
        var mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        resolve('data:' + mime + ';base64,' + res.data);
      },
      fail: reject
    });
  });
}

module.exports = {
  get: get,
  post: post,
  put: put,
  del: del,
  uploadImage: uploadImage
};