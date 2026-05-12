const api = require('../../utils/api');
const auth = require('../../utils/auth');
const themeManager = require('../../utils/theme');

Page({
  data: {
    news: null,
    isFavorited: false,
    isLoggedIn: false,
    loading: true,
    showLinkModal: false,
    themeMode: 'day',
    themeIcon: '☀️',
    themeLabel: '白天',
  },

  async onLoad(options) {
    const { id } = options;
    const themeInfo = themeManager.getThemeInfo();
    this.setData({
      themeMode: themeInfo.mode,
      themeIcon: themeInfo.icon,
      themeLabel: themeInfo.label,
      isLoggedIn: auth.checkLogin(),
    });

    this.unsubscribeTheme = themeManager.subscribe((info) => {
      this.setData({
        themeMode: info.mode,
        themeIcon: info.icon,
        themeLabel: info.label,
      });
    });

    if (id) {
      await this.loadNewsDetail(id);
    } else {
      wx.showToast({ title: '缺少资讯ID', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onShow() {
    const info = themeManager.getThemeInfo();
    if (info.mode !== this.data.themeMode) {
      this.setData({
        themeMode: info.mode,
        themeIcon: info.icon,
        themeLabel: info.label,
      });
    }
  },

  onUnload() {
    if (this.unsubscribeTheme) {
      this.unsubscribeTheme();
    }
  },

  onThemeTap() {
    const nextMode = themeManager.getNextTheme();
    themeManager.saveTheme(nextMode);
    const info = themeManager.getThemeInfo();
    this.setData({
      themeMode: info.mode,
      themeIcon: info.icon,
      themeLabel: info.label,
    });
    wx.showToast({ title: `已切换至${info.label}模式`, icon: 'none', duration: 1200 });
  },

  async loadNewsDetail(id) {
    try {
      console.log('Loading news detail, id:', id);
      const res = await api.getNewsDetail(id);
      console.log('News detail response:', res);
      
      if (res.success && res.data) {
        this.setData({
          news: res.data,
          loading: false,
        });

        if (this.data.isLoggedIn) {
          this.checkFavorite(id);
        }
      } else {
        wx.showToast({ title: '资讯不存在', icon: 'none' });
        this.setData({ loading: false });
      }
    } catch (err) {
      console.error('Load news detail failed:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async checkFavorite(newsId) {
    try {
      const favorites = await api.getFavorites();
      const isFavorited = favorites.data.some(f => f.id === parseInt(newsId, 10));
      this.setData({ isFavorited });
    } catch (err) {
      console.error('Check favorite failed', err);
    }
  },

  async onFavoriteTap() {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const { id } = this.data.news;

    try {
      if (this.data.isFavorited) {
        await api.removeFavorite(id);
        this.setData({ isFavorited: false });
        wx.showToast({ title: '已取消收藏', icon: 'success' });
      } else {
        await api.addFavorite(id);
        this.setData({ isFavorited: true });
        wx.showToast({ title: '收藏成功', icon: 'success' });
      }
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onReadOriginalTap() {
    this.setData({ showLinkModal: true });
  },

  onCloseModal() {
    this.setData({ showLinkModal: false });
  },

  onCopyLinkTap() {
    const { source_url } = this.data.news;
    wx.setClipboardData({
      data: source_url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' });
        this.setData({ showLinkModal: false });
      },
    });
  },

  onBackTap() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果返回失败，跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  },

  onShareTap() {
    const { news } = this.data;
    if (!news) return;
    
    // 使用微信分享API
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
      success: () => {
        console.log('分享菜单显示成功');
      },
      fail: (err) => {
        console.error('分享菜单显示失败:', err);
        // 如果showShareMenu失败，使用备用方案
        wx.showToast({
          title: '请点击右上角菜单分享',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  onShareAppMessage() {
    const { news } = this.data;
    return {
      title: news.title,
      path: `/pages/detail/detail?id=${news.id}`,
      imageUrl: '',
    };
  },
});
