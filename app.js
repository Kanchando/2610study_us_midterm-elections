/**
 * アメリカ政治とキリスト教思想史 - SPA アプリケーション
 * インフォグラフィック、SVG散布図、投票バーチャート、系統図プレビュー搭載
 */

(function () {
  'use strict';

  let D = null; // data.json
  let currentTab = 'current';
  let partiesSubTab = 'realignment';
  let standalonePartyTab = 'dem'; // 'dem' または 'gop' // 'realignment' または 'presidents'
  let presidentFilter = 'all'; // 'all', 'featured', 'gop', 'dem', 'other'
  let keypersonFilter = 'all'; // 'all', 'admin', 'tech', 'religion', 'allies'

  // DOM要素
  const app = document.getElementById('app');
  const topbarTitle = document.getElementById('topbar-title');
  const sheetBackdrop = document.getElementById('sheet-backdrop');
  const sheet = document.getElementById('sheet');
  const sheetTitle = document.getElementById('sheet-title');
  const sheetContent = document.getElementById('sheet-content');
  const sheetClose = document.getElementById('sheet-close');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // データ取得
  async function loadData() {
    // 1. data.js で window.SITE_DATA が読み込まれている場合は即座に使用（file:// 起動でも100%確実に動作）
    if (window.SITE_DATA) {
      D = window.SITE_DATA;
      setupGlobalSearch();
    route();
      return;
    }

    // 2. HTTP サーバー環境での fetch フォールバック
    try {
      const res = await fetch('data.json?v=' + Date.now());
      if (!res.ok) throw new Error('Failed to load data.json');
      D = await res.json();
      route();
    } catch (err) {
      console.error(err);
      app.innerHTML = `
        <div style="padding: 40px 20px; text-align: center;">
          <h2 style="font-family: var(--serif); margin-bottom: 10px;">データを読み込めませんでした</h2>
          <p style="color: var(--muted); font-size: 14px;">ブラウザの再読み込みをお試しいただくか、ローカルサーバー経由でアクセスしてください。</p>
        </div>
      `;
    }
  }

  // ルーティング
  function route() {
    if (!D) return;
    const hash = window.location.hash.replace(/^#\/?/, '');
    const validTabs = ['study', 'current', 'parties', 'religion', 'keypersons', 'glossary', 'deepdives', 'presidents'];
    
    if (hash === 'presidents') {
      currentTab = 'parties';
      partiesSubTab = 'presidents';
    } else if (validTabs.includes(hash)) {
      currentTab = hash;
    } else {
      currentTab = 'study'; // 勉強会進行台本をデフォルトに
    }

    tabBtns.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      btn.classList.toggle('active', tab === currentTab);
    });

    window.scrollTo(0, 0);
    closeSheet();

    switch (currentTab) {
      case 'study':
        renderStudyAgenda();
        break;
      case 'current':
        renderCurrent();
        break;
      case 'parties':
        renderParties();
        break;
      case 'religion':
        renderReligion();
        break;
      case 'keypersons':
        renderKeypersons();
        break;
      case 'glossary':
        renderGlossary();
        break;
      case 'deepdives':
        renderDeepdives();
        break;
    }
  }

  // =========================================================================
  // キリスト教3大系統（カトリック・プロテスタント・東方正教会）比較コンポーネント
  // =========================================================================
  function renderThreeBranchesComparison() {
    const tb = D.christianity_three_branches;
    if (!tb) return '';

    return `
      <section class="christianity-comparison-section">
        <div class="section-head" style="margin-bottom: 12px;">
          <span class="section-eyebrow">TRIPARTITE COMPARISON</span>
          <h2 class="section-title" style="font-size: 18px;">${tb.title}</h2>
          <p class="section-lead" style="font-size: 13px;">${tb.subtitle}</p>
        </div>

        <!-- 共通点ハイライトカード（全系統が共有する4大教理） -->
        <div class="common-doctrines-card">
          <div class="common-doctrines-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            ${tb.commonalities_heading}
          </div>
          <p class="common-doctrines-lead">${tb.commonalities_lead}</p>
          <div class="common-doctrines-grid">
            ${tb.commonalities.map(c => `
              <div class="common-doctrine-item">
                <div class="common-doctrine-title">
                  <span>${c.icon}</span>
                  <span>${c.title}</span>
                </div>
                <p class="common-doctrine-desc">${c.detail}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3大学統のヘッダーカード -->
        <div class="branches-header-grid">
          ${tb.branches.map(b => `
            <div class="branch-hero-card ${b.accent_class}">
              <div>
                <div class="branch-hero-meta-row">
                  <span class="branch-hero-badge ${b.accent_class}">${b.badge}</span>
                  <span class="branch-hero-origin-tag">${b.origin.split(' ')[0]}</span>
                </div>
                <div class="branch-hero-title-row">
                  <span class="branch-hero-icon">${b.icon}</span>
                  <span class="branch-hero-name ${b.accent_class}">${b.name}</span>
                </div>
                <div class="branch-hero-origin">${b.origin}</div>
                <p class="branch-hero-essence">${b.essence}</p>
              </div>
              <div class="branch-hero-pop">
                <div style="font-size: 12px; font-weight: 800; color: var(--navy);">全米信徒：${b.us_pop}</div>
                <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">世界規模：${b.global_pop}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 比較対照テーブル（スクロール可能） -->
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
          <span style="font-size: 13px; font-weight: 800; color: var(--navy);">【決定的な相違点：6大対立軸マトリックス】</span>
          <span style="font-size: 11px; color: var(--muted); font-weight: 600;">横スクロールで全体比較 →</span>
        </div>
        <div class="compare-table-wrap">
          <table class="compare-table">
            <thead>
              <tr>
                <th style="width: 130px;">比較項目</th>
                <th style="color: #7C3AED;">🏛️ ローマ・カトリック</th>
                <th style="color: #B45309;">📖 プロテスタント諸派</th>
                <th style="color: #047857;">☦️ 東方正教会</th>
              </tr>
            </thead>
            <tbody>
              ${tb.comparison_rows.map(row => `
                <tr>
                  <td class="compare-category-cell">
                    <div class="compare-cat-title">${row.category}</div>
                    <div class="compare-cat-sub">${row.question}</div>
                  </td>
                  <td class="compare-col-catholic">
                    <div class="compare-cell-title catholic">● ${row.catholic.headline}</div>
                    ${row.catholic.bullets && row.catholic.bullets.length > 0 ? `
                      <ul class="compare-cell-bullets">
                        ${row.catholic.bullets.map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    ` : `<p class="compare-cell-text">${row.catholic.text || ''}</p>`}
                  </td>
                  <td class="compare-col-protestant">
                    <div class="compare-cell-title protestant">● ${row.protestant.headline}</div>
                    ${row.protestant.bullets && row.protestant.bullets.length > 0 ? `
                      <ul class="compare-cell-bullets">
                        ${row.protestant.bullets.map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    ` : `<p class="compare-cell-text">${row.protestant.text || ''}</p>`}
                  </td>
                  <td class="compare-col-orthodox">
                    <div class="compare-cell-title orthodox">● ${row.orthodox.headline}</div>
                    ${row.orthodox.bullets && row.orthodox.bullets.length > 0 ? `
                      <ul class="compare-cell-bullets">
                        ${row.orthodox.bullets.map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    ` : `<p class="compare-cell-text">${row.orthodox.text || ''}</p>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  // =========================================================================
  // トランプ政権 人物相関図（インタラクティブ・ネットワークダイアグラム）
  // =========================================================================
  function renderTrumpRelationshipNetwork() {
    const net = D.trump_relationship_network;
    if (!net) return '';

    return `
      <section class="trump-network-section">
        <div class="section-head" style="margin-bottom: 12px;">
          <span class="section-eyebrow">RELATIONSHIP NETWORK MAP</span>
          <h2 class="section-title" style="font-size: 18.5px;">${net.title}</h2>
          <p class="section-lead" style="font-size: 13px;">${net.subtitle}（人物ノードをタップで4項目詳細を表示）</p>
        </div>

        <div class="trump-network-card">
          <div class="trump-network-svg-wrap">
            <svg class="trump-network-svg" viewBox="0 0 660 520" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- 背景セクター区切り -->
              <rect x="10" y="10" width="310" height="235" rx="14" fill="rgba(220, 38, 38, 0.03)" stroke="rgba(220, 38, 38, 0.15)" stroke-dasharray="4"/>
              <text x="25" y="32" font-size="11" font-weight="800" fill="#DC2626">【政権中枢・実務参謀】</text>

              <rect x="340" y="10" width="310" height="235" rx="14" fill="rgba(124, 58, 237, 0.03)" stroke="rgba(124, 58, 237, 0.15)" stroke-dasharray="4"/>
              <text x="625" y="32" text-anchor="end" font-size="11" font-weight="800" fill="#7C3AED">【テック資本・リバタリアン】</text>

              <rect x="10" y="275" width="310" height="235" rx="14" fill="rgba(5, 150, 105, 0.03)" stroke="rgba(5, 150, 105, 0.15)" stroke-dasharray="4"/>
              <text x="25" y="497" font-size="11" font-weight="800" fill="#059669">【大衆動員・同盟・MAHA】</text>

              <rect x="340" y="275" width="310" height="235" rx="14" fill="rgba(217, 119, 6, 0.03)" stroke="rgba(217, 119, 6, 0.15)" stroke-dasharray="4"/>
              <text x="625" y="497" text-anchor="end" font-size="11" font-weight="800" fill="#D97706">【キリスト教右派・信仰局・議会】</text>

              <!-- 関係線（トランプから各ノードへ） -->
              <!-- Vance (330, 95) -->
              <line x1="330" y1="260" x2="330" y2="120" stroke="#DC2626" stroke-width="2.5"/>
              <rect x="290" y="170" width="80" height="18" rx="4" fill="var(--card)" stroke="#DC2626" stroke-width="1"/>
              <text x="330" y="182" text-anchor="middle" font-size="9" font-weight="700" fill="#DC2626">後継指名・忠誠</text>

              <!-- Wiles (200, 110) -->
              <line x1="330" y1="260" x2="200" y2="110" stroke="#B91C1C" stroke-width="2"/>
              <rect x="215" y="175" width="76" height="18" rx="4" fill="var(--card)" stroke="#B91C1C" stroke-width="1"/>
              <text x="253" y="187" text-anchor="middle" font-size="8.5" font-weight="700" fill="#B91C1C">首席補佐官</text>

              <!-- Vought (110, 190) -->
              <line x1="330" y1="260" x2="110" y2="190" stroke="#991B1B" stroke-width="2"/>
              <rect x="155" y="220" width="84" height="18" rx="4" fill="var(--card)" stroke="#991B1B" stroke-width="1"/>
              <text x="197" y="232" text-anchor="middle" font-size="8.5" font-weight="700" fill="#991B1B">Project 2025</text>

              <!-- Musk (460, 110) -->
              <line x1="330" y1="260" x2="460" y2="110" stroke="#7C3AED" stroke-width="2.5"/>
              <rect x="375" y="165" width="76" height="18" rx="4" fill="var(--card)" stroke="#7C3AED" stroke-width="1"/>
              <text x="413" y="177" text-anchor="middle" font-size="8.5" font-weight="700" fill="#7C3AED">DOGE・献金</text>

              <!-- Thiel (550, 190) -->
              <line x1="330" y1="260" x2="550" y2="190" stroke="#6D28D9" stroke-width="2"/>
              <rect x="425" y="215" width="84" height="18" rx="4" fill="var(--card)" stroke="#6D28D9" stroke-width="1"/>
              <text x="467" y="227" text-anchor="middle" font-size="8.5" font-weight="700" fill="#6D28D9">思想的黒幕</text>

              <!-- White (530, 340) -->
              <line x1="330" y1="260" x2="530" y2="340" stroke="#D97706" stroke-width="2.5"/>
              <rect x="415" y="295" width="86" height="18" rx="4" fill="var(--card)" stroke="#D97706" stroke-width="1"/>
              <text x="458" y="307" text-anchor="middle" font-size="8.5" font-weight="700" fill="#D97706">信仰局・霊的助言</text>

              <!-- Johnson (450, 430) -->
              <line x1="330" y1="260" x2="450" y2="430" stroke="#B45309" stroke-width="2"/>
              <rect x="375" y="335" width="76" height="18" rx="4" fill="var(--card)" stroke="#B45309" stroke-width="1"/>
              <text x="413" y="347" text-anchor="middle" font-size="8.5" font-weight="700" fill="#B45309">下院議長・防波堤</text>

              <!-- Hegseth (330, 440) -->
              <line x1="330" y1="260" x2="330" y2="440" stroke="#92400E" stroke-width="2"/>
              <rect x="290" y="345" width="80" height="18" rx="4" fill="var(--card)" stroke="#92400E" stroke-width="1"/>
              <text x="330" y="357" text-anchor="middle" font-size="8.5" font-weight="700" fill="#92400E">国防長官・脱WOKE</text>

              <!-- RFK Jr (210, 430) -->
              <line x1="330" y1="260" x2="210" y2="430" stroke="#059669" stroke-width="2"/>
              <rect x="220" y="335" width="84" height="18" rx="4" fill="var(--card)" stroke="#059669" stroke-width="1"/>
              <text x="262" y="347" text-anchor="middle" font-size="8.5" font-weight="700" fill="#059669">MAHA・保健福祉</text>

              <!-- Carlson (120, 350) -->
              <line x1="330" y1="260" x2="120" y2="350" stroke="#047857" stroke-width="2"/>
              <rect x="155" y="295" width="80" height="18" rx="4" fill="var(--card)" stroke="#047857" stroke-width="1"/>
              <text x="195" y="307" text-anchor="middle" font-size="8.5" font-weight="700" fill="#047857">世論扇動・孤立主義</text>

              <!-- Kushner (95, 270) -->
              <line x1="330" y1="260" x2="95" y2="270" stroke="#065F46" stroke-width="2"/>
              <rect x="145" y="260" width="80" height="18" rx="4" fill="var(--card)" stroke="#065F46" stroke-width="1"/>
              <text x="185" y="272" text-anchor="middle" font-size="8.5" font-weight="700" fill="#065F46">家族・中東政策</text>

              <!-- 人物相互の点線関係 -->
              <!-- Vance <-> Thiel (師弟) -->
              <path d="M330 95 C 430 40, 520 120, 550 190" stroke="#7C3AED" stroke-width="1.8" stroke-dasharray="5" fill="none"/>
              <rect x="420" y="65" width="88" height="16" rx="4" fill="#7C3AED"/>
              <text x="464" y="76" text-anchor="middle" font-size="8" font-weight="800" fill="#fff">師弟・巨額政治資金</text>

              <!-- Thiel <-> Musk (PayPal) -->
              <line x1="550" y1="190" x2="460" y2="110" stroke="#6D28D9" stroke-width="1.5" stroke-dasharray="4"/>
              <rect x="495" y="145" width="68" height="16" rx="4" fill="#6D28D9"/>
              <text x="529" y="156" text-anchor="middle" font-size="7.5" font-weight="800" fill="#fff">旧PayPal同盟</text>

              <!-- White <-> Johnson (福音派) -->
              <line x1="530" y1="340" x2="450" y2="430" stroke="#D97706" stroke-width="1.5" stroke-dasharray="4"/>
              <rect x="480" y="385" width="68" height="16" rx="4" fill="#D97706"/>
              <text x="514" y="396" text-anchor="middle" font-size="7.5" font-weight="800" fill="#fff">福音派ネットワーク</text>

              <!-- ノード描画（外側人物） -->
              <!-- Vance (330, 95) -->
              <g class="network-node-g" data-kp-id="vance">
                <circle cx="330" cy="95" r="26" fill="#DC2626" stroke="#fff" stroke-width="2.5"/>
                <text x="330" y="99" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">Vance</text>
                <text x="330" y="132" text-anchor="middle" font-size="11" font-weight="800" fill="var(--ink)">JD・バンス</text>
                <text x="330" y="144" text-anchor="middle" font-size="9" fill="var(--muted)">副大統領</text>
              </g>

              <!-- Wiles (200, 110) -->
              <g class="network-node-g" data-kp-id="wiles">
                <circle cx="200" cy="110" r="24" fill="#B91C1C" stroke="#fff" stroke-width="2"/>
                <text x="200" y="114" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">Wiles</text>
                <text x="200" y="144" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">S・ワイルズ</text>
                <text x="200" y="155" text-anchor="middle" font-size="8.5" fill="var(--muted)">首席補佐官</text>
              </g>

              <!-- Vought (110, 190) -->
              <g class="network-node-g" data-kp-id="vought">
                <circle cx="110" cy="190" r="24" fill="#991B1B" stroke="#fff" stroke-width="2"/>
                <text x="110" y="194" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">Vought</text>
                <text x="110" y="224" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">R・ヴォート</text>
                <text x="110" y="235" text-anchor="middle" font-size="8.5" fill="var(--muted)">予算管理局長</text>
              </g>

              <!-- Musk (460, 110) -->
              <g class="network-node-g" data-kp-id="musk">
                <circle cx="460" cy="110" r="25" fill="#7C3AED" stroke="#fff" stroke-width="2.5"/>
                <text x="460" y="114" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">Musk</text>
                <text x="460" y="144" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">E・マスク</text>
                <text x="460" y="155" text-anchor="middle" font-size="8.5" fill="var(--muted)">DOGE・最大献金</text>
              </g>

              <!-- Thiel (550, 190) -->
              <g class="network-node-g" data-kp-id="thiel">
                <circle cx="550" cy="190" r="25" fill="#6D28D9" stroke="#fff" stroke-width="2.5"/>
                <text x="550" y="194" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">Thiel</text>
                <text x="550" y="224" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">P・ティール</text>
                <text x="550" y="235" text-anchor="middle" font-size="8.5" fill="var(--muted)">思想的黒幕</text>
              </g>

              <!-- White (530, 340) -->
              <g class="network-node-g" data-kp-id="white">
                <circle cx="530" cy="340" r="24" fill="#D97706" stroke="#fff" stroke-width="2"/>
                <text x="530" y="344" text-anchor="middle" font-size="10.5" font-weight="800" fill="#fff">White</text>
                <text x="530" y="374" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">P・ホワイト</text>
                <text x="530" y="385" text-anchor="middle" font-size="8.5" fill="var(--muted)">信仰局長・牧師</text>
              </g>

              <!-- Johnson (450, 430) -->
              <g class="network-node-g" data-kp-id="johnson">
                <circle cx="450" cy="430" r="24" fill="#B45309" stroke="#fff" stroke-width="2"/>
                <text x="450" y="434" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">Johnson</text>
                <text x="450" y="464" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">M・ジョンソン</text>
                <text x="450" y="475" text-anchor="middle" font-size="8.5" fill="var(--muted)">下院議長</text>
              </g>

              <!-- Hegseth (330, 440) -->
              <g class="network-node-g" data-kp-id="hegseth">
                <circle cx="330" cy="440" r="24" fill="#92400E" stroke="#fff" stroke-width="2"/>
                <text x="330" y="444" text-anchor="middle" font-size="9.5" font-weight="800" fill="#fff">Hegseth</text>
                <text x="330" y="474" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">P・ヘグセス</text>
                <text x="330" y="485" text-anchor="middle" font-size="8.5" fill="var(--muted)">国防長官</text>
              </g>

              <!-- RFK Jr (210, 430) -->
              <g class="network-node-g" data-kp-id="rfk_jr">
                <circle cx="210" cy="430" r="24" fill="#059669" stroke="#fff" stroke-width="2"/>
                <text x="210" y="434" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">RFK Jr</text>
                <text x="210" y="464" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">RFK・ジュニア</text>
                <text x="210" y="475" text-anchor="middle" font-size="8.5" fill="var(--muted)">保健福祉長官</text>
              </g>

              <!-- Carlson (120, 350) -->
              <g class="network-node-g" data-kp-id="carlson">
                <circle cx="120" cy="350" r="24" fill="#047857" stroke="#fff" stroke-width="2"/>
                <text x="120" y="354" text-anchor="middle" font-size="10" font-weight="800" fill="#fff">Tucker</text>
                <text x="120" y="384" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">T・カールソン</text>
                <text x="120" y="395" text-anchor="middle" font-size="8.5" fill="var(--muted)">メディア言論人</text>
              </g>

              <!-- Kushner (95, 270) -->
              <g class="network-node-g" data-kp-id="kushner">
                <circle cx="95" cy="270" r="23" fill="#065F46" stroke="#fff" stroke-width="2"/>
                <text x="95" y="274" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">Kushner</text>
                <text x="95" y="303" text-anchor="middle" font-size="10.5" font-weight="800" fill="var(--ink)">J・クシュナー</text>
                <text x="95" y="314" text-anchor="middle" font-size="8.5" fill="var(--muted)">娘婿・中東政策</text>
              </g>

              <!-- 中心ノード：ドナルド・J・トランプ (330, 260) -->
              <g class="network-node-g" data-kp-id="trump">
                <circle cx="330" cy="260" r="46" fill="#DC2626" stroke="#F59E0B" stroke-width="4" class="network-center-circle"/>
                <text x="330" y="254" text-anchor="middle" font-size="18">👑</text>
                <text x="330" y="272" text-anchor="middle" font-size="12.5" font-weight="900" fill="#fff">TRUMP</text>
                <text x="330" y="318" text-anchor="middle" font-size="13" font-weight="900" fill="var(--navy)">ドナルド・J・トランプ</text>
                <text x="330" y="331" text-anchor="middle" font-size="10" font-weight="700" fill="#B45309">第45代・第47代合衆国大統領</text>
              </g>
            </svg>
          </div>

          <!-- クラスター解説グリッド -->
          <div class="network-clusters-grid">
            ${net.clusters.map(cl => `
              <div class="network-cluster-box" style="border-top-color: ${cl.color};">
                <div class="network-cluster-title" style="color: ${cl.color};">
                  ● ${cl.name}
                </div>
                <div class="network-cluster-actors">
                  ${cl.actors.map(ac => `
                    <div class="network-actor-row" data-kp-id="${ac.id}">
                      <div>
                        <strong>${ac.name}</strong>
                        <span style="font-size: 10px; color: var(--muted); margin-left: 4px;">(${ac.role.split(' / ')[0]})</span>
                      </div>
                      <span class="card-badge" style="font-size: 9.5px; padding: 1px 5px;">${ac.relation_to_trump.split('・')[0]}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // =========================================================================
  // 共通詳細ボトムシート（4項目構造化モーダル）
  // =========================================================================
  function openShiftStageSheet(st) {
    if (!st) return;
    const formatPartyText = (txt) => {
      if (!txt) return '';
      return txt
        .replace(/民主党/g, '<strong class="text-dem">民主党</strong>')
        .replace(/共和党/g, '<strong class="text-gop">共和党</strong>');
    };

    openSheet(st.year + '：' + (st.title || '南北支持の逆転史'), `
      <div class="info-box" style="margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">【この時代の対立構図】</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
          <span class="shift-badge-south ${st.south_side || 'gop'}" style="font-size: 11px; padding: 3px 8px;">南部：${st.south}</span>
          <span class="shift-badge-north ${st.north_side || 'dem'}" style="font-size: 11px; padding: 3px 8px;">北部・全米：${st.north}</span>
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: var(--ink);">${st.summary_html || st.summary}</div>
      </div>

      <!-- 1. 概要 -->
      <div class="detail-section">
        <h4 class="detail-heading">
          <span class="detail-num-badge">1</span>
          概要
        </h4>
        <p class="detail-text">${formatPartyText(st.overview || st.summary)}</p>
      </div>

      <!-- 2. 背景・何が発生したのか -->
      <div class="detail-section">
        <h4 class="detail-heading">
          <span class="detail-num-badge">2</span>
          背景・何が発生したのか（支持逆転の力学）
        </h4>
        <p class="detail-text" style="white-space: pre-line;">${formatPartyText(st.background || '')}</p>
      </div>

      <!-- 3. 主導人物と思想 -->
      <div class="detail-section">
        <h4 class="detail-heading">
          <span class="detail-num-badge">3</span>
          主導人物と思想
        </h4>
        <div class="detail-text" style="white-space: pre-line;">${formatPartyText(st.key_actors || '')}</div>
      </div>

      <!-- 4. 現代社会への影響 -->
      <div class="detail-section">
        <h4 class="detail-heading">
          <span class="detail-num-badge">4</span>
          現代社会・政党構造への決定的影響
        </h4>
        <div class="detail-text" style="white-space: pre-line;">${formatPartyText(st.impact || '')}</div>
      </div>
    `);
  }

  function openPresidentSheet(p) {
    if (!p) return;
    const initials = p.en_name.split(' ').map(w => w[0]).join('').slice(0, 3);
    openSheet('第' + p.number + '代：' + p.name, `
      <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px;">
        <div class="president-avatar-wrap" style="width: 60px; height: 60px;">
          ${p.image ? `
            <img class="president-avatar-img" src="${p.image}" alt="${p.name}">
          ` : `
            <div class="president-avatar-placeholder ${p.party_type}" style="font-size: 17px;">${initials}</div>
          `}
        </div>
        <div>
          <div style="font-size: 13px; font-weight: 700; color: var(--muted);">${p.en_name}（${p.years}）</div>
          <div style="display: flex; gap: 6px; margin-top: 4px; align-items: center; flex-wrap: wrap;">
            <span class="president-party-badge ${p.party_type}" style="font-size: 11.5px; padding: 2px 8px;">${p.party}</span>
            ${p.featured ? '<span class="featured-badge" style="font-size: 10.5px; margin: 0;">★ 歴史的巨人</span>' : ''}
          </div>
        </div>
      </div>

      <div class="info-box" style="margin-bottom: 16px;">
        <strong>在任中の主要政策・業績：</strong><br>${p.policy}<br>
        <strong style="margin-top: 6px; display: inline-block;">議会との関係・ねじれ：</strong><br>${p.congress}
      </div>

      <!-- 1. 概要 -->
      <div class="detail-section">
        <h4 class="detail-heading">
          <span class="detail-num-badge">1</span>
          概要
        </h4>
        <p class="detail-text">${p.overview}</p>
      </div>

      <!-- 2. 背景 -->
      <div class="detail-section">
        <h4 class="detail-heading">
          <span class="detail-num-badge">2</span>
          歴史的背景・政権誕生の経緯
        </h4>
        <p class="detail-text">${p.background}</p>
      </div>

      <!-- 3. 思想と主要政策 -->
      <div class="detail-section">
        <h4 class="detail-heading">
          <span class="detail-num-badge">3</span>
          思想と主要政策
        </h4>
        <div class="detail-text" style="white-space: pre-line;">${p.ideology}</div>
      </div>

      <!-- 4. 現代社会への影響 -->
      <div class="detail-section">
        <h4 class="detail-heading">
          <span class="detail-num-badge">4</span>
          現代社会への影響
        </h4>
        <div class="detail-text" style="white-space: pre-line;">${p.impact}</div>
      </div>
    `);
  }

  function openKeyPersonSheet(p) {
    if (!p) return;
    openSheet(p.name + '（' + p.title + '）', `
      <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
        <div class="person-avatar" style="width: 72px; height: 72px; font-size: 22px; flex-shrink: 0;">
          ${p.image ? `<img src="${p.image}" alt="${p.name}">` : (p.avatar || '人')}
        </div>
        <div>
          <div class="card-badge" style="display:inline-block; margin-bottom: 4px;">${p.category}</div>
          <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">${p.en_name || ''}</div>
          <div style="font-size: 12.5px; color: var(--navy); font-weight: 600;">${(p.tags || []).join(' / ')}</div>
        </div>
      </div>
      <div class="info-box" style="margin-bottom: 18px;">
        <strong>役割・政治的位置づけ：</strong><br>${p.bio}
      </div>
      <div class="detail-section">
        <h4 class="detail-heading"><span class="detail-num-badge">1</span>概要</h4>
        <p class="detail-text">${p.overview || p.bio}</p>
      </div>
      <div class="detail-section">
        <h4 class="detail-heading"><span class="detail-num-badge">2</span>背景</h4>
        <p class="detail-text">${p.background || ''}</p>
      </div>
      <div class="detail-section">
        <h4 class="detail-heading"><span class="detail-num-badge">3</span>思想と政治的立ち位置</h4>
        <div class="detail-text" style="white-space: pre-line;">${p.ideology || ''}</div>
      </div>
      <div class="detail-section">
        <h4 class="detail-heading"><span class="detail-num-badge">4</span>現代社会への影響</h4>
        <div class="detail-text" style="white-space: pre-line;">${p.impact || ''}</div>
      </div>
    `);
  }

  // =========================================================================
  // タブ⓪：勉強会レジュメ（論点展開モード）
  // =========================================================================
  function renderStudyAgenda() {
    topbarTitle.textContent = '勉強会レジュメ';
    const sa = D.study_agenda;
    if (!sa || !sa.parts) return;

    let html = `
      <!-- 勉強会概要ヘッダー -->
      <div class="study-hero">
        <div class="study-hero-meta">
          <span class="study-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            ${sa.format_info || '3人座談会・ゼミ形式'}
          </span>
        </div>
        <h1 style="font-family: var(--serif); font-size: 20px; font-weight: 900; color: var(--navy); margin-bottom: 6px; line-height: 1.35;">
          ${sa.title}
        </h1>
        <div style="font-size: 13.5px; font-weight: 700; color: #B45309; margin-bottom: 10px;">
          ${sa.subtitle}
        </div>
        <p style="font-size: 13px; color: var(--ink); line-height: 1.6; margin: 0; background: var(--card); padding: 12px 14px; border-radius: 10px; border: 1px solid var(--line);">
          ${sa.overview_text}
        </p>
      </div>

      <!-- 現代アメリカの「4つの謎」（ビジュアルインフォグラフィックカード） -->
      <section class="puzzles-section">
        <div class="section-head" style="margin-bottom: 8px;">
          <span class="section-eyebrow">PUZZLES TO SOLVE</span>
          <h2 class="section-title" style="font-size: 18px;">現代アメリカの「4つの謎」</h2>
          <p class="section-lead" style="font-size: 12.5px;">タップすると、なぜその現象が起きているのか背景と歴史的ルーツを深掘りできます。</p>
        </div>
        <div class="puzzles-grid">
          <!-- 謎①：トランプ×福音派 -->
          <div class="puzzle-visual-card" data-puzzle-target="part3">
            <div class="puzzle-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v12M9 9h6"></path>
                <path d="M7 16l5-3 5 3"></path>
              </svg>
            </div>
            <div class="puzzle-content">
              <div class="puzzle-card-head">
                <div class="puzzle-title">謎① なぜ敬虔とは言えないトランプが、福音派の8割に熱烈支持されるのか？</div>
                <span class="puzzle-badge">深掘り</span>
              </div>
              <p class="puzzle-desc">私生活や言動がキリスト教の模範とは言えないトランプが、なぜ敬虔な信徒たちの絶対的支持を集めるのか。その背後にある『取引と保護』の力学。</p>
            </div>
          </div>

          <!-- 謎②：福音派の正体・宗派分岐 -->
          <div class="puzzle-visual-card" data-puzzle-target="part1">
            <div class="puzzle-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <path d="M12 6v7M9.5 9h5"></path>
              </svg>
            </div>
            <div class="puzzle-content">
              <div class="puzzle-card-head">
                <div class="puzzle-title">謎② そもそも「福音派」とは何か？ カトリックや正教会、他の宗派と何が違うのか？</div>
                <span class="puzzle-badge">深掘り</span>
              </div>
              <p class="puzzle-desc">ニュースで頻出する『福音派』とは単一の教会名なのか？ キリスト教2000年の歴史の中でどう位置づけられ、なぜ白人と黒人で投票先が真逆になるのか。</p>
            </div>
          </div>

          <!-- 謎③：テクノリバタリアン合流 -->
          <div class="puzzle-visual-card" data-puzzle-target="part3">
            <div class="puzzle-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="4" y="4" width="16" height="16" rx="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"></path>
              </svg>
            </div>
            <div class="puzzle-content">
              <div class="puzzle-card-head">
                <div class="puzzle-title">謎③ なぜトランプ政権にピーター・ティール率いる「テクノリバタリアン」が合流したのか？</div>
                <span class="puzzle-badge">深掘り</span>
              </div>
              <p class="puzzle-desc">シリコンバレーの先端ハイテク資本と、MAGA（反エリート・製造業労働者）という水と油に見える勢力がなぜ手を結び、JD・バンスを副大統領に押し上げたのか。</p>
            </div>
          </div>

          <!-- 謎④：信仰局・中東 -->
          <div class="puzzle-visual-card" data-puzzle-target="part3">
            <div class="puzzle-icon-wrap">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <div class="puzzle-content">
              <div class="puzzle-card-head">
                <div class="puzzle-title">謎④ なぜホワイトハウスに『信仰局』が置かれ、イスラエル絶対支援と対イラン戦争へ向かうのか？</div>
                <span class="puzzle-badge">深掘り</span>
              </div>
              <p class="puzzle-desc">政権内部に宗教機構が公式に組み込まれ、中東での過激な軍事作戦が『キリストの復活』や『善と悪の戦い』として正当化される背景にある終末論と同盟の力学。</p>
            </div>
          </div>
        </div>
      </section>

      <!-- パート別の論点展開カード -->
      ${sa.parts.map((part, pIdx) => `
        <article class="study-section-card" id="study-part-${part.id}">
          <div class="study-step-header">
            <span class="study-step-tag">${part.number}（${part.time}）</span>
            <span class="study-step-time">Session ${pIdx + 1} / ${sa.parts.length}</span>
          </div>

          <h2 style="font-family: var(--serif); font-size: 18px; font-weight: 800; color: var(--ink); margin-bottom: 6px; line-height: 1.4;">
            ${part.title}
          </h2>
          <div style="font-size: 13px; font-weight: 700; color: var(--navy); margin-bottom: 14px;">
            ${part.lead}
          </div>

          <!-- ① 箇条書き要点サマリー（全セクション共通） -->
          ${part.summary_bullets && part.summary_bullets.length > 0 ? `
            <div class="summary-bullets-card">
              <div class="summary-bullets-head">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                3分でわかる核心要点サマリー
              </div>
              <ul class="summary-bullets-list">
                ${part.summary_bullets.map(bullet => `<li>${bullet}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Part 1 専用図解：キリスト教2000年 系統分岐マップ（SVGフロー） -->
          ${part.id === 'part1' ? `
            <div class="diagram-canvas-card">
              <div class="diagram-header">
                <div class="diagram-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M6 9a9 9 0 0 1 9 9"></path></svg>
                  キリスト教2000年の全体構造における福音派の立ち位置
                </div>
                <span class="diagram-subtitle">教派ではなく「横断的運動」</span>
              </div>
              <div class="svg-diagram-wrap">
                <svg class="svg-diagram" viewBox="0 0 460 210" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- 1世紀 原始キリスト教 -->
                  <rect x="10" y="80" width="90" height="42" rx="8" fill="var(--tint)" stroke="var(--navy)" stroke-width="1.5"/>
                  <text x="55" y="98" text-anchor="middle" font-size="10" font-weight="700" fill="var(--navy)">1世紀</text>
                  <text x="55" y="112" text-anchor="middle" font-size="11" font-weight="800" fill="var(--ink)">原始キリスト教</text>

                  <!-- 分岐線 -->
                  <path d="M100 101 L140 101" stroke="var(--line)" stroke-width="2"/>
                  <path d="M140 101 L140 45 L170 45" stroke="var(--line)" stroke-width="2"/>
                  <path d="M140 101 L140 150 L170 150" stroke="var(--line)" stroke-width="2"/>

                  <!-- 東方正教会 -->
                  <rect x="170" y="26" width="100" height="38" rx="8" fill="var(--soft)" stroke="var(--line)" stroke-width="1.5"/>
                  <text x="220" y="42" text-anchor="middle" font-size="9" fill="var(--muted)">1054年 東西分裂</text>
                  <text x="220" y="55" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">東方正教会</text>

                  <!-- ローマ・カトリック -->
                  <rect x="170" y="131" width="100" height="38" rx="8" fill="var(--soft)" stroke="var(--line)" stroke-width="1.5"/>
                  <text x="220" y="147" text-anchor="middle" font-size="9" fill="var(--muted)">西方教会</text>
                  <text x="220" y="160" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">ローマ・カトリック</text>

                  <!-- 宗教改革 分岐 -->
                  <path d="M270 150 L295 150 L295 110 L315 110" stroke="var(--line)" stroke-width="2"/>
                  <path d="M295 150 L295 185 L315 185" stroke="var(--line)" stroke-width="2"/>

                  <!-- プロテスタント主流派 -->
                  <rect x="315" y="92" width="135" height="36" rx="8" fill="var(--soft)" stroke="var(--line)" stroke-width="1.5"/>
                  <text x="382" y="106" text-anchor="middle" font-size="9" fill="var(--muted)">1517年 宗教改革</text>
                  <text x="382" y="120" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--ink)">主流派（長老・聖公会等）</text>

                  <!-- 福音派（ハイライト） -->
                  <rect x="315" y="166" width="135" height="40" rx="8" fill="rgba(217, 119, 6, 0.12)" stroke="#D97706" stroke-width="2"/>
                  <text x="382" y="181" text-anchor="middle" font-size="9" font-weight="700" fill="#B45309">諸教派を横断する大衆運動</text>
                  <text x="382" y="196" text-anchor="middle" font-size="12" font-weight="900" fill="#B45309">★ 福音派 (約6,000万人)</text>
                </svg>
              </div>
            </div>

            <!-- キリスト教3大系統（カトリック・プロテスタント・東方正教会）共通点・相違点 比較表 -->
            ${renderThreeBranchesComparison()}

            <!-- Part 1 専用図解：ベビントン・クアドラングル（4原則マトリックス SVG） -->
            <div class="diagram-canvas-card">
              <div class="diagram-header">
                <div class="diagram-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line><line x1="3" y1="12" x2="21" y2="12"></line></svg>
                  デイヴィッド・ベビントン（英歴史学者）の4原則マトリックス
                </div>
                <span class="diagram-subtitle">Bebbington Quadrilateral</span>
              </div>
              <div class="svg-diagram-wrap">
                <svg class="svg-diagram" viewBox="0 0 440 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- 中央の結びつき菱形 -->
                  <polygon points="220,25 380,110 220,195 60,110" fill="rgba(27, 42, 74, 0.03)" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4"/>
                  
                  <!-- 上：聖書信仰 -->
                  <circle cx="220" cy="30" r="22" fill="#2563EB" fill-opacity="0.12" stroke="#2563EB" stroke-width="2"/>
                  <text x="220" y="35" text-anchor="middle" font-size="14">📖</text>
                  <text x="220" y="65" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--ink)">聖書信仰（ビビリズム）</text>
                  <text x="220" y="78" text-anchor="middle" font-size="9" fill="var(--muted)">判断の絶対基準・聖書無誤性</text>

                  <!-- 右：十字架中心 -->
                  <circle cx="370" cy="110" r="22" fill="#DC2626" fill-opacity="0.12" stroke="#DC2626" stroke-width="2"/>
                  <text x="370" y="115" text-anchor="middle" font-size="14">✝️</text>
                  <text x="370" y="145" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--ink)">十字架中心</text>
                  <text x="370" y="158" text-anchor="middle" font-size="9" fill="var(--muted)">贖罪の恩恵・一括肩代わり</text>

                  <!-- 下：回心主義 -->
                  <circle cx="220" cy="180" r="22" fill="#D97706" fill-opacity="0.12" stroke="#D97706" stroke-width="2"/>
                  <text x="220" y="185" text-anchor="middle" font-size="14">⚡</text>
                  <text x="220" y="145" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--ink)">回心主義（ボーン・アゲイン）</text>
                  <text x="220" y="132" text-anchor="middle" font-size="9" fill="var(--muted)">個人の劇的な生まれ変わり体験</text>

                  <!-- 左：行動主義 -->
                  <circle cx="70" cy="110" r="22" fill="#059669" fill-opacity="0.12" stroke="#059669" stroke-width="2"/>
                  <text x="70" y="115" text-anchor="middle" font-size="14">📢</text>
                  <text x="70" y="145" text-anchor="middle" font-size="11.5" font-weight="800" fill="var(--ink)">行動主義（アクティビズム）</text>
                  <text x="70" y="158" text-anchor="middle" font-size="9" fill="var(--muted)">社会宣教・最強の集票動員</text>

                  <!-- 中心バッジ -->
                  <rect x="180" y="96" width="80" height="28" rx="6" fill="var(--navy)"/>
                  <text x="220" y="114" text-anchor="middle" font-size="10.5" font-weight="800" fill="#fff">福音派の核</text>
                </svg>
              </div>

              <!-- エディトリアル解説カード（4原則の詳細展開） -->
              <div class="bebbington-editorial-grid">
                ${(part.bebbington_detailed || []).map((beb, bIdx) => `
                  <div class="beb-card">
                    <div class="beb-head">
                      <div class="beb-num">${bIdx + 1}</div>
                      <div class="beb-title-box">
                        <div class="beb-name">${beb.name}</div>
                        <div class="beb-en">${beb.tag}</div>
                      </div>
                    </div>
                    <div class="beb-catch">「${beb.catch.replace(/^[「『]|[」』]$/g, '')}」</div>
                    <div class="beb-metaphor">
                      <strong>【日常の例え】：</strong>${beb.metaphor.replace(/^【日本人的な例え】：/, '')}
                    </div>
                    <div style="font-size: 12.5px; line-height: 1.6; color: var(--ink); margin-bottom: 8px;">
                      ${beb.explanation}
                    </div>
                    <div class="beb-impact">
                      <strong>【政治・トランプ支持への直結】：</strong><br>${beb.political_impact.replace(/^【[^】]+】：\n?/, '')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Part 2 専用図解：南北二大政党 180度逆転シーソーダイアグラム（SVG） -->
          ${part.id === 'part2' ? `
            <div class="diagram-canvas-card">
              <div class="diagram-header">
                <div class="diagram-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path></svg>
                  二大政党 支持基盤の180度大逆転（シーソー図解）
                </div>
                <span class="diagram-subtitle">1860年 ⇄ 1980年〜現代</span>
              </div>
              <div class="svg-diagram-wrap">
                <svg class="svg-diagram" viewBox="0 0 440 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- 1860年代の構図 -->
                  <rect x="20" y="20" width="180" height="55" rx="8" fill="var(--soft)" stroke="var(--line)" stroke-width="1.5"/>
                  <text x="110" y="36" text-anchor="middle" font-size="10" font-weight="800" fill="var(--navy)">【1860年代 南北戦争期】</text>
                  <text x="30" y="52" font-size="10.5" font-weight="700" fill="#DC2626">共和党 (リンカン)</text>
                  <text x="125" y="52" font-size="9.5" fill="var(--muted)">＝ 北部・黒人解放</text>
                  <text x="30" y="66" font-size="10.5" font-weight="700" fill="#2563EB">民主党</text>
                  <text x="75" y="66" font-size="9.5" fill="var(--muted)">＝ 南部白人支配・人種隔離</text>

                  <!-- 現代の構図 -->
                  <rect x="240" y="20" width="180" height="55" rx="8" fill="var(--soft)" stroke="var(--line)" stroke-width="1.5"/>
                  <text x="330" y="36" text-anchor="middle" font-size="10" font-weight="800" fill="var(--navy)">【1980年〜2026年 現代】</text>
                  <text x="250" y="52" font-size="10.5" font-weight="700" fill="#DC2626">共和党 (トランプ)</text>
                  <text x="345" y="52" font-size="9.5" fill="var(--muted)">＝ 南部白人・福音派</text>
                  <text x="250" y="66" font-size="10.5" font-weight="700" fill="#2563EB">民主党</text>
                  <text x="295" y="66" font-size="9.5" fill="var(--muted)">＝ 北部・西海岸・リベラル</text>

                  <!-- 逆転の矢印 -->
                  <path d="M190 85 C220 70, 220 110, 250 95" stroke="#B45309" stroke-width="3" stroke-linecap="round"/>
                  <polygon points="252,90 258,97 248,102" fill="#B45309"/>

                  <!-- 転換のトリガー帯 -->
                  <rect x="40" y="115" width="360" height="50" rx="8" fill="rgba(217, 119, 6, 0.08)" stroke="#D97706" stroke-width="1.5"/>
                  <text x="220" y="132" text-anchor="middle" font-size="10.5" font-weight="800" fill="#B45309">逆転を起こした2大エポック</text>
                  <text x="220" y="147" text-anchor="middle" font-size="10" fill="var(--ink)">① 1964年 公民権法：民主党が黒人権利保障 → 南部白人が離脱</text>
                  <text x="220" y="159" text-anchor="middle" font-size="10" fill="var(--ink)">② 1979年 モラル・マジョリティ：中絶反対・伝統家族で福音派が共和党へ結集</text>
                </svg>
              </div>
            </div>

            <!-- Part 2 専用：南北支持逆転史 5時代インタラクティブタイムライン -->
            <div style="margin: 20px 0 16px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                <div style="font-size: 13.5px; font-weight: 800; color: var(--navy); display: flex; align-items: center; gap: 6px;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
                  南北支持の逆転史（白人南部の民主党離反プロセス・全6ステージ）
                </div>
                <span style="font-size: 11px; color: var(--muted); font-weight: 600;">各時代をタップで詳細表示</span>
              </div>
              <div class="shift-card" style="margin-bottom: 0;">
                ${(D.north_south_shift && D.north_south_shift.stages ? D.north_south_shift.stages : []).map((st, sIdx) => {
                  const sSide = st.south_side || 'gop';
                  const nSide = st.north_side || 'dem';
                  return `
                  <div class="shift-stage" data-shift-idx="${sIdx}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                      <div class="shift-year" style="margin: 0; font-size: 13.5px; font-weight: 800;">${st.year}：${st.title || ''}</div>
                      <span class="card-badge" style="font-size: 10px; padding: 2px 7px; background: rgba(27, 42, 74, 0.08); color: var(--navy);">詳細タップ →</span>
                    </div>
                    <div class="shift-bars">
                      <span class="shift-badge-south ${sSide}">南部：${st.south}</span>
                      <span class="shift-badge-north ${nSide}">北部・全米：${st.north}</span>
                    </div>
                    <p style="font-size: 12.5px; color: var(--ink); line-height: 1.55; margin: 0;">${st.summary_html || st.summary}</p>
                  </div>
                `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Part 3 専用図解：トランプ×白人福音派「ギブ・アンド・テイク」取引構造図（SVG） -->
          ${part.id === 'part3' ? `
            <div class="diagram-canvas-card">
              <div class="diagram-header">
                <div class="diagram-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><path d="M16 12l-4-4-4 4M12 8v8"></path></svg>
                  トランプ大統領 × 白人福音派「ギブ・アンド・テイク」取引構造
                </div>
                <span class="diagram-subtitle">神のブルドーザー「キュロス王理論」</span>
              </div>
              <div class="svg-diagram-wrap">
                <svg class="svg-diagram" viewBox="0 0 440 205" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- 白人福音派（左） -->
                  <rect x="15" y="25" width="130" height="135" rx="10" fill="var(--tint)" stroke="var(--navy)" stroke-width="1.5"/>
                  <text x="80" y="45" text-anchor="middle" font-size="13" font-weight="800" fill="var(--navy)">白人福音派</text>
                  <text x="80" y="60" text-anchor="middle" font-size="9" fill="var(--muted)">有権者の約15〜20%</text>
                  <rect x="25" y="75" width="110" height="75" rx="6" fill="var(--card)"/>
                  <text x="80" y="92" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--ink)">【差し出すもの】</text>
                  <text x="80" y="108" text-anchor="middle" font-size="9" fill="var(--ink)">● 鉄の岩盤支持票</text>
                  <text x="80" y="122" text-anchor="middle" font-size="9" fill="var(--ink)">● 教会動員ネットワーク</text>
                  <text x="80" y="136" text-anchor="middle" font-size="9" fill="var(--ink)">● 巨額の献金と熱狂</text>

                  <!-- 取引の双方向矢印 -->
                  <!-- 上矢印（票田） -->
                  <path d="M150 65 L275 65" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
                  <polygon points="275,60 285,65 275,70" fill="#2563EB"/>
                  <text x="215" y="55" text-anchor="middle" font-size="9.5" font-weight="800" fill="#2563EB">80%超の圧倒的投票 ▶</text>

                  <!-- 下矢印（公約実現） -->
                  <path d="M285 115 L160 115" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
                  <polygon points="160,110 150,115 160,120" fill="#DC2626"/>
                  <text x="220" y="132" text-anchor="middle" font-size="9.5" font-weight="800" fill="#DC2626">◀ 最高裁保守化・中絶破棄</text>

                  <!-- トランプ政権（右） -->
                  <rect x="290" y="25" width="135" height="135" rx="10" fill="rgba(220, 38, 38, 0.06)" stroke="#DC2626" stroke-width="1.5"/>
                  <text x="357" y="45" text-anchor="middle" font-size="13" font-weight="800" fill="#DC2626">ドナルド・トランプ</text>
                  <text x="357" y="60" text-anchor="middle" font-size="9" fill="var(--muted)">第45代・第47代大統領</text>
                  <rect x="298" y="75" width="118" height="75" rx="6" fill="var(--card)"/>
                  <text x="357" y="92" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--ink)">【提供する成果】</text>
                  <text x="357" y="108" text-anchor="middle" font-size="8.5" fill="var(--ink)">① 最高裁ドブス判決(中絶破棄)</text>
                  <text x="357" y="122" text-anchor="middle" font-size="8.5" fill="var(--ink)">② エルサレム首都認定</text>
                  <text x="357" y="136" text-anchor="middle" font-size="8.5" fill="var(--ink)">③ ホワイトハウス信仰局設置</text>

                  <!-- キュロス王バナー -->
                  <rect x="15" y="168" width="410" height="28" rx="6" fill="var(--navy)"/>
                  <text x="220" y="186" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">
                    神学的正当化：品行方正な聖人ではなく、リベラルと戦う「神の選んだ闘士（キュロス王）」
                  </text>
                </svg>
              </div>
            </div>
          ` : ''}

          <!-- ② 論点別サマリー（トップ画面は箇条書き・タップで骨太な詳細文章モーダルを展開） -->
          ${part.details && part.details.length > 0 ? `
            <div class="details-wrapper">
              <div class="details-wrapper-head">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                各論点の核心サマリー（タップで骨太な詳細解説を展開）
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${part.details.map((d, dIdx) => `
                  <div class="detail-block" data-part-idx="${pIdx}" data-detail-idx="${dIdx}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                      <div class="detail-block-title">${d.title}</div>
                      <span class="card-badge" style="font-size: 10px; padding: 2px 7px; background: rgba(27, 42, 74, 0.08); color: var(--navy); flex-shrink: 0;">詳細解説</span>
                    </div>
                    ${d.summary_bullets && d.summary_bullets.length > 0 ? `
                      <ul class="detail-block-summary-list">
                        ${d.summary_bullets.map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    ` : (d.body ? `<p style="font-size: 13px; color: var(--ink); margin: 8px 0; line-height: 1.6;">${d.body}</p>` : '')}
                    <div class="detail-expand-cta">
                      <span>詳細な論点文章を読む（${d.detailed_sections ? d.detailed_sections.length : 3}項目）</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : (part.points ? `
            <div class="details-wrapper">
              <div class="details-wrapper-head">【詳細解説】</div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${part.points.map(pt => `
                  <div class="detail-block">
                    <div class="detail-block-title">${pt.head}</div>
                    <p class="detail-block-text">${pt.body}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '')}

          <!-- 関連詳細へのワンタップジャンプ・深掘りボタン -->
          ${part.links && part.links.length > 0 ? `
            <div class="action-links-wrap">
              <div style="font-size: 11.5px; font-weight: 800; color: var(--muted); margin-bottom: 2px;">
                この論点に関連する詳細アーカイブ（タップで移動 / 表示）
              </div>
              ${part.links.map(lk => `
                <button class="action-jump-btn" type="button" 
                  data-link-type="${lk.type}" 
                  data-link-tab="${lk.tab || ''}"
                  data-link-target="${lk.target || ''}"
                  data-link-id="${lk.id || ''}"
                  data-link-num="${lk.num !== undefined ? lk.num : ''}"
                  data-link-idx="${lk.idx !== undefined ? lk.idx : ''}">
                  <span>${lk.title}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              `).join('')}
            </div>
          ` : ''}
        </article>
      `).join('')}
    `;

    app.innerHTML = html;

    // 深掘りアクションボタンのクリックイベント
    app.querySelectorAll('.action-jump-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-link-type');
        const tab = btn.getAttribute('data-link-tab');
        const target = btn.getAttribute('data-link-target');
        const id = btn.getAttribute('data-link-id');
        const num = btn.getAttribute('data-link-num');
        const idx = btn.getAttribute('data-link-idx');

        if (type === 'jump' && tab) {
          window.location.hash = '#/' + tab;
        } else if (type === 'glossary') {
          if (id) {
            window.openGlossaryModalById(id);
          } else {
            window.location.hash = '#/glossary';
          }
        } else if (type === 'tree_modal') {
          openSheet('キリスト教の系統図（拡大）', `
            <div style="text-align: center; margin-bottom: 12px;">
              <img src="assets/christianity-tree.jpg" alt="キリスト教の系統図" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow);">
            </div>
            <p style="font-size: 13px; color: var(--muted); line-height: 1.6;">
              <strong>【系統図の読み解き方】</strong><br>
              ・1世紀：初期キリスト教から5世紀のカルケドン公会議で非カルケドン派正教会が分離。<br>
              ・1054年/1204年：西方のカトリック教会（教皇集権）と東方の東方正教会（地域独立合議制）へ大分裂。<br>
              ・1517年以降：宗教改革によりルター派、改革派・長老派、聖公会、再洗礼派、バプテスト、メソジストが誕生。<br>
              ・黄色帯の「福音派」は独立した教派ではなく、これら諸教派にまたがる横断的な信仰運動。
            </p>
          `);
        } else if (type === 'stage_modal' && idx !== '') {
          const stg = (D.christianity_history || [])[parseInt(idx, 10)];
          if (stg) {
            openSheet(`${stg.period}：${stg.stage}`, `
              ${stg.featured ? '<div style="margin-bottom: 12px;"><span class="featured-badge" style="font-size: 11px; padding: 3px 9px;">★ 現代アメリカ政治を動かす最重要転換期</span></div>' : ''}
              <div class="info-box" style="margin-bottom: 20px;">
                <strong>歴史的意義：</strong><br>${stg.significance}
              </div>
              <div class="detail-section">
                <h4 class="detail-heading"><span class="detail-num-badge">1</span>概要</h4>
                <p class="detail-text">${stg.overview || ''}</p>
              </div>
              <div class="detail-section">
                <h4 class="detail-heading"><span class="detail-num-badge">2</span>背景</h4>
                <p class="detail-text">${stg.background || ''}</p>
              </div>
              <div class="detail-section">
                <h4 class="detail-heading"><span class="detail-num-badge">3</span>中心人物とその思想</h4>
                <div class="detail-text" style="white-space: pre-line;">${stg.figures || ''}</div>
              </div>
              <div class="detail-section">
                <h4 class="detail-heading"><span class="detail-num-badge">4</span>現代社会への影響</h4>
                <div class="detail-text" style="white-space: pre-line;">${stg.impact || ''}</div>
              </div>
            `);
          }
        } else if (type === 'party_modal' && idx !== '') {
          const item = (D.party_history || [])[parseInt(idx, 10)];
          if (item) {
            openSheet(`${item.era}：${item.name}`, `
              ${item.featured ? `<div style="margin-bottom: 12px;"><span class="featured-badge ${item.dominant_side || 'gop'}" style="font-size: 11px; padding: 3px 9px;">★ アメリカ政党史の最重要転換点（${item.dominant_party}）</span></div>` : ''}
              <div class="info-box" style="margin-bottom: 20px;">
                <strong>この時代の本質的な対立軸：</strong><br>${item.conflict}
              </div>
              <div class="detail-section">
                <h4 class="detail-heading"><span class="detail-num-badge">1</span>概要</h4>
                <p class="detail-text">${item.overview || item.conflict}</p>
              </div>
              <div class="detail-section">
                <h4 class="detail-heading"><span class="detail-num-badge">2</span>背景</h4>
                <p class="detail-text">${item.background || ''}</p>
              </div>
              <div class="detail-section">
                <h4 class="detail-heading"><span class="detail-num-badge">3</span>中心人物とその思想</h4>
                <div class="detail-text" style="white-space: pre-line;">${item.figures || ''}</div>
              </div>
              <div class="detail-section">
                <h4 class="detail-heading"><span class="detail-num-badge">4</span>現代社会への影響</h4>
                <div class="detail-text" style="white-space: pre-line;">${item.impact || ''}</div>
              </div>
            `);
          }
        } else if (type === 'modal' && target === 'pres') {
          const numVal = parseInt(num || id, 10);
          const p = (D.presidents || []).find(item => item.number === numVal);
          if (p) openPresidentSheet(p);
        } else if (type === 'modal' && target === 'kp' && id) {
          const p = (D.keypersons || []).find(item => item.id === id);
          if (p) openKeyPersonSheet(p);
        }
      });
    });

    // 4つの謎カードのタップ（該当パートへスムーススクロール）
    app.querySelectorAll('.puzzle-visual-card').forEach(puzEl => {
      puzEl.addEventListener('click', () => {
        const targetId = puzEl.getAttribute('data-puzzle-target');
        const targetEl = document.getElementById('study-part-' + targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          targetEl.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
          targetEl.style.borderColor = 'var(--navy)';
          targetEl.style.boxShadow = '0 0 0 3px rgba(27, 42, 74, 0.2)';
          setTimeout(() => {
            targetEl.style.borderColor = '';
            targetEl.style.boxShadow = '';
          }, 1500);
        }
      });
    });

    // 南北支持逆転史ステージタップ（Part 2内）
    app.querySelectorAll('.shift-stage[data-shift-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const sIdx = el.getAttribute('data-shift-idx');
        const st = (D.north_south_shift && D.north_south_shift.stages) ? D.north_south_shift.stages[sIdx] : null;
        if (st) openShiftStageSheet(st);
      });
    });

    // 詳細解説ブロックのタップ（タップで骨太な多段落・多項目モーダル表示）
    app.querySelectorAll('.detail-block[data-part-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const pIdx = parseInt(el.getAttribute('data-part-idx'), 10);
        const dIdx = parseInt(el.getAttribute('data-detail-idx'), 10);
        const part = sa.parts[pIdx];
        const d = part && part.details ? part.details[dIdx] : null;
        if (!d) return;

        let modalContent = '';

        // 概要箇条書きボックス（振り返り）
        if (d.summary_bullets && d.summary_bullets.length > 0) {
          modalContent += `
            <div class="detail-modal-summary-box">
              <div class="detail-modal-summary-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                要点サマリー
              </div>
              <ul class="detail-modal-summary-list">
                ${d.summary_bullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        // 骨太な詳細文章セクション（見出し＋長文）
        if (d.detailed_sections && d.detailed_sections.length > 0) {
          modalContent += `
            <div class="detail-modal-sections">
              ${d.detailed_sections.map((sec, sIdx) => {
                const num = sec.num || (sIdx + 1);
                const heading = (sec.heading || '').replace(/^[0-9]+[\.\s、・]+\s*/, '');
                const content = sec.content || sec.body || '';
                return `
                <div class="detail-modal-section">
                  <h4 class="detail-modal-section-heading">
                    <span class="detail-modal-section-num">${num}</span>
                    <span>${heading}</span>
                  </h4>
                  <p class="detail-modal-section-content">${content}</p>
                </div>
                `;
              }).join('')}
            </div>
          `;
        } else if (d.body || d.text) {
          modalContent += `
            <div class="info-box">
              <div style="font-size: 14px; line-height: 1.85; color: var(--ink); white-space: pre-line;">
                ${d.body || d.text}
              </div>
            </div>
          `;
        }

        openSheet(d.title, modalContent);
      });
    });
  }

  // =========================================================================
  // タブ①：現代・2026中間選挙とトランプ政権の構図
  // =========================================================================
  function renderCurrent() {
    topbarTitle.textContent = '現代政治と2026中間選挙';
    const cp = D.current_politics;
    const mt = cp.midterm_2026;
    const charts = cp.voter_charts;

    let html = `
      <div class="hero-card">
        <div class="hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          2026年11月3日 決戦
        </div>
        <h1 class="hero-title">${cp.title}</h1>
        <p class="hero-desc">${cp.lead}</p>
      </div>

      <!-- 2026年中間選挙前：米連邦議会 勢力図（上院・下院の議員数と過半数ライン） -->
      ${cp.congress_seats ? `
        <section class="congress-seats-section">
          <div class="section-head" style="margin-bottom: 12px;">
            <span class="section-eyebrow">Balance of Power</span>
            <h2 class="section-title" style="font-size: 19px;">${cp.congress_seats.title}</h2>
            <p class="section-lead" style="font-size: 13px;">${cp.congress_seats.subtitle}</p>
          </div>

          <div class="congress-grid">
            <!-- 上院（Senate） -->
            <div class="congress-card">
              <div class="congress-card-head">
                <h3 class="congress-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2l9 8H3z"></path></svg>
                  ${cp.congress_seats.senate.name}
                </h3>
                <span class="congress-card-badge">${cp.congress_seats.senate.status_label}</span>
              </div>

              <div class="congress-numbers-row">
                <div class="congress-party-stat gop">
                  <span class="congress-party-label"><span class="legend-dot gop"></span>共和党（多数派）</span>
                  <span class="congress-seats-num gop">${cp.congress_seats.senate.gop} <small style="font-size: 12px; font-weight: normal; color: var(--muted);">議席</small></span>
                </div>
                <div style="font-size: 11.5px; font-weight: 700; color: var(--navy); background: rgba(27, 42, 74, 0.08); padding: 2px 7px; border-radius: 6px;">過半数 51</div>
                <div class="congress-party-stat dem">
                  <span class="congress-party-label"><span class="legend-dot dem"></span>民主党・無所属</span>
                  <span class="congress-seats-num dem">${cp.congress_seats.senate.dem} <small style="font-size: 12px; font-weight: normal; color: var(--muted);">議席</small></span>
                </div>
              </div>

              <!-- プログレスバー -->
              <div class="congress-bar-container">
                <div class="congress-majority-tag">過半数 51</div>
                <div class="congress-majority-marker" style="left: 51%;"></div>
                <div class="congress-bar-wrap">
                  <div class="congress-bar-seg gop" style="width: ${cp.congress_seats.senate.gop}%;">53議席 (53%)</div>
                  <div class="congress-bar-seg dem" style="width: ${cp.congress_seats.senate.dem}%;">47議席 (47%)</div>
                </div>
              </div>

              <div class="congress-meta-box">
                <div class="congress-meta-row">
                  <strong>2026年改選：</strong>${cp.congress_seats.senate.relection_2026}
                </div>
                <div class="congress-meta-row" style="color: var(--navy); font-weight: 600;">
                  <strong>権限と焦点：</strong>${cp.congress_seats.senate.power_role}
                </div>
              </div>
            </div>

            <!-- 下院（House of Representatives） -->
            <div class="congress-card">
              <div class="congress-card-head">
                <h3 class="congress-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  ${cp.congress_seats.house.name}
                </h3>
                <span class="congress-card-badge" style="background: rgba(220, 38, 38, 0.15); font-weight: 800;">超僅差（5議席差）</span>
              </div>

              <div class="congress-numbers-row">
                <div class="congress-party-stat gop">
                  <span class="congress-party-label"><span class="legend-dot gop"></span>共和党（多数派）</span>
                  <span class="congress-seats-num gop">${cp.congress_seats.house.gop} <small style="font-size: 12px; font-weight: normal; color: var(--muted);">議席</small></span>
                </div>
                <div style="font-size: 11.5px; font-weight: 700; color: #DC2626; background: rgba(220, 38, 38, 0.08); padding: 2px 7px; border-radius: 6px;">過半数 218</div>
                <div class="congress-party-stat dem">
                  <span class="congress-party-label"><span class="legend-dot dem"></span>民主党</span>
                  <span class="congress-seats-num dem">${cp.congress_seats.house.dem} <small style="font-size: 12px; font-weight: normal; color: var(--muted);">議席</small></span>
                </div>
              </div>

              <!-- プログレスバー -->
              <div class="congress-bar-container">
                <div class="congress-majority-tag" style="left: ${(218/435*100).toFixed(1)}%;">過半数 218</div>
                <div class="congress-majority-marker" style="left: ${(218/435*100).toFixed(1)}%;"></div>
                <div class="congress-bar-wrap">
                  <div class="congress-bar-seg gop" style="width: ${(cp.congress_seats.house.gop/435*100).toFixed(1)}%;">220 (50.6%)</div>
                  <div class="congress-bar-seg dem" style="width: ${(cp.congress_seats.house.dem/435*100).toFixed(1)}%;">215 (49.4%)</div>
                </div>
              </div>

              <div class="congress-meta-box">
                <div class="congress-meta-row">
                  <strong>2026年改選：</strong><span style="color: #DC2626; font-weight: 800;">${cp.congress_seats.house.relection_2026}</span>
                </div>
                <div class="congress-meta-row" style="color: var(--navy); font-weight: 600;">
                  <strong>権限と焦点：</strong>${cp.congress_seats.house.power_role}
                </div>
              </div>
            </div>
          </div>

          <!-- 議会勢力・中間選挙の核心テイクアウェイ -->
          <div class="congress-takeaways-grid">
            ${cp.congress_seats.key_takeaways.map(tk => `
              <div class="congress-takeaway-card">
                <div class="congress-takeaway-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                  ${tk.point}
                </div>
                <p class="congress-takeaway-desc">${tk.desc}</p>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <!-- 全米州別・支持基盤マップ（レッドステート vs ブルーステート vs スイングステート） -->
      ${cp.state_map ? `
        <section class="state-map-section">
          <div class="section-head" style="margin-bottom: 12px;">
            <span class="section-eyebrow">Electoral Geography</span>
            <h2 class="section-title" style="font-size: 19px;">${cp.state_map.title}</h2>
            <p class="section-lead" style="font-size: 13px;">${cp.state_map.subtitle}</p>
          </div>

          <div class="state-map-card">
            <!-- 凡例 -->
            <div class="state-map-legend">
              <div class="map-legend-item">
                <span class="map-legend-box red"></span>
                <span>レッドステート（共和党強固・${cp.state_map.summary_stats.red_states_count}州）</span>
              </div>
              <div class="map-legend-item">
                <span class="map-legend-box blue"></span>
                <span>ブルーステート（民主党強固・${cp.state_map.summary_stats.blue_states_count}州）</span>
              </div>
              <div class="map-legend-item">
                <span class="map-legend-box swing"></span>
                <span>激戦スイングステート（勝敗の鍵・${cp.state_map.summary_stats.swing_states_count}州）</span>
              </div>
            </div>

            <!-- US全米カートグラム（タイルグリッドマップ） -->
            <div class="state-grid-scroll-wrap">
              <div class="state-grid">
                ${cp.state_map.tile_grid.map(st => `
                  <div class="state-tile ${st.type}" 
                    style="grid-row: ${st.r + 1}; grid-column: ${st.c + 1};"
                    title="${st.name} (${st.code})：${st.type === 'red' ? '共和党優位' : (st.type === 'blue' ? '民主党優位' : '激戦スイング州')}"
                    data-state-code="${st.code}">
                    <span class="state-tile-code">${st.code}</span>
                    <span class="state-tile-name">${st.name.slice(0, 4)}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="font-size: 11px; color: var(--muted); text-align: center; margin-top: 6px;">
              ※ 各タイルの位置は全米50州＋DCの地理的位置関係を模した全米カートグラムです（スクロール可能）。
            </div>

            <!-- 3分類の支持基盤・地域分析カード -->
            <div class="state-categories-grid">
              ${cp.state_map.categories.map(cat => `
                <div class="state-cat-card ${cat.id}">
                  <div class="state-cat-header">
                    <div class="state-cat-title ${cat.id}">
                      <span class="map-legend-box ${cat.id}"></span>
                      <span>${cat.name}</span>
                    </div>
                  </div>
                  <div class="state-cat-regions"><strong>主な地域：</strong>${cat.regions}</div>
                  <p class="state-cat-features">${cat.features}</p>
                  <div class="state-pills-wrap">
                    ${cat.representative_states.map(s => `
                      <div class="state-rep-pill" title="${s.role}">
                        <strong>${s.name} (${s.code})</strong>
                        <span style="color: var(--muted); font-size: 10px;">${s.role.slice(0, 18)}...</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      ` : ''}

      <!-- ビジュアル棒グラフ：支持層クロス集計 -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Demographic & Religious Data</span>
          <h2 class="section-title">誰がトランプを支持しているのか？</h2>
          <p class="section-lead">Pew Research Centerの投票照合調査による、宗教・人種・学歴別の投票実態。</p>
        </div>

        ${charts.map(chart => `
          <div class="chart-card">
            <div class="chart-header">
              <h3 style="font-family: var(--serif); font-size: 15.5px; font-weight: 700;">${chart.category}</h3>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot gop"></span>トランプ</span>
                <span class="legend-item"><span class="legend-dot dem"></span>ハリス</span>
              </div>
            </div>
            <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">${chart.description}</p>
            ${chart.items.map(it => `
              <div class="bar-row">
                <div class="bar-labels">
                  <span>${it.label}</span>
                  <span><strong style="color: var(--red-gop);">${it.trump}%</strong> vs <strong style="color: var(--blue-dem);">${it.harris}%</strong></span>
                </div>
                <div class="bar-track">
                  <div class="bar-segment gop" style="width: ${it.trump}%;">${it.trump}%</div>
                  <div class="bar-segment dem" style="width: ${it.harris}%;">${it.harris}%</div>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </section>

      <!-- 2026中間選挙の焦点 -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">The 2026 Stakes</span>
          <h2 class="section-title">中間選挙の仕組みと最大の焦点</h2>
          <p class="section-lead">${mt.summary}</p>
        </div>
        <div class="stakes-list">
          ${mt.stakes.map(st => `
            <div class="card" style="cursor: default;">
              <div class="card-head">
                <h3 class="card-title">${st.point}</h3>
              </div>
              <p class="card-body">${st.detail}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 現代の4つの謎 -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Puzzles to Solve</span>
          <h2 class="section-title">現代アメリカの「4つの謎」</h2>
          <p class="section-lead">タップすると、なぜその現象が起きているのか背景と歴史的ルーツを深掘りできます。</p>
        </div>
        <div class="puzzle-grid">
          ${cp.puzzles.map(pz => `
            <div class="card puzzle-card" data-puzzle-id="${pz.id}">
              <div class="card-head">
                <h3 class="card-title" style="color: var(--navy);">${pz.question}</h3>
                <span class="card-badge">深掘り</span>
              </div>
              <p class="card-body">${pz.summary}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 第2次トランプ政権の権力構造 -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Power Coalition</span>
          <h2 class="section-title">トランプを支える4つの支持連合</h2>
          <p class="section-lead">相容れないはずの集団がなぜ一つの強力な政治勢力として結束しているのか。</p>
        </div>
        <div class="coalition-list">
          ${cp.power_structure.map(ps => `
            <div class="card" style="cursor: default;">
              <div class="card-head">
                <h3 class="card-title">${ps.group}</h3>
                <span class="card-badge">${ps.role}</span>
              </div>
              <p class="card-body">${ps.description}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    app.innerHTML = html;

    // パズルクリックイベント（4つの謎の詳細を4項目で充実表示）
    app.querySelectorAll('.puzzle-card').forEach(el => {
      el.addEventListener('click', () => {
        const pzId = el.getAttribute('data-puzzle-id');
        const pz = cp.puzzles.find(p => p.id === pzId);
        if (pz) {
          openSheet(pz.question, `
            <div class="info-box" style="margin-bottom: 20px;">
              <strong>この謎の核心：</strong><br>${pz.summary}
            </div>

            <!-- 1. 概要 -->
            <div class="detail-section">
              <h4 class="detail-heading">
                <span class="detail-num-badge">1</span>
                概要
              </h4>
              <p class="detail-text">${pz.overview}</p>
            </div>

            <!-- 2. 背景 -->
            <div class="detail-section">
              <h4 class="detail-heading">
                <span class="detail-num-badge">2</span>
                背景
              </h4>
              <p class="detail-text">${pz.background}</p>
            </div>

            <!-- 3. 中心人物とその思想 -->
            <div class="detail-section">
              <h4 class="detail-heading">
                <span class="detail-num-badge">3</span>
                中心人物とその思想
              </h4>
              <div class="detail-text" style="white-space: pre-line;">${pz.figures}</div>
            </div>

            <!-- 4. 現代社会への影響 -->
            <div class="detail-section">
              <h4 class="detail-heading">
                <span class="detail-num-badge">4</span>
                現代社会への影響
              </h4>
              <div class="detail-text" style="white-space: pre-line;">${pz.impact}</div>
            </div>
          `);
        }
      });
    });

    // 4つの謎カードのタップ（該当パートへスムーススクロール）
    app.querySelectorAll('.puzzle-card').forEach(puzEl => {
      puzEl.addEventListener('click', () => {
        const targetId = puzEl.getAttribute('data-puzzle-target');
        const targetEl = document.getElementById('study-part-' + targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          targetEl.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
          targetEl.style.borderColor = 'var(--navy)';
          targetEl.style.boxShadow = '0 0 0 3px rgba(27, 42, 74, 0.2)';
          setTimeout(() => {
            targetEl.style.borderColor = '';
            targetEl.style.boxShadow = '';
          }, 1500);
        }
      });
    });
  }

  // =========================================================================
  // タブ②：アメリカ二大政党・支持基盤の再編史＆歴代大統領の歴史
  // =========================================================================
  function renderParties() {
    topbarTitle.textContent = partiesSubTab === 'presidents' ? '歴代大統領の歴史（全47代）' : '二大政党・支持層の再編史';
    const pc = D.party_comparison;
    const traj = D.party_matrix_trajectory;
    const nc = D.nolan_chart;
    const sh = D.party_standalone_histories;
    const ph = D.party_history;
    const ns = D.north_south_shift;
    const presidents = D.presidents || [];

    // フィルタリング処理（大統領）
    let filteredPresidents = presidents;
    if (presidentFilter === 'featured') {
      filteredPresidents = presidents.filter(p => p.featured);
    } else if (presidentFilter === 'gop') {
      filteredPresidents = presidents.filter(p => p.party_type === 'gop');
    } else if (presidentFilter === 'dem') {
      filteredPresidents = presidents.filter(p => p.party_type === 'dem');
    } else if (presidentFilter === 'other') {
      filteredPresidents = presidents.filter(p => !['gop', 'dem'].includes(p.party_type));
    }

    // 選択中の個別政党史
    const activePartyData = (sh && sh[standalonePartyTab === 'dem' ? 'democrats' : 'republicans']) ? sh[standalonePartyTab === 'dem' ? 'democrats' : 'republicans'] : null;

    let html = `
      <!-- ① そもそも民主党と共和党はどう違うのか？（二大政党 徹底比較表） -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Party Comparison Matrix</span>
          <h2 class="section-title">${pc ? pc.title : 'そもそも民主党と共和党はどう違うのか？'}</h2>
          <p class="section-lead">${pc ? pc.subtitle : ''}</p>
        </div>

        ${pc && pc.summary_bullets ? `
          <div class="summary-bullets-card">
            <div class="summary-bullets-head">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              3分でわかる核心要点サマリー
            </div>
            <ul class="summary-bullets-list">
              ${pc.summary_bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
          <span style="font-size: 13px; font-weight: 800; color: var(--navy);">【政策・思想・支持基盤 7大次元の徹底比較】</span>
          <span style="font-size: 11px; color: var(--muted); font-weight: 600;">横スクロールで全体比較 →</span>
        </div>
        <div class="party-compare-table-wrap">
          <table class="party-compare-table">
            <thead>
              <tr>
                <th style="width: 140px;">比較次元</th>
                <th style="color: #2563EB;">🐴 民主党（Democratic Party）</th>
                <th style="color: #DC2626;">🐘 共和党（Republican Party / GOP）</th>
              </tr>
            </thead>
            <tbody>
              ${(pc ? pc.dimensions : []).map(row => `
                <tr>
                  <td class="compare-category-cell">
                    <div class="compare-cat-title">${row.category}</div>
                    <div class="compare-cat-sub">${row.question}</div>
                  </td>
                  <td class="party-col-dem">
                    <span class="party-cell-title dem">● ${row.democrats.headline}</span>
                    <ul class="compare-cell-bullets">
                      ${row.democrats.bullets.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                  </td>
                  <td class="party-col-gop">
                    <span class="party-cell-title gop">● ${row.republicans.headline}</span>
                    <ul class="compare-cell-bullets">
                      ${row.republicans.bullets.map(b => `<li>${b}</li>`).join('')}
                    </ul>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- ② 党としての政策・思想マトリックス（時代的変容軌跡） -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Party Ideology Trajectory</span>
          <h2 class="section-title">${traj ? traj.title : '二大政党の思想的変容軌跡'}</h2>
          <p class="section-lead">${traj ? traj.description : ''}</p>
        </div>

        <div class="party-trajectory-card">
          <div class="matrix-canvas-wrap">
            <svg class="matrix-svg" viewBox="0 0 420 420">
              <!-- 背景グリッドと象限 -->
              <line x1="210" y1="20" x2="210" y2="400" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4" />
              <line x1="20" y1="210" x2="400" y2="210" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4" />
              
              <!-- 象限ラベル -->
              <text x="395" y="35" text-anchor="end" class="matrix-quad-label">リバタリアン（自由至上）</text>
              <text x="25" y="35" text-anchor="start" class="matrix-quad-label">リベラル（福祉・社会正義）</text>
              <text x="395" y="395" text-anchor="end" class="matrix-quad-label">伝統保守（市場・宗教倫理）</text>
              <text x="25" y="395" text-anchor="start" class="matrix-quad-label">ポピュリズム（国家介入・統制）</text>

              <!-- 軸ラベル -->
              <text x="210" y="15" text-anchor="middle" class="matrix-axis-label">↑ 個人的・政治的自由（社会リベラル）</text>
              <text x="210" y="415" text-anchor="middle" class="matrix-axis-label">↓ 伝統・秩序・共同体（社会保守）</text>
              <text x="10" y="205" text-anchor="start" class="matrix-axis-label">← 政府介入・福祉</text>
              <text x="410" y="205" text-anchor="end" class="matrix-axis-label">市場自由・減税 →</text>

              <!-- 軌跡ライン（民主党：青） -->
              <!-- 1860(40,25) -> 1930(25,60) -> 1960(30,80) -> 1980(50,75) -> 2026(28,88) -->
              <path d="M 168 320 L 120 208 L 136 144 L 200 160 L 129 118" stroke="#2563EB" stroke-width="2.5" stroke-dasharray="4" fill="none" opacity="0.6"/>

              <!-- 軌跡ライン（共和党：赤） -->
              <!-- 1860(65,70) -> 1930(80,45) -> 1960(85,40) -> 1980(92,30) -> 2026(52,20) -->
              <path d="M 248 176 L 296 256 L 312 272 L 334 304 L 206 336" stroke="#DC2626" stroke-width="2.5" stroke-dasharray="4" fill="none" opacity="0.6"/>

              <!-- プロット（5つの時代） -->
              ${(traj ? traj.eras : []).map((era, eIdx) => {
                const demX = (era.dem.x / 100) * 320 + 40;
                const demY = 400 - ((era.dem.y / 100) * 320 + 40);
                const gopX = (era.gop.x / 100) * 320 + 40;
                const gopY = 400 - ((era.gop.y / 100) * 320 + 40);
                const isLatest = eIdx === traj.eras.length - 1;
                return `
                  <!-- 民主党プロット -->
                  <circle cx="${demX}" cy="${demY}" r="${isLatest ? 8 : 6}" fill="#2563EB" stroke="#fff" stroke-width="2"/>
                  <text x="${demX}" y="${demY - 9}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#2563EB">民(${era.year.slice(0, 4)})</text>

                  <!-- 共和党プロット -->
                  <circle cx="${gopX}" cy="${gopY}" r="${isLatest ? 8 : 6}" fill="#DC2626" stroke="#fff" stroke-width="2"/>
                  <text x="${gopX}" y="${gopY + 16}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#DC2626">共(${era.year.slice(0, 4)})</text>
                `;
              }).join('')}
            </svg>
          </div>

          <div style="font-size: 11.5px; color: var(--muted); text-align: center; margin-top: 6px;">
            ● 青：民主党の時代変遷（南部奴隷主 ➔ 福祉国家 ➔ 多文化リベラル）<br>
            ● 赤：共和党の時代変遷（北部資本・黒人解放 ➔ 新自由主義 ➔ MAGAポピュリズム）
          </div>

          <!-- 時代別変容解説リスト -->
          <div class="party-trajectory-eras">
            ${(traj ? traj.eras : []).map(era => `
              <div class="trajectory-era-item">
                <div class="trajectory-era-head">
                  <span class="trajectory-era-year">${era.year}</span>
                  <div class="trajectory-era-badges">
                    <span class="trajectory-badge-dem">民主：${era.dem.desc.slice(0, 18)}...</span>
                    <span class="trajectory-badge-gop">共和：${era.gop.desc.slice(0, 18)}...</span>
                  </div>
                </div>
                <p class="trajectory-era-desc">${era.summary}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- ③ 人物マトリックス（主要政治家・思想家のノーラン・チャート散布図） -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Political Ideology Matrix</span>
          <h2 class="section-title">${nc.title}</h2>
          <p class="section-lead">${nc.description}（プロットをタップで詳細表示）</p>
        </div>

        <div class="matrix-card">
          <div class="matrix-canvas-wrap">
            <svg class="matrix-svg" viewBox="0 0 400 400">
              <line x1="200" y1="20" x2="200" y2="380" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4" />
              <line x1="20" y1="200" x2="380" y2="200" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4" />
              
              <text x="375" y="35" text-anchor="end" class="matrix-quad-label">リバタリアン（自由至上）</text>
              <text x="25" y="35" text-anchor="start" class="matrix-quad-label">リベラル（福祉・社会自由）</text>
              <text x="375" y="375" text-anchor="end" class="matrix-quad-label">保守・伝統秩序（市場・宗教）</text>
              <text x="25" y="375" text-anchor="start" class="matrix-quad-label">ポピュリズム（国家介入・統制）</text>

              <text x="200" y="16" text-anchor="middle" class="matrix-axis-label">↑ 個人的・政治的自由（リベラル）</text>
              <text x="200" y="396" text-anchor="middle" class="matrix-axis-label">↓ 伝統・秩序・共同体（保守）</text>
              <text x="10" y="195" text-anchor="start" class="matrix-axis-label">← 政府介入</text>
              <text x="390" y="195" text-anchor="end" class="matrix-axis-label">市場自由 →</text>

              ${nc.actors.map((ac, aIdx) => {
                const px = (ac.x / 100) * 320 + 40;
                const py = 400 - ((ac.y / 100) * 320 + 40);
                return `
                  <g class="matrix-node" data-actor-idx="${aIdx}">
                    <circle cx="${px}" cy="${py}" r="7" fill="${ac.color}" stroke="#fff" stroke-width="2" />
                    <text x="${px}" y="${py - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">${ac.name}</text>
                  </g>
                `;
              }).join('')}
            </svg>
          </div>
          <div style="font-size: 12px; color: var(--muted); text-align: center;">
            ● 青：民主系　● 赤：共和系　● 紫：リバタリアン　● 橙：ポストリベラル
          </div>
        </div>
      </section>

      <!-- ④ 民主党と共和党の成立、発展、主要人物、出来事、現在（二大政党の個別発展史） -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Standalone Party Histories</span>
          <h2 class="section-title">${sh ? sh.title : '二大政党の個別発展史'}</h2>
          <p class="section-lead">${sh ? sh.description : ''}</p>
        </div>

        <!-- 民主党 vs 共和党 切り替えピルトグル -->
        <div class="sub-nav-segmented" style="margin-bottom: 16px;">
          <button class="sub-nav-btn ${standalonePartyTab === 'dem' ? 'active' : ''}" data-standalone-party="dem" style="color: ${standalonePartyTab === 'dem' ? '#fff' : '#2563EB'}; background: ${standalonePartyTab === 'dem' ? '#2563EB' : ''};">
            🐴 民主党の全歴史（1828年〜）
          </button>
          <button class="sub-nav-btn ${standalonePartyTab === 'gop' ? 'active' : ''}" data-standalone-party="gop" style="color: ${standalonePartyTab === 'gop' ? '#fff' : '#DC2626'}; background: ${standalonePartyTab === 'gop' ? '#DC2626' : ''};">
            🐘 共和党の全歴史（1854年〜）
          </button>
        </div>

        ${activePartyData ? `
          <div class="standalone-party-hero ${standalonePartyTab}">
            <div class="standalone-party-title ${standalonePartyTab}">
              ${standalonePartyTab === 'dem' ? '🐴 民主党（Democratic Party）' : '🐘 共和党（Republican Party / GOP）'}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: var(--muted); margin-bottom: 8px;">
              ${activePartyData.founding_year} ｜ 創設者：${activePartyData.founders}
            </div>
            <p style="font-size: 13px; line-height: 1.65; color: var(--ink); margin: 0;">
              ${activePartyData.overview}
            </p>
          </div>

          <div style="font-size: 13.5px; font-weight: 800; color: var(--navy); margin-bottom: 12px;">
            【${standalonePartyTab === 'dem' ? '民主党' : '共和党'}の6大発展フェーズ】
          </div>

          <div class="standalone-stages-list">
            ${activePartyData.stages.map(stg => `
              <div class="standalone-stage-card">
                <div class="standalone-stage-head">
                  <span class="standalone-stage-era">${stg.era}</span>
                  <span class="card-badge" style="background: ${standalonePartyTab === 'dem' ? 'rgba(37,99,235,0.1)' : 'rgba(220,38,38,0.1)'}; color: ${standalonePartyTab === 'dem' ? '#2563EB' : '#DC2626'};">主要人物：${stg.leaders.split('、')[0]}</span>
                </div>
                <div class="standalone-stage-phase">${stg.phase}</div>
                <div style="font-size: 12px; color: var(--muted); margin-bottom: 6px;">
                  <strong>主要指導者：</strong>${stg.leaders}<br>
                  <strong>重要出来事：</strong>${stg.events}
                </div>
                <p style="font-size: 12.5px; line-height: 1.6; color: var(--ink); margin: 0;">
                  ${stg.detail}
                </p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </section>

      <!-- ⑤ ビジュアル：南北の逆転インフォグラフィック -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Geographic Realignment</span>
          <h2 class="section-title">${ns.title}</h2>
          <p class="section-lead">${ns.description}</p>
        </div>
        <div class="shift-card">
          ${ns.stages.map((st, sIdx) => {
            const sSide = st.south_side || 'gop';
            const nSide = st.north_side || 'dem';
            return `
            <div class="shift-stage" data-shift-idx="${sIdx}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div class="shift-year" style="margin: 0; font-size: 13.5px; font-weight: 800;">${st.year}：${st.title || ''}</div>
                <span class="card-badge" style="font-size: 10px; padding: 2px 7px; background: rgba(27, 42, 74, 0.08); color: var(--navy);">詳細タップ →</span>
              </div>
              <div class="shift-bars">
                <span class="shift-badge-south ${sSide}">南部：${st.south}</span>
                <span class="shift-badge-north ${nSide}">北部・全米：${st.north}</span>
              </div>
              <p style="font-size: 12.5px; color: var(--ink); line-height: 1.55; margin: 0;">${st.summary_html || st.summary}</p>
            </div>
          `;
          }).join('')}
        </div>
      </section>

      <!-- ⑥ サブ切り替えセグメントコントロール（再編史 8時代 vs 歴代大統領 47代） -->
      <div class="sub-nav-segmented">
        <button class="sub-nav-btn ${partiesSubTab === 'realignment' ? 'active' : ''}" data-subtab="realignment">
          二大政党再編史（8時代）
        </button>
        <button class="sub-nav-btn ${partiesSubTab === 'presidents' ? 'active' : ''}" data-subtab="presidents">
          歴代大統領の歴史（全47代）
        </button>
      </div>

      ${partiesSubTab === 'realignment' ? `
        <!-- 時代別タイムライン（二大政党再編史） -->
        <div class="section-head">
          <span class="section-eyebrow">Party Realignment History</span>
          <h2 class="section-title">二大政党再編の全歴史（8つの転換期）</h2>
          <p class="section-lead">赤くハイライトされた時代は米政党史の【最重要転換点】です。タップすると詳細（概要・背景・人物思想・現代への影響）が表示されます。</p>
        </div>

        <div class="timeline">
          ${ph.map((item, idx) => {
            const sideClass = item.dominant_side ? `featured-${item.dominant_side}` : 'featured-gop';
            const featClass = item.featured ? `featured ${sideClass}` : '';
            return `
            <div class="timeline-item ${featClass}">
              <div class="timeline-node"></div>
              <div class="timeline-year">${item.era}</div>
              <div class="timeline-card ${featClass}" data-idx="${idx}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                  <div class="dominant-badge-wrap" style="margin: 0;">
                    <span class="dominant-badge ${item.dominant_side}">【${item.dominant_party}】</span>
                  </div>
                  ${item.featured ? `<div class="featured-badge ${item.dominant_side || 'gop'}" style="margin: 0;"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>重要転換点</div>` : ''}
                </div>

                <div class="dominant-policy-text" style="margin-bottom: 8px;">
                  <strong>主導路線：</strong>${item.dominant_policy}
                </div>

                <h3 class="card-title" style="margin-bottom: 6px;">${item.name}</h3>
                <p class="card-body" style="font-size: 13px; margin-bottom: 8px;">${item.conflict}</p>
                
                <div class="vs-grid">
                  <div class="vs-box">
                    <div class="vs-label" style="color: #2563EB;">${item.parties.democrats ? item.parties.democrats.name : (item.parties.dem_reps ? item.parties.dem_reps.name : '民主系')}</div>
                    <div class="vs-text">${item.parties.democrats ? item.parties.democrats.leaders : (item.parties.dem_reps ? item.parties.dem_reps.leaders : '')}</div>
                  </div>
                  <div class="vs-box">
                    <div class="vs-label" style="color: #DC2626;">${item.parties.republicans ? item.parties.republicans.name : (item.parties.federalists ? item.parties.federalists.name : item.parties.whigs.name)}</div>
                    <div class="vs-text">${item.parties.republicans ? item.parties.republicans.leaders : (item.parties.federalists ? item.parties.federalists.leaders : item.parties.whigs.leaders)}</div>
                  </div>
                </div>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      ` : `
        <!-- 歴代大統領の歴史（初代〜第47代） -->
        <div class="section-head">
          <span class="section-eyebrow">US Presidents Chronology</span>
          <h2 class="section-title">歴代大統領の歴史（全47代・45名）</h2>
          <p class="section-lead">建国から2026年現在の第2次トランプ政権まで。政策・議会との関係・現代社会への影響を徹底解剖（タップで4項目詳細）。</p>
        </div>

        <!-- 絞り込みフィルターバー -->
        <div class="filter-pills-bar">
          <button class="filter-pill ${presidentFilter === 'all' ? 'active' : ''}" data-filter="all">すべて (${presidents.length})</button>
          <button class="filter-pill ${presidentFilter === 'featured' ? 'active' : ''}" data-filter="featured">★ 重要大統領 (${presidents.filter(p=>p.featured).length})</button>
          <button class="filter-pill ${presidentFilter === 'gop' ? 'active' : ''}" data-filter="gop">共和党 (${presidents.filter(p=>p.party_type==='gop').length})</button>
          <button class="filter-pill ${presidentFilter === 'dem' ? 'active' : ''}" data-filter="dem">民主党 (${presidents.filter(p=>p.party_type==='dem').length})</button>
          <button class="filter-pill ${presidentFilter === 'other' ? 'active' : ''}" data-filter="other">その他 (${presidents.filter(p=>!['gop','dem'].includes(p.party_type)).length})</button>
        </div>

        <div class="presidents-list">
          ${filteredPresidents.map((p) => {
            const initials = p.en_name.split(' ').map(w => w[0]).join('').slice(0, 3);
            return `
              <div class="president-card ${p.featured ? 'featured' : ''}" data-pres-num="${p.number}">
                <div class="president-avatar-wrap">
                  ${p.image ? `
                    <img class="president-avatar-img" src="${p.image}" alt="${p.name}" loading="lazy">
                  ` : `
                    <div class="president-avatar-placeholder ${p.party_type}">${initials}</div>
                  `}
                </div>
                <div class="president-info">
                  <div class="president-meta-top">
                    <span class="president-num">第${p.number}代</span>
                    <span class="president-party-badge ${p.party_type}">${p.party}</span>
                    <span class="president-years">${p.years}</span>
                  </div>
                  <div class="president-name">${p.name}</div>
                  <div class="president-en-name">${p.en_name}</div>
                  <div class="president-policy-snippet">
                    <strong>主要政策：</strong>${p.policy}
                  </div>
                  <div style="font-size: 11.5px; color: var(--navy); margin-top: 3px; font-weight: 500;">
                    <strong>議会：</strong>${p.congress}
                  </div>
                </div>
                <div class="president-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    app.innerHTML = html;

    // 個別政党史（民主党 vs 共和党）切り替えイベント
    app.querySelectorAll('[data-standalone-party]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-standalone-party');
        if (p !== standalonePartyTab) {
          standalonePartyTab = p;
          renderParties();
        }
      });
    });

    // サブタブ切り替えイベント（再編史 vs 歴代大統領）
    app.querySelectorAll('.sub-nav-btn[data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSub = btn.getAttribute('data-subtab');
        if (targetSub !== partiesSubTab) {
          partiesSubTab = targetSub;
          renderParties();
        }
      });
    });

    // フィルターボタン切り替えイベント（大統領）
    app.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const f = pill.getAttribute('data-filter');
        if (f !== presidentFilter) {
          presidentFilter = f;
          renderParties();
        }
      });
    });

    // マトリックスノードタップ
    app.querySelectorAll('.matrix-node').forEach(el => {
      el.addEventListener('click', () => {
        const aIdx = el.getAttribute('data-actor-idx');
        const ac = nc.actors[aIdx];
        openSheet(`${ac.name}（${ac.category}）`, `
          <div class="info-box">
            <strong>政治思想の位置づけ：</strong><br>${ac.note}
          </div>
          <h3>ノーラン・チャートにおける座標</h3>
          <p>・<strong>経済的自由度：</strong>${ac.x} / 100（数値が高いほど市場重視・減税・規制緩和）<br>
             ・<strong>個人的・政治的自由度：</strong>${ac.y} / 100（数値が高いほど個人の権利重視、低いほど伝統・秩序重視）</p>
        `);
      });
    });

    // 南北支持逆転史ステージタップ
    app.querySelectorAll('.shift-stage[data-shift-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const sIdx = el.getAttribute('data-shift-idx');
        const st = (ns && ns.stages) ? ns.stages[sIdx] : null;
        if (st) openShiftStageSheet(st);
      });
    });

    // タイムライン詳細（政党再編史 4項目）
    app.querySelectorAll('.timeline-card').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.getAttribute('data-idx');
        const item = ph[idx];
        const p1 = item.parties.democrats || item.parties.dem_reps;
        const p2 = item.parties.republicans || item.parties.federalists || item.parties.whigs;

        openSheet(`${item.era}：${item.name}`, `
          ${item.featured ? `<div style="margin-bottom: 12px;"><span class="featured-badge ${item.dominant_side || 'gop'}" style="font-size: 11px; padding: 3px 9px;">★ アメリカ政党史の最重要転換点（${item.dominant_party}）</span></div>` : ''}
          
          <div class="info-box" style="margin-bottom: 20px;">
            <strong>この時代の本質的な対立軸：</strong><br>${item.conflict}
          </div>

          <!-- 1. 概要 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">1</span>
              概要
            </h4>
            <p class="detail-text">${item.overview || item.conflict}</p>
          </div>

          <!-- 2. 背景 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">2</span>
              背景
            </h4>
            <p class="detail-text">${item.background || '準備中'}</p>
          </div>

          <!-- 3. 中心人物とその思想 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">3</span>
              中心人物とその思想
            </h4>
            <div class="detail-text" style="white-space: pre-line;">${item.figures || '準備中'}</div>
          </div>

          <!-- 4. 現代社会への影響 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">4</span>
              現代社会への影響
            </h4>
            <div class="detail-text" style="white-space: pre-line;">${item.impact || '準備中'}</div>
          </div>

          <h3 style="margin-top: 24px; margin-bottom: 12px;">【両陣営の対比】</h3>

          <div style="background: var(--soft); border-radius: 12px; padding: 14px; margin-bottom: 12px;">
            <div style="font-weight: 700; color: #2563EB; font-size: 15px; margin-bottom: 6px;">${p1.name}</div>
            <div style="font-size: 13px; line-height: 1.6; margin-bottom: 6px;">
              <strong>主要指導者：</strong>${p1.leaders}<br>
              <strong>支持基盤：</strong>${p1.base}
            </div>
            <p style="font-size: 12.5px; color: var(--muted); margin: 0;">${p1.policy}</p>
          </div>

          <div style="background: var(--soft); border-radius: 12px; padding: 14px;">
            <div style="font-weight: 700; color: #DC2626; font-size: 15px; margin-bottom: 6px;">${p2.name}</div>
            <div style="font-size: 13px; line-height: 1.6; margin-bottom: 6px;">
              <strong>主要指導者：</strong>${p2.leaders}<br>
              <strong>支持基盤：</strong>${p2.base}
            </div>
            <p style="font-size: 12.5px; color: var(--muted); margin: 0;">${p2.policy}</p>
          </div>
        `);
      });
    });

    // 歴代大統領カードタップ（4項目詳細表示）
    app.querySelectorAll('.president-card').forEach(card => {
      card.addEventListener('click', () => {
        const num = parseInt(card.getAttribute('data-pres-num'), 10);
        const p = presidents.find(item => item.number === num);
        if (p) openPresidentSheet(p);
      });
    });
  }

  // =========================================================================
  // タブ③：キリスト教2000年史と宗派分岐
  // =========================================================================
  function renderReligion() {
    topbarTitle.textContent = 'キリスト教史と宗派分岐';
    const ch = D.christianity_history;
    const denoms = D.denominations;

    let html = `
      <!-- ビジュアル：キリスト教系統図（添付画像を大迫力配置） -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Visual Genealogy</span>
          <h2 class="section-title">キリスト教の系統図</h2>
          <p class="section-lead">分裂・地域の独立・信仰運動を区別して読む全体マップ（タップで全画面高解像度拡大表示）。</p>
        </div>

        <div class="tree-preview-card" id="open-tree-modal">
          <div class="tree-img-wrap">
            <img class="tree-img" src="assets/christianity-tree.jpg" alt="キリスト教の系統図" loading="lazy">
            <div class="tree-overlay">
              <div class="tree-overlay-title">キリスト教の系統図（初期キリスト教〜現代諸派）</div>
              <div class="tree-overlay-hint">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                タップして高解像度で拡大する
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- キリスト教3大系統（カトリック・プロテスタント・東方正教会）共通点・相違点 比較表 -->
      ${renderThreeBranchesComparison()}

      <!-- 歴史ステージタイムライン -->
      <div class="section-head">
        <span class="section-eyebrow">2,000 Years of Christian History</span>
        <h2 class="section-title">キリスト教の歴史的変遷</h2>
        <p class="section-lead">赤くハイライトされた第4ステージは、大覚醒運動とボーン・アゲインにより現代アメリカ政治を動かす福音派が生まれた【最重要転換期】です。</p>
      </div>

      <div class="timeline" style="margin-bottom: 30px;">
        ${ch.map((stg, sIdx) => `
          <div class="timeline-item ${stg.featured ? 'featured' : ''}">
            <div class="timeline-node"></div>
            <div class="timeline-year">${stg.period}</div>
            <div class="timeline-card ${stg.featured ? 'featured' : ''}" data-stage-idx="${sIdx}">
              ${stg.featured ? '<div class="featured-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>最重要転換点</div>' : ''}
              <h3 class="card-title">${stg.stage}</h3>
              <p class="card-body" style="font-size: 13px; margin-top: 4px;">${stg.significance}</p>
              <div class="tag-list">
                ${stg.events.map(ev => `<span class="tag-chip">${ev.year} ${ev.title}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- ビジュアル：アメリカ宗教勢力マップ（宗派バブル散布図） -->
      <section class="section">
        <div class="section-head">
          <span class="section-eyebrow">Religious Power Map (Bubble Chart)</span>
          <h2 class="section-title">${D.denomination_bubble_chart ? D.denomination_bubble_chart.title : 'アメリカ宗教勢力マップ'}</h2>
          <p class="section-lead">${D.denomination_bubble_chart ? D.denomination_bubble_chart.description : ''}（円をタップで詳細表示）</p>
        </div>

        <div class="bubble-card">
          <div class="bubble-canvas-wrap">
            <svg class="bubble-svg" viewBox="0 0 440 400">
              <!-- グリッド線 -->
              <line x1="220" y1="20" x2="220" y2="380" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4" />
              <line x1="20" y1="200" x2="420" y2="200" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="4" />

              <!-- 軸ラベル -->
              <text x="220" y="16" text-anchor="middle" class="matrix-axis-label">↑ 聖書無誤性・個人の回心・聖霊体験</text>
              <text x="220" y="396" text-anchor="middle" class="matrix-axis-label">↓ 伝統・公会議・教父・教皇/教区制</text>
              <text x="10" y="195" text-anchor="start" class="matrix-axis-label">← 民主党寄り</text>
              <text x="430" y="195" text-anchor="end" class="matrix-axis-label">共和党寄り →</text>

              <!-- 宗派バブル -->
              ${(D.denomination_bubble_chart ? D.denomination_bubble_chart.bubbles : []).map((b, bIdx) => {
                const bx = (b.x / 100) * 360 + 40;
                const by = 400 - ((b.y / 100) * 320 + 40);
                const showSub = b.radius >= 20;
                return `
                  <g class="bubble-node" data-bubble-idx="${bIdx}">
                    <circle cx="${bx}" cy="${by}" r="${b.radius}" fill="${b.color}" fill-opacity="0.82" stroke="${b.border}" stroke-width="2.5" />
                    <text x="${bx}" y="${showSub ? by - 3 : by + 4}" class="bubble-label" font-size="${b.radius >= 35 ? '12' : (b.radius >= 20 ? '10' : '8.5')}">${b.name}</text>
                    ${showSub ? `<text x="${bx}" y="${by + 11}" class="bubble-pop-label">${b.pop}</text>` : ''}
                  </g>
                `;
              }).join('')}
            </svg>
          </div>
          <div style="font-size: 11.5px; color: var(--muted); text-align: center; line-height: 1.5;">
            ※ 円の面積＝全米信徒数。<span style="color:#D97706; font-weight:700;">● 福音派（約6,000万人）</span>は教派を横断する巨大な黄色円、<span style="color:#7C3AED; font-weight:700;">● カトリック（約5,000万人）</span>が単一教会として最大。
          </div>
        </div>
      </section>

      <!-- 主要教派・系統 比較マトリックス -->
      <section class="denom-matrix-section">
        <div class="section-head" style="margin-bottom: 12px;">
          <span class="section-eyebrow">Denomination Matrix</span>
          <h2 class="section-title" style="font-size: 19px;">主要教派・系統の信義・信徒数 比較マトリックス</h2>
          <p class="section-lead" style="font-size: 13px;">
            キリスト教主要7系統における「信仰の基準（権威）」「救済観」「教会統治」「信徒規模」「政治的スタンス」を一目で対照できる比較表です。表の各行をタップすると4項目詳細が開きます。
          </p>
        </div>

        <!-- スクロールヒント -->
        <div class="matrix-scroll-hint">
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            左右にスクロールして全項目を比較できます
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </span>
          <span style="color: var(--navy); font-weight: 800;">行タップで4項目詳細 →</span>
        </div>

        <!-- 比較対照マトリックステーブル -->
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <thead>
              <tr>
                <th style="min-width: 160px;">教派・系統</th>
                <th style="min-width: 140px;">信徒数・規模</th>
                <th style="min-width: 175px;">信義① 信仰の権威・基準</th>
                <th style="min-width: 185px;">信義② 救済観・洗礼</th>
                <th style="min-width: 165px;">教会組織（統治構造）</th>
                <th style="min-width: 180px;">米政治・トランプ支持</th>
              </tr>
            </thead>
            <tbody>
              ${denoms.map((d, dIdx) => {
                const iconMap = { fire: '🔥', water: '💧', cross: '✝️', flame: '⚡', book: '📖', dome: '🏛️' };
                const icon = iconMap[d.icon] || '✝️';
                const popUs = d.population ? d.population.us : (d.us_population || '');
                const popWorld = d.population ? d.population.world : '';
                const authBullets = d.authority_bullets || (d.authority ? [d.authority] : []);
                const salvBullets = d.salvation_bullets || (d.salvation ? [d.salvation] : []);
                const structBullets = d.structure_bullets || (d.structure ? [d.structure] : []);
                const polBullets = d.politics_bullets || (d.impact ? [d.impact] : []);

                return `
                  <tr data-denom-idx="${dIdx}">
                    <td class="matrix-col-denom">
                      <div class="matrix-denom-name">
                        <span>${icon}</span>
                        <span>${d.name}</span>
                      </div>
                      <span class="matrix-denom-badge">${d.type}</span>
                    </td>
                    <td class="matrix-col-pop">
                      <div class="matrix-pop-us">${popUs}</div>
                      ${popWorld ? `<div class="matrix-pop-detail">${popWorld}</div>` : ''}
                      ${d.population && d.population.rank_label ? `<div style="font-size: 10px; font-weight: 700; color: var(--navy); margin-top: 2px;">★ ${d.population.rank_label}</div>` : ''}
                    </td>
                    <td>
                      <ul class="matrix-bullet-list">
                        ${authBullets.map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    </td>
                    <td>
                      <ul class="matrix-bullet-list">
                        ${salvBullets.map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    </td>
                    <td>
                      <ul class="matrix-bullet-list">
                        ${structBullets.map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    </td>
                    <td>
                      <ul class="matrix-bullet-list matrix-politics-list">
                        ${polBullets.map(b => `<li>${b}</li>`).join('')}
                      </ul>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 各教派の個別カードリスト -->
        <div style="font-size: 13.5px; font-weight: 800; color: var(--navy); margin: 24px 0 10px; display: flex; align-items: center; gap: 6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          各教派の解説カード（タップで4項目詳細）
        </div>
        <div class="denom-list">
          ${denoms.map((d, dIdx) => {
            const iconMap = { fire: '🔥', water: '💧', cross: '✝️', flame: '⚡', book: '📖', dome: '🏛️' };
            const icon = iconMap[d.icon] || '✝️';
            const popUs = d.population ? d.population.us : (d.us_population || '');
            return `
              <div class="card denom-card ${d.featured ? 'featured' : ''}" data-denom-idx="${dIdx}">
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                  <div class="denom-icon-badge">${icon}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div class="card-head" style="margin-bottom: 2px;">
                      <h3 class="card-title">${d.name}</h3>
                      <span class="card-badge">${d.type}</span>
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #B45309; margin-bottom: 6px;">
                      【全米信徒規模】${popUs}
                    </div>
                    <p class="card-body" style="font-size: 12.5px; line-height: 1.5; margin-bottom: 6px;">
                      ${d.overview ? d.overview.slice(0, 85) + '...' : d.authority}
                    </p>
                    <div style="font-size: 11.5px; color: var(--red-gop); font-weight: 700; margin-bottom: 6px;">
                      【政治傾向】${d.politics_bullets ? d.politics_bullets[0] : (d.impact ? d.impact.slice(0, 55) + '...' : '')}
                    </div>
                    <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: var(--navy);">
                      <span>4項目詳細解説を読む</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;

    app.innerHTML = html;

    // 系統図拡大モーダル
    document.getElementById('open-tree-modal').addEventListener('click', () => {
      openSheet('キリスト教の系統図（拡大）', `
        <div style="text-align: center; margin-bottom: 12px;">
          <img src="assets/christianity-tree.jpg" alt="キリスト教の系統図" style="width: 100%; border-radius: 12px; box-shadow: var(--shadow);">
        </div>
        <p style="font-size: 13px; color: var(--muted); line-height: 1.6;">
          <strong>【系統図の読み解き方】</strong><br>
          ・1世紀：初期キリスト教から5世紀のカルケドン公会議で非カルケドン派正教会が分離。<br>
          ・1054年/1204年：西方のカトリック教会（教皇集権）と東方の東方正教会（地域独立合議制）へ大分裂。<br>
          ・1517年以降：宗教改革によりルター派、改革派・長老派、聖公会、再洗礼派、バプテスト、メソジストが誕生。<br>
          ・黄色帯の「福音派」は独立した教派ではなく、これら諸教派にまたがる横断的な信仰運動。
        </p>
      `);
    });

    // ステージ詳細（ボーン・アゲイン・大覚醒の深層解説とエポック）
    app.querySelectorAll('[data-stage-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const sIdx = el.getAttribute('data-stage-idx');
        const stg = ch[sIdx];
        
        const rootHtml = stg.theological_root ? `
          <div style="background: linear-gradient(135deg, rgba(27, 42, 74, 0.07) 0%, var(--card) 100%); border: 1.5px solid var(--navy); border-radius: 14px; padding: 16px; margin: 18px 0;">
            <div style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:var(--navy); margin-bottom:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              深層解説：${stg.theological_root.title}
            </div>
            <div style="font-size: 13.5px; line-height: 1.7; color: var(--ink); white-space: pre-line;">${stg.theological_root.detail}</div>
          </div>
        ` : '';

        openSheet(`${stg.period}：${stg.stage}`, `
          ${stg.featured ? '<div style="margin-bottom: 12px;"><span class="featured-badge" style="font-size: 11px; padding: 3px 9px;">★ 現代アメリカ政治を動かす最重要転換期</span></div>' : ''}
          
          <div class="info-box" style="margin-bottom: 20px;">
            <strong>歴史的意義：</strong><br>${stg.significance}
          </div>

          ${stg.overview ? `
            <!-- 1. 概要 -->
            <div class="detail-section">
              <h4 class="detail-heading">
                <span class="detail-num-badge">1</span>
                概要
              </h4>
              <p class="detail-text">${stg.overview}</p>
            </div>

            <!-- 2. 背景 -->
            <div class="detail-section">
              <h4 class="detail-heading">
                <span class="detail-num-badge">2</span>
                背景
              </h4>
              <p class="detail-text">${stg.background || ''}</p>
            </div>

            <!-- 3. 中心人物とその思想 -->
            <div class="detail-section">
              <h4 class="detail-heading">
                <span class="detail-num-badge">3</span>
                中心人物とその思想
              </h4>
              <div class="detail-text" style="white-space: pre-line;">${stg.figures || ''}</div>
            </div>

            <!-- 4. 現代社会への影響 -->
            <div class="detail-section">
              <h4 class="detail-heading">
                <span class="detail-num-badge">4</span>
                現代社会への影響
              </h4>
              <div class="detail-text" style="white-space: pre-line;">${stg.impact || ''}</div>
            </div>
          ` : ''}

          ${rootHtml}

          <h3 style="margin-top: 24px; margin-bottom: 12px; font-family: var(--serif); font-size: 15px; color: var(--navy); border-bottom: 1.5px solid var(--line); padding-bottom: 6px;">主要なエポック・転換点</h3>
          ${stg.events.map(ev => `
            <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed var(--line);">
              <h4 style="font-family: var(--serif); font-size: 14.5px; color: var(--navy); margin-bottom: 4px;">
                【${ev.year}】${ev.title}
              </h4>
              <p style="font-size: 13.5px; margin: 0; line-height: 1.6;">${ev.detail}</p>
            </div>
          `).join('')}
        `);
      });
    });

    // 宗派詳細（テーブル行およびカードのタップで展開）
    app.querySelectorAll('[data-denom-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const dIdx = el.getAttribute('data-denom-idx');
        const d = denoms[dIdx];
        if (!d) return;

        const popUs = d.population ? d.population.us : (d.us_population || '調査中');
        const popWorld = d.population ? d.population.world : '';
        const authBullets = d.authority_bullets || (d.authority ? [d.authority] : []);
        const salvBullets = d.salvation_bullets || (d.salvation ? [d.salvation] : []);
        const structBullets = d.structure_bullets || (d.structure ? [d.structure] : []);
        const polBullets = d.politics_bullets || (d.impact ? [d.impact] : []);

        openSheet(`${d.name}`, `
          <!-- 信徒数・系統規模インフォボックス -->
          <div class="info-box" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--muted);">${d.en_name || ''}</span>
              <span class="matrix-denom-badge">${d.type}</span>
            </div>
            <div style="font-size: 13.5px; font-weight: 800; color: var(--navy); margin-bottom: 3px;">
              全米信徒規模：<span style="color: #B45309;">${popUs}</span>
            </div>
            ${popWorld ? `<div style="font-size: 12px; color: var(--ink);">世界規模：<strong>${popWorld}</strong></div>` : ''}
          </div>

          <!-- 信義と教理の核心（箇条書きまとめ） -->
          <div style="background: var(--soft); border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; border: 1px solid var(--line);">
            <div style="font-size: 13px; font-weight: 800; color: var(--navy); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              【信義・信仰の権威と救済観】
            </div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--muted); margin-bottom: 3px;">信仰の最高権威（何が正統かを決めるか）：</div>
            <ul style="margin: 0 0 10px; padding-left: 18px; font-size: 12px; line-height: 1.5; color: var(--ink);">
              ${authBullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--muted); margin-bottom: 3px;">救済観と洗礼（どう救われるか）：</div>
            <ul style="margin: 0 0 10px; padding-left: 18px; font-size: 12px; line-height: 1.5; color: var(--ink);">
              ${salvBullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--muted); margin-bottom: 3px;">教会統治組織（ガバナンス）：</div>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.5; color: var(--ink);">
              ${structBullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
          </div>

          <!-- 1. 概要 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">1</span>
              概要
            </h4>
            <p class="detail-text">${d.overview || d.authority}</p>
          </div>

          <!-- 2. 背景 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">2</span>
              歴史的背景と発展
            </h4>
            <p class="detail-text">${d.background || '準備中'}</p>
          </div>

          <!-- 3. 中心人物とその思想 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">3</span>
              中心人物とその思想
            </h4>
            <div class="detail-text" style="white-space: pre-line;">${d.figures || '準備中'}</div>
          </div>

          <!-- 4. 現代社会への影響（アメリカ政治での位置） -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">4</span>
              アメリカ政治・中間選挙での位置づけ
            </h4>
            <p class="detail-text">${d.impact || ''}</p>
            <div style="margin-top: 10px; padding: 10px 12px; background: rgba(220, 38, 38, 0.05); border-left: 3px solid #DC2626; border-radius: 0 8px 8px 0;">
              <div style="font-size: 11.5px; font-weight: 800; color: #DC2626; margin-bottom: 4px;">投票動向と政治争点：</div>
              <ul style="margin: 0; padding-left: 16px; font-size: 12px; line-height: 1.55; color: var(--ink);">
                ${polBullets.map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          </div>
        `);
      });
    });

    // 宗派バブルクリック
    app.querySelectorAll('.bubble-node').forEach(el => {
      el.addEventListener('click', () => {
        const bIdx = el.getAttribute('data-bubble-idx');
        const b = D.denomination_bubble_chart.bubbles[bIdx];
        openSheet(`${b.name}`, `
          <div class="info-box">
            <strong>全米信徒規模：</strong><span style="color: var(--navy); font-weight: 700;">${b.pop}</span><br>
            <strong>位置づけ：</strong>${b.sub}
          </div>
          <h3>アメリカ宗教勢力マップでの位置</h3>
          <p>${b.note}</p>
          <h3>座標データ</h3>
          <p>・<strong>政治的支持傾向：</strong>${b.x} / 100（数値が高いほど共和党支持寄り、低いほど民主党寄り）<br>
             ・<strong>信仰規範・組織：</strong>${b.y} / 100（数値が高いほど聖書無誤性・個人の回心・聖霊体験、低いほど伝統・教皇・公会議）</p>
        `);
      });
    });
  }

  // =========================================================================
  // タブ④：キーパーソン（トランプ政権・思想・宗教の中枢12人）
  // =========================================================================
  function renderKeypersons() {
    topbarTitle.textContent = 'トランプ政権・キーパーソン';
    const kp = D.keypersons;

    // フィルタリング
    let filteredKp = kp;
    if (keypersonFilter === 'admin') {
      filteredKp = kp.filter(p => p.category.includes('政権') || p.category.includes('国家元首') || p.category.includes('統治'));
    } else if (keypersonFilter === 'tech') {
      filteredKp = kp.filter(p => p.category.includes('テック') || p.category.includes('テクノロジー'));
    } else if (keypersonFilter === 'religion') {
      filteredKp = kp.filter(p => p.category.includes('宗教') || p.category.includes('福音派'));
    } else if (keypersonFilter === 'allies') {
      filteredKp = kp.filter(p => p.category.includes('議会') || p.category.includes('同盟') || p.category.includes('メディア') || p.category.includes('外交'));
    }

    let html = `
      <!-- トランプを中心とした人物相関図（インタラクティブダイアグラム） -->
      ${renderTrumpRelationshipNetwork()}

      <div class="section-head" style="margin-top: 26px;">
        <span class="section-eyebrow">Trump Administration & Movement Network</span>
        <h2 class="section-title">トランプ政権と新保守主義の中枢人物</h2>
        <p class="section-lead">MAGAポピュリズム、シリコンバレーのテクノリバタリアン、白人福音派が合流した前代未聞の権力構造を動かす最重要人物たち（タップで4項目詳細）。</p>
      </div>

      <!-- 絞り込みフィルターバー -->
      <div class="filter-pills-bar">
        <button class="filter-pill ${keypersonFilter === 'all' ? 'active' : ''}" data-kp-filter="all">すべて (${kp.length})</button>
        <button class="filter-pill ${keypersonFilter === 'admin' ? 'active' : ''}" data-kp-filter="admin">政権中枢・統治</button>
        <button class="filter-pill ${keypersonFilter === 'tech' ? 'active' : ''}" data-kp-filter="tech">テック資本・DOGE</button>
        <button class="filter-pill ${keypersonFilter === 'religion' ? 'active' : ''}" data-kp-filter="religion">宗教・信仰局</button>
        <button class="filter-pill ${keypersonFilter === 'allies' ? 'active' : ''}" data-kp-filter="allies">議会・同盟・メディア</button>
      </div>

      <div class="kp-list">
        ${filteredKp.map((p) => `
          <div class="card kp-card" data-kp-id="${p.id}">
            <div class="person-card-in">
              <div class="person-avatar">
                ${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` : (p.avatar || '人')}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div class="card-head" style="margin-bottom: 2px;">
                  <div>
                    <h3 class="card-title">${p.name}</h3>
                    <div style="font-size: 11.5px; color: var(--muted); font-weight: 500;">${p.title}</div>
                  </div>
                  <span class="card-badge">${p.category}</span>
                </div>
                <p class="card-body" style="font-size: 13px; line-height: 1.5; margin-top: 4px;">
                  ${p.overview ? p.overview.slice(0, 85) + '...' : p.bio.slice(0, 85) + '...'}
                </p>
                <div class="tag-list" style="margin-top: 6px;">
                  ${p.tags.map(t => `<span class="tag-chip">#${t}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    app.innerHTML = html;

    // フィルター操作
    app.querySelectorAll('[data-kp-filter]').forEach(pill => {
      pill.addEventListener('click', () => {
        const f = pill.getAttribute('data-kp-filter');
        if (f !== keypersonFilter) {
          keypersonFilter = f;
          renderKeypersons();
        }
      });
    });

    // 相関図ノードおよび行クリックイベント
    app.querySelectorAll('.network-node-g, .network-actor-row').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-kp-id');
        const p = kp.find(item => item.id === id);
        if (p) openKeyPersonSheet(p);
      });
    });

    // キーパーソンカードクリックイベント（4項目詳細表示）
    app.querySelectorAll('.kp-card').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-kp-id');
        const p = kp.find(item => item.id === id);
        if (!p) return;

        openSheet(`${p.name}（${p.title}）`, `
          <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
            <div class="person-avatar" style="width: 72px; height: 72px; font-size: 22px; flex-shrink: 0;">
              ${p.image ? `<img src="${p.image}" alt="${p.name}">` : (p.avatar || '人')}
            </div>
            <div>
              <div class="card-badge" style="display:inline-block; margin-bottom: 4px;">${p.category}</div>
              <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">${p.en_name || ''}</div>
              <div style="font-size: 12.5px; color: var(--navy); font-weight: 600;">${p.tags.join(' / ')}</div>
            </div>
          </div>

          <div class="info-box" style="margin-bottom: 18px;">
            <strong>役割・政治的位置づけ：</strong><br>${p.bio}
          </div>

          <!-- 1. 概要 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">1</span>
              概要
            </h4>
            <p class="detail-text">${p.overview || p.bio}</p>
          </div>

          <!-- 2. 背景 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">2</span>
              背景
            </h4>
            <p class="detail-text">${p.background || '準備中'}</p>
          </div>

          <!-- 3. 思想と政治的立ち位置 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">3</span>
              思想と政治的立ち位置
            </h4>
            <div class="detail-text" style="white-space: pre-line;">${p.ideology || '準備中'}</div>
          </div>

          <!-- 4. 現代社会への影響 -->
          <div class="detail-section">
            <h4 class="detail-heading">
              <span class="detail-num-badge">4</span>
              現代社会への影響
            </h4>
            <div class="detail-text" style="white-space: pre-line;">${p.impact || '準備中'}</div>
          </div>
        `);
      });
    });
  }

  // =========================================================================
  // タブ⑤：深掘り解説コラム
  // =========================================================================
  function renderDeepdives() {
    topbarTitle.textContent = '深掘り思想コラム';
    const dd = D.deep_dives;

    let html = `
      <div class="section-head">
        <span class="section-eyebrow">Deep Analysis & Theological Roots</span>
        <h2 class="section-title">深層を読み解く論点アーカイブ</h2>
        <p class="section-lead">宗教学・思想史の視点から、ニュースの裏側に潜む本質的構造に迫る解説。</p>
      </div>

      <div class="dd-list">
        ${dd.map((col, idx) => `
          <div class="card dd-card" data-dd-idx="${idx}">
            <div class="card-head">
              <h3 class="card-title">${col.title}</h3>
              <span class="card-badge">コラム</span>
            </div>
            <div style="font-size: 12.5px; color: var(--navy); font-weight: 600; margin-bottom: 6px;">
              ${col.subtitle}
            </div>
            <p class="card-body">${col.content.slice(0, 110)}...</p>
          </div>
        `).join('')}
      </div>
    `;

    app.innerHTML = html;

    app.querySelectorAll('.dd-card').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.getAttribute('data-dd-idx');
        const col = dd[idx];
        openSheet(col.title, `
          <div class="info-box">
            <strong>${col.subtitle}</strong>
          </div>
          <h3>解説</h3>
          <p style="font-size: 15px; line-height: 1.75;">${col.content}</p>
        `);
      });
    });
  }


  // =========================================================================
  // 用語集モーダル展開関数
  // =========================================================================
  function openGlossarySheet(term) {
    if (!term) return;
    openSheet(term.term, `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <span class="glossary-card-cat">${term.category || '重要用語'}</span>
          <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">${term.en_term || ''}</span>
        </div>
        ${term.kana ? `<div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">読み：${term.kana}</div>` : ''}
      </div>

      <!-- 10秒要約ボックス -->
      <div class="glossary-modal-summary-box">
        <div class="glossary-modal-summary-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          10秒でわかる本質の要約
        </div>
        <p class="glossary-modal-summary-text">${term.simple_summary}</p>
      </div>

      <!-- 本質と歴史的背景 -->
      <div class="glossary-modal-section">
        <h4 class="glossary-modal-section-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          本質と歴史的背景
        </h4>
        <p class="glossary-modal-section-content">${term.detailed_explanation}</p>
      </div>

      <!-- アメリカ政治への影響 -->
      <div class="glossary-modal-section">
        <h4 class="glossary-modal-section-title" style="color: #DC2626;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          アメリカ政治・中間選挙への影響
        </h4>
        <p class="glossary-modal-section-content">${term.political_impact}</p>
      </div>

      <!-- 関連タグ -->
      ${term.tags && term.tags.length > 0 ? `
        <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line);">
          <div style="font-size: 11.5px; font-weight: 700; color: var(--muted); margin-bottom: 6px;">関連キーワード：</div>
          <div class="glossary-card-tags">
            ${term.tags.map(tag => `<span class="glossary-tag">${tag}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    `);
  }

  // グローバルアクセス用（他コンポーネントからの呼び出しに対応）
  window.openGlossaryModalById = (termId) => {
    if (!D || !D.glossary || !D.glossary.terms) return;
    const term = D.glossary.terms.find(t => t.id === termId);
    if (term) openGlossarySheet(term);
  };

  // =========================================================================
  // タブ：重要用語・神学キーワード単語帳（リアルタイム検索＆カテゴリー別）
  // =========================================================================
  let glossarySearchQuery = '';
  let glossarySelectedCategory = 'すべて';

  function renderGlossary() {
    topbarTitle.textContent = '用語集・神学単語帳';
    const g = D.glossary;
    if (!g || !g.terms) {
      app.innerHTML = '<div style="padding: 40px; text-align: center;">用語集データを準備中です。</div>';
      return;
    }

    const categories = ['すべて', ...(g.categories || ['神学・終末論', '教派', '政治・制度', 'トランプ政権'])];

    // フィルタリング処理
    const filterTerms = () => {
      const q = glossarySearchQuery.trim().toLowerCase();
      return g.terms.filter(t => {
        // カテゴリーチェック
        if (glossarySelectedCategory !== 'すべて' && t.category !== glossarySelectedCategory) {
          return false;
        }
        if (!q) return true;
        // キーワード検索（用語名、かな、英語名、要約、詳細、政治影響、タグ）
        const matchTerm = (t.term || '').toLowerCase().includes(q);
        const matchKana = (t.kana || '').toLowerCase().includes(q);
        const matchEn = (t.en_term || '').toLowerCase().includes(q);
        const matchSummary = (t.simple_summary || '').toLowerCase().includes(q);
        const matchDetail = (t.detailed_explanation || '').toLowerCase().includes(q);
        const matchImpact = (t.political_impact || '').toLowerCase().includes(q);
        const matchTags = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
        return matchTerm || matchKana || matchEn || matchSummary || matchDetail || matchImpact || matchTags;
      });
    };

    const buildTermCards = (terms) => {
      if (terms.length === 0) {
        return `
          <div class="glossary-empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin-bottom: 10px; color: var(--muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <div style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px;">該当する用語が見つかりませんでした</div>
            <p style="font-size: 12.5px; color: var(--muted); margin: 0;">検索キーワードを変更するか、カテゴリーを「すべて」にしてお試しください。</p>
          </div>
        `;
      }
      return terms.map(term => `
        <div class="glossary-card" data-term-id="${term.id}">
          <div class="glossary-card-header">
            <span class="glossary-card-cat">${term.category || '重要用語'}</span>
            <span class="glossary-card-en">${term.en_term || ''}</span>
          </div>
          <h3 class="glossary-card-title">${term.term}</h3>
          ${term.kana ? `<div class="glossary-card-kana">${term.kana}</div>` : ''}
          <div class="glossary-card-summary">
            <span class="glossary-card-summary-label">10秒要約：</span>
            ${term.simple_summary}
          </div>
          ${term.tags && term.tags.length > 0 ? `
            <div class="glossary-card-tags">
              ${term.tags.map(tg => `<span class="glossary-tag">${tg}</span>`).join('')}
            </div>
          ` : ''}
          <div class="glossary-card-cta">
            <span>詳細解説・政治への影響を読む</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      `).join('');
    };

    const initialTerms = filterTerms();

    let html = `
      <div class="glossary-hero">
        <div class="study-badge" style="margin-bottom: 8px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          キリスト教×政治 用語事典
        </div>
        <h1 class="glossary-hero-title">重要用語・神学キーワード単語帳</h1>
        <p class="glossary-hero-desc">
          「終末論」「シオニズム」「ボーン・アゲイン」など、非キリスト教徒には難解な宗教・政治概念を日常の身近な例えと政治的影響でわかりやすく整理した必須単語帳（全${g.terms.length}語）。リアルタイム検索とカテゴリー別絞り込みに対応しています。
        </p>

        <!-- リアルタイム検索バー -->
        <div class="glossary-search-wrap">
          <div class="glossary-search-inner">
            <svg class="glossary-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="search" id="glossary-search-input" class="glossary-search-input" placeholder="用語名、かな、英語、キーワードで即時検索..." value="${glossarySearchQuery}">
            <button type="button" id="glossary-search-clear" class="glossary-search-clear" style="display: ${glossarySearchQuery ? 'flex' : 'none'};" aria-label="検索クリア">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <!-- カテゴリーフィルターピル -->
        <div class="glossary-cat-pills">
          ${categories.map(cat => {
            const count = cat === 'すべて' ? g.terms.length : g.terms.filter(t => t.category === cat).length;
            const isActive = cat === glossarySelectedCategory;
            return `
              <button type="button" class="glossary-pill ${isActive ? 'active' : ''}" data-cat="${cat}">
                <span>${cat}</span>
                <span class="glossary-pill-count">${count}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 検索ヒット情報バー -->
      <div class="glossary-meta-bar">
        <div id="glossary-count-info" style="font-size: 12.5px; font-weight: 700; color: var(--muted);">
          表示中：<strong id="glossary-count-number" style="color: var(--navy); font-size: 14px;">${initialTerms.length}</strong> 件
        </div>
      </div>

      <!-- 単語帳カードグリッド -->
      <div class="glossary-grid" id="glossary-cards-container">
        ${buildTermCards(initialTerms)}
      </div>
    `;

    app.innerHTML = html;

    // イベントバインド
    const searchInput = document.getElementById('glossary-search-input');
    const clearBtn = document.getElementById('glossary-search-clear');
    const container = document.getElementById('glossary-cards-container');
    const countNumber = document.getElementById('glossary-count-number');

    const updateDisplay = () => {
      const filtered = filterTerms();
      countNumber.textContent = filtered.length;
      container.innerHTML = buildTermCards(filtered);
      clearBtn.style.display = glossarySearchQuery ? 'flex' : 'none';

      // カードクリックイベント再バインド
      container.querySelectorAll('.glossary-card').forEach(card => {
        card.addEventListener('click', () => {
          const tId = card.getAttribute('data-term-id');
          const term = g.terms.find(t => t.id === tId);
          if (term) openGlossarySheet(term);
        });
      });
    };

    // 検索入力イベント（リアルタイム）
    searchInput.addEventListener('input', (e) => {
      glossarySearchQuery = e.target.value;
      updateDisplay();
    });

    // 検索クリアボタン
    clearBtn.addEventListener('click', () => {
      glossarySearchQuery = '';
      searchInput.value = '';
      updateDisplay();
      searchInput.focus();
    });

    // カテゴリーピル切り替え
    app.querySelectorAll('.glossary-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        app.querySelectorAll('.glossary-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        glossarySelectedCategory = btn.getAttribute('data-cat');
        updateDisplay();
      });
    });

    // 初回カードクリックイベントバインド
    container.querySelectorAll('.glossary-card').forEach(card => {
      card.addEventListener('click', () => {
        const tId = card.getAttribute('data-term-id');
        const term = g.terms.find(t => t.id === tId);
        if (term) openGlossarySheet(term);
      });
    });
  }

  // =========================================================================
  // ボトムシート制御
  // =========================================================================
  function openSheet(title, htmlContent) {
    sheetTitle.textContent = title;
    sheetContent.innerHTML = htmlContent;
    sheetBackdrop.classList.add('active');
    sheet.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    sheetBackdrop.classList.remove('active');
    sheet.classList.remove('active');
    document.body.style.overflow = '';
  }

  sheetClose.addEventListener('click', closeSheet);
  sheetBackdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet();
  });


  // =========================================================================
  // サイト内全文横断検索システム（自然文・複数キーワード・該当箇所ジャンプ）
  // =========================================================================
  let globalSearchIndex = [];

  function buildGlobalSearchIndex() {
    if (!D) return;
    const idx = [];

    // ① 勉強会レジュメ（4つの謎）
    if (D.study_agenda && D.study_agenda.parts) {
      const puzzles = [
        { id: 'puz-1', title: '謎① なぜ敬虔とは言えないトランプが、福音派の8割に熱烈支持されるのか？', desc: '私生活や言動がキリスト教の模範とは言えないトランプが、なぜ敬虔な信徒たちの絶対的支持を集めるのか。その背後にある『取引と保護』の力学。', target: 'part3' },
        { id: 'puz-2', title: '謎② そもそも「福音派」とは何か？ カトリックや正教会、他の宗派と何が違うのか？', desc: 'ニュースで頻出する福音派とは単一の教会名なのか？ キリスト教2000年の歴史の中でどう位置づけられ、なぜ白人と黒人で投票先が真逆になるのか。', target: 'part1' },
        { id: 'puz-3', title: '謎③ なぜかつて奴隷解放の共和党（リンカン）が保守白人の党になり、民主党がリベラル黒人の党に逆転したのか？', desc: '南北戦争から1964年公民権法、ニクソンの南部戦略、レーガン革命に至る100年の大逆転史。', target: 'part2' },
        { id: 'puz-4', title: '謎④ なぜホワイトハウスに『信仰局』が置かれ、イスラエル絶対支援と対イラン戦争へ向かうのか？', desc: '政権内部に宗教機構が公式に組み込まれ、中東での過激な軍事作戦が善と悪の戦いとして正当化される終末論と同盟の力学。', target: 'part3' }
      ];
      puzzles.forEach(puz => {
        idx.push({
          id: puz.id,
          title: puz.title,
          category: '現代アメリカの謎',
          tab: 'study',
          target_id: 'study-part-' + puz.target,
          text: puz.title + ' ' + puz.desc + ' 福音派 トランプ 支持 理由 取引と保護 キュロス王',
          snippet: puz.desc
        });
      });

      // 各パートの詳細論点
      D.study_agenda.parts.forEach((p, pIdx) => {
        (p.details || []).forEach((dt, dIdx) => {
          const secTexts = (dt.detailed_sections || []).map(s => s.heading + ' ' + s.content).join(' ');
          const bulletsText = (dt.summary_bullets || []).join(' ');
          idx.push({
            id: `study-${p.id}-d${dIdx}`,
            title: dt.title,
            category: `勉強会レジュメ：${p.title}`,
            tab: 'study',
            target_id: `study-part-${p.id}`,
            action_type: 'open_study_detail',
            part_idx: pIdx,
            detail_idx: dIdx,
            text: `${dt.title} ${bulletsText} ${secTexts} ${p.title} ${p.lead}`,
            snippet: (dt.summary_bullets && dt.summary_bullets[0]) ? dt.summary_bullets[0] : (secTexts.slice(0, 100) + '...')
          });
        });
      });
    }

    // ② 南北支持逆転史（全6ステージ）
    if (D.north_south_shift && D.north_south_shift.stages) {
      D.north_south_shift.stages.forEach((st, sIdx) => {
        idx.push({
          id: `shift-stage-${sIdx}`,
          title: `${st.year}：${st.title}`,
          category: '南北支持の逆転史',
          tab: 'parties',
          target_id: `shift-stage-${sIdx}`,
          action_type: 'open_shift_modal',
          stage_idx: sIdx,
          text: `${st.year} ${st.title} ${st.south} ${st.north} ${st.summary} ${st.overview} ${st.background} ${st.key_actors} ${st.impact}`,
          snippet: st.summary
        });
      });
    }

    // ③ 2026年中間選挙・連邦議会勢力
    if (D.current_politics) {
      const cp = D.current_politics;
      if (cp.congress_seats) {
        idx.push({
          id: 'current-congress-seats',
          title: cp.congress_seats.title,
          category: '現代・2026中間選挙',
          tab: 'current',
          target_id: 'current-congress-seats',
          text: `${cp.congress_seats.title} ${cp.congress_seats.subtitle} 上院53議席 下院220議席 過半数51 過半数218 トリプルレッド ねじれ議会 DOGE 予算`,
          snippet: cp.congress_seats.subtitle
        });
      }
      (cp.voter_charts || []).forEach((vc, vIdx) => {
        idx.push({
          id: `current-voter-${vIdx}`,
          title: `支持層クロス集計：${vc.category}`,
          category: '現代・支持層データ',
          tab: 'current',
          text: `${vc.category} ${vc.description} 白人福音派 トランプ81% 黒人 ハリス83% カトリック スイング`,
          snippet: vc.description
        });
      });
    }

    // ③-2 全米州別・支持基盤マップ
    if (D.current_politics && D.current_politics.state_map) {
      const sm = D.current_politics.state_map;
      sm.categories.forEach(cat => {
        const statesList = cat.representative_states.map(s => s.name + ' ' + s.code + ' ' + s.role).join(' ');
        idx.push({
          id: `state-cat-${cat.id}`,
          title: `【全米州別】${cat.name}`,
          category: '全米州別・支持基盤',
          tab: 'current',
          target_id: 'state-map-section',
          text: `${cat.name} ${cat.regions} ${cat.features} ${statesList} レッドステート ブルーステート スイングステート 激戦州 州別マップ`,
          snippet: `${cat.regions}｜${cat.features.slice(0, 75)}...`
        });
      });
    }

    // ④ 主要教派マトリックス（信義・信徒数）
    if (D.denominations) {
      D.denominations.forEach((dm, dmIdx) => {
        const auth = (dm.authority_bullets || []).join(' ');
        const salv = (dm.salvation_bullets || []).join(' ');
        const pol = (dm.politics_bullets || []).join(' ');
        idx.push({
          id: `denom-${dm.id || dmIdx}`,
          title: `${dm.name}（${dm.type}）`,
          category: 'キリスト教主要教派',
          tab: 'religion',
          action_type: 'open_denom_modal',
          denom_idx: dmIdx,
          text: `${dm.name} ${dm.type} ${dm.us_population || ''} ${auth} ${salv} ${pol} ${dm.overview || ''} ${dm.impact || ''}`,
          snippet: `【全米規模】${dm.us_population || ''}｜${(dm.politics_bullets && dm.politics_bullets[0]) || dm.authority || ''}`
        });
      });
    }

    // ⑤ 用語集（単語帳・32語）
    if (D.glossary && D.glossary.terms) {
      D.glossary.terms.forEach(term => {
        idx.push({
          id: `glossary-${term.id}`,
          title: `【用語帳】${term.term}（${term.en_term || ''}）`,
          category: `単語帳：${term.category || '重要用語'}`,
          tab: 'glossary',
          action_type: 'open_glossary_modal',
          term_id: term.id,
          text: `${term.term} ${term.kana || ''} ${term.en_term || ''} ${term.simple_summary} ${term.detailed_explanation} ${term.political_impact} ${(term.tags || []).join(' ')}`,
          snippet: `10秒要約：${term.simple_summary}`
        });
      });
    }

    // ⑥ 人物相関（トランプ、バンス、マスク、ティール等）
    if (D.keypersons) {
      D.keypersons.forEach(kp => {
        idx.push({
          id: `kp-${kp.id}`,
          title: `${kp.name}（${kp.role}）`,
          category: '重要人物相関',
          tab: 'keypersons',
          action_type: 'open_kp_modal',
          kp_id: kp.id,
          text: `${kp.name} ${kp.role} ${kp.faction} ${kp.faith} ${kp.thought} ${kp.influence} ${(kp.tags || []).join(' ')}`,
          snippet: `【陣営・思想】${kp.faction}｜${kp.thought ? kp.thought.slice(0, 60) + '...' : ''}`
        });
      });
    }

    globalSearchIndex = idx;
  }

  // クエリの単語分割（助詞・不要語のストップワード除去）
  function tokenizeQuery(q) {
    const cleaned = q.trim().replace(/[？\?！!。、,]/g, ' ');
    const normalized = cleaned.replace(/(が|を|に|へ|で|と|の|は|から|まで|より|する|した|された|について|理由|なぜ)\b/g, ' ');
    const rawTokens = normalized.split(/\s+/).filter(t => t.length > 0);
    const tokens = Array.from(new Set([q.trim(), ...rawTokens])).filter(t => t.length >= 2);
    return tokens.length > 0 ? tokens : [q.trim()];
  }

  // 検索実行関数
  function searchGlobal(rawQuery) {
    if (!rawQuery || rawQuery.trim().length === 0) return [];
    if (!globalSearchIndex || globalSearchIndex.length === 0) buildGlobalSearchIndex();

    const q = rawQuery.trim();
    const tokens = tokenizeQuery(q);

    const results = [];

    globalSearchIndex.forEach(item => {
      let score = 0;
      const lowerText = item.text.toLowerCase();
      const lowerTitle = item.title.toLowerCase();
      const lowerQ = q.toLowerCase();

      // 完全一致ボーナス
      if (lowerTitle.includes(lowerQ)) score += 120;
      else if (lowerText.includes(lowerQ)) score += 70;

      // トークン一致
      tokens.forEach(tok => {
        const t = tok.toLowerCase();
        if (lowerTitle.includes(t)) score += 35;
        if (lowerText.includes(t)) score += 15;
      });

      // 「福音派」「トランプ」「支持」「理由」等の特別関連付け
      if ((lowerQ.includes('福音派') || lowerQ.includes('トランプ')) && lowerQ.includes('支持')) {
        if (item.id === 'puz-1' || item.title.includes('キュロス王') || item.title.includes('取引') || item.title.includes('実存的')) {
          score += 80;
        }
      }

      if (score > 15) {
        let displaySnippet = item.snippet;
        tokens.forEach(tok => {
          if (tok.length >= 2) {
            const reg = new RegExp(`(${tok})`, 'gi');
            displaySnippet = displaySnippet.replace(reg, '<mark>$1</mark>');
          }
        });

        results.push({
          ...item,
          score,
          highlightedSnippet: displaySnippet
        });
      }
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 15);
  }

  // 検索モーダル制御
  function setupGlobalSearch() {
    buildGlobalSearchIndex();

    const openBtn = document.getElementById('open-global-search-btn');
    const modalBackdrop = document.getElementById('search-modal-backdrop');
    const modal = document.getElementById('search-modal');
    const closeBtn = document.getElementById('search-modal-close');
    const input = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('global-search-results');
    const quickChips = document.querySelectorAll('.search-tag-chip');

    const openModal = (initialQuery = '') => {
      modalBackdrop.classList.add('active');
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (initialQuery) {
        input.value = initialQuery;
        renderSearchResults(initialQuery);
      } else {
        renderSearchResults(input.value);
      }
      setTimeout(() => input.focus(), 80);
    };

    const closeModal = () => {
      modalBackdrop.classList.remove('active');
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (openBtn) openBtn.addEventListener('click', () => openModal());
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // ショートカットキー（⌘K / Ctrl+K / ESC）
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modal.classList.contains('active')) closeModal();
        else openModal();
      }
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    if (input) {
      input.addEventListener('input', (e) => {
        renderSearchResults(e.target.value);
      });
    }

    quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-query');
        input.value = q;
        renderSearchResults(q);
      });
    });

    const renderSearchResults = (query) => {
      if (!query || query.trim().length === 0) {
        resultsContainer.innerHTML = `
          <div class="search-empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin-bottom: 8px; color: var(--muted);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <div class="search-empty-title">自然な文章やキーワードで検索</div>
            <p style="font-size: 12px; margin: 0; line-height: 1.5;">「福音派がトランプを支持する理由」「なぜ南部は共和党に」「中絶判決」「キュロス王」など、知りたい疑問をそのまま入力してください。</p>
          </div>
        `;
        return;
      }

      const list = searchGlobal(query);
      if (list.length === 0) {
        resultsContainer.innerHTML = `
          <div class="search-empty-state">
            <div class="search-empty-title">一致する項目が見つかりませんでした</div>
            <p style="font-size: 12px; margin: 0;">キーワードを短くするか、別の単語でお試しください。</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = list.map((item, i) => `
        <div class="search-result-item" data-res-idx="${i}">
          <div class="search-result-meta">
            <span class="search-result-badge">${item.category}</span>
            <span class="search-result-action">
              <span>該当箇所へジャンプ</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
          <div class="search-result-title">${item.title}</div>
          <div class="search-result-snippet">${item.highlightedSnippet}</div>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-res-idx'), 10);
          const item = list[idx];
          if (!item) return;

          closeModal();
          jumpToItem(item);
        });
      });
    };

    const jumpToItem = (item) => {
      if (item.tab) {
        window.location.hash = '#/' + item.tab;
      }

      setTimeout(() => {
        if (item.action_type === 'open_study_detail') {
          const part = D.study_agenda.parts[item.part_idx];
          const d = part && part.details ? part.details[item.detail_idx] : null;
          if (d) {
            let modalContent = '';
            if (d.summary_bullets && d.summary_bullets.length > 0) {
              modalContent += `
                <div class="detail-modal-summary-box">
                  <div class="detail-modal-summary-title">要点サマリー</div>
                  <ul class="detail-modal-summary-list">
                    ${d.summary_bullets.map(b => `<li>${b}</li>`).join('')}
                  </ul>
                </div>
              `;
            }
            if (d.detailed_sections && d.detailed_sections.length > 0) {
              modalContent += `
                <div class="detail-modal-sections">
                  ${d.detailed_sections.map((sec, sIdx) => `
                    <div class="detail-modal-section">
                      <h4 class="detail-modal-section-heading">
                        <span class="detail-modal-section-num">${sec.num || (sIdx + 1)}</span>
                        <span>${(sec.heading || '').replace(/^[0-9]+[\.\s、・]+\s*/, '')}</span>
                      </h4>
                      <p class="detail-modal-section-content">${sec.content || sec.body || ''}</p>
                    </div>
                  `).join('')}
                </div>
              `;
            }
            openSheet(d.title, modalContent);
            return;
          }
        } else if (item.action_type === 'open_shift_modal') {
          const st = D.north_south_shift.stages[item.stage_idx];
          if (st) openShiftStageSheet(st);
          return;
        } else if (item.action_type === 'open_denom_modal') {
          const denomEl = document.querySelector(`[data-denom-idx="${item.denom_idx}"]`);
          if (denomEl) denomEl.click();
          return;
        } else if (item.action_type === 'open_glossary_modal') {
          if (window.openGlossaryModalById) window.openGlossaryModalById(item.term_id);
          return;
        } else if (item.action_type === 'open_kp_modal') {
          const kp = (D.keypersons || []).find(k => k.id === item.kp_id);
          if (kp) openKeyPersonSheet(kp);
          return;
        }

        if (item.target_id) {
          const targetEl = document.getElementById(item.target_id) || document.querySelector(`.${item.target_id}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetEl.classList.add('target-pulse-highlight');
            setTimeout(() => targetEl.classList.remove('target-pulse-highlight'), 2400);
          }
        }
      }, 250);
    };
  }

    window.addEventListener('hashchange', route);
  loadData();
})();
