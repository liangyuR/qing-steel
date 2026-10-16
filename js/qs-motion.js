/*
 * 青钢 QING / STEEL · motion helpers（可选，无依赖）
 * 只做 CSS 做不到的部分：位移指示器的定位、数值逐字符滚动、分步时序、主题切换。
 * 时长从 CSS token 读取；prefers-reduced-motion 下 token 为 0，所有分步直接完成。
 */
(function (global) {
  var root = document.documentElement;

  function reducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function dur(name) {
    return parseFloat(getComputedStyle(root).getPropertyValue('--dur-' + name)) || 0;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* 主题：'' 跟随系统 / 'dark' / 'light'；支持 View Transition 时整页交叉淡入 */
  function setTheme(value, opts) {
    var apply = function () {
      if (value) root.setAttribute('data-theme', value); else root.removeAttribute('data-theme');
      if (opts && opts.storageKey) {
        try { if (value) localStorage.setItem(opts.storageKey, value); else localStorage.removeItem(opts.storageKey); } catch (e) {}
      }
      if (opts && opts.onChange) opts.onChange(value);
    };
    if (document.startViewTransition && !reducedMotion()) document.startViewTransition(apply);
    else apply();
  }
  function restoreTheme(storageKey) {
    var v = '';
    try { v = localStorage.getItem(storageKey) || ''; } catch (e) {}
    if (v === 'dark' || v === 'light') root.setAttribute('data-theme', v);
    return v;
  }

  /* 分段按钮：选中底色滑到 aria-pressed="true" 的按钮并伸缩 */
  function segUpdate(seg, instant) {
    if (!seg) return;
    var ind = seg.querySelector(':scope > .ind');
    if (!ind) { ind = document.createElement('span'); ind.className = 'ind'; seg.insertBefore(ind, seg.firstChild); }
    var cur = seg.querySelector('button[aria-pressed="true"]');
    if (!cur) { ind.style.transform = 'translateX(0) scaleX(0)'; return; }
    var first = instant || !seg.classList.contains('has-ind');
    if (first) ind.style.transition = 'none';
    ind.style.transform = 'translateX(' + cur.offsetLeft + 'px) scaleX(' + cur.offsetWidth + ')';
    if (first) { void ind.offsetWidth; ind.style.transition = ''; seg.classList.add('has-ind'); }
  }
  /* 单选分段：点击即切换 aria-pressed，并派发 qs-change 事件 */
  function bindSeg(seg) {
    segUpdate(seg, true);
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !seg.contains(b) || b.getAttribute('aria-pressed') === 'true') return;
      seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      requestAnimationFrame(function () { segUpdate(seg); });
      seg.dispatchEvent(new CustomEvent('qs-change', { detail: { button: b }, bubbles: true }));
    });
  }

  /* 导航：胶囊指示器移到 aria-current="page" 的项；rail 态缩成 44×28 */
  function navUpdate(nav, instant) {
    if (!nav) return;
    var ind = nav.querySelector(':scope > .ind');
    if (!ind) { ind = document.createElement('span'); ind.className = 'ind'; nav.insertBefore(ind, nav.firstChild); }
    var cur = nav.querySelector('.item[aria-current="page"]');
    if (!cur) { nav.classList.remove('has-ind'); return; }
    var rail = nav.classList.contains('rail');
    var cs = getComputedStyle(nav);
    var navW = parseFloat(cs.getPropertyValue(rail ? '--sidebar-w-rail' : '--sidebar-w')) || (rail ? 72 : 220);
    var padX = rail ? 8 : 12;
    var w = rail ? 44 : navW - padX * 2, h = rail ? 28 : 40;
    var x = rail ? (navW - 44) / 2 : padX, y = cur.offsetTop + (rail ? 2 : 0);
    if (instant) ind.style.transition = 'none';
    ind.style.width = w + 'px'; ind.style.height = h + 'px';
    ind.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
    nav.classList.add('has-ind');
  }
  /* 展开 ⇄ rail：文字先淡出 → 宽度变化 → 文字淡入 */
  function navToggleRail(nav) {
    if (reducedMotion()) { nav.classList.toggle('rail'); navUpdate(nav, true); return; }
    if (nav.classList.contains('switching')) return;
    nav.classList.add('switching');
    setTimeout(function () {
      nav.classList.toggle('rail');
      navUpdate(nav);
      setTimeout(function () { nav.classList.remove('switching'); }, dur('medium'));
    }, dur('short'));
  }
  function bindNav(nav) {
    navUpdate(nav, true);
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.collapse')) { navToggleRail(nav); return; }
      var item = e.target.closest('.item');
      if (!item || item.getAttribute('aria-current') === 'page') return;
      nav.querySelectorAll('.item').forEach(function (b) { b.removeAttribute('aria-current'); });
      item.setAttribute('aria-current', 'page');
      navUpdate(nav);
      nav.dispatchEvent(new CustomEvent('qs-change', { detail: { item: item }, bubbles: true }));
    });
  }

  /* 数值滚动：只有变化的字符位纵向滚动，相同值不触发 */
  function setOdo(el, str) {
    if (!el) return;
    str = String(str);
    var old = el.getAttribute('data-val');
    if (old === str) return;
    el.setAttribute('data-val', str);
    var animate = old != null && !reducedMotion() && el.children.length > 0;
    var h = '';
    for (var i = 0; i < str.length; i++) {
      var c = str[i], oc = old != null ? old[i] : undefined;
      var ce = c === ' ' ? '&nbsp;' : esc(c);
      if (!animate || oc === undefined || oc === c) h += '<span class="ch"><span>' + ce + '</span></span>';
      else h += '<span class="ch"><span class="o">' + (oc === ' ' ? '&nbsp;' : esc(oc)) + '</span><span class="n">' + ce + '</span></span>';
    }
    el.innerHTML = h;
  }

  /* 判定大卡：render(el) 负责写入新内容和 .ok/.ng；变成 NG 时整卡强调一次 */
  function swapVerdict(el, render, toNg) {
    if (el.classList.contains('out') || el.classList.contains('in')) return;
    if (reducedMotion()) { render(el); return; }
    el.classList.add('out');
    setTimeout(function () {
      render(el);
      el.classList.remove('out'); el.classList.add('in');
      if (toNg) el.classList.add('emph');
      setTimeout(function () { el.classList.remove('in'); }, dur('medium') + dur('short'));
      setTimeout(function () { el.classList.remove('emph'); }, dur('long'));
    }, dur('short'));
  }

  /* 字体加载或尺寸变化后重算指示器位置 */
  function relayout(scope) {
    scope = scope || document;
    scope.querySelectorAll('.qs-seg.has-ind').forEach(function (s) { segUpdate(s, true); });
    scope.querySelectorAll('.qs-nav').forEach(function (n) { navUpdate(n, true); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { relayout(); });
  global.addEventListener('resize', function () { relayout(); });

  global.QingSteel = {
    setTheme: setTheme, restoreTheme: restoreTheme,
    segUpdate: segUpdate, bindSeg: bindSeg,
    navUpdate: navUpdate, navToggleRail: navToggleRail, bindNav: bindNav,
    setOdo: setOdo, swapVerdict: swapVerdict,
    relayout: relayout, dur: dur, reducedMotion: reducedMotion
  };
})(window);
