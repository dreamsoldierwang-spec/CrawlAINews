const api = require('./api');
const app = getApp();

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: (userRes) => {
              const { nickName, avatarUrl } = userRes.userInfo;
              api.login(res.code, nickName, avatarUrl)
                .then((data) => {
                  app.globalData.token = data.data.token;
                  app.globalData.userInfo = data.data.user;
                  wx.setStorageSync('token', data.data.token);
                  resolve(data.data);
                })
                .catch(reject);
            },
            fail: () => {
              api.login(res.code)
                .then((data) => {
                  app.globalData.token = data.data.token;
                  app.globalData.userInfo = data.data.user;
                  wx.setStorageSync('token', data.data.token);
                  resolve(data.data);
                })
                .catch(reject);
            }
          });
        } else {
          reject(new Error('Login failed'));
        }
      },
      fail: reject
    });
  });
}

function checkLogin() {
  return !!app.globalData.token;
}

module.exports = {
  login,
  checkLogin,
};
