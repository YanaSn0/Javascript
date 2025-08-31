(function () {
  'use strict';

  const username = 'YanaSn0w1';
  const normalizedUsername = username.toLowerCase();
  const maxChecks = 20;
  const scrollOffset = 100;
  let checkedCount = 0;
  let followedCount = 0;

  function simulateHover(element) {
    const mouseOverEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(mouseOverEvent);
    console.log('🟡 Hover simulated on:', element);
  }

  function simulateUnhover(element) {
    const mouseOutEvent = new MouseEvent('mouseout', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(mouseOutEvent);
    console.log('🔵 Unhover simulated to close card');
  }

  function clickVerifiedFollowersLink() {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const verifiedLink = links.find(link =>
      link.getAttribute('href')?.toLowerCase() === `/${normalizedUsername}/verified_followers` &&
      link.offsetParent !== null
    );

    if (verifiedLink) {
      verifiedLink.click();
      console.log('🔍 Verified followers link clicked from hover card');
      setTimeout(() => followFromList(), 2000);
    } else {
      console.log('❌ Verified followers link not found or not visible');
    }
  }

  function openHoverCardAndClickVerified() {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const userLink = links.find(link =>
      link.getAttribute('href')?.toLowerCase() === `/${normalizedUsername}` &&
      link.offsetParent !== null
    );

    if (userLink) {
      simulateHover(userLink);
      console.log('✅ Hover card trigger attempted');
      setTimeout(clickVerifiedFollowersLink, 1500);
    } else {
      console.log('❌ Could not find visible user link');
    }
  }

  function followFromList() {
    const cells = Array.from(document.querySelectorAll('[data-testid="cellInnerDiv"]'));
    if (cells.length === 0) {
      console.log('❌ No user cells found');
      return clickBackOnce();
    }

    function processNext() {
      if (checkedCount >= maxChecks || checkedCount >= cells.length) {
        console.log(`✅ Done. Checked ${checkedCount}, followed ${followedCount}`);
        return clickBackOnce();
      }

      const cell = cells[checkedCount];
      const rect = cell.getBoundingClientRect();
      const scrollY = window.scrollY + rect.top - scrollOffset;
      window.scrollTo({ top: scrollY, behavior: 'smooth' });

      // Try both aria-label and data-testid selectors
      const followBtn = cell.querySelector('button[aria-label*="Follow"], button[data-testid$="-follow"]');

      if (followBtn && followBtn.offsetParent !== null) {
        const label = followBtn.getAttribute('aria-label') || '';
        const cellUsername = label.match(/@[\w]+/)?.[0]?.toLowerCase() || '';

        const currentUser = document.querySelector('button[data-testid="SideNav_AccountSwitcher_Button"] div[data-testid^="UserAvatar-Container-"]')?.getAttribute('data-testid')?.replace('UserAvatar-Container-', '').toLowerCase();

        if (cellUsername === `@${currentUser}`) {
          console.log(`🙅 Skipped self: ${cellUsername}`);
        } else if (label.includes('Following') || label.includes('Blocked')) {
          console.log(`🚫 Skipped: ${label}`);
        } else if (label.includes('Follow back') || label.toLowerCase().includes('follow')) {
          followBtn.click();
          followedCount++;
          console.log(`👤 Followed: ${label}`);
        } else {
          console.log(`⚠️ Skipped button: ${label}`);
        }
      } else {
        console.log('🚫 No followable button in cell');
      }

      checkedCount++;
      setTimeout(processNext, 1000);
    }

    processNext();
  }

  function clickBackOnce() {
    const backBtn = document.querySelector('button[data-testid="app-bar-back"]');
    if (backBtn) {
      backBtn.click();
      console.log('🔙 Back click — returned to home');
    } else {
      console.log('❌ Back button not found');
    }
  }

  setTimeout(openHoverCardAndClickVerified, 1000);
})();
