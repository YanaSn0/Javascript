const whitelist = ['yanaheat', 'yanasn0w1', 'yourbestie'].map(u => u.toLowerCase());
const scrollContainer = document.querySelector('.x6nl9eh.x1a5l9x9.x7vuprf.x1mg3h75.x1lliihq.x1iyjqo2.xs83m0k.xz65tgg.x1rife3k.x1n2onr6');

let emptyScrolls = 0; // 🧠 Track how many times we scroll without finding targets
const maxEmptyScrolls = 3;

function randomDelay() {
  return Math.floor(500 + Math.random() * 500);
}

function scrollFollowersContainer() {
  if (!scrollContainer) {
    console.error('Scroll container not found.');
    return;
  }
  scrollContainer.scrollTop += 60;
  console.log('📜 Scrolled down 60px');
}

function findNextUnfollowButton() {
  const buttons = Array.from(document.querySelectorAll('button._aswp'))
    .filter(btn => btn.textContent.trim().toLowerCase() === 'following');

  for (const btn of buttons) {
    let entry = btn;
    for (let i = 0; i < 5; i++) {
      entry = entry.parentElement;
      if (!entry) break;
      const usernameEl = entry.querySelector('a[href^="/"]');
      if (usernameEl) {
        const username = usernameEl.getAttribute('href')?.replace(/\//g, '')?.toLowerCase();
        if (username && !whitelist.includes(username)) {
          return { btn, username };
        }
      }
    }
  }

  return null;
}

function clickUnfollowConfirmation(callback) {
  const confirmBtn = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent.trim().toLowerCase() === 'unfollow');

  if (confirmBtn) {
    confirmBtn.click();
    console.log('✅ Confirmed unfollow');
    setTimeout(callback, randomDelay());
  } else {
    console.log('⚠️ Unfollow confirmation not found');
    setTimeout(callback, randomDelay());
  }
}

function unfollowAll() {
  const target = findNextUnfollowButton();

  if (!target) {
    emptyScrolls++;
    if (emptyScrolls >= maxEmptyScrolls) {
      console.log('🎉 All done! No more accounts to unfollow.');
      return;
    }
    scrollFollowersContainer();
    setTimeout(unfollowAll, randomDelay());
    return;
  }

  emptyScrolls = 0; // ✅ Reset counter when we find a target

  const { btn, username } = target;
  btn.click();
  console.log(`🚫 Clicked Following for: ${username}`);

  setTimeout(() => {
    clickUnfollowConfirmation(() => {
      scrollFollowersContainer();
      setTimeout(unfollowAll, randomDelay());
    });
  }, randomDelay());
}

unfollowAll();
