function getTweetTypes(htmlElement) {
  const socialContext = htmlElement.querySelector('[data-testid="socialContext"]');
  const text = socialContext ? socialContext.innerText.toLowerCase() : '';
  const repost = text.includes('repost');
  const pinned = text.includes('pinned');
  const promoted = text.includes('promoted');
  const replyConnector = !!htmlElement.querySelector('.r-18kxxzh.r-1wron08.r-onrtq4.r-15zivkp:not(.r-obd0qt)');
  const quoteIndicator = !!htmlElement.querySelector('[data-testid="tweetQuote"], .css-175oi2r.r-6gpygo.r-jusfrs');
  const communityIndicator = !!htmlElement.querySelector('[data-testid="communityPost"], a[href*="/i/communities/"]');
  const isVerified = !!htmlElement.querySelector('[data-testid="icon-verified"]');
  const isSpace = !!htmlElement.querySelector('[data-testid="wrapperView"]');
  const noReply = !!htmlElement.querySelector('[data-testid="reply"][aria-disabled="true"]');

  let types = [];
  if (promoted) types.push('promoted');
  if (pinned) types.push('pinned');
  if (communityIndicator) types.push('groupPost');
  if (repost) types.push('repost');
  if (quoteIndicator) types.push('quote');
  if (replyConnector) types.push('comment');
  if (noReply) types.push('noReply');
  if (!isSpace && !isVerified) types.push('unverified');
  if (types.length === 0) types.push('post');

  const order = ['noReply', 'unverified', 'promoted', 'pinned', 'groupPost', 'repost', 'quote', 'comment', 'post'];
  types.sort((a, b) => order.indexOf(a) - order.indexOf(b));

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
    noReply: { text: 'No Reply', color: '#FF0000' }
  };

  // Load global layout preference
  const layout = localStorage.getItem('indicatorLayout') || 'row';

  indicator.style.display = 'flex';
  indicator.style.flexDirection = layout;
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
  indicator.style.cursor = 'move';

  types.forEach(type => {
    const { text, color } = indicators[type] || { text: type, color: '#000' };
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    textSpan.style.fontSize = '12px';
    textSpan.style.padding = '0px 4px';
    textSpan.style.color = color;
    textSpan.style.whiteSpace = 'nowrap';
    textSpan.style.borderRadius = '2px';
    textSpan.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    indicator.appendChild(textSpan);
  });

  indicator.classList.add('custom-indicator');
  indicator.setAttribute('aria-label', types.join(' '));

  // Load saved position per type combination
  const typeKey = types.join(',');
  const savedPositions = JSON.parse(localStorage.getItem('indicatorPositions')) || {};
  const defaults = {
    'unverified,quote': {left: -22, top: 40},
    'groupPost': {left: -4, top: 44},
    'comment': {left: -2, top: 43},
    'post': {left: 1, top: 43},
    'quote': {left: -4, top: 42},
    'unverified': {left: -19, top: 40},
    'unverified,comment': {left: -19, top: 42},
    'unverified,groupPost': {left: -19, top: 38},
    'unverified,repost': {left: -19, top: 42}
  };
  const position = savedPositions[typeKey] || defaults[typeKey] || { left: 0, top: 38 };
  indicator.style.left = `${position.left}px`;
  indicator.style.top = `${position.top}px`;

  // Make draggable
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  indicator.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = parseInt(indicator.style.left, 10);
    initialTop = parseInt(indicator.style.top, 10);
    document.body.style.userSelect = 'none';
  });

  const onMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      indicator.style.left = `${initialLeft + dx}px`;
      indicator.style.top = `${initialTop + dy}px`;
    }
  };

  const onMouseUp = (e) => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
      e.preventDefault();
      e.stopPropagation();
      // Save position per type
      const newPosition = {
        left: parseInt(indicator.style.left, 10),
        top: parseInt(indicator.style.top, 10)
      };
      const positions = JSON.parse(localStorage.getItem('indicatorPositions')) || {};
      positions[typeKey] = newPosition;
      localStorage.setItem('indicatorPositions', JSON.stringify(positions));
    }
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // Prevent click on indicator from propagating
  indicator.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Double-click to toggle layout
  indicator.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentLayout = localStorage.getItem('indicatorLayout') || 'row';
    const newLayout = currentLayout === 'row' ? 'column' : 'row';
    localStorage.setItem('indicatorLayout', newLayout);
    // To apply immediately, would need to re-render all, but since page reload or scroll will apply, or alert to refresh
    alert('Layout changed to ' + newLayout + '. Refresh or scroll to apply to all.');
  });

  return indicator;
}

function applyIndicator(element, types) {
  const existingIndicator = element.querySelector('.custom-indicator');
  if (existingIndicator) existingIndicator.remove();

  const avatarContainer = element.querySelector('[data-testid="Tweet-User-Avatar"]');
  if (!avatarContainer) return;
  avatarContainer.style.position = 'relative';

  avatarContainer.appendChild(createIndicators(types));
}

function handleTweets() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]:not(.indicator-processed)');
  if (articles.length < 3) return;

  articles.forEach(article => {
    const types = getTweetTypes(article);
    applyIndicator(article, types);
    article.classList.add('indicator-processed');
  });
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function setupScrollListener() {
  window.addEventListener('scroll', debounce(() => {
    handleTweets();
  }, 300));
}

function init() {
  handleTweets();
  setupScrollListener();
}

init();
