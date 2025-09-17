(function () {
  'use strict';

  const maxChecks = 100;
  const maxFollow = 1;
  const follow = true;
  const scrollOffset = 100;
  const checkDelay = 100;
  const followDelay = 2000;
  const loadMoreDelay = 1000;
  const followArriveDelay = 2000;
  const timerDuration = 3.1 * 60; // 3.1 minute

  let checkedCount = 0;
  let followedCountHr = parseInt(localStorage.getItem('followedCountHr')) || 0;
  let followedCountDay = parseInt(localStorage.getItem('followedCountDay')) || 0;
  const seenHandles = new Set();
  let timerInterval = null;
  let timeLeft = 0;
  let timerDiv = null;
  let hrCounterDiv = null;
  let dayCounterDiv = null;
  let isProcessing = false;
  let justReset = false;

  function checkAndResetCounters() {
    const now = new Date();
    const currentHour = now.getHours();
    const lastResetHour = parseInt(localStorage.getItem('lastResetHour')) || -1;

    if (now.getMinutes() === 0 && currentHour !== lastResetHour) {
      followedCountHr = 0;
      try {
        localStorage.setItem('followedCountHr', followedCountHr);
        localStorage.setItem('lastResetHour', currentHour);
        console.log('Hourly counter reset to 0 at hour:', currentHour);
      } catch (e) {
        console.error('Failed to update followedCountHr or lastResetHour in localStorage:', e);
      }
      updateCounterDisplay();
    }

    if (now.getHours() === 0 && now.getMinutes() === 0) {
      followedCountDay = 0;
      try {
        localStorage.setItem('followedCountDay', followedCountDay);
        console.log('Daily counter reset to 0');
      } catch (e) {
        console.error('Failed to update followedCountDay in localStorage:', e);
      }
      updateCounterDisplay();
    }
  }

  function createTimer() {
    if (document.getElementById('follow-timer')) {
      console.log('Timer already active; skipping creation.');
      return;
    }

    timerDiv = document.createElement('div');
    timerDiv.id = 'follow-timer';
    timerDiv.style.position = 'fixed';
    timerDiv.style.top = '10px';
    timerDiv.style.left = '10px';
    timerDiv.style.fontSize = '12px';
    timerDiv.style.padding = '2px 5px';
    timerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    timerDiv.style.color = '#fff';
    timerDiv.style.borderRadius = '3px';
    timerDiv.style.zIndex = '10000';
    document.body.appendChild(timerDiv);

    hrCounterDiv = document.createElement('div');
    hrCounterDiv.id = 'hr-counter';
    hrCounterDiv.style.position = 'fixed';
    hrCounterDiv.style.top = '30px';
    hrCounterDiv.style.left = '10px';
    hrCounterDiv.style.fontSize = '12px';
    hrCounterDiv.style.padding = '2px 5px';
    hrCounterDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hrCounterDiv.style.color = '#fff';
    hrCounterDiv.style.borderRadius = '3px';
    hrCounterDiv.style.zIndex = '10000';
    document.body.appendChild(hrCounterDiv);

    dayCounterDiv = document.createElement('div');
    dayCounterDiv.id = 'day-counter';
    dayCounterDiv.style.position = 'fixed';
    dayCounterDiv.style.top = '50px';
    dayCounterDiv.style.left = '10px';
    dayCounterDiv.style.fontSize = '12px';
    dayCounterDiv.style.padding = '2px 5px';
    dayCounterDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    dayCounterDiv.style.color = '#fff';
    dayCounterDiv.style.borderRadius = '3px';
    dayCounterDiv.style.zIndex = '10000';
    document.body.appendChild(dayCounterDiv);

    const savedTimestamp = localStorage.getItem('timerStart');
    if (savedTimestamp && !isNaN(parseInt(savedTimestamp))) {
      timeLeft = Math.max(0, timerDuration - Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000));
    } else {
      timeLeft = timerDuration;
      try {
        localStorage.setItem('timerStart', Date.now());
        console.log('Timer started with duration:', timerDuration);
      } catch (e) {
        console.error('Failed to set timerStart in localStorage:', e);
      }
    }

    updateTimerDisplay();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      checkAndResetCounters();
      if (timeLeft <= 0) {
        timeLeft = timerDuration;
        try {
          localStorage.setItem('timerStart', Date.now());
          console.log('Timer reset to', timerDuration, 'seconds');
        } catch (e) {
          console.error('Failed to reset timerStart in localStorage:', e);
        }
        justReset = true;
        goToProfile();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    if (timerDiv) {
      timerDiv.textContent = `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    if (hrCounterDiv) {
      hrCounterDiv.textContent = `HR ${followedCountHr}/20`;
    }
    if (dayCounterDiv) {
      dayCounterDiv.textContent = `Day ${followedCountDay}/300`;
    }
  }

  function updateCounterDisplay() {
    if (hrCounterDiv) {
      hrCounterDiv.textContent = `HR ${followedCountHr}/20`;
    }
    if (dayCounterDiv) {
      dayCounterDiv.textContent = `Day ${followedCountDay}/300`;
    }
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (timerDiv) timerDiv.remove();
    if (hrCounterDiv) hrCounterDiv.remove();
    if (dayCounterDiv) dayCounterDiv.remove();
    try {
      localStorage.removeItem('timerStart');
      console.log('Timer stopped and timerStart removed from localStorage');
    } catch (e) {
      console.error('Failed to remove timerStart from localStorage:', e);
    }
  }

  function goToProfile() {
    const savedTimestamp = localStorage.getItem('timerStart');
    if (!justReset && savedTimestamp && !isNaN(parseInt(savedTimestamp)) && Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000) < timerDuration) {
      console.log('Timer still running; skipping profile navigation.');
      return;
    }

    justReset = false;

    const profileBtn = document.querySelector('[data-testid="AppTabBar_Profile_Link"]');
    if (profileBtn) {
      profileBtn.click();
      try {
        localStorage.setItem('timerStart', Date.now());
        console.log('Navigated to profile, timerStart updated');
      } catch (e) {
        console.error('Failed to update timerStart in localStorage:', e);
      }
      createTimer();
      setTimeout(goToVerifiedFollowers, followArriveDelay);
    } else {
      console.warn('Profile button not found; stopping timer.');
      stopTimer();
    }
  }

  function goToVerifiedFollowers() {
    const verifiedLink = Array.from(document.querySelectorAll('a[href]')).find(link =>
      link.getAttribute('href')?.includes('/verified_followers') && link.offsetParent !== null
    );

    if (verifiedLink) {
      verifiedLink.click();
      setTimeout(followFromList, 1000);
    } else {
      console.warn('Verified followers link not found; navigating to home.');
      goToHome();
    }
  }

  function followFromList() {
    if (isProcessing || !window.location.pathname.includes('/verified_followers')) {
      console.warn('Not on verified followers page or already processing; navigating to home.');
      goToHome();
      return;
    }

    const pageIndicator = document.querySelector('a[href*="/verified_followers"][aria-current="page"]') ||
                         document.querySelector('div[role="tablist"] div[role="presentation"] a[href*="/verified_followers"]');
    if (!pageIndicator) {
      console.warn('Page indicator not found; navigating to home.');
      goToHome();
      return;
    }

    isProcessing = true;
    checkedCount = 0;
    seenHandles.clear();

    function processNext() {
      if (checkedCount >= maxChecks || (follow && followedCountHr >= maxFollow)) {
        console.log(`Checked: ${checkedCount}/${maxChecks} Followed: HR ${followedCountHr}/20 Day ${followedCountDay}/300`);
        isProcessing = false;
        goToHome();
        return;
      }

      const cells = Array.from(document.querySelectorAll('[data-testid="cellInnerDiv"] button[aria-label*="Follow"]')).map(btn => btn.closest('[data-testid="cellInnerDiv"]'));
      let cell = cells.find(c => {
        const followBtn = c.querySelector('button[aria-label*="Follow"]');
        const handle = followBtn ? followBtn.getAttribute('aria-label').match(/@[\w\d_-]+/)?.[0] : null;
        return handle && !seenHandles.has(handle);
      });

      if (!cell && checkedCount < maxChecks) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        setTimeout(processNext, loadMoreDelay);
        return;
      } else if (!cell) {
        console.log(`Checked: ${checkedCount}/${maxChecks} Followed: HR ${followedCountHr}/20 Day ${followedCountDay}/300`);
        isProcessing = false;
        goToHome();
        return;
      }

      cell.style.outline = '3px solid lime';
      const rect = cell.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top - scrollOffset, behavior: 'smooth' });

      const followBtn = cell.querySelector('button[aria-label*="Follow"]');
      const handle = followBtn ? followBtn.getAttribute('aria-label').match(/@[\w\d_-]+/)?.[0] : '';

      let didFollow = false;
      if (follow && followBtn && followBtn.offsetParent !== null && followBtn.getAttribute('aria-label').includes('Follow back')) {
        followBtn.click();
        console.log(`Followed: ${handle}`);
        followedCountHr++;
        followedCountDay++;
        try {
          localStorage.setItem('followedCountHr', followedCountHr);
          localStorage.setItem('followedCountDay', followedCountDay);
          console.log(`Updated counters: HR ${followedCountHr}, Day ${followedCountDay}`);
        } catch (e) {
          console.error('Failed to update counters in localStorage:', e);
        }
        updateCounterDisplay();
        didFollow = true;
      }

      seenHandles.add(handle);
      checkedCount++;
      console.log(`${checkedCount}/${maxChecks} - Handle: ${handle}`);

      const delay = didFollow ? followDelay : checkDelay;
      setTimeout(processNext, delay);
    }

    processNext();
  }

  function goToHome() {
    const homeBtn = document.querySelector('a[data-testid="AppTabBar_Home_Link"]') ||
                   document.querySelector('a[href="/home"][role="link"]');
    if (homeBtn) {
      homeBtn.click();
    } else {
      console.warn('Home button not found; stopping timer.');
      stopTimer();
    }
  }

  const savedTimestamp = localStorage.getItem('timerStart');
  if (savedTimestamp && !isNaN(parseInt(savedTimestamp)) && Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000) < timerDuration) {
    console.log('Resuming timer from saved state');
    createTimer();
  } else {
    console.log('Starting new timer cycle');
    goToProfile();
  }
})();
