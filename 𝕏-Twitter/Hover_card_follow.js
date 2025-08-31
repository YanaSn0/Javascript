(function () {
  'use strict';

  const username = 'YanaSnow1'; // 🔧 Change this to test different users
  const normalizedUsername = username.toLowerCase();
  const startTime = performance.now();

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

  function clickFollowButton() {
    const buttons = document.querySelectorAll('button[aria-label^="Follow @"]');
    for (const btn of buttons) {
      const label = btn.getAttribute('aria-label');
      if (label && label.toLowerCase() === `follow @${normalizedUsername}` && btn.offsetParent !== null) {
        btn.click();
        console.log('✅ Follow button clicked');

        // Close the hover card after a short delay
        setTimeout(() => {
          const userLink = Array.from(document.querySelectorAll('a[href]')).find(link =>
            link.getAttribute('href').toLowerCase() === `/${normalizedUsername}`
          );
          if (userLink) simulateUnhover(userLink);

          const endTime = performance.now();
          console.log(`⏱️ Total time to follow: ${Math.round(endTime - startTime)} ms`);
        }, 500);
        return;
      }
    }
    console.log('❌ Follow button not found or not visible');
  }

  function openHoverCardAndFollow() {
    const userLinks = Array.from(document.querySelectorAll('a[href]')).filter(link =>
      link.getAttribute('href').toLowerCase() === `/${normalizedUsername}`
    );

    for (const link of userLinks) {
      if (link.offsetParent !== null) {
        simulateHover(link);
        console.log('✅ Hover card trigger attempted');

        // Wait for hover card to render before clicking follow
        setTimeout(clickFollowButton, 1500);
        return;
      }
    }
    console.log('❌ Could not find visible user link');
  }

  setTimeout(openHoverCardAndFollow, 1000);
})();
