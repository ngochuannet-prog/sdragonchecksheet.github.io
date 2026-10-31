/**
 * SDragon AssetTracker Pro - Authentication & Role-Based Access Control (RBAC)
 * Supports multiple user accounts, permissions (Admin, Technician, Operator), session persistence.
 */

const AUTH_STORAGE_KEYS = {
  USERS: 'sdragon_auth_users_v3',
  SESSION: 'sdragon_auth_session_v3'
};

// Seed factory accounts
const DEFAULT_FACTORY_USERS = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    password: '123',
    fullName: 'Nguyễn Văn Quản Trị (Admin)',
    role: 'admin', // admin | technician | operator
    department: 'Ban Giám Đốc & Kỹ Thuật',
    email: 'admin@sdragon.vn',
    createdDate: '2026-01-01'
  },
  {
    id: 'usr-tech-01',
    username: 'kythuat',
    password: '123',
    fullName: 'Trần Đình Long (Kỹ Sư Trưởng)',
    role: 'technician',
    department: 'Phòng Bảo Trì Cơ Điện',
    email: 'kythuat@sdragon.vn',
    createdDate: '2026-02-15'
  },
  {
    id: 'usr-operator-01',
    username: 'vanhanh',
    password: '123',
    fullName: 'Lê Minh Tuấn (Trưởng Chuyền SMT)',
    role: 'operator',
    department: 'Xưởng Sản Xuất A',
    email: 'vanhanh@sdragon.vn',
    createdDate: '2026-03-10'
  }
];

