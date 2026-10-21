/**
 * MyStox 30-Second Auto-Refresh Engine & Public Endpoints Synchronizer
 * Re-fetches live data from get.mystox.com every 30 seconds.
 */

(function() {
  console.log('[AutoRefresh] Initializing 30-second auto-refresh engine...');

  // 1. Permanently unlock PRO / VIP capabilities
  try {
    Object.defineProperty(window, 'sil', { get: () => true, set: () => true, configurable: true });
    Object.defineProperty(window, 'sip', { get: () => true, set: () => true, configurable: true });
    Object.defineProperty(window, 'sim', { get: () => true, set: () => true, configurable: true });
  } catch(e) {
    window.sil = true;
    window.sip = true;
    window.sim = true;
  }

  window.isl = () => true;
  window.isp = () => true;
  window.ism = () => true;
  window.notlogged = () => false;
  window.Session = { user: { id: 'live-user', email: 'pro@mystox.com' } };

  // 2. Prevent duplicate heading / toolbar buttons from ever being appended
  function deduplicateHeaders() {
    const scripDropdowns = document.querySelectorAll('#headermain #_scrip');
    if (scripDropdowns.length > 1) {
      for (let i = 1; i < scripDropdowns.length; i++) {
        scripDropdowns[i].remove();
      }
    }
  }

  // Hook initmenu to prevent re-running buildmenu if toolbar already exists
  if (typeof window.initmenu === 'function') {
    const origInitMenu = window.initmenu;
    window.initmenu = function() {
      if (document.querySelector('#headermain #_scrip')) {
        deduplicateHeaders();
        return;
      }
      return origInitMenu.apply(this, arguments);
    };
  }

  const REFRESH_INTERVAL_SECONDS = 30;
  let countdown = REFRESH_INTERVAL_SECONDS;
  let isRefreshing = false;
  let countdownTimer = null;
  let autoRefreshEnabled = true;

  // 3. Main Refresh Routine
  async function performRefresh() {
    if (isRefreshing) return;
    isRefreshing = true;
    updateBadgeUI(true);

    const ts = Date.now();
    console.log(`[AutoRefresh] ${new Date().toLocaleTimeString()} - Calling live public endpoints...`);

    try {
      // Step A: Refresh live cash market ticks
      if (typeof window.fetchticks_stox === 'function') {
        try { window.fetchticks_stox(); } catch(e) {}
      }

      // Step B: Refresh stocks_today.json with latest prices, volume, VWAP, delivery, etc.
      if (typeof window.commonfolder !== 'undefined' && typeof window.getFile === 'function') {
        const stocksTodayUrl = window.commonfolder + 'stocks_today.json?e4=' + ts;
        window.getFile(stocksTodayUrl, function(data) {
          let items = data;
          if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch(e) {}
          }
          if (Array.isArray(items) && window.all_idx) {
            let updatedCount = 0;
            items.forEach(item => {
              if (item && item.symbol && window.all_idx[item.symbol]) {
                const target = window.all_idx[item.symbol];
                for (const prop in item) {
                  target[prop] = item[prop];
                }
                updatedCount++;
              }
            });
            console.log(`[AutoRefresh] Updated ${updatedCount} stocks from stocks_today.json`);
          }

          // Trigger live UI recalculations across all widgets and tables
          if (typeof window.tickupdate === 'function') {
            try { window.tickupdate(); } catch(e) {}
          }
          if (typeof window.updateindices === 'function') {
            try { window.updateindices(); } catch(e) {}
          }

          // Ensure header stays clean and single
          deduplicateHeaders();
        });
      }

      // Step C: If user has an active quote/symbol open, refresh it
      if (window.lastsym && typeof window.updatequote === 'function') {
        try { window.updatequote(window.lastsym); } catch(e) {}
      }

    } catch (err) {
      console.error('[AutoRefresh] Refresh encountered error:', err);
    } finally {
      deduplicateHeaders();
      setTimeout(() => {
        isRefreshing = false;
        countdown = REFRESH_INTERVAL_SECONDS;
        updateBadgeUI(false);
      }, 800);
    }
  }

  // 4. UI Badge in Top Bar
  function injectBadge() {
    if (document.getElementById('autorefresh-container')) return;

    const nav = document.querySelector('nav.menu');
    if (!nav) {
      setTimeout(injectBadge, 300);
      return;
    }

    const badge = document.createElement('div');
    badge.id = 'autorefresh-container';
    badge.className = 'autorefresh-container';
    badge.innerHTML = `
      <style>
        .autorefresh-container {
          display: flex;
          align-items: center;
          margin-left: 10px;
          margin-right: 10px;
          user-select: none;
        }
        .autorefresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(59, 130, 246, 0.5);
          color: #93c5fd;
          padding: 3px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          outline: none;
        }
        .autorefresh-btn:hover {
          background: rgba(30, 58, 138, 0.6);
          border-color: #60a5fa;
          color: #ffffff;
        }
        .autorefresh-icon {
          font-size: 15px !important;
          line-height: 1;
        }
        .autorefresh-icon.spinning {
          animation: autorefresh-spin 0.8s linear infinite;
        }
        @keyframes autorefresh-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .autorefresh-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 6px #10b981;
        }
        .autorefresh-dot.refreshing {
          background: #3b82f6;
          box-shadow: 0 0 8px #3b82f6;
        }
        .autorefresh-time {
          font-variant-numeric: tabular-nums;
          font-weight: 700;
          color: #38bdf8;
        }
      </style>
      <button id="autorefresh-btn" class="autorefresh-btn" title="30-second live auto-refresh active. Click to sync immediately.">
        <span class="autorefresh-dot" id="autorefresh-dot"></span>
        <i class="material-symbols-outlined autorefresh-icon" id="autorefresh-icon">sync</i>
        <span>Auto 30s</span>
        <span class="autorefresh-time" id="autorefresh-time">30s</span>
      </button>
    `;

    const user = document.getElementById('user');
    if (user) {
      nav.insertBefore(badge, user);
    } else {
      nav.appendChild(badge);
    }

    const btn = document.getElementById('autorefresh-btn');
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        countdown = 0;
        performRefresh();
      });
    }
  }

  function updateBadgeUI(refreshing) {
    const icon = document.getElementById('autorefresh-icon');
    const timeEl = document.getElementById('autorefresh-time');
    const dot = document.getElementById('autorefresh-dot');

    if (icon) {
      if (refreshing) {
        icon.classList.add('spinning');
      } else {
        icon.classList.remove('spinning');
      }
    }
    if (dot) {
      if (refreshing) {
        dot.classList.add('refreshing');
      } else {
        dot.classList.remove('refreshing');
      }
    }
    if (timeEl) {
      if (refreshing) {
        timeEl.textContent = 'Sync...';
      } else {
        timeEl.textContent = countdown + 's';
      }
    }
  }

  // 5. Timer loop
  function startTimers() {
    if (countdownTimer) clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      if (!autoRefreshEnabled) return;
      if (isRefreshing) return;

      countdown--;
      if (countdown <= 0) {
        countdown = REFRESH_INTERVAL_SECONDS;
        performRefresh();
      } else {
        updateBadgeUI(false);
      }
    }, 1000);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectBadge();
      startTimers();
      deduplicateHeaders();
    });
  } else {
    injectBadge();
    startTimers();
    deduplicateHeaders();
  }

  window.triggerAutoRefresh = performRefresh;
  console.log('[AutoRefresh] Auto-refresh every 30s loaded successfully.');
})();
