(() => {
  const siteDefault = {mode:'blacklist',blacklist:[],whitelist:[],blacklistUntil:{}};
  const windowDefault = {mode:'follow',x:24,y:24};
  function rule(value) {
    let raw = value.trim().toLowerCase();
    if (!raw) return null;
    if (raw === 'file://') return raw;
    let wildcard = raw.startsWith('*.');
    if (wildcard) raw = raw.slice(2);
    if (/[\s/?#:@]/.test(raw)) throw new Error(`请输入域名，不要包含协议、端口或路径：${value}`);
    const host = new URL('https://'+raw).hostname;
    if (!host || !/^[a-z0-9.-]+$/.test(host) || host.startsWith('.') || host.endsWith('.') || host.includes('..')) throw new Error(`无效域名：${value}`);
    return (wildcard ? '*.' : '') + host;
  }
  function parse(text) { return [...new Set(text.split(/\r?\n/).map(rule).filter(Boolean))]; }
  function matches(url, pattern) {
    if (pattern === 'file://') return url.protocol === 'file:';
    if (url.protocol === 'file:') return false;
    const host = url.hostname.toLowerCase().replace(/\.$/,'');
    const domain = pattern.replace(/^\*\./,'');
    return host === domain || host.endsWith('.'+domain);
  }
  function allowed(url, policy) {
    if (policy.mode === 'all') return true;
    if (policy.mode === 'whitelist') return policy.whitelist.some(item=>matches(url,item));
    return !policy.blacklist.some(item=>matches(url,item) && !(Number.isFinite(policy.blacklistUntil?.[item]) && policy.blacklistUntil[item] <= Date.now()));
  }
  globalThis.DictPreferences = {siteDefault,windowDefault,parse,allowed,matches};
})();
