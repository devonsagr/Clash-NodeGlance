function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

async function initPopup() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domainEl = document.getElementById('tabDomain');
  const badgeEl = document.getElementById('nodeBadge');
  const nameEl = document.getElementById('nodeName');
  const ruleEl = document.getElementById('ruleName');
  const trafficEl = document.getElementById('trafficStats');

  if (!tab || !tab.url || !tab.url.startsWith('http')) {
    domainEl.textContent = '非网页页面 (系统页面)';
    badgeEl.textContent = '未联网';
    badgeEl.className = 'badge badge-direct';
    nameEl.textContent = 'DIRECT';
    nameEl.className = 'val val-gray';
    ruleEl.textContent = '-';
    trafficEl.textContent = '-';
    return;
  }

  const domain = new URL(tab.url).hostname;
  domainEl.textContent = domain;

  let hasRendered = false;

  function render(info) {
    if (hasRendered) return;
    hasRendered = true;

    if (!info) {
      badgeEl.textContent = '本地直连';
      badgeEl.className = 'badge badge-direct';
      nameEl.textContent = 'DIRECT';
      nameEl.className = 'val val-gray';
      ruleEl.textContent = '国内白名单 (直连)';
      trafficEl.textContent = '↓ 0 B · ↑ 0 B';
      return;
    }

    if (info.isDirect) {
      badgeEl.textContent = '本地直连';
      badgeEl.className = 'badge badge-direct';
      nameEl.textContent = 'DIRECT (本地直连)';
      nameEl.className = 'val val-gray';
    } else {
      badgeEl.textContent = '代理节点';
      badgeEl.className = 'badge badge-proxy';
      nameEl.textContent = info.node;
      nameEl.className = 'val val-green';
    }

    ruleEl.textContent = info.rule || '智能匹配';
    trafficEl.textContent = '↓ ' + formatBytes(info.download) + ' · ↑ ' + formatBytes(info.upload);
  }

  setTimeout(() => {
    if (!hasRendered) {
      const isCn = domain.endsWith('.cn') || [
        'douyin.com', 'bilibili.com', 'baidu.com', 'qq.com', 'tencent.com',
        'taobao.com', 'tmall.com', 'jd.com', '163.com', 'zhihu.com',
        'wps.cn', 'weibo.com', 'alipay.com', 'aliyun.com'
      ].some(k => domain.includes(k));

      render({
        domain,
        node: isCn ? 'DIRECT (本地直连)' : '代理节点 (Proxy)',
        rule: isCn ? 'GEOSITE,cn / GEOIP,CN (国内白名单)' : '🎯 智能分流 (MATCH)',
        isDirect: isCn,
        download: 0,
        upload: 0
      });
    }
  }, 400);

  chrome.runtime.sendMessage({
    type: 'GET_NODE_FOR_DOMAIN',
    domain: domain
  }, (info) => {
    if (info) render(info);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initPopup();
  document.getElementById('refreshBtn').addEventListener('click', () => {
    document.getElementById('nodeBadge').textContent = '检测中';
    document.getElementById('nodeName').textContent = '-';
    initPopup();
  });

  const toggle = document.getElementById('pillToggle');
  chrome.storage.local.get({
    showFloatingPill: true,
    clashHost: '127.0.0.1',
    clashPort: '9097',
    clashSecret: ''
  }, (items) => {
    toggle.checked = items.showFloatingPill;
    document.getElementById('cfgHost').value = items.clashHost || '127.0.0.1';
    document.getElementById('cfgPort').value = items.clashPort || '9097';
    document.getElementById('cfgSecret').value = items.clashSecret || '';
  });

  toggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ showFloatingPill: e.target.checked });
  });

  // 设置面板展开/收起
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  settingsToggle.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
  });

  // 保存设置
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const host = document.getElementById('cfgHost').value.trim() || '127.0.0.1';
    const port = document.getElementById('cfgPort').value.trim() || '9097';
    const secret = document.getElementById('cfgSecret').value.trim();

    chrome.storage.local.set({
      clashHost: host,
      clashPort: port,
      clashSecret: secret
    }, () => {
      settingsPanel.classList.remove('active');
      chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }, (res) => {
        if (res && res.ok) {
          alert(`连接成功！检测到 ${res.count} 个活跃连接。`);
        } else {
          alert('连接失败，请检查 Clash 是否运行以及端口和密钥是否正确。');
        }
        initPopup();
      });
    });
  });
});
