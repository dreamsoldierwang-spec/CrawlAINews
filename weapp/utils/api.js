const app = getApp();

function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${app.globalData.apiBaseUrl}${url}`;
    console.log('API Request:', method, fullUrl, data);
    
    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Authorization': `Bearer ${app.globalData.token || ''}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('API Response:', res.statusCode, res.data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || 'Request failed'));
        }
      },
      fail: (err) => {
        console.error('API Request failed:', err);
        reject(err);
      }
    });
  });
}

module.exports = {
  getNews: (date) => request(`/news?date=${date || ''}`),
  getNewsDetail: (id) => request(`/news/${id}`),
  getSources: () => request('/news/sources'),
  getFavorites: () => request('/favorites'),
  addFavorite: (newsId) => request('/favorites', 'POST', { newsId }),
  removeFavorite: (newsId) => request(`/favorites/${newsId}`, 'DELETE'),
  login: (code, nickname, avatarUrl) => request('/auth/login', 'POST', { code, nickname, avatarUrl }),
  getUser: () => request('/auth/user'),
};
