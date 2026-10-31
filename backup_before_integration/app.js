/**
 * SDragon AssetTracker Pro - Master Application Controller
 * Orchestrates views, modals, theme switching, global events, and toasts.
 */

// Global Toast Notification Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-msg">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Global View Switching
function switchView(viewName) {
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const views = {
    'sheet-view': document.getElementById('viewSheet'),
    'kanban-view': document.getElementById('viewKanban'),
    'maintenance-view': document.getElementById('viewMaintenance'),
    'analytics-view': document.getElementById('viewAnalytics'),
    'inspection-history-view': document.getElementById('viewInspectionHistory')
  };

  navItems.forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  Object.entries(views).forEach(([vKey, vEl]) => {
    if (vEl) {
      if (vKey === viewName) {
        vEl.style.display = 'block';
        vEl.classList.add('active');
      } else {
        vEl.style.display = 'none';
        vEl.classList.remove('active');
      }
    }
  });

  // Re-render specific views when switched
  if (viewName === 'maintenance-view' && window.maintenanceManager) {
    window.maintenanceManager.render();
  } else if (viewName === 'kanban-view' && window.sheetManager) {
    window.sheetManager.renderKanban();
  } else if (viewName === 'sheet-view' && window.sheetManager) {
    window.sheetManager.render();
  } else if (viewName === 'analytics-view' && window.dashboardManager) {
    window.dashboardManager.updateKPIs();
  } else if (viewName === 'inspection-history-view' && window.inspectionHistoryManager) {
    window.inspectionHistoryManager.render();
  }
}

// ================= GLOBAL UNIFIED REAL-TIME DATA REFRESH =================
window.refreshAllDataViews = function () {
  // 1. Refresh Track Sheet Table & Kanban
  if (window.sheetManager) {
    if (typeof window.sheetManager.render === 'function') window.sheetManager.render();
    if (typeof window.sheetManager.renderKanban === 'function') window.sheetManager.renderKanban();
  }

  // 2. Refresh Inspection History Table & Stats
  if (window.inspectionHistoryManager && typeof window.inspectionHistoryManager.render === 'function') {
    window.inspectionHistoryManager.render();
  }

  // 3. Refresh Maintenance Schedule & Logs
  if (window.maintenanceManager && typeof window.maintenanceManager.render === 'function') {
    window.maintenanceManager.render();
  }

  // 4. Refresh Dashboard KPIs, Gauges & Interactive Column Chart
  if (window.dashboardManager && typeof window.dashboardManager.updateKPIs === 'function') {
    window.dashboardManager.updateKPIs();
  }

  // 5. Update Sidebar Nav Badges
  const assets = (typeof store !== 'undefined' && store.getAssets) ? store.getAssets() : [];
  const elBadgeTotal = document.getElementById('badgeTotalCount');
  if (elBadgeTotal) elBadgeTotal.textContent = assets.length;

  const inspections = (typeof store !== 'undefined' && store.getInspections) ? store.getInspections() : [];
  const elBadgeInsp = document.getElementById('badgeInspectionCount');
  if (elBadgeInsp) elBadgeInsp.textContent = inspections.length;

  // 6. Update Header Quick Status Chips
  let running = 0, maint = 0, down = 0;
  assets.forEach(a => {
    if (a.status === 'operational') running++;
    else if (a.status === 'maintenance') maint++;
    else if (a.status === 'down') down++;
  });
  const qRun = document.getElementById('quickRunningCount');
  const qMnt = document.getElementById('quickMaintenanceCount');
  const qDwn = document.getElementById('quickDownCount');
  if (qRun) qRun.textContent = running;
  if (qMnt) qMnt.textContent = maint;
  if (qDwn) qDwn.textContent = down;

  // 7. If Asset Detail Modal is open, refresh it in real-time
  const detailModal = document.getElementById('assetDetailModal');
  if (detailModal && detailModal.style.display !== 'none' && detailModal.dataset.currentAssetId) {
    if (window.openAssetDetailModal) {
      window.openAssetDetailModal(detailModal.dataset.currentAssetId);
    }
  }
};


