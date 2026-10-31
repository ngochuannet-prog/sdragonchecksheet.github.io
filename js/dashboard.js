/**
 * SDragon AssetTracker Pro - Dashboard & Analytics Engine
 * Calculates executive KPI metrics, health rates, and renders interactive column charts.
 */

class DashboardManager {
  constructor() {
    this.selectedCategory = 'ALL';
    this.selectedAsset = 'ALL';
    this.selectedMetric = 'cost'; // 'cost' | 'hours' | 'tracksheet' | 'value' | 'maint_count'
    this.chartMode = 'asset';     // 'asset' | 'category'
    this.isInitialized = false;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.initEventListeners();
    this.initColumnChartEvents();
    this.updateKPIs();
    this.isInitialized = true;
  }

  initEventListeners() {
    // KPI Quick Filter buttons
    const btnFilterDue = document.getElementById('btnFilterDue');
    if (btnFilterDue) {
      btnFilterDue.addEventListener('click', () => {
        switchView('sheet-view');
        if (window.sheetManager) window.sheetManager.setDueFilter('due7');
      });
    }

    const btnFilterDown = document.getElementById('btnFilterDown');
    if (btnFilterDown) {
      btnFilterDown.addEventListener('click', () => {
        switchView('sheet-view');
        if (window.sheetManager) window.sheetManager.setStatusFilter('down');
      });
    }

    // Button to restore demo analytics data
    const btnRestoreDemo = document.getElementById('btnRestoreDemoAnalytics');
    if (btnRestoreDemo) {
      btnRestoreDemo.addEventListener('click', () => {
        if (confirm('Nạp lại dữ liệu 16 máy móc mẫu đầy đủ lịch sử bảo trì & kiểm tra ca?')) {
          store.resetToDemoData();
          this.selectedCategory = 'ALL';
          this.selectedAsset = 'ALL';
          if (window.sheetManager) window.sheetManager.render();
          this.updateKPIs();
          showToast('✅ Đã nạp lại 16 máy móc mẫu thành công!', 'success');
        }
      });
    }
  }

