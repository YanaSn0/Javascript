function getTweetType(htmlElement) {
  const repostIndicator = htmlElement.querySelector('[data-testid="socialContext"]');
  const replyConnector = htmlElement.querySelector('.r-15zivkp, .r-18kxxzh.r-1wron08.r-onrtq4.r-15zivkp');
  const quoteIndicator = htmlElement.querySelector('[data-testid="tweetQuote"], .css-175oi2r.r-6gpygo.r-jusfrs');
  const communityIndicator = htmlElement.querySelector('[data-testid="communityPost"], a[href*="/i/communities/"]');
  const isVerified = htmlElement.querySelector('[data-testid="icon-verified"]');
  const isSpace = htmlElement.querySelector('[data-testid="wrapperView"]');

  if (communityIndicator) {
    if (quoteIndicator) return 'groupQuote';
    if (repostIndicator && replyConnector) return 'groupRepost';
    return 'groupPost';
  }

  if (!isSpace && !isVerified) {
    if (quoteIndicator) return 'unverifiedQuote';
    return 'unverified';
  }

  if (repostIndicator && quoteIndicator) return 'quoteRepost';
  if (repostIndicator && replyConnector) return 'commentRepost';
  if (quoteIndicator) return 'quote';
  if (repostIndicator) return 'repost';
  if (replyConnector) return 'comment';
  return 'post';
}

function createIndicator(type) {
  const indicator = document.createElement('div');
  const indicators = {
    repost: { text: 'RT', color: '#000000' },
    groupPost: { text: 'GP', color: '#800080' },
    groupRepost: { text: 'GRT', color: '#8B4513' },
    groupQuote: { text: 'GQT', color: '#FF69B4' },
    post: { text: 'Post', color: '#00FF00' },
    comment: { text: 'Reply', color: '#8B4513' },
    commentRepost: { text: 'RRT', color: '#000000' },
    quote: { text: 'QT', color: '#0000FF' },
    quoteRepost: { text: 'QTRT', color: '#00B7EB' },
    unverified: { text: 'Unv', color: '#FF0000' },
    unverifiedQuote: { text: 'UQT', color: '#FF0000' }
  };
  const { text, color } = indicators[type] || indicators['post'];

  indicator.style.display = 'flex';
  indicator.style.flexDirection = 'column';
  indicator.style.alignItems = 'center';
  indicator.style.position = 'absolute';
  indicator.style.top = '38px';
  indicator.style.bottom = '0px';
  indicator.style.left = '6px';
  indicator.style.right = '0px';
  indicator.style.zIndex = '4000';
  indicator.style.borderRadius = '3px';
  indicator.style.gap = '0px';

  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  textSpan.style.fontSize = '14px';
  textSpan.style.padding = '0px';
  textSpan.style.color = color;
  textSpan.style.whiteSpace = 'nowrap';

  indicator.appendChild(textSpan);
  indicator.classList.add('custom-indicator');
  indicator.setAttribute('aria-label', text);
  return indicator;
}

function applyIndicator(element, type) {
  const existingIndicator = element.querySelector('.custom-indicator');
  if (existingIndicator) existingIndicator.remove();

  const avatarContainer = element.querySelector('[data-testid="Tweet-User-Avatar"]');
  if (!avatarContainer) return;
  avatarContainer.style.position = 'relative';

  setTimeout(() => {
    avatarContainer.appendChild(createIndicator(type));
  }, 500);
}

function handleTweets() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]:not(.indicator-processed)');
  if (articles.length < 3) return;

  articles.forEach(article => {
    const type = getTweetType(article);
    applyIndicator(article, type);
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