class AuthManager {
  constructor() {
    this.initStorage();
    this.currentUser = this.loadSession();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initEventListeners());
    } else {
      this.initEventListeners();
    }
  }

  initStorage() {
    if (!localStorage.getItem(AUTH_STORAGE_KEYS.USERS)) {
      localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_FACTORY_USERS));
    }
  }

  getUsers() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : DEFAULT_FACTORY_USERS;
    } catch (e) {
      return DEFAULT_FACTORY_USERS;
    }
  }

  saveUsers(users) {
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  loadSession() {
    try {
      const sess = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION);
      if (sess) {
        return JSON.parse(sess);
      }
    } catch (e) {}
    // Default active session as Admin so user is not blocked initially
    const defaultAdmin = DEFAULT_FACTORY_USERS[0];
    this.setSession(defaultAdmin);
    return defaultAdmin;
  }

  setSession(user) {
    const sessionData = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      department: user.department || 'Nhà máy SDragon',
      email: user.email || '',
      loginAt: new Date().toISOString()
    };
    this.currentUser = sessionData;
    localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
    this.updateUserUI();
    this.applyPermissionsUI();
  }

  clearSession() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
    this.updateUserUI();
    this.applyPermissionsUI();
  }

  login(username, password) {
    const users = this.getUsers();
    const cleanUser = username.trim().toLowerCase();
    const matched = users.find(u => u.username.toLowerCase() === cleanUser && u.password === password);
    
    if (matched) {
      this.setSession(matched);
      return { success: true, user: matched };
    }
    return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác! (Thử: admin / 123)' };
  }

  logout() {
    this.clearSession();
    this.openLoginModal();
    if (typeof showToast === 'function') {
      showToast('Đã đăng xuất khỏi tài khoản!', 'info');
    }
  }

  // Permission Checks: action = 'add_asset' | 'edit_asset' | 'delete_asset' | 'maintenance' | 'manage_users' | 'export_backup'
  hasPermission(action) {
    if (!this.currentUser) return false;
    const role = this.currentUser.role;

    switch (action) {
      case 'manage_users':
      case 'reset_demo':
        return role === 'admin';

      case 'delete_asset':
        return role === 'admin';

      case 'add_asset':
      case 'edit_asset':
      case 'maintenance':
      case 'print_qr':
        return role === 'admin' || role === 'technician';

      case 'view':
      case 'export_csv':
      case 'track_inspection':
        return true; // All roles can view and export basic CSV

      default:
        return false;
    }
  }

  // Update Header User Profile Element
  updateUserUI() {
    const user = this.currentUser;
    const avatarEl = document.getElementById('userAvatarInitial');
    const nameEl = document.getElementById('userFullName');
    const roleEl = document.getElementById('userRoleBadge');
    const navUserManageBtn = document.getElementById('btnOpenUserManagement');

    if (!user) {
      if (nameEl) nameEl.textContent = 'Chưa đăng nhập';
      if (roleEl) {
        roleEl.className = 'role-badge guest';
        roleEl.textContent = 'Khách';
      }
      if (avatarEl) avatarEl.textContent = '?';
      if (navUserManageBtn) navUserManageBtn.style.display = 'none';
      return;
    }

    if (nameEl) nameEl.textContent = user.fullName;
    if (avatarEl) {
      const parts = user.fullName.trim().split(' ').filter(Boolean);
      const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]) : (parts[0] ? parts[0][0] : 'U');
      avatarEl.textContent = initials.toUpperCase();
    }

    if (roleEl) {
      roleEl.className = `role-badge ${user.role}`;
      let roleLabel = 'Khách';
      if (user.role === 'admin') roleLabel = '👑 Quản Trị Viên';
      else if (user.role === 'technician') roleLabel = '🔧 Kỹ Thuật Viên';
      else if (user.role === 'operator') roleLabel = '👷 Người Vận Hành';
      roleEl.textContent = roleLabel;
    }

    // Toggle Admin Navigation Items
    const btnUserDropdown = document.getElementById('btnOpenUserMgmtDropdown');
    const isAdmin = user && user.role === 'admin';
    if (navUserManageBtn) {
      navUserManageBtn.style.display = isAdmin ? 'flex' : 'none';
    }
    if (btnUserDropdown) {
      btnUserDropdown.style.display = isAdmin ? 'flex' : 'none';
    }
  }

  // Apply UI Disabling / Hiding according to permissions
  applyPermissionsUI() {
    const role = this.currentUser ? this.currentUser.role : 'guest';

    // 1. Add Asset Button
    const btnAdd = document.getElementById('btnOpenAddModal');
    if (btnAdd) {
      if (role === 'operator' || !this.currentUser) {
        btnAdd.style.opacity = '0.5';
        btnAdd.title = 'Chỉ Quản trị viên hoặc Kỹ thuật viên mới được thêm máy';
      } else {
        btnAdd.style.opacity = '1';
        btnAdd.title = '+ Thêm Máy Móc Mới';
      }
    }

    // 2. Bulk Delete Button
    const btnBulkDel = document.getElementById('btnBulkDelete');
    if (btnBulkDel) {
      btnBulkDel.style.display = role === 'admin' ? 'inline-flex' : 'none';
    }

    // 3. Reset Demo Button in Export Modal
    const btnResetDemo = document.getElementById('btnResetDemoData');
    if (btnResetDemo) {
      btnResetDemo.disabled = role !== 'admin';
      btnResetDemo.title = role !== 'admin' ? 'Chỉ Quản trị viên mới được đặt lại dữ liệu mẫu' : '';
    }
  }

  openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'flex';
      const userInp = document.getElementById('loginUsername');
      if (userInp) userInp.focus();
    }
  }

  closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
  }

  // Add / Manage Users (STRICT ADMIN ONLY)
  createUser(userData) {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      return { success: false, message: 'Chỉ Quản Trị Viên (Admin) mới có quyền tạo tài khoản mới!' };
    }
    const users = this.getUsers();
    if (users.some(u => u.username.toLowerCase() === userData.username.trim().toLowerCase())) {
      return { success: false, message: `Tên đăng nhập "${userData.username}" đã tồn tại!` };
    }
    userData.id = 'usr-' + Date.now();
    userData.createdDate = new Date().toISOString().split('T')[0];
    users.push(userData);
    this.saveUsers(users);
    return { success: true, user: userData };
  }

  deleteUser(userId) {
    if (this.currentUser && this.currentUser.id === userId) {
      return { success: false, message: 'Không thể xóa tài khoản của chính bạn đang đăng nhập!' };
    }
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);
    return { success: true };
  }

  initEventListeners() {
    // Top right user profile click opens user dropdown
    const userProfileWidget = document.getElementById('userProfileWidget');
    if (userProfileWidget) {
      userProfileWidget.addEventListener('click', (e) => {
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.classList.toggle('show');
      });
    }

    // Close user dropdown if click outside
    window.addEventListener('click', (e) => {
      const widget = document.getElementById('userProfileWidget');
      const menu = document.getElementById('userDropdownMenu');
      if (menu && widget && !widget.contains(e.target)) {
        menu.classList.remove('show');
      }
    });

    // Logout button in dropdown
    const btnLogout = document.getElementById('btnLogoutDropdown');
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.classList.remove('show');
        this.logout();
      });
    }

    // Switch Account button in dropdown
    const btnSwitchAccount = document.getElementById('btnSwitchAccount');
    if (btnSwitchAccount) {
      btnSwitchAccount.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.classList.remove('show');
        this.openLoginModal();
      });
    }

    // Open User Management Modal from sidebar or dropdown
    const btnOpenUserMgmt = document.getElementById('btnOpenUserManagement');
    if (btnOpenUserMgmt) {
      btnOpenUserMgmt.addEventListener('click', () => {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
          if (typeof showToast === 'function') {
            showToast('Chỉ Quản Trị Viên (Admin) mới có quyền xem mật khẩu và quản lý tài khoản!', 'error');
          }
          return;
        }
        this.renderUserManagementModal();
        const modal = document.getElementById('userManagementModal');
        if (modal) modal.style.display = 'flex';
      });
    }

    const btnOpenUserMgmtDropdown = document.getElementById('btnOpenUserMgmtDropdown');
    if (btnOpenUserMgmtDropdown) {
      btnOpenUserMgmtDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.classList.remove('show');
        if (!this.currentUser || this.currentUser.role !== 'admin') {
          if (typeof showToast === 'function') {
            showToast('Chỉ Quản Trị Viên (Admin) mới có quyền xem mật khẩu và quản lý tài khoản!', 'error');
          }
          return;
        }
        this.renderUserManagementModal();
        const modal = document.getElementById('userManagementModal');
        if (modal) modal.style.display = 'flex';
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userVal = document.getElementById('loginUsername').value;
        const passVal = document.getElementById('loginPassword').value;

        const res = this.login(userVal, passVal);
        if (res.success) {
          this.closeLoginModal();
          if (typeof showToast === 'function') {
            showToast(`Đăng nhập thành công! Xin chào ${res.user.fullName}`, 'success');
          }
          if (window.sheetManager) window.sheetManager.render();
        } else {
          if (typeof showToast === 'function') {
            showToast(res.message, 'error');
          }
        }
      });
    }

    // Quick demo account chips
    document.querySelectorAll('.demo-login-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const u = chip.dataset.user;
        const p = chip.dataset.pass;
        document.getElementById('loginUsername').value = u;
        document.getElementById('loginPassword').value = p;
        const res = this.login(u, p);
        if (res.success) {
          this.closeLoginModal();
          if (typeof showToast === 'function') {
            showToast(`Đã chuyển sang tài khoản: ${res.user.fullName}`, 'success');
          }
          if (window.sheetManager) window.sheetManager.render();
        }
      });
    });

    // Password visibility toggle
    const btnTogglePass = document.getElementById('btnTogglePassword');
    if (btnTogglePass) {
      btnTogglePass.addEventListener('click', () => {
        const inp = document.getElementById('loginPassword');
        if (inp.type === 'password') {
          inp.type = 'text';
          btnTogglePass.textContent = 'Ẩn';
        } else {
          inp.type = 'password';
          btnTogglePass.textContent = 'Hiện';
        }
      });
    }

    // Close Login Modal button
    const btnCloseLogin = document.getElementById('btnCloseLoginModal');
    if (btnCloseLogin) {
      btnCloseLogin.addEventListener('click', () => {
        if (!this.currentUser) {
          if (typeof showToast === 'function') {
            showToast('Vui lòng chọn tài khoản để tiếp tục', 'warning');
          }
          return;
        }
        this.closeLoginModal();
      });
    }

    // User Management Modal: Add new user form
    const newUserForm = document.getElementById('newUserForm');
    if (newUserForm) {
      newUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const fullName = document.getElementById('newFullName').value.trim();
        const role = document.getElementById('newRole').value;
        const department = document.getElementById('newDepartment').value.trim();
        const email = document.getElementById('newEmail').value.trim();

        const res = this.createUser({ username, password, fullName, role, department, email });
        if (res.success) {
          newUserForm.reset();
          this.renderUserManagementModal();
          if (typeof showToast === 'function') {
            showToast(`Đã tạo tài khoản cho ${fullName}!`, 'success');
          }
        } else {
          if (typeof showToast === 'function') {
            showToast(res.message, 'error');
          }
        }
      });
    }

    const btnCloseUserMgmt = document.getElementById('btnCloseUserMgmt');
    if (btnCloseUserMgmt) {
      btnCloseUserMgmt.addEventListener('click', () => {
        const modal = document.getElementById('userManagementModal');
        if (modal) modal.style.display = 'none';
      });
    }

    // Update UI on start
    this.updateUserUI();
    this.applyPermissionsUI();
  }

  // Render User Management Table in Admin Modal (STRICT RBAC)
  renderUserManagementModal() {
    const tbody = document.getElementById('userListTbody');
    if (!tbody) return;

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';

    // Form create user: only visible to Admin
    const newUserCard = document.getElementById('newUserCardPanel');
    const adminNotice = document.getElementById('adminOnlyUserNotice');
    if (newUserCard) {
      newUserCard.style.display = isAdmin ? 'block' : 'none';
    }
    if (adminNotice) {
      adminNotice.style.display = isAdmin ? 'none' : 'block';
    }

    const users = this.getUsers();
    tbody.innerHTML = users.map(u => {
      const isCurrent = this.currentUser && this.currentUser.id === u.id;
      let rolePill = '<span class="role-badge operator">Người Vận Hành</span>';
      if (u.role === 'admin') rolePill = '<span class="role-badge admin">👑 Quản Trị Viên</span>';
      else if (u.role === 'technician') rolePill = '<span class="role-badge technician">🔧 Kỹ Thuật Viên</span>';

      // STRICT SECURITY: ONLY ADMIN CAN VIEW PASSWORDS! ALL OTHERS MASKED!
      const passCell = isAdmin 
        ? `<code>${u.password}</code>` 
        : `<span style="letter-spacing:3px; color:var(--text-dim); font-weight:700;">••••••</span>`;

      return `
        <tr>
          <td><strong>${u.username}</strong> ${isCurrent ? '<small style="color:var(--status-operational); font-weight:700;">(Đang dùng)</small>' : ''}</td>
          <td>${u.fullName}</td>
          <td>${rolePill}</td>
          <td>${u.department || '-'}</td>
          <td>${passCell}</td>
          <td class="text-center">
            ${isCurrent ? '<span style="color:var(--text-dim); font-size:0.75rem;">Hiện tại</span>' : (isAdmin ? `
              <button class="btn btn-sm btn-danger" onclick="window.authManager.handleDeleteUser('${u.id}')" title="Xóa người dùng">
                Xóa
              </button>
            ` : '<span style="color:var(--text-dim); font-size:0.75rem;">Chỉ xem</span>')}
          </td>
        </tr>
      `;
    }).join('');
  }

  handleDeleteUser(userId) {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      if (typeof showToast === 'function') {
        showToast('Chỉ Quản Trị Viên (Admin) mới có quyền xóa tài khoản!', 'error');
      }
      return;
    }
    if (confirm('Bạn có chắc muốn xóa tài khoản này?')) {
      const res = this.deleteUser(userId);
      if (res.success) {
        this.renderUserManagementModal();
        if (typeof showToast === 'function') {
          showToast('Đã xóa tài khoản!', 'info');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast(res.message, 'error');
        }
      }
    }
  }
}

// Global instance
window.authManager = new AuthManager();