  initColumnChartEvents() {
    // 1. Category selector
    const catSelect = document.getElementById('chartFilterCategory');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.selectedAsset = 'ALL';
        this.populateAssetSelector();
        this.renderColumnChart();
      });
    }

    // 2. Individual Asset selector
    const assetSelect = document.getElementById('chartFilterAsset');
    if (assetSelect) {
      assetSelect.addEventListener('change', (e) => {
        this.selectedAsset = e.target.value;
        this.renderColumnChart();
      });
    }

    // 3. Metric selector
    const metricSelect = document.getElementById('chartMetricSelector');
    if (metricSelect) {
      metricSelect.addEventListener('change', (e) => {
        this.selectedMetric = e.target.value;
        this.renderColumnChart();
      });
    }

    // 4. View Mode buttons (Per Asset vs Per Category)
    const btnModeAsset = document.getElementById('btnChartModeAsset');
    const btnModeCat = document.getElementById('btnChartModeCategory');

    if (btnModeAsset && btnModeCat) {
      btnModeAsset.addEventListener('click', () => {
        this.chartMode = 'asset';
        btnModeAsset.classList.add('active');
        btnModeCat.classList.remove('active');
        this.renderColumnChart();
      });

      btnModeCat.addEventListener('click', () => {
        this.chartMode = 'category';
        btnModeCat.classList.add('active');
        btnModeAsset.classList.remove('active');
        this.renderColumnChart();
      });
    }
  }

  // Populate Categories into Filter Dropdown
  populateCategorySelector() {
    const catSelect = document.getElementById('chartFilterCategory');
    if (!catSelect) return;

    const assets = store.getAssets();
    const categories = Array.from(new Set(assets.map(a => a.category))).filter(Boolean).sort();

    const currentVal = this.selectedCategory;
    catSelect.innerHTML = `<option value="ALL">-- Tất Cả Loại Máy (${categories.length} loại) --</option>` +
      categories.map(c => `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`).join('');

    this.populateAssetSelector();
  }

  // Populate Individual Assets into Filter Dropdown based on category
  populateAssetSelector() {
    const assetSelect = document.getElementById('chartFilterAsset');
    if (!assetSelect) return;

    let assets = store.getAssets();
    if (this.selectedCategory !== 'ALL') {
      assets = assets.filter(a => a.category === this.selectedCategory);
    }

    const currentVal = this.selectedAsset;
    assetSelect.innerHTML = `<option value="ALL">-- Tất Cả Thiết Bị (${assets.length} máy) --</option>` +
      assets.map(a => `<option value="${a.id}" ${a.id === currentVal ? 'selected' : ''}>${a.code} - ${a.name}</option>`).join('');
  }

  // Update all dashboard KPI metrics
  updateKPIs() {
    let assets = store.getAssets();
    const logs = store.getLogs();

    if (!assets) assets = [];

    const total = assets.length;

    // 1. Status tallies
    let runningCount = 0;
    let maintCount = 0;
    let downCount = 0;
    let dueCount = 0;
    let totalValue = 0;
    let totalHours = 0;

    assets.forEach(a => {
      if (a.status === 'operational') runningCount++;
      else if (a.status === 'maintenance') maintCount++;
      else if (a.status === 'down') downCount++;

      if (a.value) totalValue += Number(a.value);
      if (a.operatingHours) totalHours += Number(a.operatingHours);

      const dueInfo = DateHelper.calculateDueStatus(a.nextDue);
      if (dueInfo.isOverdue || dueInfo.isWithin7Days) {
        dueCount++;
      }
    });

    // Availability Rate = (Running / Total) * 100
    const availabilityRate = total > 0 ? Math.round((runningCount / total) * 100) : 0;

    // Header Quick Stats
    const qRunning = document.getElementById('quickRunningCount');
    const qMaint = document.getElementById('quickMaintenanceCount');
    const qDown = document.getElementById('quickDownCount');
    if (qRunning) qRunning.textContent = runningCount;
    if (qMaint) qMaint.textContent = maintCount;
    if (qDown) qDown.textContent = downCount;

    // Top KPI Cards
    const kpiTotalAssets = document.getElementById('kpiTotalAssets');
    const kpiTotalValue = document.getElementById('kpiTotalValue');
    const kpiAvailabilityRate = document.getElementById('kpiAvailabilityRate');
    const kpiAvailabilitySub = document.getElementById('kpiAvailabilitySub');
    const kpiAvailabilityGauge = document.getElementById('kpiAvailabilityGauge');
    const kpiDueCount = document.getElementById('kpiDueCount');
    const kpiDueSub = document.getElementById('kpiDueSub');
    const kpiDownCount = document.getElementById('kpiDownCount');
    const kpiDownSub = document.getElementById('kpiDownSub');
    const badgeDueCount = document.getElementById('badgeDueCount');

    if (kpiTotalAssets) {
      kpiTotalAssets.textContent = total;
      kpiTotalAssets.classList.add('kpi-updated-pulse');
      setTimeout(() => kpiTotalAssets.classList.remove('kpi-updated-pulse'), 800);
    }
    if (kpiTotalValue) {
      kpiTotalValue.textContent = `Tổng giá trị: ${NumberHelper.formatCompactVN(totalValue)}`;
    }
    
    if (kpiAvailabilityRate) kpiAvailabilityRate.textContent = `${availabilityRate}%`;
    if (kpiAvailabilitySub) kpiAvailabilitySub.textContent = `${runningCount}/${total} máy đang chạy`;
    if (kpiAvailabilityGauge) kpiAvailabilityGauge.style.width = `${availabilityRate}%`;

    if (kpiDueCount) kpiDueCount.textContent = dueCount;
    if (kpiDueSub) kpiDueSub.textContent = dueCount > 0 ? `${dueCount} máy cần bảo dưỡng gấp` : 'Không có máy quá hạn';
    if (badgeDueCount) badgeDueCount.textContent = dueCount;

    if (kpiDownCount) kpiDownCount.textContent = downCount;
    if (kpiDownSub) kpiDownSub.textContent = downCount > 0 ? `${downCount} sự cố dừng chuyền` : '0 sự cố dừng máy';

    // Update Real-Time Today Live Diagram & Banner
    const todayStr = DateHelper.getTodayStr();
    const todayFormatted = DateHelper.getTodayFormattedVN();
    const inspections = store.getInspections ? store.getInspections() : [];
    const todayLogs = logs.filter(l => l.date === todayStr);
    const todayInspections = inspections.filter(i => i.date === todayStr);
    const todayPass = todayInspections.filter(i => i.status === 'PASS').length;
    const todayNG = todayInspections.filter(i => i.status === 'FAIL').length;

    const elTodayDateBadge = document.getElementById('todayLiveDateBadge');
    const elTodaySyncInfo = document.getElementById('todayLiveSyncInfo');
    const elNodeRun = document.getElementById('todayNodeRun');
    const elNodeRunSub = document.getElementById('todayNodeRunSub');
    const elNodeMaint = document.getElementById('todayNodeMaint');
    const elNodeMaintSub = document.getElementById('todayNodeMaintSub');
    const elNodeDown = document.getElementById('todayNodeDown');
    const elNodeDownSub = document.getElementById('todayNodeDownSub');
    const elNodeInspect = document.getElementById('todayNodeInspect');
    const elNodeInspectSub = document.getElementById('todayNodeInspectSub');

    if (elTodayDateBadge) elTodayDateBadge.textContent = todayFormatted;
    if (elTodaySyncInfo) elTodaySyncInfo.textContent = `Đồng bộ tức thời lúc ${new Date().toLocaleTimeString('vi-VN')}`;
    
    if (elNodeRun) elNodeRun.textContent = `${runningCount} máy`;
    if (elNodeRunSub) elNodeRunSub.textContent = `${availabilityRate}% hoạt động tốt`;
    
    if (elNodeMaint) elNodeMaint.textContent = `${maintCount + dueCount} máy`;
    if (elNodeMaintSub) elNodeMaintSub.textContent = `${todayLogs.length} phiếu hôm nay (${dueCount} đến hạn)`;
    
    if (elNodeDown) elNodeDown.textContent = `${downCount} máy`;
    if (elNodeDownSub) elNodeDownSub.textContent = downCount > 0 ? `${downCount} sự cố cần can thiệp` : '0 sự cố hôm nay';
    
    if (elNodeInspect) elNodeInspect.textContent = `${todayInspections.length} lượt`;
    if (elNodeInspectSub) elNodeInspectSub.textContent = `${todayPass} Đạt / ${todayNG} NG hôm nay`;

    // Update Category & Asset selectors
    this.populateCategorySelector();

    // Render Hero Interactive Column Chart
    this.renderColumnChart();

    // Also update existing Analytics View bars & health row
    this.renderAnalytics(assets, logs, totalValue, totalHours, availabilityRate);
  }

  // ================= RENDER INTERACTIVE COLUMN BAR CHART =================
  renderColumnChart() {
    const container = document.getElementById('columnChartWrapper');
    const summaryCards = document.getElementById('chartSummaryCards');
    if (!container) return;

    let assets = store.getAssets();
    const logs = store.getLogs();
    const inspections = store.getInspections();

    if (!assets || assets.length === 0) {
      container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; color:var(--text-dim); gap:14px; padding:30px; text-align:center;">
          <div style="font-size:2.4rem;">🏭</div>
          <div style="font-size:1.15rem; font-weight:700; color:var(--text-main);">Chưa có máy móc nào trong hệ thống</div>
          <p style="font-size:0.9rem; color:var(--text-muted); max-width:440px; margin:0; line-height:1.5;">Toàn bộ máy do AI tự nạp đã được xóa sạch. Bạn hãy tự nhập các thiết bị thực tế của phân xưởng mình.</p>
          <button type="button" class="btn btn-primary" onclick="if(window.openAddAssetModal) window.openAddAssetModal(); else document.getElementById('btnOpenAddModal').click();" style="display:inline-flex; align-items:center; gap:8px; font-weight:600; margin-top:6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ➕ Tự Thêm Máy Móc Mới
          </button>
        </div>
      `;
      if (summaryCards) summaryCards.innerHTML = '';
      return;
    }

    // Apply category filter
    if (this.selectedCategory !== 'ALL') {
      assets = assets.filter(a => a.category === this.selectedCategory);
    }

    // Apply single asset filter
    if (this.selectedAsset !== 'ALL') {
      assets = assets.filter(a => a.id === this.selectedAsset);
    }

    // Prepare Data Series
    let dataPoints = [];

    if (this.chartMode === 'category') {
      // Group by Category
      const grouped = {};
      assets.forEach(a => {
        if (!grouped[a.category]) {
          grouped[a.category] = {
            key: a.category,
            label: a.category,
            subLabel: 'Nhóm thiết bị',
            assets: []
          };
        }
        grouped[a.category].assets.push(a);
      });

      dataPoints = Object.values(grouped).map(grp => {
        const assetIds = grp.assets.map(a => a.id);
        const grpLogs = logs.filter(l => assetIds.includes(l.assetId));
        const grpInspections = inspections.filter(i => assetIds.includes(i.assetId));

        let val = 0;
        let passCount = 0;
        let ngCount = 0;

        if (this.selectedMetric === 'cost') {
          val = grpLogs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
        } else if (this.selectedMetric === 'hours') {
          val = grp.assets.reduce((sum, a) => sum + (Number(a.operatingHours) || 0), 0);
        } else if (this.selectedMetric === 'value') {
          val = grp.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
        } else if (this.selectedMetric === 'maint_count') {
          val = grpLogs.length;
        } else if (this.selectedMetric === 'tracksheet') {
          passCount = grpInspections.filter(i => i.status === 'PASS').length;
          ngCount = grpInspections.filter(i => i.status === 'FAIL').length;
          val = passCount + ngCount;
        } else if (this.selectedMetric === 'today_status') {
          const todayStr = DateHelper.getTodayStr();
          const todayInsps = grpInspections.filter(i => i.date === todayStr);
          passCount = todayInsps.filter(i => i.status === 'PASS').length;
          ngCount = todayInsps.filter(i => i.status === 'FAIL').length;
          val = passCount + ngCount;
        }

        return {
          code: grp.label,
          name: `${grp.assets.length} máy`,
          category: grp.label,
          val: val,
          passCount,
          ngCount,
          assetCount: grp.assets.length
        };
      });
    } else {
      // Per Individual Asset
      dataPoints = assets.map(a => {
        const aLogs = logs.filter(l => l.assetId === a.id);
        const aInspections = inspections.filter(i => i.assetId === a.id);

        let val = 0;
        let passCount = 0;
        let ngCount = 0;

        if (this.selectedMetric === 'cost') {
          val = aLogs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
        } else if (this.selectedMetric === 'hours') {
          val = Number(a.operatingHours) || 0;
        } else if (this.selectedMetric === 'value') {
          val = Number(a.value) || 0;
        } else if (this.selectedMetric === 'maint_count') {
          val = aLogs.length;
        } else if (this.selectedMetric === 'tracksheet') {
          passCount = aInspections.filter(i => i.status === 'PASS').length;
          ngCount = aInspections.filter(i => i.status === 'FAIL').length;
          val = passCount + ngCount;
        } else if (this.selectedMetric === 'today_status') {
          const todayStr = DateHelper.getTodayStr();
          const todayInsps = aInspections.filter(i => i.date === todayStr);
          passCount = todayInsps.filter(i => i.status === 'PASS').length;
          ngCount = todayInsps.filter(i => i.status === 'FAIL').length;
          val = passCount + ngCount;
        }

        return {
          id: a.id,
          code: a.code,
          name: a.name,
          category: a.category,
          val: val,
          passCount,
          ngCount,
          status: a.status
        };
      });
    }

    if (dataPoints.length === 0) {
      container.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; color:var(--text-dim);">
          Không có máy móc nào phù hợp với bộ lọc hiện tại.
        </div>
      `;
      if (summaryCards) summaryCards.innerHTML = '';
      return;
    }

    // Determine Maximum Value for Y-Axis Scale
    let maxVal = 0;
    if (this.selectedMetric === 'tracksheet' || this.selectedMetric === 'today_status') {
      maxVal = Math.max(...dataPoints.map(d => Math.max(d.passCount, d.ngCount, 1)), 5);
    } else {
      maxVal = Math.max(...dataPoints.map(d => d.val), 10);
    }

    // Y-Axis Ticks (5 steps: 100%, 75%, 50%, 25%, 0)
    const ticks = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

    const formatTick = (num) => {
      if (this.selectedMetric === 'cost' || this.selectedMetric === 'value') {
        return NumberHelper.formatCompactVN(num);
      } else if (this.selectedMetric === 'hours') {
        return num >= 1000 ? `${(num / 1000).toFixed(1)}k h` : `${Math.round(num)} h`;
      } else if (this.selectedMetric === 'tracksheet') {
        return `${Math.round(num)} lần`;
      } else {
        return `${Math.round(num)} lần`;
      }
    };

    // Y-Axis HTML
    const yAxisHTML = `
      <div class="chart-y-axis">
        ${ticks.map(t => `<span>${formatTick(t)}</span>`).join('')}
      </div>
    `;

    // Gridlines HTML
    const gridLinesHTML = `
      <div class="chart-grid-lines">
        ${ticks.map(() => `<div class="grid-line"></div>`).join('')}
      </div>
    `;

    // Columns HTML
    const themeClass = this.selectedMetric === 'cost' ? 'theme-cost'
      : this.selectedMetric === 'hours' ? 'theme-hours'
      : this.selectedMetric === 'value' ? 'theme-value'
      : this.selectedMetric === 'maint_count' ? 'theme-maint' : 'theme-cost';

    const columnsHTML = dataPoints.map(d => {
      if (this.selectedMetric === 'tracksheet' || this.selectedMetric === 'today_status') {
        const passHeightPct = Math.max(Math.round((d.passCount / maxVal) * 100), d.passCount > 0 ? 5 : 0);
        const ngHeightPct = Math.max(Math.round((d.ngCount / maxVal) * 100), d.ngCount > 0 ? 5 : 0);

        return `
          <div class="chart-col-unit" title="${d.code} (${d.name}): ${d.passCount} lượt Đạt (OK), ${d.ngCount} lượt lỗi (NG)">
            <div class="col-val-badge">
              <span style="color:#10B981">${d.passCount}✓</span> / <span style="color:#EF4444">${d.ngCount}✗</span>
            </div>
            <div class="col-bar-dual-container">
              <div class="col-bar theme-pass" style="height: ${passHeightPct}%;"></div>
              <div class="col-bar theme-ng" style="height: ${ngHeightPct}%;"></div>
            </div>
            <div class="col-x-label">
              <span class="x-code">${d.code}</span>
              <span class="x-sub" title="${d.name}">${d.name}</span>
            </div>
          </div>
        `;
      } else {
        const heightPct = Math.max(Math.round((d.val / maxVal) * 100), d.val > 0 ? 4 : 0);
        const formattedVal = formatTick(d.val);

        return `
          <div class="chart-col-unit" title="${d.code} (${d.name}) - ${d.category}: ${formatTick(d.val)}">
            <div class="col-val-badge">${formattedVal}</div>
            <div class="col-bar ${themeClass}" style="height: ${heightPct}%;"></div>
            <div class="col-x-label">
              <span class="x-code">${d.code}</span>
              <span class="x-sub" title="${d.name}">${d.name}</span>
            </div>
          </div>
        `;
      }
    }).join('');

    container.innerHTML = `
      ${yAxisHTML}
      ${gridLinesHTML}
      <div class="chart-bars-viewport">
        ${columnsHTML}
      </div>
    `;

    // Summary Statistics Cards underneath
    if (summaryCards) {
      let totalMetricVal = 0;
      let highestItem = dataPoints[0];
      let lowestItem = dataPoints[0];

      if (this.selectedMetric === 'tracksheet' || this.selectedMetric === 'today_status') {
        const totalPass = dataPoints.reduce((sum, d) => sum + d.passCount, 0);
        const totalNG = dataPoints.reduce((sum, d) => sum + d.ngCount, 0);
        const totalInsp = totalPass + totalNG;
        const passRate = totalInsp > 0 ? Math.round((totalPass / totalInsp) * 100) : 100;

        summaryCards.innerHTML = `
          <div class="chart-stat-box highlight">
            <span class="lbl">TỔNG LƯỢT KIỂM TRA CA</span>
            <strong class="val">${totalInsp} lượt</strong>
            <span class="sub">${dataPoints.length} thiết bị trong phân tích</span>
          </div>
          <div class="chart-stat-box">
            <span class="lbl">TỔNG SỐ LƯỢT ĐẠT (OK)</span>
            <strong class="val" style="color:#10B981">${totalPass} lượt</strong>
            <span class="sub">Tỷ lệ an toàn: ${passRate}%</span>
          </div>
          <div class="chart-stat-box">
            <span class="lbl">TỔNG SỐ LƯỢT LỖI (NG)</span>
            <strong class="val" style="color:#EF4444">${totalNG} lỗi</strong>
            <span class="sub">Cần can thiệp sửa chữa</span>
          </div>
          <div class="chart-stat-box">
            <span class="lbl">MÁY NHIỀU LỖI NHẤT</span>
            <strong class="val">${dataPoints.sort((a,b)=>b.ngCount - a.ngCount)[0]?.code || '-'}</strong>
            <span class="sub">${dataPoints[0]?.ngCount || 0} lần phát hiện NG</span>
          </div>
        `;
      } else {
        totalMetricVal = dataPoints.reduce((sum, d) => sum + d.val, 0);
        const avgVal = dataPoints.length > 0 ? Math.round(totalMetricVal / dataPoints.length) : 0;

        dataPoints.forEach(d => {
          if (d.val > highestItem.val) highestItem = d;
          if (d.val < lowestItem.val) lowestItem = d;
        });

        const metricLabel = this.selectedMetric === 'cost' ? 'CHI PHÍ BẢO DƯỠNG'
          : this.selectedMetric === 'hours' ? 'SỐ GIỜ VẬN HÀNH'
          : this.selectedMetric === 'value' ? 'NGUYÊN GIÁ ĐẦU TƯ' : 'SỐ LƯỢT BẢO TRÌ';

        summaryCards.innerHTML = `
          <div class="chart-stat-box highlight">
            <span class="lbl">TỔNG ${metricLabel}</span>
            <strong class="val">${formatTick(totalMetricVal)}</strong>
            <span class="sub">Trên ${dataPoints.length} đối tượng được lọc</span>
          </div>
          <div class="chart-stat-box">
            <span class="lbl">MỨC TRUNG BÌNH / ĐỐI TƯỢNG</span>
            <strong class="val">${formatTick(avgVal)}</strong>
            <span class="sub">Bình quân từng thiết bị</span>
          </div>
          <div class="chart-stat-box">
            <span class="lbl">MỨC CAO NHẤT (ĐỈNH)</span>
            <strong class="val">${highestItem.code}</strong>
            <span class="sub">${highestItem.name} &bull; ${formatTick(highestItem.val)}</span>
          </div>
          <div class="chart-stat-box">
            <span class="lbl">MỨC THẤP NHẤT</span>
            <strong class="val">${lowestItem.code}</strong>
            <span class="sub">${lowestItem.name} &bull; ${formatTick(lowestItem.val)}</span>
          </div>
        `;
      }
    }
  }

  // Render View 4: Distribution Breakdown Lists & System Health
  renderAnalytics(assets, logs, totalValue, totalHours, availabilityRate) {
    const depContainer = document.getElementById('chartDepartmentBars');
    const catContainer = document.getElementById('chartCategoryBars');
    const metricRow = document.getElementById('analyticsMetricRow');

    if (!depContainer || !catContainer || !metricRow) return;

    const total = assets.length || 1;

    // 1. Department Breakdown
    const depCounts = {};
    assets.forEach(a => {
      depCounts[a.department] = (depCounts[a.department] || 0) + 1;
    });

    const depEntries = Object.entries(depCounts).sort((a, b) => b[1] - a[1]);
    depContainer.innerHTML = depEntries.map(([dep, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div class="chart-bar-item">
          <div class="bar-meta">
            <span><strong>${dep}</strong></span>
            <span>${count} máy (${pct}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-progress" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');

    // 2. Category Breakdown
    const catCounts = {};
    assets.forEach(a => {
      catCounts[a.category] = (catCounts[a.category] || 0) + 1;
    });

    const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    catContainer.innerHTML = catEntries.map(([cat, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div class="chart-bar-item">
          <div class="bar-meta">
            <span><strong>${cat}</strong></span>
            <span>${count} máy (${pct}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-progress" style="width: ${pct}%; background: linear-gradient(90deg, #10B981, #06B6D4);"></div>
          </div>
        </div>
      `;
    }).join('');

    // 3. System Health Metrics Row
    const totalCost = logs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
    metricRow.innerHTML = `
      <div class="metric-sub-card">
        <span class="lbl">TỔNG NGUYÊN GIÁ ĐẦU TƯ</span>
        <strong class="val" style="color:var(--accent-cyan);">${NumberHelper.formatCurrencyVN(totalValue)}</strong>
      </div>
      <div class="metric-sub-card">
        <span class="lbl">TỔNG GIỜ HOẠT ĐỘNG TOÀN NHÀ MÁY</span>
        <strong class="val" style="color:var(--status-operational);">${totalHours.toLocaleString('vi-VN')} h</strong>
      </div>
      <div class="metric-sub-card">
        <span class="lbl">SỐ PHIẾU BẢO DƯỠNG ĐÃ LẬP</span>
        <strong class="val" style="color:var(--status-warning);">${logs.length} phiếu</strong>
      </div>
      <div class="metric-sub-card">
        <span class="lbl">TỔNG CHI PHÍ BẢO DƯỠNG ĐÃ CHI</span>
        <strong class="val" style="color:#A855F7;">${NumberHelper.formatCurrencyVN(totalCost)}</strong>
      </div>
    `;
  }
}

// Global Export and Automatic Instantiation
window.DashboardManager = DashboardManager;
if (typeof window !== 'undefined') {
  window.dashboardManager = new DashboardManager();
}
