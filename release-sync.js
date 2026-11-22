/* Release data is maintained by GitHub Actions; no visitor token is needed. */
(() => {
  'use strict';
  const source = 'https://raw.githubusercontent.com/TagMyAudio/TagMyAudio-Website/main/release-data.json';
  const keys = ['macarm', 'macintel', 'mackit', 'setup', 'portable', 'winkit', 'sources'];
  const labels = {
    en: ['Downloads of this version (applications only)', 'Snapshot', 'Release notes'],
    fr: ['Téléchargements de cette version (applications uniquement)', 'Relevé du', 'Notes de version'],
    es: ['Descargas de esta versión (solo aplicaciones)', 'Datos del', 'Notas de la versión'],
    it: ['Download di questa versione (solo applicazioni)', 'Dati del', 'Note di versione'],
    pt: ['Downloads desta versão (apenas aplicações)', 'Dados de', 'Notas da versão'],
    ru: ['Загрузки этой версии (только приложения)', 'Данные на', 'Примечания к выпуску'],
    ja: ['このバージョンのダウンロード数（アプリのみ）', '集計日時', 'リリースノート'],
    hi: ['इस संस्करण के डाउनलोड (केवल ऐप्लिकेशन)', 'आँकड़ों की तारीख', 'रिलीज़ नोट्स'],
    zh: ['此版本的下载次数（仅应用程序）', '统计时间', '发行说明'],
    ko: ['이 버전의 다운로드 수(앱만)', '집계 시각', '릴리스 노트'],
    id: ['Unduhan versi ini (hanya aplikasi)', 'Data per', 'Catatan rilis'],
    tr: ['Bu sürümün indirilme sayısı (yalnızca uygulamalar)', 'Veri tarihi', 'Sürüm notları']
  };
  let current = null;
  let refreshingCounts = false;
  function valid(data) {
    if (data?.schema !== 1 || !/^\d+\.\d+\.\d+$/.test(data.version) || !Number.isFinite(Date.parse(data.updated_at))) return false;
    const expected = new RegExp('^https://github\\.com/TagMyAudio/TagMyAudio/releases/download/v?' + data.version.replaceAll('.', '\\.') + '/TagMyAudio-');
    if (!/^https:\/\/github\.com\/TagMyAudio\/TagMyAudio\/releases\/tag\/v?\d+\.\d+\.\d+$/.test(data.release_url)) return false;
    return keys.every(key => {
      const a = data.assets?.[key];
      return a && expected.test(a.url) && /^[a-f0-9]{64}$/.test(a.sha256) && Number.isSafeInteger(a.downloads) && a.downloads >= 0;
    });
  }
  function render() {
    if (!current) return;
    const lang = document.documentElement.lang || 'en';
    const text = labels[lang] || labels.en;
    document.querySelectorAll('[data-release-version]').forEach(el => { el.textContent = current.version; });
    keys.forEach(key => {
      const heading = document.querySelector('.download-item h4[data-i18n="' + key + '"]');
      if (!heading) return;
      const item = heading.closest('.download-item');
      item.querySelector('a.btn').href = current.assets[key].url;
      item.querySelector('.sha').textContent = current.assets[key].sha256;
    });
    document.querySelectorAll('.download-card').forEach((card, i) => {
      const pair = i === 0 ? ['macarm', 'macintel'] : ['setup', 'portable'];
      const count = pair.reduce((sum, k) => sum + current.assets[k].downloads, 0);
      const number = card.querySelector('.download-count span');
      number.removeAttribute('aria-hidden');
      number.textContent = new Intl.NumberFormat(lang).format(count);
      card.querySelector('.download-count').title = text[0];
    });
  }
  async function read(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {signal: controller.signal, credentials:'omit'});
      if (!response.ok) throw new Error('Release snapshot unavailable');
      const data = await response.json();
      if (!valid(data)) throw new Error('Invalid release snapshot');
      return data;
    } finally { clearTimeout(timeout); }
  }
  async function refreshCounts() {
    if (!current || refreshingCounts || document.hidden) return;
    refreshingCounts = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('https://api.github.com/repos/TagMyAudio/TagMyAudio/releases/tags/' + current.release_url.split('/').pop(), {
        signal: controller.signal, credentials: 'omit', cache: 'no-store',
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!response.ok) throw new Error('Live counts unavailable');
      const release = await response.json();
      if (release.html_url !== current.release_url || !Array.isArray(release.assets)) throw new Error('Unexpected release');
      const counts = {};
      for (const key of keys) {
        const asset = release.assets.find(a => a.browser_download_url === current.assets[key].url);
        if (!asset || !Number.isSafeInteger(asset.download_count) || asset.download_count < 0) throw new Error('Invalid live count');
        counts[key] = asset.download_count;
      }
      for (const key of keys) current.assets[key].downloads = counts[key];
      render();
    } catch {
      // Retain the last known counts if GitHub is unavailable or rate-limited.
    } finally {
      clearTimeout(timeout);
      refreshingCounts = false;
    }
  }
  document.addEventListener('tagmyaudio:language', render);
  read(source).catch(() => read('release-data.json')).then(data => { current = data; render(); void refreshCounts(); }).catch(() => {
    // Keep the reviewed HTML links and hashes. Unknown counts remain a dash, never a fabricated zero.
  });
  setInterval(() => { void refreshCounts(); }, 5 * 60 * 1000);
})();
