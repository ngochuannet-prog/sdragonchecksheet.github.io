/**
 * SDragon AssetTracker Pro - Maintenance & Calibration Controller
 * Manages PM schedules, urgent countdown alerts, maintenance logs, and work orders.
 */

class MaintenanceManager {
  constructor() {
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

    // Export Maintenance Logs CSV
    const btnExportLogs = document.getElementById('btnExportMaintLogs');
    if (btnExportLogs) {
      btnExportLogs.addEventListener('click', () => {
        this.exportLogsCSV();
      });
    }

    // Maintenance Form Submit
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
  }

  // Render View 3
  render() {
    this.renderUrgentCountdownList();
    this.renderMaintenanceLogsTable();
  }

  // 1. Render Urgent Maintenance Countdown List
  renderUrgentCountdownList() {
    const container = document.getElementById('urgentItemsContainer');
    const urgentCountBadge = document.getElementById('urgentMaintenanceCount');
    if (!container) return;

    const assets = store.getAssets();
    const urgentList = [];

    assets.forEach(a => {
      const dueInfo = DateHelper.calculateDueStatus(a.nextDue);
      if (dueInfo.isOverdue || dueInfo.isWithin7Days) {
        urgentList.push({
          ...a,
          dueInfo
        });
      }
    });

    // Sort by most overdue first
    urgentList.sort((a, b) => a.dueInfo.days - b.dueInfo.days);

    if (urgentCountBadge) {
      urgentCountBadge.textContent = `${urgentList.length} máy`;
      if (urgentList.length === 0) {
        urgentCountBadge.style.background = 'var(--status-operational-bg)';
        urgentCountBadge.style.color = 'var(--status-operational)';
      } else {
        urgentCountBadge.style.background = 'var(--status-down-bg)';
        urgentCountBadge.style.color = 'var(--status-down)';
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

  // 2. Render Maintenance Log History Table
  renderMaintenanceLogsTable() {
    const tbody = document.getElementById('maintenanceHistoryTbody');
    if (!tbody) return;

    const logs = store.getLogs();
    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:24px; color:var(--text-dim);">Chưa có nhật ký bảo trì nào được ghi nhận.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let statusTag = '';
      if (l.resultStatus === 'operational') statusTag = '<span class="status-pill operational"><span class="stat-dot"></span> Sẵn sàng</span>';
      else if (l.resultStatus === 'maintenance') statusTag = '<span class="status-pill maintenance"><span class="stat-dot"></span> Đang chờ</span>';
      else statusTag = '<span class="status-pill down"><span class="stat-dot"></span> Sự cố</span>';

      return `
        <tr>
          <td style="font-family:var(--font-mono); font-size:0.78rem;">${DateHelper.formatVN(l.date)}</td>
          <td>
            <span class="asset-code-badge" onclick="openAssetDetailModal('${l.assetId}')">${l.assetCode}</span>
          </td>
          <td><strong>${l.type}</strong></td>
          <td style="max-width:280px; font-size:0.8rem; color:var(--text-muted);">${l.description}</td>
          <td>${l.technician}</td>
          <td style="font-family:var(--font-mono); color:var(--text-main); font-weight:600;">
            ${NumberHelper.formatCurrencyVN(l.cost)}
          </td>
          <td>${statusTag}</td>
        </tr>
      `;
    }).join('');
  }

  // Open Maintenance Log Modal
  openMaintenanceModal(targetAssetId = null) {
    const modal = document.getElementById('maintenanceLogModal');
    const select = document.getElementById('maintAssetSelect');
    const dateInput = document.getElementById('maintDate');
    const form = document.getElementById('maintLogForm');

    if (!modal || !select) return;

    // Populate asset dropdown
    const assets = store.getAssets();
    select.innerHTML = assets.map(a => `
      <option value="${a.id}" ${targetAssetId === a.id ? 'selected' : ''}>
        ${a.code} - ${a.name} (${a.department})
      </option>
    `).join('');

    // Set today as default date
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    form.reset();
    if (targetAssetId) {
      select.value = targetAssetId;
    }
    dateInput.value = new Date().toISOString().split('T')[0];

    modal.style.display = 'flex';
  }

  closeMaintenanceModal() {
    const modal = document.getElementById('maintenanceLogModal');
    if (modal) modal.style.display = 'none';
  }

  handleSaveMaintenance() {
    const select = document.getElementById('maintAssetSelect');
    const assetId = select.value;
    const asset = store.getAssetById(assetId);

    if (!asset) {
      showToast('Vui lòng chọn thiết bị hợp lệ!', 'error');
      return;
    }

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

    store.addMaintenanceLog(logData);
    this.closeMaintenanceModal();

    // Re-render everything
    this.render();
    if (window.sheetManager) window.sheetManager.render();
    if (window.dashboardManager) window.dashboardManager.updateKPIs();

    showToast(`Đã lưu phiếu bảo dưỡng cho ${asset.code}! Hạn bảo dưỡng mới đã được cập nhật.`, 'success');
  }

  // Export logs to CSV
  exportLogsCSV() {
    const logs = store.getLogs();
    const headers = ['Ngày', 'Mã Thiết Bị', 'Tên Máy Móc', 'Loại Hình', 'Nội Dung Xử Lý', 'Kỹ Thuật Viên', 'Chi Phí (VNĐ)', 'Trạng Thái Sau Sửa'];
    const rows = logs.map(l => [
      `"${l.date}"`,
      `"${l.assetCode}"`,
      `"${l.assetName}"`,
      `"${l.type}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${l.technician}"`,
      `"${l.cost || 0}"`,
      `"${l.resultStatus}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SDragon_Maintenance_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất toàn bộ nhật ký bảo trì!', 'info');
  }
}

window.maintenanceManager = new MaintenanceManager();