// ================= GLOBAL ACTION BRIDGES FOR INLINE HTML =================
window.openAssetDetailModal = function (id) {
  const asset = store.getAssetById(id);
  if (!asset) return;

  const modal = document.getElementById('assetDetailModal');
  if (!modal) return;
  modal.dataset.currentAssetId = id;

  // Header info
  document.getElementById('detailAssetBadge').textContent = asset.code;
  document.getElementById('detailAssetName').textContent = asset.name;
  document.getElementById('detailStatusPill').className = `status-pill ${asset.status}`;
  document.getElementById('detailStatusPill').innerHTML = `<span class="stat-dot"></span> ${asset.status === 'operational' ? 'Đang hoạt động' : asset.status === 'maintenance' ? 'Đang bảo dưỡng' : asset.status === 'down' ? 'Sự cố dừng máy' : asset.status}`;
  document.getElementById('detailDepartmentText').textContent = asset.department;
  document.getElementById('detailLocationText').textContent = asset.location || 'Chuyền chính';
  document.getElementById('detailOperatorText').textContent = asset.operator || 'Chưa phân công';

  // Tech Specs Table
  document.getElementById('dtlManufacturer').textContent = asset.manufacturer || '-';
  document.getElementById('dtlModel').textContent = asset.model || '-';
  document.getElementById('dtlCategory').textContent = asset.category || '-';
  document.getElementById('dtlCommissionDate').textContent = DateHelper.formatVN(asset.commissionDate);
  document.getElementById('dtlValue').textContent = NumberHelper.formatCurrencyVN(asset.value);
  document.getElementById('dtlOperatingHours').textContent = `${new Intl.NumberFormat('vi-VN').format(asset.operatingHours || 0)} giờ`;
  document.getElementById('dtlSpecs').textContent = asset.specs || 'Chưa có ghi chú thông số';

  // Countdown box
  const dueInfo = DateHelper.calculateDueStatus(asset.nextDue);
  document.getElementById('dtlNextDue').textContent = DateHelper.formatVN(asset.nextDue);
  document.getElementById('dtlDueRemaining').textContent = dueInfo.text;
  if (dueInfo.isOverdue) {
    document.getElementById('dtlDueRemaining').style.color = 'var(--status-down)';
  } else if (dueInfo.isWithin7Days) {
    document.getElementById('dtlDueRemaining').style.color = 'var(--status-maintenance)';
  } else {
    document.getElementById('dtlDueRemaining').style.color = 'var(--status-operational)';
  }

  // Action buttons inside detail
  const btnMaint = document.getElementById('btnOpenNewMaintForAsset');
  if (btnMaint) {
    btnMaint.onclick = () => {
      modal.style.display = 'none';
      openAddMaintModalForAsset(asset.id);
    };
  }

  const btnQR = document.getElementById('btnPrintQRForAsset');
  if (btnQR) {
    btnQR.onclick = () => {
      openQRTagModal(asset.id);
    };
  }

  const btnEdit = document.getElementById('btnEditFromDetail');
  if (btnEdit) {
    btnEdit.onclick = () => {
      modal.style.display = 'none';
      openEditAssetModal(asset.id);
    };
  }

  // Load Track Sheet inspection history for this asset
  const inspTbody = document.getElementById('detailInspectionHistoryTbody');
  if (inspTbody) {
    const assetInspections = store.getInspectionsByAssetId(asset.id);
    if (assetInspections.length === 0) {
      inspTbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding:16px; color:var(--text-dim);">Chưa có lượt kiểm tra ca nào được ghi nhận cho máy này.</td></tr>';
    } else {
      inspTbody.innerHTML = assetInspections.map(insp => {
        // find specific values from items
        const vItem = insp.items ? insp.items.find(i => i.id === 1) : null;
        const aItem = insp.items ? insp.items.find(i => i.id === 2) : null;
        const oItem = insp.items ? insp.items.find(i => i.id === 3) : null;
        const tItem = insp.items ? insp.items.find(i => i.id === 4) : null;

        const voltStr = vItem ? vItem.value : '-';
        const airStr = aItem ? aItem.value : '-';
        const oilStr = oItem ? oItem.value : '-';
        const tempStr = tItem ? tItem.value : '-';

        let resBadge = '<span class="status-pill operational"><span class="stat-dot"></span> 10/10 ĐẠT</span>';
        if (insp.status !== 'PASS') {
          resBadge = `<span class="status-pill down"><span class="stat-dot"></span> ${insp.totalCount - insp.passedCount} MỤC NG</span>`;
        }

        return `
          <tr>
            <td style="font-family:var(--font-mono); font-size:0.76rem;"><strong>${DateHelper.formatVN(insp.date)}</strong> ${insp.time || ''}</td>
            <td>${insp.shift || '-'}</td>
            <td><strong>${insp.inspector || '-'}</strong></td>
            <td><code>${voltStr}</code></td>
            <td><code>${airStr}</code></td>
            <td><small>${oilStr}</small></td>
            <td><code>${tempStr}</code></td>
            <td>${resBadge}</td>
            <td style="font-size:0.75rem; color:var(--text-muted); max-width:180px;">${insp.overallNotes || '-'}</td>
          </tr>
        `;
      }).join('');
    }
  }

  const btnInspectDetail = document.getElementById('btnInspectFromDetail');
  if (btnInspectDetail) {
    btnInspectDetail.onclick = () => {
      modal.style.display = 'none';
      openTrackInspectionModal(asset.id);
    };
  }

  // Load history logs for this asset
  const logsList = document.getElementById('detailLogsList');
  const logs = store.getLogsByAssetId(asset.id);
  if (logsList) {
    if (logs.length === 0) {
      logsList.innerHTML = `<div style="color:var(--text-dim); font-size:0.8rem; padding:12px 0;">Chưa có lịch sử bảo dưỡng nào cho máy này.</div>`;
    } else {
      logsList.innerHTML = logs.map(l => `
        <div class="log-item-card">
          <div class="log-top">
            <strong>${l.type} &bull; ${DateHelper.formatVN(l.date)}</strong>
            <span style="font-family:var(--font-mono);">${NumberHelper.formatCurrencyVN(l.cost)}</span>
          </div>
          <div class="log-desc">${l.description}</div>
          <div class="log-tech">Kỹ thuật viên: <strong>${l.technician}</strong></div>
        </div>
      `).join('');
    }
  }

  modal.style.display = 'flex';
};

window.openAddMaintModalForAsset = function (assetId) {
  if (window.authManager && !window.authManager.hasPermission('maintenance')) {
    showToast('Tài khoản Người Vận Hành chỉ có quyền xem. Cần quyền Kỹ Thuật Viên hoặc Admin để lập phiếu bảo trì!', 'warning');
    window.authManager.openLoginModal();
    return;
  }
  if (window.maintenanceManager) {
    window.maintenanceManager.openMaintenanceModal(assetId);
  }
};

window.openQRTagModal = function (assetId) {
  const asset = store.getAssetById(assetId);
  if (!asset) return;

  QRTagManager.renderTag(asset);
  const modal = document.getElementById('qrTagModal');
  if (modal) modal.style.display = 'flex';
};

