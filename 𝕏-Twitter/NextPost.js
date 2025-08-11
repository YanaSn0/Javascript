(function () {
    let tweetIdentifier = null;

    // Inject persistent CSS class
    const style = document.createElement('style');
    style.textContent = `
        .copilot-highlight {
            border: 2px solid limegreen !important;
            border-radius: 6px !important;
            box-shadow: 0 0 10px limegreen !important;
            overflow: hidden !important;
        }
    `;
    document.head.appendChild(style);

    function getTweetIdentifier(post) {
        const timestamp = post.querySelector('time');
        return timestamp ? timestamp.getAttribute('datetime') : null;
    }

    function findTweetByIdentifier(id) {
        const allTweets = document.querySelectorAll('article[data-testid="tweet"]');
        for (const tweet of allTweets) {
            const time = tweet.querySelector('time');
            if (time && time.getAttribute('datetime') === id) {
                return tweet;
            }
        }
        return null;
    }

    function highlightPost(post) {
        post.classList.add('copilot-highlight');
    }

    function unhighlightPost(post) {
        post.classList.remove('copilot-highlight');
    }

    // Capture tweet on reply click
    document.addEventListener('pointerdown', (event) => {
        const replyButton = event.target.closest('button[data-testid="reply"], button[aria-label*="Reply"]');
        if (replyButton) {
            const post = replyButton.closest('article[data-testid="tweet"]');
            if (post) {
                tweetIdentifier = getTweetIdentifier(post);
            }
        }
    });

    // After reply is sent, re-find tweet and scroll
    document.addEventListener('click', (event) => {
        const submitButton = event.target.closest('button[data-testid="tweetButton"]');
        if (submitButton && tweetIdentifier) {
            setTimeout(() => {
                const post = findTweetByIdentifier(tweetIdentifier);
                if (post) {
                    highlightPost(post);
                    const rect = post.getBoundingClientRect();
                    const scrollTarget = window.scrollY + rect.bottom - 50;
                    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
                }
                tweetIdentifier = null;
            }, 1200); // Wait for modal to close
        }
    });

    // Remove highlight if clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('button[data-testid="reply"], button[data-testid="tweetButton"]')) {
            const post = findTweetByIdentifier(tweetIdentifier);
            if (post) unhighlightPost(post);
            tweetIdentifier = null;
        }
    });
})();
