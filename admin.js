    // 管理员密码
    const ADMIN_PASSWORD = '0000';

    let currentAppStatus = '';
    let currentContactType = '';
    let allApplications = [];
    let allContacts = [];
    let allUsers = [];

    // Toast 提示
    function showToast(message, type = 'success') {
      const existing = document.querySelector('.toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    // 管理员登录状态（本地 fallback，防止 CloudBase SDK 未加载时崩溃）
    function _adminLoggedIn(val) {
      if (typeof setAdminLoggedIn === 'function') {
        setAdminLoggedIn(val);
      } else {
        if (val) sessionStorage.setItem('voltix_admin', 'true');
        else sessionStorage.removeItem('voltix_admin');
      }
    }

    function _isAdminLoggedIn() {
      if (typeof isAdminLoggedIn === 'function') return isAdminLoggedIn();
      return sessionStorage.getItem('voltix_admin') === 'true';
    }

    // ========== 管理员登录验证 ==========
    async function checkAdmin() {
      const password = document.getElementById('adminPassword').value;
      const errorDiv = document.getElementById('loginError');
      const loginBtn = document.getElementById('loginBtn');

      errorDiv.textContent = '';

      if (!password) {
        errorDiv.textContent = '请输入密码';
        return;
      }

      loginBtn.disabled = true;
      loginBtn.textContent = '登录中...';

      try {
        // 模拟网络延迟（生产环境可去掉，或替换为真实 API 验证）
        await new Promise(resolve => setTimeout(resolve, 300));

        if (password === ADMIN_PASSWORD) {
          // 本地 sessionStorage，完全不依赖 CloudBase SDK
          sessionStorage.setItem('voltix_admin_local', '1');
          errorDiv.style.color = '#10b981';
          errorDiv.textContent = '登录成功！正在跳转...';
          setTimeout(() => {
            document.getElementById('loginPanel').style.display = 'none';
            document.getElementById('adminContainer').style.display = 'flex';
            refreshData();
          }, 500);
        } else {
          errorDiv.style.color = '#ef4444';
          errorDiv.textContent = '密码错误，请重试';
          document.getElementById('adminPassword').value = '';
        }
      } catch (e) {
        errorDiv.style.color = '#ef4444';
        errorDiv.textContent = '登录异常，请刷新重试';
        console.error('[admin] checkAdmin error:', e);
      } finally {
        // 关键：任何情况都必须恢复按钮
        loginBtn.disabled = false;
        loginBtn.textContent = '登录';
      }
    }

    function showAdminPanel() {
      document.getElementById('loginPanel').style.display = 'none';
      document.getElementById('adminContainer').style.display = 'flex';
      refreshData();
    }

    function logoutAdmin() {
      sessionStorage.removeItem('voltix_admin_local');
      window.location.reload();
    }

    // DOM 加载完成后检查本地登录态
    document.addEventListener('DOMContentLoaded', function() {
      if (sessionStorage.getItem('voltix_admin_local') === '1') {
        showAdminPanel();
      }
    });

    // ========== 数据加载（从数据库）==========
    async function refreshData() {
      try {
        await Promise.all([loadStats(), loadApplications(), loadContacts(), loadUsers()]);
      } catch (e) {
        showToast('加载数据失败：' + e.message, 'error');
      }
    }

    async function loadStats() {
      try {
        const apps = await fetchApplications();
        const contacts = await fetchContacts();
        document.getElementById('statApplications').textContent = apps.length;
        document.getElementById('statPending').textContent = apps.filter(a => a.status === 'pending').length;
        document.getElementById('statApproved').textContent = apps.filter(a => a.status === 'approved').length;
        document.getElementById('statContacts').textContent = contacts.length;
      } catch (e) {
        console.error('loadStats error:', e);
      }
    }

    async function loadApplications() {
      allApplications = await fetchApplications();
      filterApplications();
    }

    async function loadContacts() {
      allContacts = await fetchContacts();
      filterContacts();
    }

    async function loadUsers() {
      allUsers = await fetchUsers();
      filterUsers();
    }

    // ========== 筛选逻辑 ==========
    function switchMenu(menu, element) {
      document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
      element.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('panel-' + menu).classList.add('active');
      const titles = { 'applications': '合作申请', 'contacts': '联系我们', 'users': '注册用户' };
      document.getElementById('pageTitle').textContent = titles[menu] || '';
    }

    function setAppStatusFilter(status, element) {
      currentAppStatus = status;
      document.querySelectorAll('#appStatusGroup .btn-filter').forEach(btn => btn.classList.remove('active'));
      element.classList.add('active');
      filterApplications();
    }

    function filterApplications() {
      const search = document.getElementById('appSearch').value.toLowerCase();
      let filtered = allApplications;

      if (search) {
        filtered = filtered.filter(a =>
          (a.companyName && a.companyName.toLowerCase().includes(search)) ||
          (a.contactPhone && a.contactPhone.includes(search))
        );
      }

      if (currentAppStatus) {
        filtered = filtered.filter(a => a.status === currentAppStatus);
      }

      renderApplicationsTable(filtered);
    }

    function setContactTypeFilter(type, element) {
      currentContactType = type;
      document.querySelectorAll('#contactTypeGroup .btn-filter').forEach(btn => btn.classList.remove('active'));
      element.classList.add('active');
      filterContacts();
    }

    function filterContacts() {
      const search = document.getElementById('contactSearch').value.toLowerCase();
      let filtered = allContacts;

      if (search) {
        filtered = filtered.filter(c =>
          (c.name && c.name.toLowerCase().includes(search)) ||
          (c.phone && c.phone.includes(search))
        );
      }

      if (currentContactType) {
        filtered = filtered.filter(c => c.type === currentContactType);
      }

      renderContactsTable(filtered);
    }

    function filterUsers() {
      const search = document.getElementById('userSearch').value.toLowerCase();
      let filtered = allUsers;

      if (search) {
        filtered = filtered.filter(u =>
          (u.name && u.name.toLowerCase().includes(search)) ||
          (u.email && u.email.toLowerCase().includes(search)) ||
          (u.company && u.company.toLowerCase().includes(search)) ||
          (u.phone && u.phone.includes(search))
        );
      }

      renderUsersTable(filtered);
    }

    // ========== 渲染表格 ==========
    function renderApplicationsTable(data) {
      const container = document.getElementById('applicationsTable');
      const typeMap = { property: '物业', hotel: '酒店', mall: '商场', community: '社区', office: '写字楼', other: '其他' };

      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>暂无合作申请数据</p></div>';
        return;
      }

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>编号</th><th>公司名称</th><th>场所类型</th><th>联系电话</th>
              <th>申请桩数</th><th>状态</th><th>申请时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(app => `
              <tr>
                <td>${app._id ? app._id.slice(-6).toUpperCase() : '-'}</td>
                <td>${app.companyName || '-'}</td>
                <td>${typeMap[app.companyType] || '-'}</td>
                <td>${app.contactPhone || '-'}</td>
                <td>${app.pileCount || '-'} 个</td>
                <td><span class="status status-${app.status || 'pending'}">${getStatusText(app.status)}</span></td>
                <td>${app.createdAt ? new Date(app.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
                <td class="actions">
                  <button class="btn-action btn-view" onclick="viewApplication('${app._id}')">查看</button>
                  ${app.status === 'pending' ? `
                    <button class="btn-action btn-approve" onclick="updateStatus('${app._id}', 'approved')">通过</button>
                    <button class="btn-action btn-reject" onclick="updateStatus('${app._id}', 'rejected')">拒绝</button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    function renderContactsTable(data) {
      const container = document.getElementById('contactsTable');
      const typeMap = { purchase: '产品购买咨询', partnership: '场地合作申请', invest: '投资合作', tech: '技术支持', other: '其他' };

      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📧</div><p>暂无咨询数据</p></div>';
        return;
      }

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>编号</th><th>咨询类型</th><th>联系人</th><th>联系电话</th>
              <th>电子邮箱</th><th>咨询时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(c => `
              <tr>
                <td>${c._id ? c._id.slice(-6).toUpperCase() : '-'}</td>
                <td>${typeMap[c.type] || '-'}</td>
                <td>${c.name || '-'}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${c.createdAt ? new Date(c.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
                <td class="actions">
                  <button class="btn-action btn-view" onclick="viewContact('${c._id}')">查看</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    function renderUsersTable(data) {
      const container = document.getElementById('usersTable');

      if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>暂无注册用户</p></div>';
        return;
      }

      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>用户ID</th><th>姓名</th><th>手机号</th><th>邮箱</th>
              <th>公司</th><th>注册时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(u => `
              <tr>
                <td>${u._id ? u._id.slice(-6).toUpperCase() : '-'}</td>
                <td>${u.name || '-'}</td>
                <td>${u.phone || '-'}</td>
                <td>${u.email || '-'}</td>
                <td>${u.company || '-'}</td>
                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('zh-CN') : '-'}</td>
                <td class="actions">
                  <button class="btn-action btn-view" onclick="viewUser('${u._id}')">查看</button>
                  <button class="btn-action btn-edit" onclick="editUser('${u._id}')">编辑</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // ========== 详情弹窗 ==========
    function viewApplication(id) {
      const app = allApplications.find(a => a._id === id);
      if (!app) return;

      const typeMap = { property: '物业', hotel: '酒店', mall: '商场', community: '社区', office: '写字楼', other: '其他' };
      const installMap = { underground: '地下车库', indoor: '室内停车场', outdoor: '室外停车场' };

      document.getElementById('detailContent').innerHTML = `
        <h3>📋 合作申请详情</h3>
        <div class="detail-grid">
          <div class="detail-row"><div class="detail-label">申请编号</div><div class="detail-value">${app._id ? app._id.slice(-6).toUpperCase() : '-'}</div></div>
          <div class="detail-row"><div class="detail-label">公司名称</div><div class="detail-value">${app.companyName || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">场所类型</div><div class="detail-value">${typeMap[app.companyType] || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">联系电话</div><div class="detail-value">${app.contactPhone || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">场地面积</div><div class="detail-value">${app.siteArea || '-'} ㎡</div></div>
          <div class="detail-row"><div class="detail-label">申请桩数</div><div class="detail-value">${app.pileCount || '-'} 个</div></div>
          <div class="detail-row"><div class="detail-label">安装位置</div><div class="detail-value">${installMap[app.installType] || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">当前状态</div><div class="detail-value"><span class="status status-${app.status || 'pending'}">${getStatusText(app.status)}</span></div></div>
          <div class="detail-row detail-row-full"><div class="detail-label">补充说明</div><div class="detail-value">${app.description || '无'}</div></div>
          <div class="detail-row detail-row-full"><div class="detail-label">申请时间</div><div class="detail-value">${app.createdAt ? new Date(app.createdAt).toLocaleString('zh-CN') : '-'}</div></div>
        </div>
        <div class="detail-actions">
          ${app.status === 'pending' ? `
            <button class="btn-primary-modal" onclick="updateStatus('${app._id}', 'approved')">✅ 通过申请</button>
            <button class="btn-danger-modal" onclick="updateStatus('${app._id}', 'rejected')">❌ 拒绝申请</button>
          ` : ''}
          <button class="btn-close-modal" onclick="closeModal()">关闭</button>
        </div>
      `;
      document.getElementById('detailModal').classList.add('active');
    }

    function viewContact(id) {
      const c = allContacts.find(x => x._id === id);
      if (!c) return;

      const typeMap = { purchase: '产品购买咨询', partnership: '场地合作申请', invest: '投资合作', tech: '技术支持', other: '其他' };

      document.getElementById('detailContent').innerHTML = `
        <h3>📧 咨询详情</h3>
        <div class="detail-grid">
          <div class="detail-row"><div class="detail-label">咨询编号</div><div class="detail-value">${c._id ? c._id.slice(-6).toUpperCase() : '-'}</div></div>
          <div class="detail-row"><div class="detail-label">咨询类型</div><div class="detail-value">${typeMap[c.type] || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">联系人</div><div class="detail-value">${c.name || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">联系电话</div><div class="detail-value">${c.phone || '-'}</div></div>
          <div class="detail-row detail-row-full"><div class="detail-label">电子邮箱</div><div class="detail-value">${c.email || '-'}</div></div>
          <div class="detail-row detail-row-full"><div class="detail-label">详细需求</div><div class="detail-value">${c.detail || '无'}</div></div>
          <div class="detail-row detail-row-full"><div class="detail-label">咨询时间</div><div class="detail-value">${c.createdAt ? new Date(c.createdAt).toLocaleString('zh-CN') : '-'}</div></div>
        </div>
        <div class="detail-actions">
          <button class="btn-close-modal" onclick="closeModal()">关闭</button>
        </div>
      `;
      document.getElementById('detailModal').classList.add('active');
    }

    function viewUser(id) {
      const u = allUsers.find(x => x._id === id);
      if (!u) { showToast('用户数据未找到', 'error'); return; }

      document.getElementById('detailContent').innerHTML = `
        <h3>👤 用户详情</h3>
        <div class="detail-grid">
          <div class="detail-row"><div class="detail-label">用户ID</div><div class="detail-value">${u._id ? u._id.slice(-6).toUpperCase() : '-'}</div></div>
          <div class="detail-row"><div class="detail-label">姓名</div><div class="detail-value">${u.name || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">手机号</div><div class="detail-value">${u.phone || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">电子邮箱</div><div class="detail-value">${u.email || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">公司</div><div class="detail-value">${u.company || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">注册时间</div><div class="detail-value">${u.createdAt ? new Date(u.createdAt).toLocaleString('zh-CN') : '-'}</div></div>
        </div>
        <div class="detail-actions">
          <button class="btn-close-modal" onclick="closeModal()">关闭</button>
        </div>
      `;
      document.getElementById('detailModal').classList.add('active');
    }

    function editUser(id) {
      const u = allUsers.find(x => x._id === id);
      if (!u) { showToast('用户数据未找到', 'error'); return; }

      document.getElementById('detailContent').innerHTML = `
        <h3>✏️ 编辑用户</h3>
        <div class="edit-form">
          <input type="hidden" id="editUserId" value="${u._id}">
          <div class="form-group">
            <label>用户ID</label>
            <input type="text" value="${u._id ? u._id.slice(-6).toUpperCase() : '-'}" disabled style="background:#f1f5f9;color:#94a3b8;">
          </div>
          <div class="form-group">
            <label>姓名</label>
            <input type="text" id="editUserName" value="${u.name || ''}" placeholder="请输入姓名">
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input type="text" id="editUserPhone" value="${u.phone || ''}" placeholder="请输入手机号">
          </div>
          <div class="form-group">
            <label>电子邮箱</label>
            <input type="email" id="editUserEmail" value="${u.email || ''}" placeholder="请输入邮箱">
          </div>
          <div class="form-group">
            <label>公司</label>
            <input type="text" id="editUserCompany" value="${u.company || ''}" placeholder="请输入公司名称">
          </div>
          <div class="form-actions">
            <button class="btn-primary-modal" onclick="saveUserEdit('${u._id}')">💾 保存修改</button>
            <button class="btn-close-modal" onclick="closeModal()">取消</button>
          </div>
        </div>
      `;
      document.getElementById('detailModal').classList.add('active');
    }

    // ========== 保存编辑 ==========
    async function saveUserEdit(id) {
      const name = document.getElementById('editUserName').value.trim();
      const phone = document.getElementById('editUserPhone').value.trim();
      const email = document.getElementById('editUserEmail').value.trim();
      const company = document.getElementById('editUserCompany').value.trim();

      if (!name) {
        showToast('请输入姓名', 'error');
        return;
      }

      try {
        await updateUser(id, { name, phone, email, company });
        // 更新本地缓存
        const idx = allUsers.findIndex(u => u._id === id);
        if (idx > -1) {
          allUsers[idx] = { ...allUsers[idx], name, phone, email, company };
        }
        closeModal();
        filterUsers();
        showToast('用户信息已成功更新', 'success');
      } catch (e) {
        showToast('保存失败：' + e.message, 'error');
      }
    }

    async function updateStatus(id, status) {
      try {
        await updateApplicationStatus(id, status);
        const idx = allApplications.findIndex(a => a._id === id);
        if (idx > -1) {
          allApplications[idx] = { ...allApplications[idx], status };
        }
        closeModal();
        refreshData();
        showToast(status === 'approved' ? '申请已通过' : '申请已拒绝', 'success');
      } catch (e) {
        showToast('操作失败：' + e.message, 'error');
      }
    }

    // ========== 数据导出 ==========
    async function exportData() {
      try {
        const data = {
          applications: await fetchApplications(),
          contacts: await fetchContacts(),
          users: await fetchUsers(),
          exportTime: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voltix-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('数据导出成功', 'success');
      } catch (e) {
        showToast('导出失败：' + e.message, 'error');
      }
    }

    // ========== 弹窗控制 ==========
    function closeModal() {
      document.getElementById('detailModal').classList.remove('active');
    }

    function getStatusText(status) {
      const texts = { pending: '审核中', approved: '已通过', rejected: '已拒绝' };
      return texts[status] || '审核中';
    }

    document.getElementById('detailModal').addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });
