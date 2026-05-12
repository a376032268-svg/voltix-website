/**
 * Voltix CloudBase 初始化文件
 * 在所有 HTML 页面 </head> 前引入
 * 依赖：cdn.jsdelivr.net/npm/@cloudbase/js-sdk@latest/dist/index.umd.js
 */
(function () {
  function init() {
    if (typeof cloudbase === 'undefined') {
      setTimeout(init, 50);
      return;
    }

    const app = cloudbase.init({
      env: 'voltix-prod-d9gpbrzsm7e719fc5'
    });

    const db = app.database();

    window.cbApp = app;
    window.cbDb = db;

    // ========== 用户注册 ==========
    window.registerUser = async function (name, phone, password, email, company) {
      const exist = await db.collection('users').where({ phone }).get();
      if (exist.data && exist.data.length > 0) {
        throw new Error('该手机号已注册，请直接登录');
      }
      const res = await db.collection('users').add({
        name,
        phone,
        password,
        email: email || '',
        company: company || '',
        createdAt: new Date().toISOString()
      });
      return res;
    };

    // ========== 用户登录 ==========
    window.loginUser = async function (phone, password) {
      const res = await db.collection('users').where({ phone, password }).get();
      if (!res.data || res.data.length === 0) {
        throw new Error('手机号码或密码错误');
      }
      return res.data[0];
    };

    // ========== 会话管理（localStorage，仅存登录态）==========
    window.getCurrentUser = function () {
      const raw = localStorage.getItem('voltix_user');
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
      const res = await db.collection('applications').add({
       ...data,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      // 异步触发短信通知（不阻塞主流程）
      _notifyOwnerSms('application', data).catch(() => {});
      return res;
    };

    // ========== 提交联系表单 ==========
    window.submitContact = async function (data) {
      const res = await db.collection('contacts').add({
       ...data,
        createdAt: new Date().toISOString()
      });
      // 异步触发短信通知（不阻塞主流程）
      _notifyOwnerSms('contact', data).catch(() => {});
      return res;
    };

    // ========== 短信通知（调用云函数） ==========
    // 需要在 CloudBase 控制台创建云函数 "sendSmsNotify"，参见部署文档
    async function _notifyOwnerSms(type, data) {
      try {
        await app.callFunction({
          name: 'sendSmsNotify',
          data: { type, data }
        });
      } catch (e) {
        console.warn('[SMS] 通知发送失败（不影响主流程）:', e.message);
      }
    }

    // ========== 管理员：获取所有合作申请 ==========
    window.fetchApplications = async function () {
      const res = await db.collection('applications').orderBy('createdAt', 'desc').get();
      return res.data || [];
    };

    // ========== 管理员：更新申请状态 ==========
    window.updateApplicationStatus = async function (id, status) {
      return await db.collection('applications').doc(id).update({
        status,
        updateTime: new Date().toISOString()
      });
    };

    // ========== 管理员：获取所有联系 ==========
    window.fetchContacts = async function () {
      const res = await db.collection('contacts').orderBy('createdAt', 'desc').get();
      return res.data || [];
    };

    // ========== 管理员：获取所有用户 ==========
    window.fetchUsers = async function () {
      const res = await db.collection('users').orderBy('createdAt', 'desc').get();
      return res.data || [];
    };

    // ========== 管理员：更新用户信息 ==========
    window.updateUser = async function (id, data) {
      return await db.collection('users').doc(id).update({
       ...data,
        updateTime: new Date().toISOString()
      });
    };

    // ========== 管理员登录状态（sessionStorage）==========
    window.isAdminLoggedIn = function () {
      return sessionStorage.getItem('voltix_admin') === 'true';
    };

    window.setAdminLoggedIn = function (val) {
      if (val) sessionStorage.setItem('voltix_admin', 'true');
      else sessionStorage.removeItem('voltix_admin');
    };

    console.log('[CloudBase] SDK 初始化完成');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
