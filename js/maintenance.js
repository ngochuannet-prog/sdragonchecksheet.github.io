/**
 * SDragon AssetTracker Pro - Maintenance & Calibration Controller
 * Manages PM schedules, urgent countdown alerts, maintenance logs, work orders,
 * row selection, print selected, export CSV, edit, and deletion.
 */

class MaintenanceManager {
  constructor() {
    this.selectedIds = new Set();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initEventListeners());
    } else {
      this.initEventListeners();
    }
  }

  initEventListeners() {
    // Quick Add Maintenance Log Button
    const btnQuickAddLog = document.getElementById('btnQuickAddLog');
    if (btnQuickAddLog) {
      btnQuickAddLog.addEventListener('click', () => {
        this.openMaintenanceModal();
      });
    }

    // Export Maintenance Logs CSV (Selected or All)
    const btnExportLogs = document.getElementById('btnExportMaintLogs');
    if (btnExportLogs) {
      btnExportLogs.addEventListener('click', () => {
        this.exportLogsCSV();
      });
    }

    // Print Selected Maintenance Logs
    const btnPrintSelected = document.getElementById('btnMaintPrintSelected');
    if (btnPrintSelected) {
      btnPrintSelected.addEventListener('click', () => {
        this.printSelectedLogs();
      });
    }

    // Bulk Delete Selected Maintenance Logs
    const btnDeleteSelected = document.getElementById('btnMaintDeleteSelected');
    if (btnDeleteSelected) {
      btnDeleteSelected.addEventListener('click', () => {
        this.deleteSelectedLogs();
      });
    }

    // Maintenance Form Submit (Add or Edit)
    const maintForm = document.getElementById('maintLogForm');
    if (maintForm) {
      maintForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveMaintenance();
      });
    }

    // Close Maintenance Modal buttons
    const btnClose = document.getElementById('btnCloseMaintModal');
    const btnCancel = document.getElementById('btnCancelMaint');
    if (btnClose) btnClose.addEventListener('click', () => this.closeMaintenanceModal());
    if (btnCancel) btnCancel.addEventListener('click', () => this.closeMaintenanceModal());

    // Select All Checkbox Handler
    const selectAll = document.getElementById('maintSelectAll');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const checkboxes = document.querySelectorAll('.maint-row-checkbox');
        checkboxes.forEach(cb => {
          cb.checked = isChecked;
          const id = cb.dataset.logId;
          if (id) {
            if (isChecked) this.selectedIds.add(id);
            else this.selectedIds.delete(id);
          }
        });
        this.updateSelectionUI();
      });
    }

    // Auto-subscribe to Store reactive updates
    if (typeof store !== 'undefined' && typeof store.subscribe === 'function') {
      store.subscribe((eventName, data) => {
        if (eventName.startsWith('maintenance_') || eventName.startsWith('assets_')) {
          this.render();
        }
      });
    }
  }

  // Update UI selection badges and action buttons
  updateSelectionUI() {
    const count = this.selectedIds.size;
    const badge = document.getElementById('maintSelectedCountBadge');
    const btnDelete = document.getElementById('btnMaintDeleteSelected');
    const btnExport = document.getElementById('btnExportMaintLogs');
    const btnPrint = document.getElementById('btnMaintPrintSelected');
    const selectAll = document.getElementById('maintSelectAll');

    if (badge) {
      if (count > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = `Đã chọn ${count} mục`;
      } else {
        badge.style.display = 'none';
      }
    }

    if (btnDelete) {
      btnDelete.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    if (btnExport) {
      btnExport.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>${count > 0 ? `Xuất ${count} CSV` : 'Xuất CSV'}</span>
      `;
    }

    if (btnPrint) {
      btnPrint.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        <span>${count > 0 ? `In ${count} Mục` : 'In Ra'}</span>
      `;
    }

    if (selectAll) {
      const allCbs = document.querySelectorAll('.maint-row-checkbox');
      if (allCbs.length > 0) {
        selectAll.checked = count === allCbs.length;
        selectAll.indeterminate = count > 0 && count < allCbs.length;
      } else {
        selectAll.checked = false;
        selectAll.indeterminate = false;
      }
    }
  }

  // Master Render Method
  render() {
    this.renderUrgentCountdowns();
    this.renderMaintenanceLogsTable();
  }

  // 1. Render Countdown Alerts for Overdue & Sắp Đến Hạn
  renderUrgentCountdowns() {
    const container = document.getElementById('urgentItemsContainer');
    const badgeCount = document.getElementById('urgentMaintenanceCount');
    if (!container) return;

    const assets = (typeof store !== 'undefined' && store.getAssets) ? store.getAssets() : [];
    const urgentList = [];

    assets.forEach(a => {
      const dueInfo = DateHelper.calculateDueStatus(a.nextDue);
      if (dueInfo.isOverdue || dueInfo.isWithin7Days) {
        urgentList.push({ ...a, dueInfo });
      }
    });

    urgentList.sort((a, b) => a.dueInfo.days - b.dueInfo.days);

    if (badgeCount) {
      badgeCount.textContent = `${urgentList.length} máy`;
      if (urgentList.length > 0) {
        badgeCount.className = 'count-tag urgent';
      } else {
        badgeCount.className = 'count-tag safe';
      }
    }

    if (urgentList.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-dim); font-size:0.85rem;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--status-operational); margin-bottom:8px;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div>Tất cả máy móc đều trong hạn vận hành an toàn!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = urgentList.map(item => {
      const isOverdue = item.dueInfo.isOverdue;
      return `
        <div class="urgent-item-row ${isOverdue ? 'is-overdue' : ''}">
          <div class="urgent-info">
            <h5>${item.code} - ${item.name}</h5>
            <span>${item.department} &bull; PIC: ${item.operator ? item.operator.split(' ')[0] : 'N/A'}</span>
          </div>
          <div style="text-align:right;">
            <div class="due-tag ${isOverdue ? 'overdue' : 'warning'}" style="margin-bottom:6px;">
              ${item.dueInfo.text}
            </div>
            <button class="btn btn-sm btn-secondary" onclick="openAddMaintModalForAsset('${item.id}')" title="Lập phiếu xử lý">
              Bảo Dưỡng &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Render Maintenance Log History Table with checkboxes and action buttons
  renderMaintenanceLogsTable() {
    const tbody = document.getElementById('maintenanceHistoryTbody');
    if (!tbody) return;

    const logs = (typeof store !== 'undefined' && store.getLogs) ? store.getLogs() : [];
    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding:24px; color:var(--text-dim);">Chưa có nhật ký bảo trì nào được ghi nhận.</td></tr>`;
      this.selectedIds.clear();
      this.updateSelectionUI();
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let statusTag = '';
      if (l.resultStatus === 'operational') statusTag = '<span class="status-pill operational"><span class="stat-dot"></span> Sẵn sàng</span>';
      else if (l.resultStatus === 'maintenance') statusTag = '<span class="status-pill maintenance"><span class="stat-dot"></span> Đang chờ</span>';
      else statusTag = '<span class="status-pill down"><span class="stat-dot"></span> Sự cố</span>';

      const isChecked = this.selectedIds.has(l.id);

      return `
        <tr data-log-id="${l.id}" class="${isChecked ? 'row-selected' : ''}">
          <td style="text-align: center;">
            <input type="checkbox" class="maint-row-checkbox" data-log-id="${l.id}" ${isChecked ? 'checked' : ''}>
          </td>
          <td style="font-family:var(--font-mono); font-size:0.78rem;">${DateHelper.formatVN(l.date)}</td>
          <td>
            <span class="asset-code-badge" onclick="openAssetDetailModal('${l.assetId}')" title="Xem thông tin máy">${l.assetCode || 'N/A'}</span>
          </td>
          <td><strong>${l.type || 'Bảo dưỡng'}</strong></td>
          <td style="max-width:260px; font-size:0.8rem; color:var(--text-muted);">${l.description || '-'}</td>
          <td>${l.technician || 'N/A'}</td>
          <td style="font-family:var(--font-mono); color:var(--text-main); font-weight:600;">
            ${(typeof NumberHelper !== 'undefined') ? NumberHelper.formatCurrencyVN(l.cost) : (l.cost || 0)}
          </td>
          <td>${statusTag}</td>
          <td style="text-align: center;">
            <div class="row-actions" style="justify-content: center; gap: 4px;">
              <button type="button" class="action-btn-mini warning" onclick="window.maintenanceManager.openEditModal('${l.id}')" title="Chỉnh sửa phiếu bảo dưỡng này">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="action-btn-mini danger" onclick="window.maintenanceManager.deleteLog('${l.id}')" title="Xóa phiếu bảo dưỡng này">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row checkbox event listeners
    tbody.querySelectorAll('.maint-row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.dataset.logId;
        if (!id) return;
        if (cb.checked) {
          this.selectedIds.add(id);
          cb.closest('tr')?.classList.add('row-selected');
        } else {
          this.selectedIds.delete(id);
          cb.closest('tr')?.classList.remove('row-selected');
        }
        this.updateSelectionUI();
      });
    });

    this.updateSelectionUI();
  }

  // Open Maintenance Log Modal (Create new)
  openMaintenanceModal(targetAssetId = null) {
    if (window.authManager && !window.authManager.hasPermission('maintenance')) {
      showToast('Vui lòng đăng nhập tài khoản Kỹ Thuật Viên hoặc Admin để lập phiếu bảo dưỡng!', 'warning');
      window.authManager.openLoginModal();
      return;
    }

    const modal = document.getElementById('maintenanceLogModal');
    const select = document.getElementById('maintAssetSelect');
    const dateInput = document.getElementById('maintDate');
    const form = document.getElementById('maintLogForm');
    const logIdInput = document.getElementById('maintLogId');
    const modalSubtitle = document.getElementById('maintModalSubtitle');

    if (!modal || !select) return;

    if (logIdInput) logIdInput.value = '';
    const modalTitle = modal.querySelector('.modal-title-group h3');
    if (modalTitle) modalTitle.textContent = 'Ghi Nhật Ký Bảo Dưỡng / Sửa Chữa';
    if (modalSubtitle) modalSubtitle.textContent = 'Cập nhật track sheet bảo dưỡng thiết bị';

    const assets = store.getAssets();
    select.innerHTML = assets.map(a => `
      <option value="${a.id}" ${targetAssetId === a.id ? 'selected' : ''}>
        ${a.code} - ${a.name} (${a.department})
      </option>
    `).join('');

    select.disabled = false;
    form.reset();
    if (targetAssetId) select.value = targetAssetId;
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    modal.style.display = 'flex';
  }

  // Open Edit Maintenance Log Modal
  openEditModal(logId) {
    if (window.authManager && !window.authManager.hasPermission('maintenance')) {
      showToast('Vui lòng đăng nhập tài khoản Kỹ Thuật Viên hoặc Admin để chỉnh sửa phiếu!', 'warning');
      window.authManager.openLoginModal();
      return;
    }

    const log = store.getLogById(logId);
    if (!log) {
      showToast('Không tìm thấy bản ghi bảo dưỡng cần sửa!', 'error');
      return;
    }

    const modal = document.getElementById('maintenanceLogModal');
    const select = document.getElementById('maintAssetSelect');
    const dateInput = document.getElementById('maintDate');
    const logIdInput = document.getElementById('maintLogId');
    const modalSubtitle = document.getElementById('maintModalSubtitle');

    if (!modal || !select) return;

    if (logIdInput) logIdInput.value = log.id;
    const modalTitle = modal.querySelector('.modal-title-group h3');
    if (modalTitle) modalTitle.textContent = `✏️ Chỉnh Sửa Nhật Ký: ${log.assetCode}`;
    if (modalSubtitle) modalSubtitle.textContent = `Cập nhật thông tin phiếu bảo dưỡng thực hiện ngày ${DateHelper.formatVN(log.date)}`;

    const assets = store.getAssets();
    select.innerHTML = assets.map(a => `
      <option value="${a.id}" ${log.assetId === a.id ? 'selected' : ''}>
        ${a.code} - ${a.name} (${a.department})
      </option>
    `).join('');

    select.value = log.assetId;
    if (dateInput) dateInput.value = log.date || '';

    const elType = document.getElementById('maintType');
    const elDesc = document.getElementById('maintDescription');
    const elTech = document.getElementById('maintTechnician');
    const elCost = document.getElementById('maintCost');
    const elStatus = document.getElementById('maintResultStatus');

    if (elType) elType.value = log.type || 'Bảo dưỡng định kỳ';
    if (elDesc) elDesc.value = log.description || '';
    if (elTech) elTech.value = log.technician || '';
    if (elCost) elCost.value = log.cost || 0;
    if (elStatus) elStatus.value = log.resultStatus || 'operational';

    modal.style.display = 'flex';
  }

  closeMaintenanceModal() {
    const modal = document.getElementById('maintenanceLogModal');
    if (modal) modal.style.display = 'none';
    const logIdInput = document.getElementById('maintLogId');
    if (logIdInput) logIdInput.value = '';
  }

  // Handle Form Submit (Add or Edit)
  handleSaveMaintenance() {
    const select = document.getElementById('maintAssetSelect');
    const assetId = select.value;
    const asset = store.getAssetById(assetId);

    if (!asset) {
      showToast('Vui lòng chọn thiết bị hợp lệ!', 'error');
      return;
    }

    const logIdInput = document.getElementById('maintLogId');
    const isEdit = logIdInput && logIdInput.value;

    const logData = {
      assetId: asset.id,
      assetCode: asset.code,
      assetName: asset.name,
      date: document.getElementById('maintDate').value,
      type: document.getElementById('maintType').value,
      description: document.getElementById('maintDescription').value,
      technician: document.getElementById('maintTechnician').value,
      cost: parseFloat(document.getElementById('maintCost').value) || 0,
      resultStatus: document.getElementById('maintResultStatus').value
    };

    if (isEdit) {
      logData.id = logIdInput.value;
      store.updateMaintenanceLog(logData);
      showToast(`Đã cập nhật phiếu bảo dưỡng cho ${asset.code}!`, 'success');
    } else {
      store.addMaintenanceLog(logData);
      showToast(`Đã lưu phiếu bảo dưỡng mới cho ${asset.code}! Hạn bảo dưỡng mới đã được cập nhật.`, 'success');
    }

    this.closeMaintenanceModal();
    this.render();

    if (typeof window.refreshAllDataViews === 'function') {
      window.refreshAllDataViews();
    }
  }

  // Delete single maintenance log
  deleteLog(logId) {
    if (window.authManager && !window.authManager.hasPermission('delete_asset')) {
      showToast('Chỉ Quản Trị Viên (Admin) mới có quyền xóa nhật ký bảo dưỡng!', 'warning');
      window.authManager.openLoginModal();
      return;
    }

    const log = store.getLogById(logId);
    const confirmMsg = log 
      ? `Bạn có chắc chắn muốn xóa phiếu bảo dưỡng của máy "${log.assetCode}" ngày ${DateHelper.formatVN(log.date)}?`
      : 'Bạn có chắc chắn muốn xóa phiếu bảo dưỡng này?';

    if (confirm(confirmMsg)) {
      store.deleteMaintenanceLog(logId);
      this.selectedIds.delete(logId);
      this.render();
      if (typeof window.refreshAllDataViews === 'function') {
        window.refreshAllDataViews();
      }
      showToast('Đã xóa phiếu bảo dưỡng thành công!', 'info');
    }
  }

  // Bulk delete selected logs
  deleteSelectedLogs() {
    if (window.authManager && !window.authManager.hasPermission('delete_asset')) {
      showToast('Chỉ Quản Trị Viên (Admin) mới có quyền xóa nhật ký bảo dưỡng!', 'warning');
      window.authManager.openLoginModal();
      return;
    }

    const count = this.selectedIds.size;
    if (count === 0) {
      showToast('Vui lòng chọn ít nhất 1 phiếu bảo dưỡng để xóa!', 'warning');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa ${count} phiếu bảo dưỡng đã chọn? Hành động này không thể hoàn tác.`)) {
      store.deleteMultipleMaintenanceLogs([...this.selectedIds]);
      this.selectedIds.clear();
      this.render();
      if (typeof window.refreshAllDataViews === 'function') {
        window.refreshAllDataViews();
      }
      showToast(`Đã xóa thành công ${count} phiếu bảo dưỡng!`, 'info');
    }
  }

  // Export logs to CSV (Selected or All)
  exportLogsCSV() {
    const allLogs = store.getLogs();
    if (allLogs.length === 0) {
      showToast('Chưa có nhật ký bảo dưỡng nào để xuất CSV!', 'warning');
      return;
    }

    const targetLogs = this.selectedIds.size > 0
      ? allLogs.filter(l => this.selectedIds.has(l.id))
      : allLogs;

    store.exportMaintenanceLogsToCSV(targetLogs);
    showToast(`Đã xuất ${targetLogs.length} phiếu bảo dưỡng ra file CSV!`, 'success');
  }

  // Print selected logs or all logs
  printSelectedLogs() {
    const allLogs = store.getLogs();
    if (allLogs.length === 0) {
      showToast('Chưa có nhật ký bảo dưỡng nào để in!', 'warning');
      return;
    }

    const targetLogs = this.selectedIds.size > 0
      ? allLogs.filter(l => this.selectedIds.has(l.id))
      : allLogs;

    const printContainer = document.getElementById('printableBatchContainer');
    if (!printContainer) {
      window.print();
      return;
    }

    const rowsHtml = targetLogs.map((l, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>${DateHelper.formatVN(l.date)}</td>
        <td><strong>${l.assetCode || ''}</strong> - ${l.assetName || ''}</td>
        <td>${l.type || ''}</td>
        <td>${l.description || ''}</td>
        <td>${l.technician || ''}</td>
        <td>${(typeof NumberHelper !== 'undefined') ? NumberHelper.formatCurrencyVN(l.cost) : (l.cost || 0)}</td>
        <td>${l.resultStatus === 'operational' ? 'Sẵn sàng' : (l.resultStatus === 'maintenance' ? 'Đang bảo dưỡng' : 'Sự cố')}</td>
      </tr>
    `).join('');

    printContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h2 style="margin:0; font-size:16pt; font-weight:bold;">SDRAGON INDUSTRIAL PRECISION</h2>
            <div style="font-size:10pt; color:#444; margin-top:4px;">HỆ THỐNG QUẢN LÝ THIẾT BỊ VẬN HÀNH & BẢO TRÌ</div>
          </div>
          <div style="text-align:right; font-size:9pt;">
            <div>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
            <div>Số lượng bản ghi: ${targetLogs.length}</div>
          </div>
        </div>

        <h3 style="text-align:center; font-size:14pt; margin: 16px 0; text-transform: uppercase;">
          BÁO CÁO NHẬT KÝ BẢO DƯỠNG & SỬA CHỮA MÁY MÓC
        </h3>

        <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:10pt;">
          <thead>
            <tr style="background:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; width:35px; text-align:center;">STT</th>
              <th style="border:1px solid #000; padding:6px; width:85px;">Ngày</th>
              <th style="border:1px solid #000; padding:6px;">Thiết Bị / Máy Móc</th>
              <th style="border:1px solid #000; padding:6px;">Loại Hình</th>
              <th style="border:1px solid #000; padding:6px;">Nội Dung Kỹ Thuật</th>
              <th style="border:1px solid #000; padding:6px;">Kỹ Thuật Viên</th>
              <th style="border:1px solid #000; padding:6px;">Chi Phí</th>
              <th style="border:1px solid #000; padding:6px;">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-around; text-align: center; font-size: 10pt;">
          <div>
            <strong>Kỹ Thuật Viên Thực Hiện</strong><br><br><br>
            <span>(Ký, ghi rõ họ tên)</span>
          </div>
          <div>
            <strong>Trưởng Phòng Cơ Điện / Quản Đốc</strong><br><br><br>
            <span>(Ký, đóng dấu duyệt)</span>
          </div>
        </div>
      </div>
    `;

    printContainer.style.display = 'block';
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        printContainer.style.display = 'none';
        printContainer.innerHTML = '';
      }, 500);
    }, 200);
  }
}

window.maintenanceManager = new MaintenanceManager();
window.openAddMaintModalForAsset = function (assetId) {
  if (window.maintenanceManager) {
    window.maintenanceManager.openMaintenanceModal(assetId);
  }
};
