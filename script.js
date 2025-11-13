// FinSight base interactions + Chart.js initialization
(function(){
  const collapseBtn = document.getElementById('collapseBtn');
  const sidebar = document.getElementById('sidebar');

  if (collapseBtn) {
    collapseBtn.addEventListener('click', ()=>{
      if (window.innerWidth <= 700) {
        sidebar && sidebar.classList.toggle('open');
      } else {
        document.documentElement.classList.toggle('sidebar-collapsed');
        if (document.documentElement.classList.contains('sidebar-collapsed')){
          sidebar && (sidebar.style.width = '80px');
        } else {
          sidebar && (sidebar.style.width = '');
        }
      }
    });
  }

  // Clock in topbar (optional) — only run if element exists
  const clockEl = document.getElementById('clock');
  if (clockEl) {
    function updateClock(){
      const now = new Date();
      const opts = {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'};
      clockEl.textContent = now.toLocaleString(undefined, opts);
    }
    updateClock();
  setInterval(updateClock, 60000);
  }

  // Animate KPI/card values on load
  function animateCardValues(){
    const values = document.querySelectorAll('.card .card-value');
    values.forEach((el,i)=>{
      el.style.opacity = 0; el.style.transform = 'translateY(6px)';
      setTimeout(()=>{ el.style.transition = 'all 360ms ease'; el.style.opacity = 1; el.style.transform = 'none'; }, 110 * i);
    });
  }

  // Chart initialization
  function initCharts(){
    // Sample data arrays (monthly)
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revenueMonthly = [12000,15000,14000,17000,19000,22000,24000,23000,21000,25000,27000,30000];
    // expensesByMonth: each month has [marketing, salaries, infrastructure, other]
    const expensesByMonth = [
      [3200,5600,1400,800], [3000,5800,1500,900], [2800,5400,1600,700], [3500,6000,1700,800],
      [4200,6200,1800,900], [4800,6500,2000,1070], [5200,6800,2100,1100], [5000,6700,2000,900],
      [4700,6400,1900,700], [5400,7000,2200,900], [5600,7300,2300,800], [6000,7500,2400,1070]
    ];

    // categories are static for pie chart
    const expenseCategories = ['Marketing','Salaries','Infrastructure','Other'];

    // Chart instances stored here
    let revenueChartInstance = null;
    let expensesChartInstance = null;

    // helper: get indices for selection value
    function indicesForSelection(val){
      if (val === 'all') return Array.from({length:12},(_,i)=>i);
      if (val === 'Q1') return [0,1,2];
      if (val === 'Q2') return [3,4,5];
      if (val === 'Q3') return [6,7,8];
      if (val === 'Q4') return [9,10,11];
      // month names (Jan,Feb,...)
      const idx = monthNames.indexOf(val);
      if (idx >= 0) return [idx];
      return Array.from({length:12},(_,i)=>i);
    }

    function aggregatedExpensesForIndices(indices){
      const totals = [0,0,0,0];
      indices.forEach(i=>{
        expensesByMonth[i].forEach((v,ci)=> totals[ci] += v);
      });
      return totals;
    }

    // initialize charts with full year by default
    const ctxRevenue = document.getElementById('revenueChart');
    const ctxExpenses = document.getElementById('expensesChart');

    if (ctxRevenue && typeof Chart !== 'undefined'){
      revenueChartInstance = new Chart(ctxRevenue.getContext('2d'), {
        type: 'line',
        data: {
          labels: monthNames,
          datasets: [{
            label: 'Revenue',
            data: revenueMonthly,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: {
              grid: { color: 'rgba(15,23,42,0.04)' },
              ticks: { callback: function(v){ return '$' + v; } }
            }
          }
        }
      });
    }

    if (ctxExpenses && typeof Chart !== 'undefined'){
      const initialTotals = aggregatedExpensesForIndices(indicesForSelection('all'));
      expensesChartInstance = new Chart(ctxExpenses.getContext('2d'), {
        type: 'pie',
        data: { labels: expenseCategories, datasets: [{ data: initialTotals, backgroundColor:['#2563eb','#10b981','#f97316','#6b7280'], hoverOffset:6 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right'}} }
      });
    }

    // update charts for a given selection value
    function updateChartsFor(val){
      const idx = indicesForSelection(val);
      const labels = idx.map(i=> monthNames[i]);
      const revenueData = idx.map(i=> revenueMonthly[i]);
      const expenseTotals = aggregatedExpensesForIndices(idx);

      if (revenueChartInstance){
        revenueChartInstance.data.labels = labels;
        revenueChartInstance.data.datasets[0].data = revenueData;
        revenueChartInstance.update();
      }
      if (expensesChartInstance){
        expensesChartInstance.data.datasets[0].data = expenseTotals;
        expensesChartInstance.update();
      }
    }

    // wire dropdown
    const periodSelect = document.getElementById('periodSelect');
    if (periodSelect){
      periodSelect.addEventListener('change', (e)=>{ updateChartsFor(e.target.value); });
    }

    // expose a small API for initial selection if needed
    return { updateChartsFor };
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    animateCardValues();
    // small timeout to allow canvas to inherit sizes before Chart.js measures
    setTimeout(initCharts, 120);
    // Notifications panel wiring
    const notifBtn = document.getElementById('notifBtn');
    const notifPanel = document.getElementById('notifPanel');
    const notifOverlay = document.getElementById('notifOverlay');
    const closeNotif = document.getElementById('closeNotif');
    const markAllRead = document.getElementById('markAllRead');

    function openNotif(){
      if (!notifPanel) return;
      notifPanel.classList.add('open');
      notifOverlay && notifOverlay.classList.add('open');
      notifPanel.setAttribute('aria-hidden','false');
      notifBtn && notifBtn.setAttribute('aria-expanded','true');
    }
    function closeNotifPanel(){
      if (!notifPanel) return;
      notifPanel.classList.remove('open');
      notifOverlay && notifOverlay.classList.remove('open');
      notifPanel.setAttribute('aria-hidden','true');
      notifBtn && notifBtn.setAttribute('aria-expanded','false');
    }

    if (notifBtn){
      notifBtn.addEventListener('click', (e)=>{
        const isOpen = notifPanel && notifPanel.classList.contains('open');
        if (isOpen) closeNotifPanel(); else openNotif();
      });
    }
    if (closeNotif){ closeNotif.addEventListener('click', closeNotifPanel); }
    if (notifOverlay){ notifOverlay.addEventListener('click', closeNotifPanel); }
    if (markAllRead){ markAllRead.addEventListener('click', ()=>{ document.getElementById('notifCount') && (document.getElementById('notifCount').textContent = '0'); }); }

    // close on ESC
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeNotifPanel(); });

    // Theme toggle: persist preference and apply dark-theme class
    const themeToggle = document.getElementById('themeToggle');
    function applyTheme(theme){
      if (theme === 'dark'){
        document.documentElement.classList.add('dark-theme');
        if (themeToggle) themeToggle.textContent = '☀️';
      } else {
        document.documentElement.classList.remove('dark-theme');
        if (themeToggle) themeToggle.textContent = '🌙';
      }
    }

    // determine initial theme: localStorage -> prefers-color-scheme -> light
    let savedTheme = null;
    try { savedTheme = localStorage.getItem('theme'); } catch(e) { savedTheme = null; }
    if (!savedTheme){
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      savedTheme = prefersDark ? 'dark' : 'light';
    }
    applyTheme(savedTheme);

    if (themeToggle){
      themeToggle.addEventListener('click', ()=>{
        const isDark = document.documentElement.classList.contains('dark-theme');
        const next = isDark ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch(e) { /* ignore */ }
      });
    }
  });
})();
