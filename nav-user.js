// Voltix 导航栏用户状态管理 v1.5.0
// 统一处理所有页面的导航栏用户状态

(function() {
  'use strict';

  // 初始化导航栏用户状态
  function initNavUser() {
    const currentUser = getCurrentUser(); // 从 cloudbase-init.js 获取
    const navUser = document.getElementById('navUser');
    const mobileLoginLink = document.getElementById('mobileLoginLink');

    if (!navUser) return;

    if (currentUser) {
      // 已登录状态 - 使用统一优化的样式
      navUser.innerHTML = `
        <div class="user-menu">
          <a href="profile.html" class="nav-link user-menu-trigger">
            <span class="user-avatar">${currentUser.name.charAt(0)}</span>
            <span class="user-name">${currentUser.name}</span>
            <svg class="user-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
          <div class="user-dropdown">
            <div class="user-dropdown-header">
              <span class="user-avatar-large">${currentUser.name.charAt(0)}</span>
              <div class="user-info">
                <span class="user-info-name">${currentUser.name}</span>
                <span class="user-info-phone">${currentUser.phone || ''}</span>
              </div>
            </div>
            <div class="user-dropdown-divider"></div>
            <a href="profile.html" class="user-dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              个人中心
            </a>
            <a href="#" class="user-dropdown-item user-dropdown-item-danger" onclick="logout();return false;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              退出登录
            </a>
          </div>
        </div>
      `;

      // 移动端菜单更新
      if (mobileLoginLink) {
        mobileLoginLink.textContent = '个人中心';
        mobileLoginLink.href = 'profile.html';
      }
    } else {
      // 未登录状态
      navUser.innerHTML = `<a href="login.html" class="nav-link">登录</a>`;
      if (mobileLoginLink) {
        mobileLoginLink.textContent = '登录';
        mobileLoginLink.href = 'login.html';
      }
    }
  }

  // 退出登录
  window.logout = function() {
    if (confirm('确定要退出登录吗？')) {
      localStorage.removeItem('voltix_user');
      window.location.href = 'index.html';
    }
  };

  // 页面加载时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavUser);
  } else {
    initNavUser();
  }
})();
