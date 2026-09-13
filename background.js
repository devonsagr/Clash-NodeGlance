// Clash 节点实时雷达 - Background Service Worker

const DEFAULT_CONFIG = {
  clashHost: '127.0.0.1',
  clashPort: '9097', // 默认 Clash Verge / Mihomo 常用端口，CFW 通常为 9090
  clashSecret: '',    // 默认空密码，可在扩展设置中填写
  showFloatingPill: true
};

const domainCache = new Map();

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_CONFIG, (items) => {
      resolve(items || DEFAULT_CONFIG);
    });
  });
}

// 请求 Clash /connections 接口
async function fetchConnections() {
  try {
    const config = await getConfig();
    const portsToTry = [config.clashPort, '9097', '9090'];
    const uniquePorts = [...new Set(portsToTry.filter(Boolean))];

    for (const port of uniquePorts) {
      try {
        const url = `http://${config.clashHost}:${port}/connections`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1200);
        const headers = {};
        if (config.clashSecret) {
          headers['Authorization'] = `Bearer ${config.clashSecret}`;
        }
        const resp = await fetch(url, {
          signal: controller.signal,
          headers
        });
        clearTimeout(timer);
        if (resp.ok) {
          // 如果默认端口不同，自动更新为可用端口
          if (port !== config.clashPort) {
            chrome.storage.local.set({ clashPort: port });
          }
          return await resp.json();
        }
      } catch (e) {}
    }
    return null;
  } catch (err) {
    return null;
  }
}

// 核心：解析指定域名走哪个节点
async function resolveNodeForDomain(domain) {
  if (!domain) {
    return { node: '未知', chains: ['DIRECT'], rule: '未知', isDirect: true, upload: 0, download: 0 };
  }
  domain = domain.toLowerCase().trim();

  // 1. 查询当前实时活跃连接
  const data = await fetchConnections();
  if (data && Array.isArray(data.connections)) {
    const match = data.connections.find(c => {
      const host = (c.metadata?.host || c.metadata?.destinationIP || '').toLowerCase();
      return host === domain || host.endsWith('.' + domain) || domain.endsWith('.' + host);
    });

    if (match) {
      const chains = match.chains || [];
      const isDirect = chains.includes('DIRECT') || chains.length === 0;
      const finalNode = isDirect ? 'DIRECT (本地直连)' : (chains[0] || '未知节点');
      const rule = match.rule || 'Match';

      const info = {
        domain,
        node: finalNode,
        chains,
        rule,
        isDirect,
        upload: match.upload || 0,
        download: match.download || 0,
        timestamp: Date.now()
      };
      domainCache.set(domain, info);
      return info;
    }
  }

  // 2. 查询近期缓存 (10分钟内有效)
  if (domainCache.has(domain)) {
    const cached = domainCache.get(domain);
    if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
      return cached;
    }
  }

  // 3. 智能推断判断 (通用规则)
  const isCn = domain.endsWith('.cn') || [
    'douyin.com', 'bilibili.com', 'baidu.com', 'qq.com', 'tencent.com',
    'taobao.com', 'tmall.com', 'jd.com', '163.com', 'zhihu.com',
    'wps.cn', 'weibo.com', 'alipay.com', 'aliyun.com', 'feishu.cn', 'bytedance.net'
  ].some(k => domain.includes(k));

  if (isCn) {
    const directInfo = {
      domain,
      node: 'DIRECT (本地直连)',
      chains: ['DIRECT'],
      rule: 'GEOSITE,cn / GEOIP,CN (国内直连)',
      isDirect: true,
      upload: 0,
      download: 0,
      timestamp: Date.now()
    };
    domainCache.set(domain, directInfo);
    return directInfo;
  }

  // 海外未知站 -> 默认代理出口
  const defaultProxy = {
    domain,
    node: '代理节点 (Proxy)',
    chains: ['代理节点', 'MATCH'],
    rule: '🎯 规则兜底 / 海外分流 (MATCH)',
    isDirect: false,
    upload: 0,
    download: 0,
    timestamp: Date.now()
  };
  domainCache.set(domain, defaultProxy);
  return defaultProxy;
}

// 更新工具栏角标与国家/地区识别
async function updateBadge(tabId, url) {
  if (!url || !url.startsWith('http')) {
    try {
      chrome.action.setBadgeText({ text: '', tabId });
    } catch(e) {}
    return;
  }

  try {
    const domain = new URL(url).hostname;
    const info = await resolveNodeForDomain(domain);
    if (!info) return;

    let badgeText = '1X';
    let badgeColor = '#059669';

    if (info.isDirect) {
      badgeText = '直';
      badgeColor = '#6B7280';
    } else {
      const nodeName = info.node.toLowerCase();
      if (nodeName.includes('台湾') || nodeName.includes('tw') || nodeName.includes('hinet') || nodeName.includes('taiwan')) {
        badgeText = 'TW';
        badgeColor = '#059669';
      } else if (nodeName.includes('香港') || nodeName.includes('hk') || nodeName.includes('hongkong')) {
        badgeText = 'HK';
        badgeColor = '#2563EB';
      } else if (nodeName.includes('日本') || nodeName.includes('jp') || nodeName.includes('japan') || nodeName.includes('tokyo')) {
        badgeText = 'JP';
        badgeColor = '#EC4899';
      } else if (nodeName.includes('美国') || nodeName.includes('us') || nodeName.includes('united states') || nodeName.includes('america')) {
        badgeText = 'US';
        badgeColor = '#7C3AED';
      } else if (nodeName.includes('新加坡') || nodeName.includes('sg') || nodeName.includes('singapore')) {
        badgeText = 'SG';
        badgeColor = '#0891B2';
      } else if (nodeName.includes('韩国') || nodeName.includes('kr') || nodeName.includes('korea')) {
        badgeText = 'KR';
        badgeColor = '#EA580C';
      } else if (nodeName.includes('英国') || nodeName.includes('uk') || nodeName.includes('london')) {
        badgeText = 'UK';
        badgeColor = '#4F46E5';
      } else {
        badgeText = '代理';
        badgeColor = '#059669';
      }
    }

    chrome.action.setBadgeText({ text: badgeText, tabId });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
    chrome.action.setTitle({
      title: `${domain}\n出站链路: ${info.node}\n命中规则: ${info.rule}`,
      tabId
    });
  } catch (e) {}
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      updateBadge(activeInfo.tabId, tab.url);
    }
  } catch(e) {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab && tab.url) {
    updateBadge(tabId, tab.url);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_NODE_FOR_DOMAIN') {
    resolveNodeForDomain(request.domain)
      .then(res => sendResponse(res))
      .catch(() => {
        sendResponse({
          domain: request.domain,
          node: 'DIRECT (本地直连)',
          chains: ['DIRECT'],
          rule: '智能匹配',
          isDirect: true,
          upload: 0,
          download: 0
        });
      });
    return true;
  }

  if (request.type === 'TEST_CONNECTION') {
    fetchConnections().then(data => {
      sendResponse({ ok: !!data, count: data ? (data.connections || []).length : 0 });
    }).catch(() => sendResponse({ ok: false, count: 0 }));
    return true;
  }
});
