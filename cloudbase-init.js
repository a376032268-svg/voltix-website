/**
 * Voltix CloudBase 初始化文件 v1.3.0
 * 在所有 HTML 页面 </head> 前引入
 * 依赖：cdn.jsdelivr.net/npm/@cloudbase/js-sdk@latest/dist/index.umd.js
 * 备用：static.cloudbase.net/js-sdk/latest/cloudbase.full.js
 */
(function () {
  var _app = null;
  var _db = null;
  var _initDone = false;
  var _initError = null;
  var _initRetryCount = 0;
  var MAX_INIT_RETRIES = 200; // 最多等待 200 * 50ms = 10 秒

  // ========== SDK 初始化 ==========
  function tryInit() {
    if (typeof cloudbase === 'undefined') {
      _initRetryCount++;
      if (_initRetryCount >= MAX_INIT_RETRIES) {
        _initError = '⚠️ CloudBase SDK 加载失败（CDN 访问被拦截），请尝试以下方法：\n1. 切换网络（如 WiFi ↔ 移动数据）\n2. 关闭代理/VPN 后刷新\n3. 使用 Chrome/Edge 浏览器';
        console.error('[CloudBase] SDK 加载超时（CDN 访问失败）。当前页面使用的 CDN 可能被网络拦截，请检查网络或切换 CDN。');
        // 触发事件让页面知道初始化失败
        window.dispatchEvent(new CustomEvent('cloudbase-error', { detail: _initError }));
      } else {
        setTimeout(tryInit, 50);
      }
      return;
    }

    try {
      _app = cloudbase.init({
        env: 'voltix-prod-d9gpbrzsm7e719fc5'
      });
      _db = _app.database();
      _initDone = true;
      console.log('[CloudBase] SDK 初始化完成');

      // SDK 就绪后主动触发事件，供页面监听
      window.dispatchEvent(new CustomEvent('cloudbase-ready'));
    } catch (e) {
      _initError = '数据库初始化失败，请刷新页面重试';
      console.error('[CloudBase] 初始化异常:', e);
      window.dispatchEvent(new CustomEvent('cloudbase-error', { detail: _initError }));
    }
  }

  // ========== 页面层调用：等待 SDK 就绪 ==========
  // 推荐用法：await waitForDb() 后再调用数据库函数
  window.waitForDb = function () {
    return new Promise(function (resolve, reject) {
      if (_initDone && _db) {
        resolve(_db);
        return;
      }
      if (_initError) {
        reject(new Error(_initError));
        return;
      }
      // 最多等 10 秒
      var timeout = setTimeout(function () {
        window.removeEventListener('cloudbase-ready', onReady);
        reject(new Error('数据库连接超时，请检查网络后刷新页面重试'));
      }, 10000);

      function onReady() {
        clearTimeout(timeout);
        if (_initError) {
          reject(new Error(_initError));
        } else {
          resolve(_db);
        }
      }
      window.addEventListener('cloudbase-ready', onReady);

      // 如果已经完成（事件已触发）
      if (_initDone) onReady();
    });
  };

  // 内部：确保数据库就绪后才执行操作
  function withDb(fn) {
    if (!_initDone || !_db) {
      return Promise.reject(new Error(
        _initError || '数据库未就绪，请检查网络后刷新页面重试'
      ));
    }
    return fn(_db);
  }

  // ========== 用户注册 ==========
  window.registerUser = async function (name, phone, password, email, company) {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('users').where({ phone: phone }).get().then(function (exist) {
        if (exist.data && exist.data.length > 0) {
          throw new Error('该手机号已注册，请直接登录');
        }
        return db.collection('users').add({
          name: name,
          phone: phone,
          password: password,
          email: email || '',
          company: company || '',
          createdAt: new Date().toISOString()
        });
      });
    });
  };

  // ========== 用户登录 ==========
  window.loginUser = async function (phone, password) {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('users').where({ phone: phone, password: password }).get().then(function (res) {
        if (!res.data || res.data.length === 0) {
          throw new Error('手机号码或密码错误');
        }
        return res.data[0];
      });
    });
  };

  // ========== 会话管理（localStorage，仅存登录态）==========
  window.getCurrentUser = function () {
    var raw = localStorage.getItem('voltix_user');
    return raw ? JSON.parse(raw) : null;
  };

  window.setCurrentUser = function (user) {
    if (user) {
      localStorage.setItem('voltix_user', JSON.stringify({
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email || '',
        company: user.company || '',
        loginTime: new Date().toISOString()
      }));
    } else {
      localStorage.removeItem('voltix_user');
    }
  };

  // ========== 提交合作申请 ==========
  window.submitApplication = async function (data) {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('applications').add(Object.assign({}, data, {
        status: 'pending',
        createdAt: new Date().toISOString()
      })).then(function (res) {
        _notifyOwnerSms('application', data);
        return res;
      });
    });
  };

  // ========== 提交联系表单 ==========
  window.submitContact = async function (data) {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('contacts').add(Object.assign({}, data, {
        createdAt: new Date().toISOString()
      })).then(function (res) {
        _notifyOwnerSms('contact', data);
        return res;
      });
    });
  };

  // ========== 短信通知（调用云函数，不阻塞主流程） ==========
  function _notifyOwnerSms(type, data) {
    if (!_app) return;
    _app.callFunction({
      name: 'sendSmsNotify',
      data: { type: type, data: data }
    }).catch(function (e) {
      console.warn('[SMS] 短信通知发送失败（不影响主流程）:', e.message);
    });
  }

  // ========== 管理员：获取所有合作申请 ==========
  window.fetchApplications = async function () {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('applications').orderBy('createdAt', 'desc').get().then(function (res) {
        return res.data || [];
      });
    });
  };

  // ========== 管理员：更新申请状态 ==========
  window.updateApplicationStatus = async function (id, status) {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('applications').doc(id).update({
        status: status,
        updateTime: new Date().toISOString()
      });
    });
  };

  // ========== 管理员：获取所有联系 ==========
  window.fetchContacts = async function () {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('contacts').orderBy('createdAt', 'desc').get().then(function (res) {
        return res.data || [];
      });
    });
  };

  // ========== 管理员：获取所有用户 ==========
  window.fetchUsers = async function () {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('users').orderBy('createdAt', 'desc').get().then(function (res) {
        return res.data || [];
      });
    });
  };

  // ========== 管理员：更新用户信息 ==========
  window.updateUser = async function (id, data) {
    await waitForDb();
    return withDb(function (db) {
      return db.collection('users').doc(id).update(Object.assign({}, data, {
        updateTime: new Date().toISOString()
      }));
    });
  };

  // ========== 管理员登录状态（sessionStorage）==========
  window.isAdminLoggedIn = function () {
    return sessionStorage.getItem('voltix_admin_local') === '1';
  };

  window.setAdminLoggedIn = function (val) {
    if (val) sessionStorage.setItem('voltix_admin_local', '1');
    else sessionStorage.removeItem('voltix_admin_local');
  };

  // ========== 启动初始化 ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    tryInit();
  }
})();