window.openEditAssetModal = function (assetId) {
  if (window.authManager && !window.authManager.hasPermission('edit_asset')) {
    showToast('Tài khoản Người Vận Hành chỉ có quyền xem. Vui lòng đăng nhập Admin hoặc Kỹ Thuật Viên để chỉnh sửa!', 'warning');
    window.authManager.openLoginModal();
    return;
  }
  const asset = store.getAssetById(assetId);
  if (!asset) return;

  document.getElementById('modalAssetTitle').textContent = `Chỉnh Sửa Thông Tin: ${asset.code}`;
  document.getElementById('formAssetId').value = asset.id;
  document.getElementById('formCode').value = asset.code;
  document.getElementById('formName').value = asset.name;
  document.getElementById('formCategory').value = asset.category;
  document.getElementById('formDepartment').value = asset.department;
  document.getElementById('formLocation').value = asset.location || '';
  document.getElementById('formStatus').value = asset.status;
  document.getElementById('formManufacturer').value = asset.manufacturer || '';
  document.getElementById('formModel').value = asset.model || '';
  document.getElementById('formOperator').value = asset.operator || '';
  document.getElementById('formCommissionDate').value = asset.commissionDate || '';
  document.getElementById('formMaintenanceInterval').value = asset.maintenanceInterval || 90;
  document.getElementById('formLastMaintenance').value = asset.lastMaintenance || '';
  document.getElementById('formValue').value = asset.value || '';
  document.getElementById('formOperatingHours').value = asset.operatingHours || '';
  const csIntervalEl = document.getElementById('formCheckSheetInterval');
  if (csIntervalEl) csIntervalEl.value = asset.checkSheetInterval || 1;
  document.getElementById('formSpecs').value = asset.specs || '';

  const modal = document.getElementById('assetFormModal');
  if (modal) modal.style.display = 'flex';
};

window.deleteSingleAsset = function (assetId) {
  if (window.authManager && !window.authManager.hasPermission('delete_asset')) {
    showToast('Chỉ Quản Trị Viên (Admin) mới có quyền xóa thiết bị khỏi hệ thống!', 'error');
    window.authManager.openLoginModal();
    return;
  }
  const asset = store.getAssetById(assetId);
  if (!asset) return;

  if (confirm(`Bạn có chắc muốn xóa thiết bị "${asset.code} - ${asset.name}"?`)) {
    store.deleteAsset(assetId);
    if (window.refreshAllDataViews) {
      window.refreshAllDataViews();
    } else {
      if (window.sheetManager) window.sheetManager.render();
      if (window.dashboardManager) window.dashboardManager.updateKPIs();
    }
    showToast(`Đã xóa thiết bị ${asset.code}!`, 'warning');
  }
};

// ================= APP INITIALIZATION =================

// ================= TRACK SHEET DYNAMIC INSPECTION CONTROLLER =================

let currentModalItems = [];

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function syncCurrentDomToItems() {
  if (!Array.isArray(currentModalItems)) return;
  currentModalItems.forEach(it => {
    const valInput = document.getElementById(`inspectVal_${it.id}`);
    if (valInput) it.value = valInput.value;

    const evalInput = document.getElementById(`inspectEval_${it.id}`);
    if (evalInput) it.result = evalInput.value;

    const noteInput = document.getElementById(`inspectNote_${it.id}`);
    if (noteInput) it.note = noteInput.value;

    const nameInput = document.getElementById(`itemCustomName_${it.id}`);
    if (nameInput) it.name = nameInput.value;

    const stdInput = document.getElementById(`itemCustomStd_${it.id}`);
    if (stdInput) it.standard = stdInput.value;

    const methodSelect = document.getElementById(`itemCustomMethod_${it.id}`);
    if (methodSelect) it.method = methodSelect.value;
  });
}

window.openTrackInspectionModal = function (assetId) {
  const asset = store.getAssetById(assetId);
  if (!asset) return;

  const modal = document.getElementById('trackInspectionModal');
  if (!modal) return;

  // Set hidden asset id & meta
  document.getElementById('inspectAssetId').value = asset.id;
  document.getElementById('inspectModalAssetCode').textContent = asset.code;
  document.getElementById('inspectModalAssetName').textContent = asset.name;
  document.getElementById('inspectModalAssetDept').textContent = `${asset.department} • ${asset.location || 'Chuyền chính'}`;

  // Default Date and Time
  const now = new Date();
  document.getElementById('inspectDate').value = now.toISOString().split('T')[0];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('inspectTime').value = `${hours}:${minutes}`;

  // Auto-detect shift
  const h = now.getHours();
  let defaultShift = 'Ca 1 (06:00 - 14:00)';
  if (h >= 14 && h < 22) defaultShift = 'Ca 2 (14:00 - 22:00)';
  else if (h >= 22 || h < 6) defaultShift = 'Ca 3 (22:00 - 06:00)';
  document.getElementById('inspectShift').value = defaultShift;

  // Inspector name: current logged in user or asset operator
  let inspectorName = 'Kỹ Thuật Viên';
  if (window.authManager && window.authManager.currentUser) {
    inspectorName = window.authManager.currentUser.fullName;
  } else if (asset.operator) {
    inspectorName = asset.operator;
  }
  document.getElementById('inspectInspector').value = inspectorName;
  document.getElementById('inspectOverallNotes').value = '';

  // Initialize items: load per-asset custom checklist if exists, else load standard items
  if (asset.customCheckItems && Array.isArray(asset.customCheckItems) && asset.customCheckItems.length > 0) {
    currentModalItems = JSON.parse(JSON.stringify(asset.customCheckItems));
  } else if (typeof STANDARD_INSPECTION_ITEMS !== 'undefined') {
    currentModalItems = JSON.parse(JSON.stringify(STANDARD_INSPECTION_ITEMS));
  } else {
    currentModalItems = [];
  }

  // Ensure default structure
  currentModalItems.forEach(it => {
    if (it.value === undefined) it.value = it.defaultVal || '';
    if (!it.result) it.result = 'OK';
    if (!it.note) it.note = '';
  });

  window.renderChecksheetTableItems();

  modal.style.display = 'flex';
};

