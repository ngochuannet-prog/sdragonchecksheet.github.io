/**
 * SDragon AssetTracker Pro - Sheet & Kanban View Controller
 * Handles table filtering, multi-column sorting, pagination, bulk selection, and Kanban board.
 */

class SheetManager {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.sortField = 'code';
    this.sortAsc = true;
    this.selectedIds = new Set();

    this.filters = {
      search: '',
      department: 'all',
      category: 'all',
      status: 'all',
      maintenanceDue: 'all',
      inspection: 'all'
    };

    this.cachedFilteredAssets = [];
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initEventListeners());
    } else {
      this.initEventListeners();
    }
  }

  initEventListeners() {
    // Sortable Headers
    document.querySelectorAll('.th-sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (this.sortField === field) {
          this.sortAsc = !this.sortAsc;
        } else {
          this.sortField = field;
          this.sortAsc = true;
        }
        this.updateSortHeaderUI();
        this.render();
      });
    });

    // Select All Checkbox
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const checked = e.target.checked;
        if (checked) {
          this.cachedFilteredAssets.forEach(a => this.selectedIds.add(a.id));
        } else {
          this.selectedIds.clear();
        }
        this.updateBulkToolbar();
        this.renderTableRows();
      });
    }

    // Bulk actions
    const btnCancelBulk = document.getElementById('btnCancelBulk');
    if (btnCancelBulk) {
      btnCancelBulk.addEventListener('click', () => {
        this.selectedIds.clear();
        if (selectAll) selectAll.checked = false;
        this.updateBulkToolbar();
        this.renderTableRows();
      });
    }

    const btnBulkExport = document.getElementById('btnBulkExportCSV');
    if (btnBulkExport) {
      btnBulkExport.addEventListener('click', () => {
        const selected = store.getAssets().filter(a => this.selectedIds.has(a.id));
        if (selected.length > 0) {
          store.exportToCSV(selected);
          showToast(`Đã xuất ${selected.length} thiết bị ra file CSV!`, 'success');
        }
      });
    }

    const btnBulkDelete = document.getElementById('btnBulkDelete');
    if (btnBulkDelete) {
      btnBulkDelete.addEventListener('click', () => {
        if (confirm(`Bạn có chắc muốn xóa vĩnh viễn ${this.selectedIds.size} máy móc đã chọn?`)) {
          store.deleteMultipleAssets(Array.from(this.selectedIds));
          this.selectedIds.clear();
          this.updateBulkToolbar();
          if (window.refreshAllDataViews) {
            window.refreshAllDataViews();
          } else {
            this.render();
            if (window.dashboardManager) window.dashboardManager.updateKPIs();
          }
          showToast('Đã xóa các thiết bị đã chọn!', 'warning');
        }
      });
    }

    const btnBulkPrint = document.getElementById('btnBulkPrintQR');
    if (btnBulkPrint) {
      btnBulkPrint.addEventListener('click', () => {
        const assets = (typeof store !== 'undefined' && store.getAssets) ? store.getAssets() : [];
        const selected = assets.filter(a => this.selectedIds && this.selectedIds.has(a.id));
        if (selected.length > 0) {
          openQRTagModal(selected[0].id);
        } else if (assets.length > 0) {
          const target = (this.cachedFilteredAssets && this.cachedFilteredAssets.length > 0)
            ? this.cachedFilteredAssets[0]
            : assets[0];
          openQRTagModal(target.id);
          if (typeof showToast === 'function') {
            showToast(`Đang mở tem QR máy ${target.code}. Bạn có thể tích chọn máy để in cụ thể!`, 'info');
          }
        } else {
          if (typeof showToast === 'function') {
            showToast('Chưa có thiết bị nào trong hệ thống để in tem QR!', 'warning');
          }
        }
      });
    }

    // Pagination
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTableRows();
          this.renderPagination();
        }
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const maxPage = Math.ceil(this.cachedFilteredAssets.length / this.pageSize) || 1;
        if (this.currentPage < maxPage) {
          this.currentPage++;
          this.renderTableRows();
          this.renderPagination();
        }
      });
    }

    // Filter Controls
    const depFilter = document.getElementById('filterDepartment');
    const catFilter = document.getElementById('filterCategory');
    const statusFilter = document.getElementById('filterStatus');
    const dueFilter = document.getElementById('filterMaintenanceDue');
    const inspFilter = document.getElementById('filterInspection');

    if (depFilter) depFilter.addEventListener('change', (e) => { this.filters.department = e.target.value; this.render(); });
    if (catFilter) catFilter.addEventListener('change', (e) => { this.filters.category = e.target.value; this.render(); });
    if (statusFilter) statusFilter.addEventListener('change', (e) => { this.filters.status = e.target.value; this.render(); });
    if (dueFilter) dueFilter.addEventListener('change', (e) => { this.filters.maintenanceDue = e.target.value; this.render(); });
    if (inspFilter) inspFilter.addEventListener('change', (e) => { this.filters.inspection = e.target.value; this.render(); });

    // Reset Filters button
    const btnResetFilters = document.getElementById('btnResetFilters');
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => this.resetFilters());
    }
    const btnEmptyReset = document.getElementById('btnEmptyReset');
    if (btnEmptyReset) {
      btnEmptyReset.addEventListener('click', () => this.resetFilters());
    }

    const btnClearAll = document.getElementById('btnClearAllAssetsPill');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        if (confirm('XÁC NHẬN: Bạn có chắc chắn muốn xóa toàn bộ máy móc hiện tại để tự nhập lại danh sách mới từ đầu?')) {
          store.clearAllAssets();
          this.selectedIds.clear();
          if (window.refreshAllDataViews) {
            window.refreshAllDataViews();
          } else {
            this.render();
            if (window.dashboardManager) window.dashboardManager.updateKPIs();
          }
          showToast('🗑️ Đã xóa sạch toàn bộ máy móc! Bạn có thể tự thêm máy mới.', 'info');
        }
      });
    }
  }

  resetFilters() {
    this.filters = {
      search: '',
      department: 'all',
      category: 'all',
      status: 'all',
      maintenanceDue: 'all',
      inspection: 'all'
    };

    const dep = document.getElementById('filterDepartment');
    const cat = document.getElementById('filterCategory');
    const st = document.getElementById('filterStatus');
    const due = document.getElementById('filterMaintenanceDue');
    const search = document.getElementById('globalSearchInput');
    const clearBtn = document.getElementById('btnClearSearch');

    if (dep) dep.value = 'all';
    if (cat) cat.value = 'all';
    if (st) st.value = 'all';
    if (due) due.value = 'all';
    if (search) search.value = '';
    if (clearBtn) clearBtn.style.display = 'none';

    this.currentPage = 1;
    this.render();
    showToast('Đã xóa tất cả bộ lọc', 'info');
  }

  setSearchQuery(q) {
    this.filters.search = q.trim().toLowerCase();
    this.currentPage = 1;
    this.render();
  }

  setStatusFilter(status) {
    this.filters.status = status;
    const st = document.getElementById('filterStatus');
    if (st) st.value = status;

    // Sync pill buttons active state
    document.querySelectorAll('.btn-status-pill').forEach(pill => {
      if (pill.dataset.status === status) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    this.currentPage = 1;
    this.render();
  }

  setDueFilter(period) {
    this.filters.maintenanceDue = period;
    const due = document.getElementById('filterMaintenanceDue');
    if (due) due.value = period;
    this.currentPage = 1;
    this.render();
  }

  updateSortHeaderUI() {
    document.querySelectorAll('.th-sortable').forEach(th => {
      const field = th.dataset.sort;
      const icon = th.querySelector('.sort-icon');
      if (field === this.sortField) {
        th.style.color = 'var(--text-main)';
        if (icon) {
          icon.textContent = this.sortAsc ? '▲' : '▼';
          icon.style.opacity = '1';
        }
      } else {
        th.style.color = '';
        if (icon) {
          icon.textContent = '↕';
          icon.style.opacity = '0.4';
        }
      }
    });
  }

  // Filter and Sort Asset List
  getFilteredAssets() {
    let list = store.getAssets();

    // 1. Search filter
    if (this.filters.search) {
      const q = this.filters.search;
      list = list.filter(a => 
        (a.code && a.code.toLowerCase().includes(q)) ||
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.model && a.model.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q)) ||
        (a.location && a.location.toLowerCase().includes(q)) ||
        (a.operator && a.operator.toLowerCase().includes(q)) ||
        (a.manufacturer && a.manufacturer.toLowerCase().includes(q))
      );
    }

    // 2. Department
    if (this.filters.department !== 'all') {
      list = list.filter(a => a.department === this.filters.department);
    }

    // 3. Category
    if (this.filters.category !== 'all') {
      list = list.filter(a => a.category === this.filters.category);
    }

    // 4. Status
    if (this.filters.status !== 'all') {
      list = list.filter(a => a.status === this.filters.status);
    }

    // 5. Maintenance Due
    if (this.filters.maintenanceDue !== 'all') {
      list = list.filter(a => {
        const dueInfo = DateHelper.calculateDueStatus(a.nextDue);
        if (this.filters.maintenanceDue === 'overdue') return dueInfo.isOverdue;
        if (this.filters.maintenanceDue === 'due7') return dueInfo.isOverdue || dueInfo.days <= 7;
        if (this.filters.maintenanceDue === 'due30') return dueInfo.isOverdue || dueInfo.days <= 30;
        if (this.filters.maintenanceDue === 'ok') return !dueInfo.isOverdue && dueInfo.days > 7;
        return true;
      });
    }

    // 6. Track Sheet Inspection filter
    if (this.filters.inspection !== 'all') {
      const todayStr = new Date().toISOString().split('T')[0];
      list = list.filter(a => {
        const chk = a.lastCheckSheet;
        if (this.filters.inspection === 'checked_pass') {
          return chk && chk.status === 'PASS';
        } else if (this.filters.inspection === 'not_checked') {
          return !chk || chk.date !== todayStr;
        } else if (this.filters.inspection === 'has_issue') {
          return chk && chk.status === 'FAIL';
        }
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortAsc ? valA - valB : valB - valA;
      }

      if (this.sortField === 'checkSheet') {
        const statusA = a.lastCheckSheet ? a.lastCheckSheet.status : 'PENDING';
        const statusB = b.lastCheckSheet ? b.lastCheckSheet.status : 'PENDING';
        return this.sortAsc ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
      }
      const strA = valA.toString().toLowerCase();
      const strB = valB.toString().toLowerCase();
      return this.sortAsc ? strA.localeCompare(strB, 'vi') : strB.localeCompare(strA, 'vi');
    });

    this.cachedFilteredAssets = list;
    return list;
  }

  render() {
    this.updatePillCounts();
    this.getFilteredAssets();
    this.renderTableRows();
    this.renderPagination();
    this.renderKanban();
    this.updateBulkToolbar();
  }

  updatePillCounts() {
    const assets = store.getAssets();
    let running = 0;
    let down = 0;
    let maint = 0;
    let standby = 0;

    assets.forEach(a => {
      if (a.status === 'operational') running++;
      else if (a.status === 'down') down++;
      else if (a.status === 'maintenance') maint++;
      else standby++;
    });

    const elAll = document.getElementById('pillCountAll');
    const elRun = document.getElementById('pillCountRunning');
    const elDown = document.getElementById('pillCountDown');
    const elMaint = document.getElementById('pillCountMaint');
    const elStby = document.getElementById('pillCountStandby');

    if (elAll) elAll.textContent = assets.length;
    if (elRun) elRun.textContent = running;
    if (elDown) elDown.textContent = down;
    if (elMaint) elMaint.textContent = maint;
    if (elStby) elStby.textContent = standby;
  }

  // Render Table View Rows
  renderTableRows() {
    const tbody = document.getElementById('assetTableBody');
    const emptyState = document.getElementById('tableEmptyState');
    if (!tbody) return;

    const list = this.cachedFilteredAssets;
    const total = list.length;

    // Show/Hide Empty State
    if (total === 0) {
      tbody.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'block';
        const emptyTitle = document.getElementById('emptyStateTitle');
        const emptyDesc = document.getElementById('emptyStateDesc');
        const allAssets = store.getAssets();
        if (!allAssets || allAssets.length === 0) {
          if (emptyTitle) emptyTitle.textContent = 'Danh sách máy móc đang trống (Đã xóa các máy AI tự nạp)';
          if (emptyDesc) emptyDesc.textContent = 'Toàn bộ máy mẫu đã được dọn sạch. Bạn hãy bấm "+ Tự Thêm Máy Móc Mới" để thêm thiết bị thực tế.';
        } else {
          if (emptyTitle) emptyTitle.textContent = 'Không tìm thấy máy móc phù hợp với bộ lọc';
          if (emptyDesc) emptyDesc.textContent = 'Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm của bạn.';
        }
      }
    } else {
      if (emptyState) emptyState.style.display = 'none';

      // Slice for current page
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const pageItems = list.slice(startIndex, startIndex + this.pageSize);

      tbody.innerHTML = pageItems.map(asset => {
        const isSelected = this.selectedIds.has(asset.id);
        const dueInfo = DateHelper.calculateDueStatus(asset.nextDue);
        let dueTagClass = 'safe';
        if (dueInfo.isOverdue) dueTagClass = 'overdue';
        else if (dueInfo.isWithin7Days) dueTagClass = 'warning';

        return `
          <tr class="${isSelected ? 'row-selected' : ''}" data-id="${asset.id}">
            <td class="td-checkbox">
              <input type="checkbox" class="row-checkbox" data-id="${asset.id}" ${isSelected ? 'checked' : ''}>
            </td>
            <td>
              <span class="asset-code-badge" onclick="openAssetDetailModal('${asset.id}')" title="Click để xem chi tiết">${asset.code}</span>
            </td>
            <td>
              <div class="asset-name-cell">
                <span class="asset-title" onclick="openAssetDetailModal('${asset.id}')" style="cursor:pointer;">${asset.name}</span>
                <span class="asset-meta">
                  <span>${asset.category}</span> &bull; <span>${asset.model || ''}</span>
                </span>
              </div>
            </td>
            <td>
              <div>
                <strong>${asset.department}</strong>
                <div style="font-size:0.72rem; color:var(--text-dim);">${asset.location || '-'}</div>
              </div>
            </td>
            <td>
              <div class="status-cell-container">
                ${this.getStatusPillHTML(asset.status)}
                <button type="button" class="btn-quick-status-switch" onclick="window.openQuickStatusModal('${asset.id}')" title="Chuyển trạng thái máy sang Bảo trì hoặc Sự cố dừng máy">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                  <span>Chuyển trạng thái</span>
                </button>
              </div>
            </td>
            <td>
              <div class="inspect-cell">
                ${this.getCheckSheetBadgeHTML(asset.lastCheckSheet)}
                <button class="btn btn-sm btn-track-check" onclick="window.openTrackInspectionModal('${asset.id}')" title="Kiểm tra 10 hạng mục Track Sheet máy này">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  <span>Kiểm Tra</span>
                </button>
              </div>
            </td>
            <td>
              <div class="due-cell">
                <span class="due-date">${DateHelper.formatVN(asset.nextDue)}</span>
                <span class="due-tag ${dueTagClass}">${dueInfo.text}</span>
              </div>
            </td>
            <td>
              <div style="font-size:0.8rem;">${asset.operator || '<span style="color:var(--text-dim);">Chưa gán</span>'}</div>
            </td>
            <td>
              <strong style="font-family:var(--font-mono); font-size:0.82rem; color:var(--text-main);">
                ${NumberHelper.formatCurrencyVN(asset.value)}
              </strong>
            </td>
            <td class="text-center">
              <div class="row-actions-group">
                <button class="action-btn-mini" title="Xem chi tiết" onclick="openAssetDetailModal('${asset.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="action-btn-mini warning" title="Chuyển trạng thái sang bảo trì / sự cố" onclick="window.openQuickStatusModal('${asset.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                </button>
                <button class="action-btn-mini" title="Ghi nhật ký bảo trì" onclick="openAddMaintModalForAsset('${asset.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </button>
                <button class="action-btn-mini" title="In tem QR Code" onclick="openQRTagModal('${asset.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"/></svg>
                </button>
                <button class="action-btn-mini" title="Chỉnh sửa máy" onclick="openEditAssetModal('${asset.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="action-btn-mini danger" title="Xóa máy này" onclick="deleteSingleAsset('${asset.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach row checkbox handlers
      tbody.querySelectorAll('.row-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const id = e.target.dataset.id;
          if (e.target.checked) {
            this.selectedIds.add(id);
          } else {
            this.selectedIds.delete(id);
          }
          this.updateBulkToolbar();
          const tr = e.target.closest('tr');
          if (tr) tr.classList.toggle('row-selected', e.target.checked);
        });
      });
    }

    // Update counts
    const showingCount = document.getElementById('showingCount');
    const totalFilterCount = document.getElementById('totalFilterCount');
    const grandTotalCount = document.getElementById('grandTotalCount');
    const badgeTotalCount = document.getElementById('badgeTotalCount');

    const grand = store.getAssets().length;
    if (showingCount) showingCount.textContent = list.length > 0 ? `${Math.min((this.currentPage - 1) * this.pageSize + 1, list.length)} - ${Math.min(this.currentPage * this.pageSize, list.length)}` : '0';
    if (totalFilterCount) totalFilterCount.textContent = list.length;
    if (grandTotalCount) grandTotalCount.textContent = grand;
    if (badgeTotalCount) badgeTotalCount.textContent = grand;
  }

  // Track Sheet Check Badge HTML
  getCheckSheetBadgeHTML(chk) {
    if (!chk) {
      return `
        <div class="check-pill pending" title="Chưa có dữ liệu kiểm tra ca hôm nay">
          <span class="stat-dot"></span>
          <span>Chưa kiểm tra ca</span>
        </div>
      `;
    }

    if (chk.status === 'PASS') {
      return `
        <div class="check-badge-group">
          <div class="check-pill pass" title="Kiểm tra lúc ${chk.time || ''} ngày ${DateHelper.formatVN(chk.date)} bởi ${chk.inspector}">
            <span class="stat-dot"></span>
            <span>${chk.summary || (chk.passedCount ? `${chk.passedCount}/${chk.totalCount} ĐẠT` : 'ĐẠT')}</span>
          </div>
          <span class="check-sub">${chk.shift || 'Ca kiểm tra'} &bull; ${chk.inspector ? chk.inspector.split(' ')[0] : ''}</span>
        </div>
      `;
    } else {
      return `
        <div class="check-badge-group">
          <div class="check-pill fail" title="Phát hiện hạng mục NG! Kiểm tra lúc ${chk.time || ''}">
            <span class="stat-dot"></span>
            <span>${chk.summary || 'CÓ MỤC NG'}</span>
          </div>
          <span class="check-sub danger">${chk.inspector ? chk.inspector.split(' ')[0] : 'KTV'} (Cảnh báo)</span>
        </div>
      `;
    }
  }

  // Status Badge Markup
  getStatusPillHTML(status) {
    switch (status) {
      case 'operational':
        return `<span class="status-pill operational"><span class="stat-dot"></span> Đang hoạt động</span>`;
      case 'maintenance':
        return `<span class="status-pill maintenance"><span class="stat-dot"></span> Đang bảo dưỡng</span>`;
      case 'down':
        return `<span class="status-pill down"><span class="stat-dot"></span> Sự cố / Dừng máy</span>`;
      case 'calibration':
        return `<span class="status-pill calibration"><span class="stat-dot"></span> Chờ kiểm định</span>`;
      case 'standby':
        return `<span class="status-pill standby"><span class="stat-dot"></span> Máy dự phòng</span>`;
      default:
        return `<span class="status-pill standby">${status}</span>`;
    }
  }

  // Pagination UI
  renderPagination() {
    const list = this.cachedFilteredAssets;
    const maxPage = Math.ceil(list.length / this.pageSize) || 1;
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    const pageContainer = document.getElementById('pageNumbersContainer');

    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
    if (btnNext) btnNext.disabled = this.currentPage >= maxPage;

    if (pageContainer) {
      let html = '';
      for (let i = 1; i <= maxPage; i++) {
        if (i === 1 || i === maxPage || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
          html += `<span class="page-num ${i === this.currentPage ? 'active' : ''}" onclick="window.sheetManager.goToPage(${i})">${i}</span>`;
        } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
          html += `<span style="padding:0 4px; color:var(--text-dim);">...</span>`;
        }
      }
      pageContainer.innerHTML = html;
    }
  }

  goToPage(p) {
    this.currentPage = p;
    this.renderTableRows();
    this.renderPagination();
  }

  // Bulk Toolbar Floating
  updateBulkToolbar() {
    const bar = document.getElementById('bulkToolbar');
    const count = document.getElementById('bulkSelectedCount');
    const selectAll = document.getElementById('selectAllCheckbox');

    if (!bar) return;
    const size = this.selectedIds.size;
    if (count) count.textContent = size;

    if (size > 0) {
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
      if (selectAll) selectAll.checked = false;
    }
  }

  // Render View 2: Kanban Board
  renderKanban() {
    const list = this.getFilteredAssets();

    const opList = document.getElementById('kanbanListOperational');
    const maintList = document.getElementById('kanbanListMaintenance');
    const downList = document.getElementById('kanbanListDown');
    const otherList = document.getElementById('kanbanListOther');

    const opBadge = document.getElementById('kanbanBadgeOperational');
    const maintBadge = document.getElementById('kanbanBadgeMaintenance');
    const downBadge = document.getElementById('kanbanBadgeDown');
    const otherBadge = document.getElementById('kanbanBadgeOther');

    if (!opList) return;

    const opAssets = list.filter(a => a.status === 'operational');
    const maintAssets = list.filter(a => a.status === 'maintenance');
    const downAssets = list.filter(a => a.status === 'down');
    const otherAssets = list.filter(a => a.status === 'calibration' || a.status === 'standby');

    if (opBadge) opBadge.textContent = opAssets.length;
    if (maintBadge) maintBadge.textContent = maintAssets.length;
    if (downBadge) downBadge.textContent = downAssets.length;
    if (otherBadge) otherBadge.textContent = otherAssets.length;

    const createKanbanCard = (asset) => {
      const dueInfo = DateHelper.calculateDueStatus(asset.nextDue);
      let dueClass = 'safe';
      if (dueInfo.isOverdue) dueClass = 'overdue';
      else if (dueInfo.isWithin7Days) dueClass = 'warning';

      return `
        <div class="kanban-item-card" onclick="openAssetDetailModal('${asset.id}')">
          <div class="item-card-top">
            <span class="asset-code-badge">${asset.code}</span>
            <span class="due-tag ${dueClass}">${dueInfo.text}</span>
          </div>
          <div class="item-card-title">${asset.name}</div>
          <div class="item-card-desc">${asset.department} &bull; ${asset.location || 'Chuyền chính'}</div>
          <div class="item-card-footer">
            <span>PIC: ${asset.operator ? asset.operator.split(' ')[0] : 'Chưa gán'}</span>
            <strong>${NumberHelper.formatCompactVN(asset.value)}</strong>
          </div>
        </div>
      `;
    };

    opList.innerHTML = opAssets.map(createKanbanCard).join('') || '<div style="color:var(--text-dim); font-size:0.75rem; text-align:center; padding:20px;">Trống</div>';
    maintList.innerHTML = maintAssets.map(createKanbanCard).join('') || '<div style="color:var(--text-dim); font-size:0.75rem; text-align:center; padding:20px;">Trống</div>';
    downList.innerHTML = downAssets.map(createKanbanCard).join('') || '<div style="color:var(--text-dim); font-size:0.75rem; text-align:center; padding:20px;">Không có sự cố</div>';
    otherList.innerHTML = otherAssets.map(createKanbanCard).join('') || '<div style="color:var(--text-dim); font-size:0.75rem; text-align:center; padding:20px;">Trống</div>';
  }
}

// Global instance
window.sheetManager = new SheetManager();
