// == TweetIndicators (SVG class-based noReply; overwrite 'post' on noReply/limited) ==
window.TweetIndicators = (() => {

  // ---- DETECTORS ----
  const detectors = {
    promoted: el => {
      const ctx = el.querySelector('[data-testid="socialContext"]');
      return !!(ctx && (ctx.textContent || '').toLowerCase().includes('promoted'));
    },
    pinned: el => {
      const ctx = el.querySelector('[data-testid="socialContext"]');
      return !!(ctx && (ctx.textContent || '').toLowerCase().includes('pinned'));
    },
    groupPost: el =>
      !!el.querySelector('[data-testid="communityPost"], a[href*="/i/communities/"]'),
    repost: el => {
      const ctx = el.querySelector('[data-testid="socialContext"]');
      return !!(ctx && (ctx.textContent || '').toLowerCase().includes('repost'));
    },
    quote: el =>
      !!el.querySelector('[data-testid="tweetQuote"], .css-175oi2r.r-6gpygo.r-jusfrs'),

    comment: el => {
      const replyingText = /\bReplying to\b/i.test(el.innerText || '');
      const replyingCtx = !!el.querySelector(
        '[data-testid="replyingToContext"], [data-testid*="replying"]'
      );
      const ariaReply = !!el.querySelector('[aria-label*="Replying to"]');
      const legacyConnector = !!el.querySelector(
        '.r-18kxxzh.r-1wron08.r-onrtq4.r-15zivkp:not(.r-obd0qt)'
      );
      return replyingText || replyingCtx || ariaReply || legacyConnector;
    },

    // NoReply: detect disabled reply icon via SVG class
    noReply: el => {
      const icon = el.querySelector('button[data-testid="reply"] svg');
      if (!icon) return false;
      const cls = icon.getAttribute('class') || '';
      // Disabled reply icons carry r-12c3ph5 (extra muted style class)
      return /\br-12c3ph5\b/.test(cls);
    },

    limited: el => {
      const texts = [
        ...el.querySelectorAll('[data-testid="socialContext"], .css-146c3p1')
      ].map(n => (n.textContent || '').toLowerCase());
      return texts.some(t =>
        /\b(only people|followers can reply|verified accounts|mentioned users|accounts .* mentioned can reply)\b/.test(t)
      );
    },

    blocked: el =>
      !!el.querySelector('button[aria-label="Share post"][aria-disabled="true"]'),

    unverified: el =>
      !el.querySelector('[data-testid="icon-verified"]') &&
      !el.querySelector('[data-testid="wrapperView"]')
  };

  const typeOrder = [
    'blocked','noReply','limited','unverified',
    'promoted','pinned','groupPost','repost',
    'quote','comment','post'
  ];

  function getTweetTypes(htmlElement) {
    let types = [];
    for (const [type, fn] of Object.entries(detectors)) {
      try { if (fn(htmlElement)) types.push(type); } catch {}
    }

    if (types.length === 0) types.push('post');

    // Overwrite: if noReply or limited, strip out 'post'
    if (types.includes('noReply') || types.includes('limited')) {
      types = types.filter(t => t !== 'post');
    }

    types.sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));
    return types;
  }

  // ---- INDICATOR UI ----
  function createIndicators(types) {
    const indicator = document.createElement('div');
    const palette = {
      repost:    { text: 'Repost',     color: '#000000' },
      groupPost: { text: 'Group',      color: '#800080' },
      quote:     { text: 'Quote',      color: '#0000FF' },
      comment:   { text: 'Reply',      color: '#8B4513' },
      post:      { text: 'Post',       color: '#00FF00' },
      unverified:{ text: 'Unverified', color: '#FF0000' },
      pinned:    { text: 'Pinned',     color: '#FFD700' },
      promoted:  { text: 'Promoted',   color: '#808080' },
      noReply:   { text: 'No Reply',   color: '#FF0000' },
      blocked:   { text: 'Blocked',    color: '#FF0000' },
      limited:   { text: 'Limited',    color: '#FF0000' }
    };

    Object.assign(indicator.style, {
      display: 'flex',
      flexDirection: localStorage.getItem('indicatorLayout') || 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      position: 'absolute',
      top: '38px',
      left: '0px',
      zIndex: '4000',
      borderRadius: '3px',
      gap: '4px',
      padding: '2px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)'
    });

    types.forEach(type => {
      const { text, color } = palette[type] || { text: type, color: '#000' };
      const span = document.createElement('span');
      span.textContent = text;
      Object.assign(span.style, {
        fontSize: '12px',
        padding: '0px 4px',
        color,
        whiteSpace: 'nowrap',
        borderRadius: '2px',
        backgroundColor: 'rgba(0,0,0,0.05)'
      });
      indicator.appendChild(span);
    });

    indicator.classList.add('custom-indicator');
    indicator.setAttribute('aria-label', types.join(' '));
    return indicator;
  }

  function applyIndicator(element, types) {
    const existing = element.querySelector('.custom-indicator');
    if (existing) existing.remove();
    const avatar = element.querySelector('[data-testid="Tweet-User-Avatar"]');
    if (!avatar) return;
    if (getComputedStyle(avatar).position === 'static') avatar.style.position = 'relative';
    avatar.appendChild(createIndicators(types));
  }

  // ---- RUNNERS ----
  function handleTweets() {
    const articles = document.querySelectorAll('article[data-testid="tweet"]:not(.indicator-processed)');
    articles.forEach(article => {
      const types = getTweetTypes(article);
      applyIndicator(article, types);
      article.classList.add('indicator-processed');
    });
  }

  function observeTweets() {
    const observer = new MutationObserver(() => handleTweets());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    handleTweets();
    observeTweets();
    addReloadButton();
  }

  function rerunIndicators() {
    document.querySelectorAll('article[data-testid="tweet"].indicator-processed')
      .forEach(el => el.classList.remove('indicator-processed'));
    document.querySelectorAll('.custom-indicator').forEach(el => el.remove());
    handleTweets();
  }

  function updateDetectors(newDefs) {
    Object.assign(detectors, newDefs);
    rerunIndicators();
  }

  function addReloadButton() {
    if (document.getElementById('indicator-reload-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'indicator-reload-btn';
    btn.textContent = '↻ Reload Indicators';
    Object.assign(btn.style, {
      position: 'fixed', bottom: '10px', right: '10px',
      zIndex: 99999, padding: '6px 10px', fontSize: '12px',
      background: '#222', color: '#fff', border: '1px solid #555',
      borderRadius: '4px', cursor: 'pointer', opacity: '0.7'
    });
    btn.onmouseenter = () => btn.style.opacity = '1';
    btn.onmouseleave = () => btn.style.opacity = '0.7';
    btn.onclick = () => rerunIndicators();
    document.body.appendChild(btn);
  }

  return { init, rerun: rerunIndicators, updateDetectors };

})();

// Run once
TweetIndicators.init();
