function unfollowAllSmart() {
  const whitelist = ['yourbestie', 'yanaheat', 'yanasn0w1'];
  let unfollowedCount = 0;
  let scrollAttempts = 0;
  let consecutiveFailures = 0;
  let lastUsername = null;
  let isRunning = false; // Start paused
  let timeoutId = null; // Track timeouts
  const maxScrollAttempts = 10;
  const maxUnfollows = 300; // Daily limit

  // Create UI
  const uiContainer = document.createElement('div');
  uiContainer.style.position = 'fixed';
  uiContainer.style.top = '10px';
  uiContainer.style.right = '10px';
  uiContainer.style.zIndex = '1000';
  uiContainer.style.background = '#fff';
  uiContainer.style.padding = '10px';
  uiContainer.style.border = '1px solid #ccc';
  uiContainer.style.borderRadius = '5px';
  uiContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  uiContainer.innerHTML = `
    <button id="startBtn" style="margin-right: 10px;">Start</button>
    <button id="stopBtn" disabled>Stop</button>
    <div>Status: Paused</div>
    <div>Unfollowed: <span id="unfollowCount">0</span></div>
  `;
  document.body.appendChild(uiContainer);

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDiv = uiContainer.querySelector('div');
  const countSpan = document.getElementById('unfollowCount');

  // UI event listeners
  startBtn.addEventListener('click', () => {
    if (!isRunning) {
      if (timeoutId) clearTimeout(timeoutId); // Clear any rate limit pause
      isRunning = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      statusDiv.textContent = 'Status: Running';
      console.log(`Starting unfollow script for Threads at ${new Date().toLocaleString()}`);
      consecutiveFailures = 0; // Reset failures on manual start
      lastUsername = null; // Clear last username
      clickNext();
    }
  });

  stopBtn.addEventListener('click', () => {
    if (isRunning) {
      isRunning = false;
      if (timeoutId) clearTimeout(timeoutId); // Clear pending timeouts
      startBtn.disabled = false;
      stopBtn.disabled = true;
      statusDiv.textContent = 'Status: Paused';
      console.log('Script paused by user');
    }
  });

  function getFollowButtons() {
    return Array.from(document.querySelectorAll('div[role="button"].x1i10hfl'))
      .filter(btn => btn.textContent.trim() === 'Following' && btn.querySelector('div.xlyipyv'))
      .map(btn => {
        const parent = btn.closest('div.x78zum5.x1q0g3np');
        let usernameEl = parent?.querySelector('a[href^="/@"] span.x1lliihq');
        const username = usernameEl?.textContent?.trim().toLowerCase()?.replace('@', '') || `unknown_${unfollowedCount}_${Date.now()}`;
        if (username.startsWith('unknown_')) {
          console.log(`Debug: No username found. Parent HTML: ${parent?.outerHTML.slice(0, 200) || 'none'}...`);
        }
        return { button: btn, username };
      })
      .filter(item => !whitelist.includes(item.username));
  }

  function scrollToBottom() {
    const currentHeight = document.body.scrollHeight;
    window.scrollTo({ top: currentHeight, behavior: 'smooth' });
    console.log(`Scrolling to height: ${currentHeight}`);
  }

  function clickNext() {
    if (!isRunning) return; // Exit if paused

    // Stop if rate limit reached
    if (unfollowedCount >= maxUnfollows) {
      console.log(`Stopped: Reached daily unfollow limit of ${maxUnfollows} accounts.`);
      isRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      statusDiv.textContent = 'Status: Stopped (Limit Reached)';
      return;
    }

    const followButtons = getFollowButtons();

    if (followButtons.length === 0) {
      if (scrollAttempts >= maxScrollAttempts) {
        console.log(`Finished unfollowing ${unfollowedCount} accounts.`);
        isRunning = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusDiv.textContent = 'Status: Finished';
        return;
      }

      scrollToBottom();
      scrollAttempts++;
      console.log(`Scrolling (Attempt ${scrollAttempts}/${maxScrollAttempts})`);
      timeoutId = setTimeout(clickNext, 2000); // Fixed 2s for scroll
      return;
    }

    scrollAttempts = 0; // Reset scroll attempts
    const { button: btn, username } = followButtons[0];

    // Track consecutive failures by username
    if (username === lastUsername) {
      consecutiveFailures++;
    } else {
      consecutiveFailures = 0;
      lastUsername = username;
    }

    // Pause 5 minutes after exactly 2 consecutive failures
    if (consecutiveFailures >= 2) {
      console.log(`Pausing for 5 minutes due to 2 consecutive unfollow failures for ${username}`);
      isRunning = false;
      startBtn.disabled = false; // Allow manual resume
      stopBtn.disabled = true;
      statusDiv.textContent = `Status: Paused (Rate Limit for ${username})`;
      timeoutId = setTimeout(() => {
        console.log(`Resuming after 5-minute pause`);
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusDiv.textContent = 'Status: Running';
        consecutiveFailures = 0; // Reset after pause
        clickNext();
      }, 300000); // 5 minutes
      return;
    }

    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    console.log(`Clicking "Following" button for ${username}`);
    btn.click();

    // Wait 2s, then click "Unfollow"
    timeoutId = setTimeout(() => {
      if (!isRunning) return; // Exit if paused

      const unfollowBtn = Array.from(document.querySelectorAll('div[role="button"].x1i10hfl'))
        .find(el => el.textContent.trim() === 'Unfollow' && el.querySelector('span.x1lliihq'));

      if (unfollowBtn) {
        unfollowBtn.click();

        // Wait 0.5s to check button state
        timeoutId = setTimeout(() => {
          if (!isRunning) return; // Exit if paused

          const buttonText = btn.textContent.trim();
          console.log(`Button state for ${username}: "${buttonText}"`);
          if (buttonText !== 'Following') {
            unfollowedCount++;
            consecutiveFailures = 0; // Reset on success
            lastUsername = null; // Clear last username
            console.log(`Unfollowed #${unfollowedCount} (${username})`);
            countSpan.textContent = unfollowedCount; // Update UI
            // Proceed immediately after success
            clickNext();
          } else {
            console.warn(`Unfollow failed for ${username} (button still says "Following")`);
            console.log(`Failure count: ${consecutiveFailures + 1} for ${username}`);
            // Wait 0.5s (total ~3s), then proceed
            timeoutId = setTimeout(clickNext, 500);
          }
        }, 500);
      } else {
        console.warn(`Unfollow button not found for ${username}`);
        console.log(`Failure count: ${consecutiveFailures + 1} for ${username}`);
        // Wait 0.5s (total ~3s), then proceed
        timeoutId = setTimeout(clickNext, 500);
      }
    }, 2000); // Dialog check delay
  }

  // Start paused
  console.log(`Script loaded in paused state. Click "Start" to begin.`);
}

unfollowAllSmart();
