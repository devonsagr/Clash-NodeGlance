// Clash 节点实时雷达 - Content Script
(function() {
  if (window !== window.top) return;

  const currentDomain = window.location.hostname;
  if (!currentDomain) return;

  chrome.storage.local.get({ showFloatingPill: true }, (settings) => {
    if (!settings.showFloatingPill) return;
    initFloatingPill();
  });

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  function initFloatingPill() {
    const hostEl = document.createElement('div');
    hostEl.id = '__clash_node_radar_host__';
    document.documentElement.appendChild(hostEl);

    const shadow = hostEl.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .pill-wrapper {
        position: relative;
        user-select: none;
      }
      .pill {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 6px 14px;
        background: rgba(15, 23, 42, 0.88);
        color: #F8FAFC;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 9999px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .pill:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
        background: rgba(15, 23, 42, 0.96);
        border-color: rgba(255, 255, 255, 0.25);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .dot.proxy {
        background: #10B981;
        box-shadow: 0 0 8px #10B981;
        animation: pulse 2s infinite;
      }
      .dot.direct {
        background: #94A3B8;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .node-name {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .detail-card {
        position: absolute;
        bottom: 40px;
        right: 0;
        width: 270px;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 14px;
        padding: 12px 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(16px);
        display: none;
        flex-direction: column;
        gap: 8px;
        font-size: 11px;
        color: #94A3B8;
      }
      .detail-card.active {
        display: flex;
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 6px;
      }
      .card-title {
        font-weight: 600;
        color: #F8FAFC;
        font-size: 12px;
        max-width: 210px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .close-btn {
        cursor: pointer;
        color: #94A3B8;
        font-size: 14px;
        line-height: 1;
        padding: 2px 4px;
        border-radius: 4px;
      }
      .close-btn:hover {
        color: #F8FAFC;
        background: rgba(255, 255, 255, 0.1);
      }
      .card-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .val-bold {
        color: #F8FAFC;
        font-weight: 600;
        text-align: right;
        max-width: 170px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .val-green {
        color: #34D399;
      }
    `;
    shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'pill-wrapper';

    wrapper.innerHTML = `
      <div class="pill" id="pillBtn" title="点击查看详细路由信息">
        <span class="dot proxy" id="pillDot"></span>
        <span class="node-name" id="pillText">探测中...</span>
      </div>
      <div class="detail-card" id="detailCard">
        <div class="card-header">
          <span class="card-title">${currentDomain}</span>
          <span class="close-btn" id="closeCardBtn">&times;</span>
        </div>
        <div class="card-row">
          <span>出站链路</span>
          <span class="val-bold val-green" id="cardNode">探测中...</span>
        </div>
        <div class="card-row">
          <span>匹配规则</span>
          <span class="val-bold" id="cardRule">-</span>
        </div>
        <div class="card-row">
          <span>流量传输</span>
          <span class="val-bold" id="cardTraffic">↓ 0 B · ↑ 0 B</span>
        </div>
      </div>
    `;
    shadow.appendChild(wrapper);

    const pillBtn = shadow.getElementById('pillBtn');
    const pillDot = shadow.getElementById('pillDot');
    const pillText = shadow.getElementById('pillText');
    const detailCard = shadow.getElementById('detailCard');
    const closeCardBtn = shadow.getElementById('closeCardBtn');
    const cardNode = shadow.getElementById('cardNode');
    const cardRule = shadow.getElementById('cardRule');
    const cardTraffic = shadow.getElementById('cardTraffic');

    pillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      detailCard.classList.toggle('active');
    });

    closeCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      detailCard.classList.remove('active');
    });

    document.addEventListener('click', () => {
      detailCard.classList.remove('active');
    });

    function updateNodeInfo() {
      chrome.runtime.sendMessage({
        type: 'GET_NODE_FOR_DOMAIN',
        domain: currentDomain
      }, (info) => {
        if (!info) return;

        if (info.isDirect) {
          pillDot.className = 'dot direct';
          pillText.textContent = '⚡ 直连 DIRECT';
          cardNode.textContent = 'DIRECT (本地直连)';
          cardNode.className = 'val-bold';
        } else {
          pillDot.className = 'dot proxy';
          pillText.textContent = info.node;
          cardNode.textContent = info.node;
          cardNode.className = 'val-bold val-green';
        }

        cardRule.textContent = info.rule || '智能匹配';
        const downStr = formatBytes(info.download);
        const upStr = formatBytes(info.upload);
        cardTraffic.textContent = '↓ ' + downStr + ' · ↑ ' + upStr;
      });
    }

    updateNodeInfo();
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateNodeInfo();
      }
    }, 3000);
  }
})();