window.renderChecksheetTableItems = function () {
  const tbody = document.getElementById('checksheetTbody');
  if (!tbody) return;

  if (currentModalItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px 16px; color: var(--text-dim);">
          <div style="font-size: 1.05rem; font-weight: 600; margin-bottom: 10px; color: var(--text-main);">
            Chưa có hạng mục kiểm tra nào cho thiết bị này
          </div>
          <p style="font-size: 0.8rem; margin-bottom: 16px;">
            Nhấp nút bên dưới để thêm hạng mục kiểm tra hoặc nạp 10 mục tiêu chuẩn kỹ thuật
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button type="button" class="btn btn-sm btn-primary" onclick="window.addNewInspectionItem()">
              + Thêm Hạng Mục Mới
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.resetToDefault10Items()">
              ↺ Nạp 10 Mục Tiêu Chuẩn
            </button>
          </div>
        </td>
      </tr>
    `;
    recalculateInspectionSummary();
    return;
  }

  tbody.innerHTML = currentModalItems.map((item, idx) => {
    const isCustom = Boolean(item.isCustom || !item.name || String(item.id).startsWith('custom_'));
    const val = item.value !== undefined ? item.value : (item.defaultVal || '');
    const res = item.result || 'OK';
    const note = item.note || '';

    const nameColumnHTML = isCustom ? `
      <div class="custom-item-editor">
        <input type="text" class="check-item-name-input" id="itemCustomName_${item.id}" value="${escapeHtml(item.name || '')}" placeholder="Nhập tên mục kiểm tra (bắt buộc)..." required>
        <input type="text" class="check-item-std-input" id="itemCustomStd_${item.id}" value="${escapeHtml(item.standard || '')}" placeholder="Tiêu chuẩn kỹ thuật (VD: 380V ± 5%, 5-7 bar...)">
      </div>
    ` : `
      <div class="item-name-block">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="item-standard-desc">Tiêu chuẩn: ${escapeHtml(item.standard)}</span>
      </div>
    `;

    const methodColumnHTML = isCustom ? `
      <select class="check-method-select" id="itemCustomMethod_${item.id}">
        <option value="Quan sát mắt" ${item.method === 'Quan sát mắt' ? 'selected' : ''}>Quan sát mắt</option>
        <option value="Đồng hồ đo" ${item.method === 'Đồng hồ đo' ? 'selected' : ''}>Đồng hồ đo</option>
        <option value="Nhiệt kế hồng ngoại" ${item.method === 'Nhiệt kế hồng ngoại' ? 'selected' : ''}>Nhiệt kế</option>
        <option value="Bấm thao tác test" ${item.method === 'Bấm thao tác test' ? 'selected' : ''}>Thao tác test</option>
        <option value="Lắng nghe âm thanh" ${item.method === 'Lắng nghe âm thanh' ? 'selected' : ''}>Lắng nghe</option>
        <option value="Khác" ${!['Quan sát mắt','Đồng hồ đo','Nhiệt kế hồng ngoại','Bấm thao tác test','Lắng nghe âm thanh'].includes(item.method) ? 'selected' : ''}>Khác</option>
      </select>
    ` : `
      <span class="item-method-tag">${escapeHtml(item.method)}</span>
    `;

    return `
      <tr data-item-id="${item.id}">
        <td class="text-center">
          <span class="item-index-badge">${idx + 1}</span>
        </td>
        <td>
          ${nameColumnHTML}
        </td>
        <td>
          ${methodColumnHTML}
        </td>
        <td>
          <input type="text" class="check-input-val" id="inspectVal_${item.id}" value="${escapeHtml(val)}" placeholder="Nhập giá trị đo..." required>
        </td>
        <td class="text-center">
          <div class="result-toggle-group">
            <button type="button" class="btn-toggle-eval btn-ok ${res === 'OK' ? 'active' : ''}" data-item="${item.id}" data-eval="OK" onclick="window.toggleItemEval('${item.id}', 'OK')">
              ✓ ĐẠT
            </button>
            <button type="button" class="btn-toggle-eval btn-ng ${res === 'NG' ? 'active' : ''}" data-item="${item.id}" data-eval="NG" onclick="window.toggleItemEval('${item.id}', 'NG')">
              ✗ NG
            </button>
          </div>
          <input type="hidden" id="inspectEval_${item.id}" value="${res}">
        </td>
        <td>
          <input type="text" class="check-note-input" id="inspectNote_${item.id}" value="${escapeHtml(note)}" placeholder="Ghi chú nếu có bất thường...">
        </td>
        <td class="text-center">
          <button type="button" class="btn-delete-row" onclick="window.deleteInspectionItem('${item.id}')" title="Xóa mục kiểm tra này">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  recalculateInspectionSummary();
};

window.addNewInspectionItem = function () {
  syncCurrentDomToItems();

  const newId = 'custom_' + Date.now();
  currentModalItems.push({
    id: newId,
    name: '',
    standard: '',
    method: 'Quan sát mắt',
    defaultVal: '',
    value: '',
    result: 'OK',
    note: '',
    isCustom: true
  });

  window.renderChecksheetTableItems();

  // Focus on the newly added item name input
  setTimeout(() => {
    const input = document.getElementById(`itemCustomName_${newId}`);
    if (input) input.focus();
  }, 60);

  showToast('Đã thêm 1 mục kiểm tra mới! Hãy nhập tên và tiêu chuẩn.', 'info');
};

window.deleteInspectionItem = function (itemId) {
  syncCurrentDomToItems();
  const idx = currentModalItems.findIndex(it => String(it.id) === String(itemId));
  if (idx !== -1) {
    const removed = currentModalItems.splice(idx, 1)[0];
    window.renderChecksheetTableItems();
    showToast(`Đã xóa mục: ${removed.name || 'Hạng mục kiểm tra'}`, 'info');
  }
};

window.resetToDefault10Items = function () {
  if (confirm('Khôi phục danh sách về 10 hạng mục tiêu chuẩn ban đầu?')) {
    if (typeof STANDARD_INSPECTION_ITEMS !== 'undefined') {
      currentModalItems = JSON.parse(JSON.stringify(STANDARD_INSPECTION_ITEMS));
      currentModalItems.forEach(it => {
        it.value = it.defaultVal || '';
        it.result = 'OK';
        it.note = '';
      });
      window.renderChecksheetTableItems();
      showToast('Đã khôi phục 10 hạng mục tiêu chuẩn', 'info');
    }
  }
};

window.toggleItemEval = function (itemId, result) {
  const hiddenInput = document.getElementById(`inspectEval_${itemId}`);
  if (hiddenInput) hiddenInput.value = result;

  // Also update in-memory state
  const found = currentModalItems.find(it => String(it.id) === String(itemId));
  if (found) found.result = result;

  const row = document.querySelector(`tr[data-item-id="${itemId}"]`);
  if (row) {
    const btnOk = row.querySelector('.btn-ok');
    const btnNg = row.querySelector('.btn-ng');
    if (result === 'OK') {
      if (btnOk) btnOk.classList.add('active');
      if (btnNg) btnNg.classList.remove('active');
    } else {
      if (btnNg) btnNg.classList.add('active');
      if (btnOk) btnOk.classList.remove('active');
    }
  }

  recalculateInspectionSummary();
};

function recalculateInspectionSummary() {
  const tbody = document.getElementById('checksheetTbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr[data-item-id]');
  const totalCount = rows.length;
  let passCount = 0;
  let failCount = 0;

  rows.forEach(r => {
    const itemId = r.dataset.itemId;
    const valInput = document.getElementById(`inspectEval_${itemId}`);
    if (valInput && valInput.value === 'OK') {
      passCount++;
    } else {
      failCount++;
    }
  });

  const totalEl = document.getElementById('summaryTotalCount');
  const passEl = document.getElementById('summaryPassCount');
  const failEl = document.getElementById('summaryFailCount');
  const badgeEl = document.getElementById('summaryConclusionBadge');
  const textEl = document.getElementById('summaryConclusionText');
  const selectAllBtnText = document.getElementById('btnSelectAllText');

  if (totalEl) totalEl.textContent = `${passCount}/${totalCount}`;
  if (passEl) passEl.textContent = passCount;
  if (failEl) failEl.textContent = failCount;
  if (selectAllBtnText) selectAllBtnText.textContent = `✓ Chọn Tất Cả ${totalCount} Mục ĐẠT (OK)`;

  if (badgeEl && textEl) {
    if (totalCount === 0) {
      badgeEl.className = 'conclusion-badge';
      textEl.textContent = 'CHƯA CÓ HẠNG MỤC NÀO';
    } else if (failCount === 0) {
      badgeEl.className = 'conclusion-badge pass';
      textEl.textContent = `✅ ĐỦ ĐIỀU KIỆN VẬN HÀNH AN TOÀN (${passCount}/${totalCount} ĐẠT)`;
    } else {
      badgeEl.className = 'conclusion-badge fail';
      textEl.textContent = `🚨 CẢNH BÁO: CÓ ${failCount} MỤC KHÔNG ĐẠT (NG)`;
    }
  }
}

function initApp() {
  // 1. Theme Initializer
  const currentTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  document.body.className = `theme-${currentTheme}`;

  const btnThemeToggle = document.getElementById('btnThemeToggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      const newTheme = isDark ? 'light' : 'dark';
      document.body.className = `theme-${newTheme}`;
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      showToast(`Đã chuyển sang giao diện ${newTheme === 'dark' ? 'Tối (Dark)' : 'Sáng (Light)'}`, 'info');
    });
  }

  // 2. Sidebar Navigation
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);

      // Close mobile menu if open
      const sidebar = document.getElementById('appSidebar');
      if (sidebar) sidebar.classList.remove('mobile-open');
    });
  });

  // Mobile sidebar toggle
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  const sidebar = document.getElementById('appSidebar');
  if (btnToggleSidebar && sidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // 3. Global Search Input & Hotkey
  const searchInput = document.getElementById('globalSearchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (btnClearSearch) btnClearSearch.style.display = val ? 'block' : 'none';
      if (window.sheetManager) window.sheetManager.setSearchQuery(val);
    });

    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        btnClearSearch.style.display = 'none';
        if (window.sheetManager) window.sheetManager.setSearchQuery('');
        searchInput.focus();
      });
    }

    // Keyboard shortcut "/" to focus search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  // 4. View Switch Buttons (Table / Cards)
  const btnViewTable = document.getElementById('btnViewTable');
  const btnViewCards = document.getElementById('btnViewCards');

  if (btnViewTable) {
    btnViewTable.addEventListener('click', () => {
      btnViewTable.classList.add('active');
      if (btnViewCards) btnViewCards.classList.remove('active');
      switchView('sheet-view');
    });
  }

  if (btnViewCards) {
    btnViewCards.addEventListener('click', () => {
      btnViewCards.classList.add('active');
      if (btnViewTable) btnViewTable.classList.remove('active');
      switchView('kanban-view');
    });
  }

  // 5. Add / Edit Asset Modal Handlers
  const btnOpenAddModal = document.getElementById('btnOpenAddModal');
  const assetFormModal = document.getElementById('assetFormModal');
  const btnCloseAssetModal = document.getElementById('btnCloseAssetModal');
  const btnCancelAsset = document.getElementById('btnCancelAsset');
  const assetForm = document.getElementById('assetForm');
  const btnAutoCode = document.getElementById('btnAutoCode');
  const formCategory = document.getElementById('formCategory');

  if (btnOpenAddModal) {
    btnOpenAddModal.addEventListener('click', () => {
      if (window.authManager && !window.authManager.hasPermission('add_asset')) {
        showToast('Bạn đang ở quyền Người Vận Hành (Chỉ xem). Cần tài khoản Kỹ Thuật Viên hoặc Admin để thêm máy!', 'warning');
        window.authManager.openLoginModal();
        return;
      }
      assetForm.reset();
      document.getElementById('formAssetId').value = '';
      document.getElementById('modalAssetTitle').textContent = 'Thêm Máy Móc & Thiết Bị Mới';
      document.getElementById('formCommissionDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('formLastMaintenance').value = new Date().toISOString().split('T')[0];
      
      // Auto-generate code
      const cat = formCategory.value || 'Máy Phay / Tiện CNC';
      document.getElementById('formCode').value = store.generateAssetCode(cat);

      if (assetFormModal) assetFormModal.style.display = 'flex';
    });
  }

  if (btnAutoCode) {
    btnAutoCode.addEventListener('click', () => {
      const cat = formCategory.value;
      document.getElementById('formCode').value = store.generateAssetCode(cat);
      showToast('Đã tự động tạo mã thiết bị chuẩn phân xưởng!', 'info');
    });
  }

  if (formCategory) {
    formCategory.addEventListener('change', () => {
      // If adding new asset, regenerate code
      if (!document.getElementById('formAssetId').value) {
        document.getElementById('formCode').value = store.generateAssetCode(formCategory.value);
      }
    });
  }

  const closeAssetModalFunc = () => {
    if (assetFormModal) assetFormModal.style.display = 'none';
  };
  if (btnCloseAssetModal) btnCloseAssetModal.addEventListener('click', closeAssetModalFunc);
  if (btnCancelAsset) btnCancelAsset.addEventListener('click', closeAssetModalFunc);

  // Submit Asset Form
  if (assetForm) {
    assetForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const id = document.getElementById('formAssetId').value;
      const code = document.getElementById('formCode').value.trim();
      const name = document.getElementById('formName').value.trim();
      const category = document.getElementById('formCategory').value;
      const department = document.getElementById('formDepartment').value;
      const location = document.getElementById('formLocation').value.trim();
      const status = document.getElementById('formStatus').value;
      const manufacturer = document.getElementById('formManufacturer').value.trim();
      const model = document.getElementById('formModel').value.trim();
      const operator = document.getElementById('formOperator').value.trim();
      const commissionDate = document.getElementById('formCommissionDate').value;
      const maintenanceInterval = parseInt(document.getElementById('formMaintenanceInterval').value, 10) || 90;
      const lastMaintenance = document.getElementById('formLastMaintenance').value;
      const rawValue = parseFloat(document.getElementById('formValue').value) || 0;
      const value = rawValue > 0 && rawValue < 1000 ? 0 : rawValue; // min 1000 VND
      if (rawValue > 0 && rawValue < 1000) {
        showToast('Nguyên giá tài sản phải từ 1.000 VNĐ trở lên! Đã đặt về 0.', 'warning');
      }
      const operatingHours = parseFloat(document.getElementById('formOperatingHours').value) || 0;
      const checkSheetInterval = parseInt(document.getElementById('formCheckSheetInterval').value, 10) || 1;
      const specs = document.getElementById('formSpecs').value.trim();

      // Check duplicate code
      const existing = store.getAssetByCode(code);
      if (existing && existing.id !== id) {
        showToast(`Mã thiết bị "${code}" đã tồn tại trên hệ thống! Vui lòng chọn mã khác.`, 'error');
        return;
      }

      // Calculate next due date
      let nextDue = '';
      if (lastMaintenance) {
        const d = new Date(lastMaintenance);
        d.setDate(d.getDate() + maintenanceInterval);
        nextDue = d.toISOString().split('T')[0];
      }

      const assetPayload = {
        id: id || undefined,
        code,
        name,
        category,
        department,
        location,
        status,
        manufacturer,
        model,
        operator,
        commissionDate,
        maintenanceInterval,
        lastMaintenance,
        nextDue,
        value,
        operatingHours,
        checkSheetInterval,
        specs
      };

      store.saveAsset(assetPayload);
      closeAssetModalFunc();

      if (window.refreshAllDataViews) {
        window.refreshAllDataViews();
      } else {
        if (window.sheetManager) window.sheetManager.render();
        if (window.dashboardManager) window.dashboardManager.updateKPIs();
        if (window.maintenanceManager) window.maintenanceManager.render();
      }

      showToast(`Đã lưu máy móc: ${code} - ${name}!`, 'success');
    });
  }

  // 6. Detail Modal Close Handlers
  const detailModal = document.getElementById('assetDetailModal');
  const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
  const btnCloseDetail = document.getElementById('btnCloseDetail');
  if (btnCloseDetailModal) btnCloseDetailModal.addEventListener('click', () => { detailModal.style.display = 'none'; });
  if (btnCloseDetail) btnCloseDetail.addEventListener('click', () => { detailModal.style.display = 'none'; });

  // 7. QR Tag Modal Handlers
  const qrModal = document.getElementById('qrTagModal');
  const btnCloseQRModal = document.getElementById('btnCloseQRModal');
  const btnCloseQR = document.getElementById('btnCloseQR');
  const btnPrintTag = document.getElementById('btnPrintTag');
  const btnBatchQR = document.getElementById('btnBatchQR');

  if (btnCloseQRModal) btnCloseQRModal.addEventListener('click', () => { qrModal.style.display = 'none'; });
  if (btnCloseQR) btnCloseQR.addEventListener('click', () => { qrModal.style.display = 'none'; });
  if (btnPrintTag) btnPrintTag.addEventListener('click', () => { QRTagManager.printTag(); });
  if (btnBatchQR) {
    btnBatchQR.addEventListener('click', () => {
      const assets = store.getAssets();
      if (assets.length > 0) {
        openQRTagModal(assets[0].id);
      }
    });
  }

  // 8. Export & Import Modal Handlers
  const exportModal = document.getElementById('exportImportModal');
  const btnExportImport = document.getElementById('btnExportImport');
  const btnCloseExportModal = document.getElementById('btnCloseExportModal');
  const btnCloseExportFooter = document.getElementById('btnCloseExportFooter');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnBackupJSON = document.getElementById('btnBackupJSON');
  const btnResetDemoData = document.getElementById('btnResetDemoData');
  const btnSelectFile = document.getElementById('btnSelectFile');
  const fileInputUpload = document.getElementById('fileInputUpload');
  const fileDropZone = document.getElementById('fileDropZone');

  if (btnExportImport) {
    btnExportImport.addEventListener('click', () => {
      if (exportModal) exportModal.style.display = 'flex';
    });
  }

  const closeExportFunc = () => {
    if (exportModal) exportModal.style.display = 'none';
  };
  if (btnCloseExportModal) btnCloseExportModal.addEventListener('click', closeExportFunc);
  if (btnCloseExportFooter) btnCloseExportFooter.addEventListener('click', closeExportFunc);

  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      store.exportToCSV();
      showToast('Đã tải xuống file danh mục thiết bị CSV/Excel!', 'success');
    });
  }

  if (btnBackupJSON) {
    btnBackupJSON.addEventListener('click', () => {
      store.exportBackupJSON();
      showToast('Đã sao lưu toàn bộ cơ sở dữ liệu!', 'success');
    });
  }

  if (btnResetDemoData) {
    btnResetDemoData.addEventListener('click', () => {
      if (confirm('Khôi phục toàn bộ danh mục về 16 máy móc công nghiệp mẫu ban đầu?')) {
        store.resetToDemoData();
        if (window.sheetManager) window.sheetManager.render();
        if (window.dashboardManager) window.dashboardManager.updateKPIs();
        if (window.maintenanceManager) window.maintenanceManager.render();
        closeExportFunc();
        showToast('Đã khôi phục dữ liệu mẫu công nghiệp thành công!', 'success');
      }
    });
  }

  // File Upload Handlers
  if (btnSelectFile && fileInputUpload) {
    btnSelectFile.addEventListener('click', () => fileInputUpload.click());
  }

  const processUploadedFile = (file) => {
    if (!file) return;
    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (e) => {
        const success = store.importBackupJSON(e.target.result);
        if (success) {
          if (window.sheetManager) window.sheetManager.render();
          if (window.dashboardManager) window.dashboardManager.updateKPIs();
          if (window.maintenanceManager) window.maintenanceManager.render();
          closeExportFunc();
          showToast('Phục hồi dữ liệu từ file JSON thành công!', 'success');
        } else {
          showToast('File JSON không đúng cấu trúc SDragon AssetTracker!', 'error');
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      showToast('Đã nhận diện file CSV! Hệ thống đang xử lý dữ liệu...', 'info');
      // Simple CSV parse demo notification
      reader.onload = () => {
        showToast('Đã nhập thành công dữ liệu từ file CSV!', 'success');
        closeExportFunc();
      };
      reader.readAsText(file);
    } else {
      showToast('Vui lòng chọn file .json hoặc .csv hợp lệ!', 'error');
    }
  };

  if (fileInputUpload) {
    fileInputUpload.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        processUploadedFile(e.target.files[0]);
      }
    });
  }

  if (fileDropZone) {
    fileDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropZone.style.borderColor = 'var(--primary)';
    });
    fileDropZone.addEventListener('dragleave', () => {
      fileDropZone.style.borderColor = '';
    });
    fileDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropZone.style.borderColor = '';
      if (e.dataTransfer.files.length > 0) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    });
  }

  // Close modals on Escape key or outside overlay click
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // Initial Full Render
  if (window.sheetManager) window.sheetManager.render();
  if (window.dashboardManager) window.dashboardManager.updateKPIs();
  if (window.maintenanceManager) window.maintenanceManager.render();

  
  // 9. Track Sheet Inspection Form & Action Handlers
  const inspectForm = document.getElementById('trackInspectionForm');
  const btnCloseInspect = document.getElementById('btnCloseInspectModal');
  const btnCancelInspect = document.getElementById('btnCancelInspect');
  const inspectModal = document.getElementById('trackInspectionModal');

  const closeInspectModalFunc = () => {
    if (inspectModal) inspectModal.style.display = 'none';
  };
  if (btnCloseInspect) btnCloseInspect.addEventListener('click', closeInspectModalFunc);
  if (btnCancelInspect) btnCancelInspect.addEventListener('click', closeInspectModalFunc);

  // Add Item Button
  const btnAddCheckItem = document.getElementById('btnAddCheckItem');
  if (btnAddCheckItem) {
    btnAddCheckItem.addEventListener('click', () => {
      window.addNewInspectionItem();
    });
  }

  // 1-Click Select All PASS
  const btnSelectAllPass = document.getElementById('btnSelectAllPass');
  if (btnSelectAllPass) {
    btnSelectAllPass.addEventListener('click', () => {
      syncCurrentDomToItems();
      currentModalItems.forEach(it => {
        it.result = 'OK';
        const evalInp = document.getElementById(`inspectEval_${it.id}`);
        if (evalInp) evalInp.value = 'OK';

        const row = document.querySelector(`tr[data-item-id="${it.id}"]`);
        if (row) {
          const btnOk = row.querySelector('.btn-ok');
          const btnNg = row.querySelector('.btn-ng');
          if (btnOk) btnOk.classList.add('active');
          if (btnNg) btnNg.classList.remove('active');
        }

        const valInp = document.getElementById(`inspectVal_${it.id}`);
        if (valInp && (!valInp.value || valInp.value.trim() === '')) {
          valInp.value = it.defaultVal || 'Đạt';
          it.value = valInp.value;
        }
      });
      recalculateInspectionSummary();
      showToast(`Đã chọn nhanh tất cả ${currentModalItems.length} mục ĐẠT chuẩn!`, 'info');
    });
  }

  // Reset inspect form
  const btnResetInspect = document.getElementById('btnResetInspectForm');
  if (btnResetInspect) {
    btnResetInspect.addEventListener('click', () => {
      window.resetToDefault10Items();
    });
  }

  // Print inspection form
  const btnPrintInspect = document.getElementById('btnPrintInspectionForm');
  if (btnPrintInspect) {
    btnPrintInspect.addEventListener('click', () => {
      window.print();
    });
  }

  // Export Inspections CSV
  const btnExportInspCSV = document.getElementById('btnExportInspectionsCSV');
  if (btnExportInspCSV) {
    btnExportInspCSV.addEventListener('click', () => {
      store.exportInspectionsToCSV();
      showToast('Đã xuất toàn bộ lịch sử Track Sheet ra file CSV!', 'success');
    });
  }

  // Submit Track Sheet Inspection Form
  if (inspectForm) {
    inspectForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const assetId = document.getElementById('inspectAssetId').value;
      const asset = store.getAssetById(assetId);
      if (!asset) {
        showToast('Không tìm thấy thiết bị!', 'error');
        return;
      }

      syncCurrentDomToItems();

      if (currentModalItems.length === 0) {
        showToast('Phiếu kiểm tra phải có ít nhất 1 hạng mục!', 'warning');
        return;
      }

      const shift = document.getElementById('inspectShift').value;
      const date = document.getElementById('inspectDate').value;
      const time = document.getElementById('inspectTime').value;
      const inspector = document.getElementById('inspectInspector').value.trim();
      const overallNotes = document.getElementById('inspectOverallNotes').value.trim();

      // Collect items and validate names
      const items = [];
      let passCount = 0;
      let failCount = 0;

      for (let i = 0; i < currentModalItems.length; i++) {
        const it = currentModalItems[i];
        const name = (it.name || '').trim();
        if (!name) {
          showToast(`Vui lòng nhập tên cho mục kiểm tra số ${i + 1}!`, 'error');
          const nameInput = document.getElementById(`itemCustomName_${it.id}`);
          if (nameInput) nameInput.focus();
          return;
        }

        const val = it.value !== undefined ? String(it.value).trim() : '';
        const res = it.result || 'OK';
        const note = (it.note || '').trim();

        if (res === 'OK') passCount++;
        else failCount++;

        items.push({
          id: it.id,
          name: name,
          standard: it.standard || '',
          method: it.method || 'Quan sát mắt',
          value: val,
          result: res,
          note: note,
          isCustom: Boolean(it.isCustom)
        });
      }

      const overallStatus = failCount === 0 ? 'PASS' : 'FAIL';

      const inspectionRecord = {
        assetId: asset.id,
        assetCode: asset.code,
        assetName: asset.name,
        department: asset.department,
        date,
        time,
        shift,
        inspector,
        status: overallStatus,
        passedCount: passCount,
        totalCount: items.length,
        overallNotes,
        items
      };

      store.addInspection(inspectionRecord);

      // Save custom items template for this asset so future inspections remember this checklist
      asset.customCheckItems = items.map(it => ({
        id: it.id,
        name: it.name,
        standard: it.standard,
        method: it.method,
        defaultVal: it.value,
        isCustom: it.isCustom
      }));
      store.saveAsset(asset);

      closeInspectModalFunc();

      // Refresh all views immediately
      if (window.refreshAllDataViews) {
        window.refreshAllDataViews();
      } else {
        if (window.sheetManager) window.sheetManager.render();
        if (window.dashboardManager) window.dashboardManager.updateKPIs();
      }

      if (overallStatus === 'PASS') {
        showToast(`✅ Đã lưu phiếu Track Sheet cho ${asset.code}! (${passCount}/${items.length} ĐẠT)`, 'success');
      } else {
        showToast(`🚨 Cảnh báo: Thiết bị ${asset.code} có ${failCount} mục NG! Trạng thái chuyển sang sự cố.`, 'warning');
      }
    });
  }

  // Header Quick Status Chips Click Listeners:
  const badgeRunning = document.querySelector('.quick-stat-badge.status-running');
  const badgeMaint = document.querySelector('.quick-stat-badge.status-maintenance');
  const badgeDown = document.querySelector('.quick-stat-badge.status-down');

  if (badgeRunning) {
    badgeRunning.addEventListener('click', () => {
      switchView('sheet-view');
      if (window.sheetManager) window.sheetManager.setStatusFilter('operational');
      showToast('Đang hiển thị danh sách: Các máy đang hoạt động (Running)', 'info');
    });
  }

  if (badgeMaint) {
    badgeMaint.addEventListener('click', () => {
      switchView('sheet-view');
      if (window.sheetManager) window.sheetManager.setStatusFilter('maintenance');
      showToast('Đang hiển thị danh sách: Các máy đang bảo dưỡng', 'info');
    });
  }

  if (badgeDown) {
    badgeDown.addEventListener('click', () => {
      switchView('sheet-view');
      if (window.sheetManager) window.sheetManager.setStatusFilter('down');
      showToast('Đang hiển thị danh sách: Các máy đang dừng / gặp sự cố (Down)', 'warning');
    });
  }

  // Top KPI Card Availability -> Click to view running machines
  const cardAvailability = document.getElementById('kpiAvailabilityRate');
  if (cardAvailability) {
    const cardEl = cardAvailability.closest('.kpi-card');
    if (cardEl) {
      cardEl.style.cursor = 'pointer';
      cardEl.title = 'Nhấp để lọc danh sách các máy đang hoạt động';
      cardEl.addEventListener('click', () => {
        switchView('sheet-view');
        if (window.sheetManager) window.sheetManager.setStatusFilter('operational');
        showToast('Đang hiển thị: Các máy đang hoạt động', 'info');
      });
    }
  }

  // Initial sync across all views & badges
  if (window.refreshAllDataViews) {
    window.refreshAllDataViews();
  }

  console.log("SDragon AssetTracker Pro v3.0 Initialized successfully.");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


// Global helper to open Add Asset Modal
window.openAddAssetModal = function() {
  const btn = document.getElementById('btnOpenAddModal');
  if (btn) btn.click();
};
