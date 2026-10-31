/**
 * SDragon AssetTracker Pro - Track Sheet Inspection History Manager
 * Manages inspection records, search, filter, KPI stats, pagination, details view,
 * multi-select, print batch report, export CSV, edit modal & deletion.
 */

class InspectionHistoryManager {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.searchTerm = '';
    this.filterAsset = 'all';
    this.filterStatus = 'all';
    this.filterDept = 'all';
    this.selectedIds = new Set();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.initEventListeners();
    this.render();
  }

  initEventListeners() {
    // Search input
    const searchInput = document.getElementById('inspSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.trim().toLowerCase();
        this.currentPage = 1;
        this.renderTableOnly();
      });
    }

    // Filter by Asset
    const filterAsset = document.getElementById('inspFilterAsset');
    if (filterAsset) {
      filterAsset.addEventListener('change', (e) => {
        this.filterAsset = e.target.value;
        this.currentPage = 1;
        this.renderTableOnly();
      });
    }

    // Filter by Status
    const filterStatus = document.getElementById('inspFilterStatus');
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        this.filterStatus = e.target.value;
        this.currentPage = 1;
        this.renderTableOnly();
      });
    }

    // Filter by Department
    const filterDept = document.getElementById('inspFilterDept');
    if (filterDept) {
      filterDept.addEventListener('change', (e) => {
        this.filterDept = e.target.value;
        this.currentPage = 1;
        this.renderTableOnly();
      });
    }

    // Reset filters
    const btnReset = document.getElementById('btnResetInspFilter');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.searchTerm = '';
        this.filterAsset = 'all';
        this.filterStatus = 'all';
        this.filterDept = 'all';
        if (searchInput) searchInput.value = '';
        if (filterAsset) filterAsset.value = 'all';
        if (filterStatus) filterStatus.value = 'all';
        if (filterDept) filterDept.value = 'all';
        this.currentPage = 1;
        this.renderTableOnly();
      });
    }

    // New check sheet button from History
    const btnNew = document.getElementById('btnNewInspectionFromHistory');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        window.openSelectAssetForInspection();
      });
    }

    // Export CSV button (Selected or All)
    const btnExport = document.getElementById('btnExportInspectionHistoryCSV');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        this.exportInspectionsCSV();
      });
    }

    // Print selected inspections button
    const btnPrintSelected = document.getElementById('btnInspPrintSelected');
    if (btnPrintSelected) {
      btnPrintSelected.addEventListener('click', () => {
        this.printSelectedInspections();
      });
    }

    // Bulk delete selected inspections button
    const btnDeleteSelected = document.getElementById('btnInspDeleteSelected');
    if (btnDeleteSelected) {
      btnDeleteSelected.addEventListener('click', () => {
        this.deleteSelectedInspections();
      });
    }

    // Select-all checkbox header
    const selectAllCheckbox = document.getElementById('inspSelectAll');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const paged = this.getCurrentPageRecords();
        if (e.target.checked) {
          paged.forEach(i => this.selectedIds.add(i.id));
        } else {
          paged.forEach(i => this.selectedIds.delete(i.id));
        }
        this.updateSelectionUI();
        this.renderTableOnly();
      });
    }

    // Refresh button
    const btnRefresh = document.getElementById('btnRefreshInspectionHistory');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        if (window.refreshAllDataViews) {
          window.refreshAllDataViews();
        } else {
          this.render();
        }
        showToast('Đã làm mới dữ liệu lịch sử Track Sheet!', 'info');
      });
    }

    // Pagination buttons
    const btnPrev = document.getElementById('btnInspPrevPage');
    const btnNext = document.getElementById('btnInspNextPage');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTableOnly();
        }
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const total = this.getFilteredInspections().length;
        const maxPage = Math.ceil(total / this.pageSize) || 1;
        if (this.currentPage < maxPage) {
          this.currentPage++;
          this.renderTableOnly();
        }
      });
    }

    // Modal Close buttons for Inspection Detail Modal
    const modalDetail = document.getElementById('inspectionDetailModal');
    const btnCloseDetail1 = document.getElementById('btnCloseInspectionDetailModal');
    const btnCloseDetail2 = document.getElementById('btnCloseInspDetail');
    const closeDetail = () => {
      if (modalDetail) modalDetail.style.display = 'none';
    };
    if (btnCloseDetail1) btnCloseDetail1.addEventListener('click', closeDetail);
    if (btnCloseDetail2) btnCloseDetail2.addEventListener('click', closeDetail);

    // Print button inside detail modal
    const btnPrintDetail = document.getElementById('btnPrintInspDetail');
    if (btnPrintDetail) {
      btnPrintDetail.addEventListener('click', () => {
        window.print();
      });
    }

    // Delete button inside detail modal
    const btnDeleteFromDetail = document.getElementById('btnDeleteFromInspDetail');
    if (btnDeleteFromDetail) {
      btnDeleteFromDetail.addEventListener('click', () => {
        const inspId = modalDetail.dataset.currentInspId;
        if (inspId) {
          window.deleteInspectionRecord(inspId);
        }
      });
    }

    // Edit inspection modal event listeners
    const formEditInsp = document.getElementById('editInspectionForm');
    if (formEditInsp) {
      formEditInsp.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveEditInspection();
      });
    }

    const btnCloseEdit1 = document.getElementById('btnCloseEditInspModal');
    const btnCloseEdit2 = document.getElementById('btnCancelEditInsp');
    if (btnCloseEdit1) btnCloseEdit1.addEventListener('click', () => this.closeEditModal());
    if (btnCloseEdit2) btnCloseEdit2.addEventListener('click', () => this.closeEditModal());

    // Modal select asset for inspection close
    const modalSelectAsset = document.getElementById('selectAssetForInspectionModal');
    const btnCloseSelectAsset1 = document.getElementById('btnCloseSelectAssetModal');
    const btnCloseSelectAsset2 = document.getElementById('btnCancelSelectAsset');
    const closeSelectAsset = () => {
      if (modalSelectAsset) modalSelectAsset.style.display = 'none';
    };
    if (btnCloseSelectAsset1) btnCloseSelectAsset1.addEventListener('click', closeSelectAsset);
    if (btnCloseSelectAsset2) btnCloseSelectAsset2.addEventListener('click', closeSelectAsset);

    // Form submit select asset
    const formSelectAsset = document.getElementById('formSelectAssetForInspection');
    if (formSelectAsset) {
      formSelectAsset.addEventListener('submit', (e) => {
        e.preventDefault();
        const assetSelect = document.getElementById('selectAssetToInspectDropdown');
        const assetId = assetSelect ? assetSelect.value : '';
        if (!assetId) {
          showToast('Vui lòng chọn thiết bị muốn kiểm tra!', 'warning');
          return;
        }
        closeSelectAsset();
        if (window.openTrackInspectionModal) {
          window.openTrackInspectionModal(assetId);
        }
      });
    }
  }

  getFilteredInspections() {
    let list = store.getInspections ? store.getInspections() : [];

    // Filter by Asset
    if (this.filterAsset !== 'all') {
      list = list.filter(i => i.assetId === this.filterAsset);
    }

    // Filter by Status
    if (this.filterStatus !== 'all') {
      list = list.filter(i => i.status === this.filterStatus);
    }

    // Filter by Department
    if (this.filterDept !== 'all') {
      list = list.filter(i => (i.department || '').toLowerCase() === this.filterDept.toLowerCase());
    }

    // Filter by Search term
    if (this.searchTerm) {
      list = list.filter(i => {
        const code = (i.assetCode || '').toLowerCase();
        const name = (i.assetName || '').toLowerCase();
        const dept = (i.department || '').toLowerCase();
        const insp = (i.inspector || '').toLowerCase();
        const shift = (i.shift || '').toLowerCase();
        const notes = (i.overallNotes || '').toLowerCase();
        const date = (i.date || '').toLowerCase();
        return code.includes(this.searchTerm) ||
          name.includes(this.searchTerm) ||
          dept.includes(this.searchTerm) ||
          insp.includes(this.searchTerm) ||
          shift.includes(this.searchTerm) ||
          notes.includes(this.searchTerm) ||
          date.includes(this.searchTerm);
      });
    }

    return list;
  }

  getCurrentPageRecords() {
    const filtered = this.getFilteredInspections();
    const total = filtered.length;
    const totalPages = Math.ceil(total / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const startIdx = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIdx, startIdx + this.pageSize);
  }

  // Update selection badges and buttons
  updateSelectionUI() {
    const count = this.selectedIds.size;
    const badge = document.getElementById('inspSelectedCountBadge');
    if (badge) {
      badge.textContent = `${count} đã chọn`;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

    const btnPrint = document.getElementById('btnInspPrintSelected');
    if (btnPrint) {
      const span = btnPrint.querySelector('span');
      if (span) {
        span.textContent = count > 0 ? `In Đã Chọn (${count})` : 'In Danh Sách';
      }
    }

    const btnDel = document.getElementById('btnInspDeleteSelected');
    if (btnDel) {
      btnDel.style.display = count > 0 ? 'inline-flex' : 'none';
      const span = btnDel.querySelector('span');
      if (span) {
        span.textContent = `Xóa Đã Chọn (${count})`;
      }
    }

    // Update select-all checkbox state based on current page
    const chkAll = document.getElementById('inspSelectAll');
    const paged = this.getCurrentPageRecords();
    if (chkAll && paged.length > 0) {
      const selectedInPage = paged.filter(i => this.selectedIds.has(i.id)).length;
      chkAll.checked = selectedInPage === paged.length;
      chkAll.indeterminate = selectedInPage > 0 && selectedInPage < paged.length;
    } else if (chkAll) {
      chkAll.checked = false;
      chkAll.indeterminate = false;
    }
  }

  // Populate dynamic dropdowns
  populateFilterOptions() {
    const assets = store.getAssets ? store.getAssets() : [];

    // Asset filter dropdown
    const filterAsset = document.getElementById('inspFilterAsset');
    if (filterAsset) {
      const cur = this.filterAsset;
      let html = '<option value="all">-- Tất cả thiết bị --</option>';
      assets.forEach(a => {
        html += `<option value="${a.id}" ${a.id === cur ? 'selected' : ''}>${a.code} - ${a.name}</option>`;
      });
      filterAsset.innerHTML = html;
    }

    // Department filter dropdown
    const filterDept = document.getElementById('inspFilterDept');
    if (filterDept) {
      const depts = Array.from(new Set(assets.map(a => a.department).filter(Boolean))).sort();
      const cur = this.filterDept;
      let html = '<option value="all">-- Tất cả phân xưởng --</option>';
      depts.forEach(d => {
        html += `<option value="${d}" ${d === cur ? 'selected' : ''}>${d}</option>`;
      });
      filterDept.innerHTML = html;
    }
  }

  // Update KPI metric cards for inspection history
  updateStats(allInspections) {
    const total = allInspections.length;
    let passCount = 0;
    let failCount = 0;

    allInspections.forEach(i => {
      if (i.status === 'PASS') passCount++;
      else failCount++;
    });

    const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

    const elTotal = document.getElementById('inspStatTotal');
    const elPass = document.getElementById('inspStatPass');
    const elFail = document.getElementById('inspStatFail');
    const elRate = document.getElementById('inspStatRate');

    if (elTotal) elTotal.textContent = total;
    if (elPass) elPass.textContent = passCount;
    if (elFail) elFail.textContent = failCount;
    if (elRate) elRate.textContent = `${passRate}%`;

    // Sidebar badge
    const badge = document.getElementById('badgeInspectionCount');
    if (badge) badge.textContent = total;
  }

  render() {
    const all = store.getInspections ? store.getInspections() : [];
    this.updateStats(all);
    this.populateFilterOptions();
    this.renderTableOnly();
  }

  renderTableOnly() {
    const tbody = document.getElementById('inspectionHistoryTbody');
    const emptyState = document.getElementById('inspEmptyState');
    const tableWrap = document.getElementById('inspTableWrapper');
    const paginationWrap = document.getElementById('inspPaginationWrapper');
    if (!tbody) return;

    const filtered = this.getFilteredInspections();
    const total = filtered.length;

    if (total === 0) {
      tbody.innerHTML = '';
      if (tableWrap) tableWrap.style.display = 'none';
      if (paginationWrap) paginationWrap.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      this.selectedIds.clear();
      this.updateSelectionUI();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'block';
    if (paginationWrap) paginationWrap.style.display = 'flex';

    // Pagination slicing
    const totalPages = Math.ceil(total / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const paged = filtered.slice(startIdx, startIdx + this.pageSize);

    // Update pagination labels
    const pageInfo = document.getElementById('inspPageInfo');
    if (pageInfo) {
      pageInfo.textContent = `Trang ${this.currentPage} / ${totalPages} (Tổng ${total} lượt kiểm tra)`;
    }
    const btnPrev = document.getElementById('btnInspPrevPage');
    const btnNext = document.getElementById('btnInspNextPage');
    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
    if (btnNext) btnNext.disabled = this.currentPage >= totalPages;

    // Build Table Rows
    tbody.innerHTML = paged.map((insp, index) => {
      const rowIdx = startIdx + index + 1;
      const isSelected = this.selectedIds.has(insp.id);
      const isPass = insp.status === 'PASS';
      const statusPill = isPass
        ? `<span class="status-pill operational"><span class="stat-dot"></span> ĐẠT (PASS)</span>`
        : `<span class="status-pill down"><span class="stat-dot"></span> CẢNH BÁO (NG)</span>`;

      // Extract highlights from items (Điện áp, Khí, Dầu, Nhiệt độ)
      const highlights = [];
      if (Array.isArray(insp.items)) {
        insp.items.forEach(it => {
          const n = (it.name || '').toLowerCase();
          if (n.includes('điện áp') && it.value) highlights.push(`⚡ ${it.value}`);
          else if (n.includes('khí') && it.value) highlights.push(`💨 ${it.value}`);
          else if (n.includes('dầu') && it.value) highlights.push(`🛢️ ${it.value}`);
          else if (n.includes('nhiệt độ') && it.value) highlights.push(`🌡️ ${it.value}`);
        });
      }
      const chipsHtml = highlights.length > 0
        ? highlights.slice(0, 4).map(h => `<span class="insp-mini-chip">${h}</span>`).join(' ')
        : `<span class="text-muted" style="font-size:0.8rem;">${insp.totalCount || 0} hạng mục đo</span>`;

      const formattedDate = (typeof DateHelper !== 'undefined' && DateHelper.formatVN) ? DateHelper.formatVN(insp.date) : insp.date;

      return `
        <tr class="${isSelected ? 'row-selected' : ''}">
          <td class="text-center" style="width:40px;">
            <input type="checkbox" class="insp-row-checkbox" data-id="${insp.id}" ${isSelected ? 'checked' : ''}>
          </td>
          <td class="text-center font-mono" style="color:var(--text-muted); font-size:0.85rem;">${rowIdx}</td>
          <td class="font-mono font-bold" style="color:var(--primary-light);">${insp.assetCode}</td>
          <td style="font-weight:600; color:var(--text-main);">${insp.assetName}</td>
          <td style="color:var(--text-muted); font-size:0.85rem;">${insp.department || '-'}</td>
          <td class="font-mono" style="font-size:0.85rem;">
            ${formattedDate} <span style="color:var(--text-dim); font-size:0.75rem;">${insp.time || ''}</span>
          </td>
          <td>
            <span class="shift-pill">${insp.shift || '-'}</span>
          </td>
          <td style="font-size:0.85rem; color:var(--text-main);">
            ${insp.inspector || '-'}
          </td>
          <td class="text-center">
            ${statusPill}
          </td>
          <td>
            <div class="insp-chips-wrap">
              ${chipsHtml}
            </div>
          </td>
          <td class="text-center">
            <div class="row-actions" style="justify-content:center; gap:4px;">
              <button type="button" class="action-btn-mini primary" onclick="window.viewInspectionDetail('${insp.id}')" title="Xem đầy đủ phiếu kiểm tra / In phiếu">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Xem</span>
              </button>
              <button type="button" class="action-btn-mini warning" onclick="window.inspectionHistoryManager.openEditModal('${insp.id}')" title="Sửa thông tin phiếu kiểm tra">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Sửa</span>
              </button>
              <button type="button" class="action-btn-mini danger" onclick="window.deleteInspectionRecord('${insp.id}')" title="Xóa phiếu kiểm tra này">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Xóa</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row checkbox handlers
    tbody.querySelectorAll('.insp-row-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          this.selectedIds.add(id);
        } else {
          this.selectedIds.delete(id);
        }
        const tr = e.target.closest('tr');
        if (tr) {
          if (e.target.checked) tr.classList.add('row-selected');
          else tr.classList.remove('row-selected');
        }
        this.updateSelectionUI();
      });
    });

    this.updateSelectionUI();
  }

  // Open edit modal for inspection
  openEditModal(inspId) {
    if (window.authManager && !window.authManager.hasPermission('edit_asset')) {
      showToast('Chỉ Quản Trị Viên (Admin) hoặc Kỹ Thuật Viên mới có quyền chỉnh sửa phiếu kiểm tra!', 'warning');
      if (window.authManager.openLoginModal) window.authManager.openLoginModal();
      return;
    }

    const insp = store.getInspectionById(inspId);
    if (!insp) {
      showToast('Không tìm thấy thông tin phiếu kiểm tra!', 'error');
      return;
    }

    const modal = document.getElementById('editInspectionModal');
    if (!modal) return;

    document.getElementById('editInspId').value = insp.id;
    document.getElementById('editInspAssetDisplay').value = `${insp.assetCode} - ${insp.assetName} (${insp.department || 'Xưởng'})`;
    document.getElementById('editInspDate').value = insp.date || '';
    document.getElementById('editInspTime').value = insp.time || '';
    document.getElementById('editInspShift').value = insp.shift || 'Ca 1 (06:00 - 14:00)';
    document.getElementById('editInspStatus').value = insp.status || 'PASS';
    document.getElementById('editInspInspector').value = insp.inspector || '';
    document.getElementById('editInspNotes').value = insp.overallNotes || '';

    modal.style.display = 'flex';
  }

  closeEditModal() {
    const modal = document.getElementById('editInspectionModal');
    if (modal) modal.style.display = 'none';
    const idInput = document.getElementById('editInspId');
    if (idInput) idInput.value = '';
  }

  handleSaveEditInspection() {
    const id = document.getElementById('editInspId').value;
    if (!id) return;

    const insp = store.getInspectionById(id);
    if (!insp) return;

    const updatedData = {
      id: id,
      date: document.getElementById('editInspDate').value,
      time: document.getElementById('editInspTime').value,
      shift: document.getElementById('editInspShift').value,
      status: document.getElementById('editInspStatus').value,
      inspector: document.getElementById('editInspInspector').value,
      overallNotes: document.getElementById('editInspNotes').value
    };

    store.updateInspection(updatedData);
    this.closeEditModal();
    this.render();

    if (typeof window.refreshAllDataViews === 'function') {
      window.refreshAllDataViews();
    }

    showToast(`Đã cập nhật thông tin phiếu kiểm tra cho ${insp.assetCode}!`, 'success');
  }

  // Bulk delete selected inspections
  deleteSelectedInspections() {
    if (window.authManager && !window.authManager.hasPermission('delete_asset')) {
      showToast('Chỉ Quản Trị Viên (Admin) mới có quyền xóa phiếu kiểm tra!', 'warning');
      if (window.authManager.openLoginModal) window.authManager.openLoginModal();
      return;
    }

    const count = this.selectedIds.size;
    if (count === 0) {
      showToast('Vui lòng chọn ít nhất 1 phiếu kiểm tra để xóa!', 'warning');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${count} phiếu kiểm tra đã chọn không?\n\nLưu ý: Hành động này không thể hoàn tác.`)) {
      store.deleteMultipleInspections([...this.selectedIds]);
      this.selectedIds.clear();
      this.render();
      if (typeof window.refreshAllDataViews === 'function') {
        window.refreshAllDataViews();
      }
      showToast(`Đã xóa thành công ${count} phiếu kiểm tra!`, 'info');
    }
  }

  // Export CSV (Selected or All)
  exportInspectionsCSV() {
    const all = store.getInspections ? store.getInspections() : [];
    if (all.length === 0) {
      showToast('Chưa có lịch sử kiểm tra nào để xuất CSV!', 'warning');
      return;
    }

    const targetInspections = this.selectedIds.size > 0
      ? all.filter(i => this.selectedIds.has(i.id))
      : all;

    store.exportInspectionsToCSV(targetInspections);
    showToast(`Đã xuất ${targetInspections.length} phiếu kiểm tra ra file CSV!`, 'success');
  }

  // Print selected inspections or filtered list
  printSelectedInspections() {
    const all = store.getInspections ? store.getInspections() : [];
    if (all.length === 0) {
      showToast('Chưa có lịch sử kiểm tra nào để in!', 'warning');
      return;
    }

    const targetInspections = this.selectedIds.size > 0
      ? all.filter(i => this.selectedIds.has(i.id))
      : this.getFilteredInspections();

    const printContainer = document.getElementById('printableBatchContainer');
    if (!printContainer) {
      window.print();
      return;
    }

    const rowsHtml = targetInspections.map((i, idx) => {
      const isPass = i.status === 'PASS';
      const dateStr = (typeof DateHelper !== 'undefined' && DateHelper.formatVN) ? DateHelper.formatVN(i.date) : i.date;
      return `
        <tr>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:6px; font-family:monospace; font-weight:bold;">${i.assetCode || ''}</td>
          <td style="border:1px solid #000; padding:6px;">${i.assetName || ''}</td>
          <td style="border:1px solid #000; padding:6px;">${i.department || ''}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center;">${dateStr} ${i.time || ''}</td>
          <td style="border:1px solid #000; padding:6px;">${i.shift || ''}</td>
          <td style="border:1px solid #000; padding:6px;">${i.inspector || ''}</td>
          <td style="border:1px solid #000; padding:6px; text-align:center; font-weight:bold; color:${isPass ? '#27ae60' : '#e74c3c'};">
            ${isPass ? 'ĐẠT (PASS)' : 'CẢNH BÁO (NG)'}
          </td>
          <td style="border:1px solid #000; padding:6px; font-size:8.5pt;">${i.overallNotes || ''}</td>
        </tr>
      `;
    }).join('');

    printContainer.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #000;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h2 style="margin:0; font-size:16pt; font-weight:bold;">SDRAGON INDUSTRIAL PRECISION</h2>
            <div style="font-size:10pt; color:#444; margin-top:4px;">HỆ THỐNG GIÁM SÁT & BẢO TRÌ THIẾT BỊ SẢN XUẤT</div>
          </div>
          <div style="text-align:right; font-size:9pt;">
            <div>Ngày in: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</div>
            <div>Số lượng bản ghi: ${targetInspections.length}</div>
          </div>
        </div>

        <h3 style="text-align:center; font-size:14pt; margin: 16px 0; text-transform: uppercase;">
          BÁO CÁO TỔNG HỢP LỊCH SỬ KIỂM TRA ĐẦU CA (TRACK SHEET)
        </h3>

        <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:9.5pt;">
          <thead>
            <tr style="background:#f2f2f2;">
              <th style="border:1px solid #000; padding:6px; width:30px; text-align:center;">STT</th>
              <th style="border:1px solid #000; padding:6px; width:75px;">Mã Máy</th>
              <th style="border:1px solid #000; padding:6px;">Tên Thiết Bị</th>
              <th style="border:1px solid #000; padding:6px; width:80px;">Phân Xưởng</th>
              <th style="border:1px solid #000; padding:6px; width:110px; text-align:center;">Ngày Giờ</th>
              <th style="border:1px solid #000; padding:6px; width:70px;">Ca Máy</th>
              <th style="border:1px solid #000; padding:6px; width:100px;">Người Kiểm Tra</th>
              <th style="border:1px solid #000; padding:6px; width:80px; text-align:center;">Đánh Giá</th>
              <th style="border:1px solid #000; padding:6px;">Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-around; text-align: center; font-size: 10pt;">
          <div>
            <strong>Người Lập Báo Cáo</strong><br><br><br>
            <span>(Ký, ghi rõ họ tên)</span>
          </div>
          <div>
            <strong>Trưởng Ca / Giám Sát</strong><br><br><br>
            <span>(Ký, ghi rõ họ tên)</span>
          </div>
          <div>
            <strong>Quản Đốc Phân Xưởng</strong><br><br><br>
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

// Global modal trigger: View Inspection Detail
window.viewInspectionDetail = function (inspId) {
  const insp = store.getInspectionById(inspId);
  if (!insp) {
    showToast('Không tìm thấy dữ liệu phiếu kiểm tra!', 'error');
    return;
  }

  const modal = document.getElementById('inspectionDetailModal');
  if (!modal) return;
  modal.dataset.currentInspId = inspId;

  // Header
  const title = document.getElementById('inspDetailModalTitle');
  if (title) title.textContent = `PHIẾU KIỂM TRA TRACK SHEET - ${insp.assetCode}`;

  const sub = document.getElementById('inspDetailModalSubtitle');
  if (sub) {
    const formattedDate = (typeof DateHelper !== 'undefined' && DateHelper.formatVN) ? DateHelper.formatVN(insp.date) : insp.date;
    sub.textContent = `${insp.assetName} • ${insp.department || ''} • Ngày: ${formattedDate} (${insp.time || ''}) • ${insp.shift || ''}`;
  }

  // Meta cards
  const elCode = document.getElementById('dtlInspAssetCode');
  const elName = document.getElementById('dtlInspAssetName');
  const elDept = document.getElementById('dtlInspAssetDept');
  const elDate = document.getElementById('dtlInspDate');
  const elShift = document.getElementById('dtlInspShift');
  const elInspector = document.getElementById('dtlInspInspector');
  const elStatusPill = document.getElementById('dtlInspStatusPill');
  const elScore = document.getElementById('dtlInspScore');
  const elNotes = document.getElementById('dtlInspOverallNotes');

  if (elCode) elCode.textContent = insp.assetCode;
  if (elName) elName.textContent = insp.assetName;
  if (elDept) elDept.textContent = insp.department || '-';
  if (elDate) {
    const dStr = (typeof DateHelper !== 'undefined' && DateHelper.formatVN) ? DateHelper.formatVN(insp.date) : insp.date;
    elDate.textContent = `${dStr} lúc ${insp.time || '--:--'}`;
  }
  if (elShift) elShift.textContent = insp.shift || '-';
  if (elInspector) elInspector.textContent = `${insp.inspector || '-'} (${insp.inspectorRole || 'Người kiểm tra'})`;

  if (elStatusPill) {
    const isPass = insp.status === 'PASS';
    elStatusPill.className = `status-pill ${isPass ? 'operational' : 'down'}`;
    elStatusPill.innerHTML = `<span class="stat-dot"></span> ${isPass ? 'ĐẠT TIÊU CHUẨN (PASS)' : 'CẢNH BÁO / KHÔNG ĐẠT (NG)'}`;
  }

  if (elScore) {
    elScore.innerHTML = `<strong>${insp.passedCount || 0} / ${insp.totalCount || 0}</strong> hạng mục ĐẠT chuẩn`;
  }

  if (elNotes) {
    elNotes.textContent = insp.overallNotes || 'Không có ghi chú thêm.';
  }

  // Checked Items Table
  const tbody = document.getElementById('dtlInspItemsTbody');
  if (tbody) {
    const items = Array.isArray(insp.items) ? insp.items : [];
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:20px;">Không có danh sách hạng mục đo chi tiết.</td></tr>`;
    } else {
      tbody.innerHTML = items.map((it, idx) => {
        const isOk = it.result === 'OK';
        const resBadge = isOk
          ? `<span class="badge-status-ok" style="background:rgba(39,174,96,0.15); color:#27ae60; padding:4px 8px; border-radius:4px; font-weight:700; font-size:0.8rem; border:1px solid rgba(39,174,96,0.3);">✓ ĐẠT (OK)</span>`
          : `<span class="badge-status-ng" style="background:rgba(231,76,60,0.15); color:#e74c3c; padding:4px 8px; border-radius:4px; font-weight:700; font-size:0.8rem; border:1px solid rgba(231,76,60,0.3);">✕ LỖI (NG)</span>`;

        return `
          <tr style="${!isOk ? 'background:rgba(231,76,60,0.06);' : ''}">
            <td class="text-center font-mono" style="color:var(--text-muted);">${idx + 1}</td>
            <td style="font-weight:600; color:var(--text-main);">
              ${it.name || ''}
              ${it.isCustom ? '<span style="font-size:0.7rem; color:var(--primary-color); margin-left:6px;">(Tự thêm)</span>' : ''}
            </td>
            <td style="color:var(--text-muted); font-size:0.85rem;">${it.standard || '-'}</td>
            <td style="color:var(--text-dim); font-size:0.85rem;">${it.method || 'Quan sát'}</td>
            <td class="font-mono" style="font-weight:600; color:var(--primary-light); font-size:0.9rem;">
              ${it.value ? it.value : '<span class="text-muted">-</span>'}
            </td>
            <td class="text-center">${resBadge}</td>
            <td style="font-size:0.85rem; color:var(--text-muted);">
              ${it.note || '-'}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  modal.style.display = 'flex';
};

// Global delete single inspection record
window.deleteInspectionRecord = function (inspId) {
  if (window.authManager && !window.authManager.hasPermission('delete_asset')) {
    showToast('Chỉ Quản Trị Viên (Admin) mới có quyền xóa phiếu kiểm tra!', 'warning');
    if (window.authManager.openLoginModal) window.authManager.openLoginModal();
    return;
  }

  const insp = store.getInspectionById(inspId);
  if (!insp) return;

  const confirmMsg = `Bạn có chắc chắn muốn xóa vĩnh viễn phiếu kiểm tra ngày ${insp.date} (${insp.shift}) của thiết bị "${insp.assetCode} - ${insp.assetName}" không?\n\nLưu ý: Thao tác này không thể hoàn tác.`;

  if (confirm(confirmMsg)) {
    store.deleteInspection(inspId);

    // If modal detail is currently showing this inspection, close it
    const modalDetail = document.getElementById('inspectionDetailModal');
    if (modalDetail && modalDetail.dataset.currentInspId === inspId) {
      modalDetail.style.display = 'none';
    }

    // Refresh all views immediately
    if (window.refreshAllDataViews) {
      window.refreshAllDataViews();
    }

    showToast(`Đã xóa phiếu kiểm tra của thiết bị ${insp.assetCode}!`, 'warning');
  }
};

// Global select asset modal for creating a new check sheet from History page
window.openSelectAssetForInspection = function () {
  const assets = store.getAssets ? store.getAssets() : [];
  if (assets.length === 0) {
    showToast('Chưa có thiết bị nào trong hệ thống! Vui lòng thêm máy móc trước khi lập phiếu kiểm tra.', 'warning');
    if (window.openAddAssetModal) window.openAddAssetModal();
    return;
  }

  // If only 1 asset, directly open check sheet
  if (assets.length === 1) {
    if (window.openTrackInspectionModal) {
      window.openTrackInspectionModal(assets[0].id);
    }
    return;
  }

  // Populate dropdown and open picker modal
  const dropdown = document.getElementById('selectAssetToInspectDropdown');
  if (dropdown) {
    dropdown.innerHTML = assets.map(a => `
      <option value="${a.id}">${a.code} - ${a.name} (${a.department || 'Xưởng'}) [${a.status === 'operational' ? 'Đang chạy' : a.status === 'down' ? 'Sự cố' : 'Bảo dưỡng'}]</option>
    `).join('');
  }

  const modal = document.getElementById('selectAssetForInspectionModal');
  if (modal) modal.style.display = 'flex';
};

// Auto-instantiate
window.inspectionHistoryManager = new InspectionHistoryManager();
