const auth = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
  },

  onShow() {
    const isLoggedIn = auth.checkLogin();
    this.setData({
      isLoggedIn,
      userInfo: app.globalData.userInfo,
    });
  },

  async onLoginTap() {
    try {
      const data = await auth.login();
      this.setData({
        isLoggedIn: true,
        userInfo: data.user,
      });
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  onLogoutTap() {
    wx.removeStorageSync('token');
    app.globalData.token = null;
    app.globalData.userInfo = null;
    this.setData({
      isLoggedIn: false,
      userInfo: null,
    });
    wx.showToast({ title: '已退出', icon: 'success' });
  },

  onFavoritesTap() {
    wx.switchTab({
      url: '/pages/favorites/favorites',
    });
  },
});
