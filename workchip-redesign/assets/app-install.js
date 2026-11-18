/* 직원 앱 — 앱 설치 유도 (기기별). 시안 확인용: 주소에 ?dev=ios | android | inapp | pc 를 붙이거나 화면의 "시안 · 기기" 버튼으로 바꿔 봐요 */
(function () {
  const A = window.APP;
  const UA = navigator.userAgent;
  const detect = () => {
    if (/KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(UA)) return 'inapp';
    if (/iPhone|iPad|iPod/i.test(UA)) return 'ios';
    if (/Android/i.test(UA)) return 'android';
    return matchMedia('(pointer: coarse)').matches ? 'android' : 'pc';
  };
  let DEV = new URLSearchParams(location.search).get('dev') || sessionStorage.getItem('wc-dev') || detect();
  const LABEL = { ios: 'iPhone', android: 'Android', inapp: '카카오톡 안', pc: 'PC' };
  const APP_URL = 'https://app.workchip.co.kr';
  const dismissed = (k) => sessionStorage.getItem('wc-inst-' + k);
  const dismiss = (k) => sessionStorage.setItem('wc-inst-' + k, '1');
  const char = (k, cls) => A.charImg(k, cls);
  const shadow = '<i class="ins-shadow"></i>';
  const storeBtns = (only) => `<div class="ins-stores">${only !== 'android' ? `<button class="store" data-i="store" data-v="App Store">${ic('mono/smartphone')}<span><small>다운로드</small><b>App Store</b></span></button>` : ''}${only !== 'ios' ? `<button class="store" data-i="store" data-v="Google Play">${ic('mono/play')}<span><small>다운로드</small><b>Google Play</b></span></button>` : ''}</div>`;

  /* 덮개 · 배너 그리기 */
  const layerRoot = () => {
    let el = document.getElementById('ins');
    if (!el) { el = document.createElement('div'); el.id = 'ins'; document.body.appendChild(el); }
    return el;
  };
  function render(r) {
    const root = layerRoot(); root.innerHTML = '';
    document.body.dataset.dev = DEV;
    const pre = r === 'intro' || r === 'login';
    // 시안 기기 전환 버튼 (로그인 전 화면에만)
    if (pre) root.insertAdjacentHTML('beforeend', `<button class="dev-chip" data-i="dev">${ic('mono/smartphone')}시안 · 기기: ${LABEL[DEV]}${ic('glyph/chevron-down')}</button>`);
    // iPhone — 로그인 전에 앱으로 (실서비스와 같은 흐름, 캐릭터 화면으로)
    if (DEV === 'ios' && pre && !dismissed('ios')) {
      root.insertAdjacentHTML('beforeend', `<div class="ins-gate"><div class="ins-g-in">
        <div class="ins-top">${logo(20)}</div>
        <div class="ins-hero"><span class="wc-bubble">앱에서 만나요!</span>${char('working', 'float ins-char')}${shadow}</div>
        <h1>워크칩은<br>앱에서 사용해요</h1>
        <p>App Store에서 앱을 받아 회사 계정으로 로그인하세요.<br>출퇴근 알림과 QR 출근은 앱에서만 돼요.</p>
        <ul class="ins-why"><li>${ic('color/noti-bell')}<span>퇴근 10분 전 · 승인 결과 알림</span></li><li>${ic('color/qr')}<span>매장 QR을 찍으면 바로 출근</span></li><li>${ic('color/device-check')}<span>내 기기로만 출퇴근해서 안전해요</span></li></ul>
        <div class="ins-acts"><button class="btn btn-primary btn-lg btn-block" data-i="store" data-v="App Store">${ic('mono/download')}App Store에서 받기</button>
          <button class="btn btn-white btn-lg btn-block" data-i="open">이미 설치했다면 앱 열기</button>
          <button class="ins-skip" data-i="skip" data-v="ios">시안 · 웹으로 계속 보기</button></div></div></div>`);
    }
    // Android — 홈 화면에 설치 (로그인 전엔 아래 띠, 로그인 후 홈에선 한 번 시트)
    if (DEV === 'android' && pre && !dismissed('and-bar')) {
      root.insertAdjacentHTML('beforeend', `<div class="ins-bar">${char('default', 'ins-mini')}<span><b>앱으로 설치하면 더 편해요</b><small>홈 화면에서 한 번에 열리고 알림도 받아요</small></span><button class="btn btn-primary btn-sm" data-i="pwa">설치</button><button class="ins-x" data-i="skip" data-v="and-bar" aria-label="닫기">${ic('glyph/close')}</button></div>`);
    }
    if (DEV === 'android' && r === 'home' && !dismissed('and-sheet')) setTimeout(pwaSheet, 500);
    // 카카오톡 · 네이버 등 앱 안 브라우저 — 설치 불가 안내
    if (DEV === 'inapp' && !dismissed('inapp')) {
      root.insertAdjacentHTML('beforeend', `<div class="ins-inapp">${ic('color/alert')}<span><b>카카오톡 안에서는 설치할 수 없어요</b><small>기본 브라우저로 열면 앱으로 설치하고 알림도 받아요</small></span><button class="btn btn-primary btn-sm" data-i="browser">브라우저로 열기</button></div>`);
    }
    // PC — 휴대폰으로 옮겨 가기 (QR · 문자 · 스토어)
    if (DEV === 'pc') {
      root.insertAdjacentHTML('beforeend', `<aside class="ins-pc">
        <div class="ins-pc-h">${char(pre ? 'default' : 'working', 'float ins-pc-char')}${shadow}</div>
        <h2>워크칩은 휴대폰에서<br>더 편해요</h2>
        <p>휴대폰 카메라로 QR을 찍으면 앱 설치 화면이 열려요.</p>
        <div class="ins-qr">${fakeQR(31, 25)}</div>
        <button class="btn btn-grey btn-block" data-i="sms">${ic('mono/chat')}설치 링크 문자로 받기</button>
        ${storeBtns()}
        <small class="ins-note">PC에서는 기록 확인만 하고, 출퇴근은 휴대폰 앱에서 해요.</small></aside>`);
    }
    bindControls(root);
  }
  function pwaSheet() {
    if (location.hash !== '#/home' || document.querySelector('.layer')) return;
    const s = A.info(null, `<div class="ins-sheet"><div class="ins-hero sm"><span class="wc-bubble">홈 화면에 둘래요?</span>${char('default', 'float ins-char sm')}${shadow}</div>
      <h2>워크칩 앱을 설치하세요</h2><p>홈 화면에서 한 번에 열리고<br>출퇴근 알림도 받을 수 있어요.</p>
      <div class="ins-prev"><img src="../assets/brand/app-icon-512.png" alt=""><span>워크칩</span></div></div>`,
      '<button class="btn btn-grey btn-lg" id="later">나중에</button><button class="btn btn-primary btn-lg" id="ok">설치</button>');
    s.$('#later').onclick = () => { dismiss('and-sheet'); s.close(); };
    s.$('#ok').onclick = () => { dismiss('and-sheet'); s.close(); installed(); };
  }
  function installed() {
    const s = A.info(null, `<div class="done">${char('working', 'float sm')}<h3>설치했어요</h3><p>홈 화면의 워크칩을 열어 주세요.<br>처음 한 번만 다시 로그인하면 돼요.</p></div>
      <p class="ins-help">설치 창이 안 뜨나요? 브라우저 메뉴 ⋮ › <b>홈 화면에 추가</b>를 눌러요.</p>`);
    void s;
  }
  const ACT = {
    dev: (b) => popover(b, `<div class="p-sec">시안 · 어떤 기기로 볼까요?</div>${Object.entries(LABEL).map(([k, l]) => `<button class="p-item" data-d="${k}" aria-checked="${DEV === k}">${l}</button>`).join('')}`, (el) => {
      el.querySelectorAll('[data-d]').forEach((x) => (x.onclick = () => { DEV = x.dataset.d; sessionStorage.setItem('wc-dev', DEV); ['ios', 'and-bar', 'and-sheet', 'inapp'].forEach((k) => sessionStorage.removeItem('wc-inst-' + k)); closePopover(); render(location.hash.replace('#/', '') || 'intro'); }));
    }, { width: 220 }),
    store: (b) => toast(`${b.dataset.v}로 이동해요 (시안)`),
    open: () => toast('워크칩 앱을 여는 중… (시안)'),
    skip: (b) => { dismiss(b.dataset.v); render(location.hash.replace('#/', '') || 'intro'); },
    pwa: () => { dismiss('and-bar'); render(location.hash.replace('#/', '') || 'intro'); installed(); },
    browser: () => { const s = A.info('기본 브라우저로 열기', `<ol class="steps-m"><li><b>1</b><span>오른쪽 아래 ${ic('mono/more')} 을 눌러요</span></li><li><b>2</b><span>‘다른 브라우저로 열기’를 골라요</span></li><li><b>3</b><span>열린 화면에서 안내대로 홈 화면에 추가해요</span></li></ol>
        ${ui.field('또는 주소 복사', `<div class="copy-in"><input class="input sm" readonly value="${APP_URL}"><button type="button" class="btn btn-grey btn-sm" id="cp">${ic('mono/copy')}복사</button></div>`)}`); s.$('#cp').onclick = () => { navigator.clipboard?.writeText(APP_URL); toast('주소를 복사했어요'); }; },
    sms: () => { const s = A.info('설치 링크 받기', `${ui.field('휴대폰 번호', '<input class="input sm" id="ph" type="tel" placeholder="010-0000-0000">', '문자로 앱 설치 링크를 보내 드려요')}`, '<button class="btn btn-primary btn-lg" id="ok">보내기</button>'); s.$('#ok').onclick = () => { s.close(); toast('설치 링크를 문자로 보냈어요'); }; },
  };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b && ACT[b.dataset.i]) { e.preventDefault(); ACT[b.dataset.i](b); } });
  window.addEventListener('routed', (e) => render(e.detail));
})();
