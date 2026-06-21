var TOKEN_KEY = 'ilist_token';

function getToken() {
  try {
    return wx.getStorageSync(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
}

function setToken(token) {
  try {
    wx.setStorageSync(TOKEN_KEY, token);
  } catch (e) { }
}

function clearToken() {
  try {
    wx.removeStorageSync(TOKEN_KEY);
  } catch (e) { }
}

module.exports = {
  getToken: getToken,
  setToken: setToken,
  clearToken: clearToken
};