const api = require('../../utils/api');
const auth = require('../../utils/auth');
const themeManager = require('../../utils/theme');

Page({
  data: {
    newsList: [],
    currentDate: '',
    newsCount: 0,
    loading: false,
    hasMore: true,
    isLoggedIn: false,
    showDatePicker: false,
    dateList: [],
    themeMode: 'day',
    themeIcon: '☀️',
  },

  onLoad() {
    const themeInfo = themeManager.getThemeInfo();
    this.setData({
      currentDate: this.formatDate(new Date()),
      isLoggedIn: auth.checkLogin(),
      dateList: this.generateDateList(),
      themeMode: themeInfo.mode,
      themeIcon: themeInfo.icon,
    });
    this.loadNews();

    this.unsubscribeTheme = themeManager.subscribe((info) => {
      this.setData({
        themeMode: info.mode,
        themeIcon: info.icon,
      });
    });
  },

  onShow() {
    const info = themeManager.getThemeInfo();
    if (info.mode !== this.data.themeMode) {
      this.setData({
        themeMode: info.mode,
        themeIcon: info.icon,
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
    });
    wx.showToast({ title: `已切换至${info.label}模式`, icon: 'none', duration: 1200 });
  },

  onPullDownRefresh() {
    this.loadNews().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadNews(date) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const targetDate = date || this.data.currentDate;
      const res = await api.getNews(targetDate);
      if (res.success) {
        this.setData({
          newsList: res.data.items,
          newsCount: res.data.count,
          currentDate: targetDate,
          hasMore: false,
        });
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

  onDateTap() {
    this.setData({
      showDatePicker: true,
      dateList: this.generateDateList(),
    });
  },

  onDateSelect(e) {
    const { index } = e.currentTarget.dataset;
    const selectedDate = this.data.dateList[index];
    this.setData({ showDatePicker: false });
    this.loadNews(selectedDate);
  },

  onCloseDatePicker() {
    this.setData({ showDatePicker: false });
  },

  generateDateList() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      dates.push(this.formatDate(date));
    }
    return dates;
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
});
