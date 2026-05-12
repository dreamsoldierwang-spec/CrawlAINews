const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    favorites: [],
    loading: false,
    isLoggedIn: false,
  },

  onShow() {
    this.setData({ isLoggedIn: auth.checkLogin() });
    if (this.data.isLoggedIn) {
      this.loadFavorites();
    }
  },

  async loadFavorites() {
    this.setData({ loading: true });

    try {
      const res = await api.getFavorites();
      if (res.success) {
        this.setData({ favorites: res.data });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onNewsTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
    });
  },

  async onLoginTap() {
    try {
      await auth.login();
      this.setData({ isLoggedIn: true });
      this.loadFavorites();
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },
});
