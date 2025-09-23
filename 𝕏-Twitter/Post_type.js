// Namespace wrapper
window.TweetIndicators = (() => {

  // --- DETECTORS MAP (mutable) ---
  const detectors = {
    promoted: el => {
      const ctx = el.querySelector('[data-testid="socialContext"]');
      return ctx && ctx.textContent.toLowerCase().includes('promoted');
    },
    pinned: el => {
      const ctx = el.querySelector('[data-testid="socialContext"]');
      return ctx && ctx.textContent.toLowerCase().includes('pinned');
    },
    groupPost: el =>
      !!el.querySelector('[data-testid="communityPost"], a[href*="/i/communities/"]'),
    repost: el => {
      const ctx = el.querySelector('[data-testid="socialContext"]');
      return ctx && ctx.textContent.toLowerCase().includes('repost');
    },
    quote: el =>
      !!el.querySelector('[data-testid="tweetQuote"], .css-175oi2r.r-6gpygo.r-jusfrs'),
    comment: el => {
      // Attached replies (connector line)
      const replyConnector = !!el.querySelector(
        '.r-18kxxzh.r-1wron08.r-onrtq4.r-15zivkp:not(.r-obd0qt)'
      );
      // Unattached replies ("Replying to …" block)
      const replyingToBlock = !!el.textContent.includes('Replying to');
      return replyConnector || replyingToBlock;
    },
    noReply: el => !!el.querySelector('[data-testid="reply"][aria-disabled="true"]'),
    blocked: el =>
      !!el.querySelector('button[aria-label="Share post"][aria-disabled="true"]'),
    limited: el =>
      Array.from(el.querySelectorAll('.css-146c3p1')).some(n =>
        n.textContent.includes('can reply')
      ),
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
      if (fn(htmlElement)) types.push(type);
    }
    if (types.length === 0) types.push('post');
    types.sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));
    return types;
  }

  function createIndicators(types) {
    const indicator = document.createElement('div');
    const indicators = {
      repost: { text: 'Repost', color: '#000000' },
      groupPost: { text: 'Group', color: '#800080' },
      quote: { text: 'Quote', color: '#0000FF' },
      comment: { text: 'Reply', color: '#8B4513' },
      post: { text: 'Post', color: '#00FF00' },
      unverified: { text: 'Unverified', color: '#FF0000' },
      pinned: { text: 'Pinned', color: '#FFD700' },
      promoted: { text: 'Promoted', color: '#808080' },
      noReply: { text: 'No Reply', color: '#FF0000' },
      blocked: { text: 'Blocked', color: '#FF0000' },
      limited: { text: 'Limited', color: '#FF0000' }
    };

    indicator.style.display = 'flex';
    indicator.style.flexDirection = localStorage.getItem('indicatorLayout') || 'row';
    indicator.style.flexWrap = 'wrap';
    indicator.style.alignItems = 'center';
    indicator.style.position = 'absolute';
    indicator.style.top = '38px';
    indicator.style.left = '0px';
    indicator.style.zIndex = '4000';
    indicator.style.borderRadius = '3px';
    indicator.style.gap = '4px';
    indicator.style.padding = '2px';
    indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';

    types.forEach(type => {
      const { text, color } = indicators[type] || { text: type, color: '#000' };
      const span = document.createElement('span');
      span.textContent = text;
      span.style.fontSize = '12px';
      span.style.padding = '0px 4px';
      span.style.color = color;
      span.style.whiteSpace = 'nowrap';
      span.style.borderRadius = '2px';
      span.style.backgroundColor = 'rgba(0,0,0,0.05)';
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
    avatar.style.position = 'relative';
    avatar.appendChild(createIndicators(types));
  }

  function handleTweets() {
    const articles = document.querySelectorAll(
      'article[data-testid="tweet"]:not(.indicator-processed)'
    );
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

  // Expose public API
  return { init, rerun: rerunIndicators, updateDetectors };

})(); // closes the IIFE

// Run once
TweetIndicators.init();
