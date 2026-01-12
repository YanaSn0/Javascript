(function() {
    'use strict';

    // Config object
    const config = {
        paused: true,
        pLimit: 2,  // Profile limit
        pCount: 0,  // Current profile follows
        hLimit: 50,  // Hourly follow limit
        hCount: 0,   // Hourly follows
        followDelay: 1000, // Reduced delay between follow actions
        dStart: null, // Daily reset timestamp
        hStart: null, // Hourly reset timestamp
        followProfileOwner: false // Toggle for following profile owner
    };

    // Other variables
    let busy = false;
    let timer = null;
    let homeOffset = -50; // Offset for homepage scrolling
    let followersOffset = -100; // Offset for followers page scrolling
    let fDelay = 500; // Increased for stability
    let currentProfile = null;
    let tweetIndex = 0; // Track current tweet
    let lastHandle = null; // Track last processed handle
    let tabId = Date.now() + '-' + Math.random(); // Unique ID for this tab
    let scrollAttempts = 0; // Track scroll attempts
    const maxScrollAttempts = 5; // Max scrolls before resetting

    function log(msg) {
        console.log(`[v1.0.13] ${msg}`);
    }

    // Single-tab lock mechanism
    function acquireLock() {
        try {
            const activeTab = localStorage.getItem('xfollow-active-tab');
            if (activeTab && activeTab !== tabId) {
                log('Script already running in another tab, exiting');
                setupUI();
                return false;
            }
            localStorage.setItem('xfollow-active-tab', tabId);
            log(`Lock acquired for tab ${tabId}`);
            return true;
        } catch (e) {
            log(`Error acquiring lock: ${e.message}`);
            return false;
        }
    }

    function releaseLock() {
        try {
            if (localStorage.getItem('xfollow-active-tab') === tabId) {
                localStorage.removeItem('xfollow-active-tab');
                log(`Lock released for tab ${tabId}`);
            }
        } catch (e) {
            log(`Error releasing lock: ${e.message}`);
        }
    }

    // Utility functions
    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getDayStart() {
        try {
            const now = new Date();
            const pdt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
            const start = new Date(pdt.getFullYear(), pdt.getMonth(), pdt.getDate(), 17, 0, 0);
            if (pdt < start) start.setDate(start.getDate() - 1);
            return start.getTime();
        } catch (e) {
            log(`Error in getDayStart: ${e.message}`);
            return Date.now();
        }
    }

    function getHourStart() {
        try {
            const now = new Date();
            const pdt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
            return new Date(pdt.getFullYear(), pdt.getMonth(), pdt.getDate(), pdt.getHours(), 0, 0).getTime();
        } catch (e) {
            log(`Error in getHourStart: ${e.message}`);
            return Date.now();
        }
    }

    async function resetLimits() {
        try {
            const now = Date.now();
            const pdt = new Date(now).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
            const pdtDate = new Date(pdt);

            if (config.hStart && now - config.hStart >= 3600000) {
                config.hCount = 0;
                config.hStart = getHourStart();
                log('Hourly follow count reset');
                save();
            }
        } catch (e) {
            log(`Error in resetLimits: ${e.message}`);
        }
    }

    // Storage functions
    const save = () => {
        try {
            localStorage.setItem('xfollow-config', JSON.stringify(config));
        } catch (e) {
            log(`Error saving config: ${e.message}`);
        }
    };

    const load = () => {
        try {
            const stored = localStorage.getItem('xfollow-config');
            if (stored) {
                Object.assign(config, JSON.parse(stored));
                config.paused = config.paused !== undefined ? config.paused : true;
                config.pLimit = Math.max(1, Math.min(20, config.pLimit || 2));
                config.pCount = config.pCount || 0;
                config.hLimit = Math.max(10, Math.min(100, config.hLimit || 50));
                config.hCount = config.hCount || 0;
                config.followDelay = config.followDelay || 1000;
                config.dStart = config.dStart || getDayStart();
                config.hStart = config.hStart || getHourStart();
                config.followProfileOwner = config.followProfileOwner !== undefined ? config.followProfileOwner : false;
            }
        } catch (e) {
            log(`Error loading config: ${e.message}`);
        }
    };

    // UI Styling Functions
    const boxStyle = (active, isUnload = false) => `
        display: inline-flex;
        align-items: center;
        background-color: ${isUnload ? '#0000FF' : (active ? '#00CC00' : '#0000FF')};
        color: white;
        font-weight: bold;
        border-radius: 4px;
        padding: 2px 4px;
        gap: 4px;
        cursor: pointer;
    `;

    const createButton = (id, label, onClick, active = true, isUnload = false) => {
        const btn = document.createElement('div');
        btn.id = id;
        btn.textContent = label;
        btn.style.cssText = boxStyle(active, isUnload);
        btn.addEventListener('click', onClick);
        return btn;
    };

    const setupUI = () => {
        try {
            const existing = document.getElementById('xfollow-ui');
            if (existing) existing.remove();

            const container = document.createElement('div');
            container.id = 'xfollow-ui';
            container.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 1000;
                font-family: Arial;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 6px;
            `;

            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = 'display: flex; gap: 6px; flex-direction: row-reverse;';

            const toggleBtn = createButton('toggle-btn', config.paused ? 'Start' : 'Stop', async () => {
                config.paused = !config.paused;
                log(config.paused ? 'Script stopped' : 'Script started');
                save();
                updateUI();
                if (!config.paused && !busy) {
                    if (window.location.pathname !== '/home') {
                        await goToHomePage();
                    }
                    tweetIndex = 0;
                    scrollAttempts = 0;
                    lastHandle = null;
                    const arts = getValidTweets();
                    if (arts[tweetIndex]) {
                        const handle = arts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                        log(`Scrolling to first tweet at index ${tweetIndex} (handle: ${handle})`);
                        await scrollToTweet(arts[tweetIndex], 'top');
                    } else {
                        log('No tweets found on start, scrolling down');
                        await scrollToTweet(null, 'top');
                    }
                    scanFollow();
                }
            }, true);
            buttonContainer.appendChild(toggleBtn);

            container.appendChild(buttonContainer);

            document.body.appendChild(container);
        } catch (e) {
            log(`Error setting up UI: ${e.message}`);
        }
    };

    const updateUI = () => {
        try {
            const toggleBtn = document.getElementById('toggle-btn');

            if (toggleBtn) {
                toggleBtn.textContent = config.paused ? 'Start' : 'Stop';
                toggleBtn.style.cssText = boxStyle(true);
            }
        } catch (e) {
            log(`Error updating UI: ${e.message}`);
        }
    };

    async function checkRateLimit() {
        try {
            await delay(1000); // Wait for potential toast to appear
            const toast = document.querySelector('[data-testid="toast"]');
            if (toast) {
                const text = toast.textContent.toLowerCase();
                if (text.includes('rate limited')) {
                    log('Rate limit detected, pausing for 1 hour');
                    config.paused = true;
                    save();
                    updateUI();
                    setTimeout(() => {
                        config.paused = false;
                        save();
                        updateUI();
                        log('Resuming after rate limit pause');
                        if (!busy) scanFollow();
                    }, 60 * 60 * 1000);
                    return true;
                } else if (text.includes('unable to follow')) {
                    log('Daily follow limit detected, pausing for 1 hour');
                    config.paused = true;
                    save();
                    updateUI();
                    setTimeout(() => {
                        config.paused = false;
                        save();
                        updateUI();
                        log('Resuming after daily limit pause');
                        if (!busy) scanFollow();
                    }, 60 * 60 * 1000);
                    return true;
                }
            }
            return false;
        } catch (e) {
            log(`Error checking rate limit: ${e.message}`);
            return false;
        }
    }

    // Navigation and follow functions
    async function goToHomePage() {
        try {
            const homeLink = document.querySelector('a[href="/home"]');
            if (homeLink) {
                homeLink.click();
                await delay(2000); // Wait for page to load
                log('Navigated to home page');
                return true;
            }
            log('Home link not found');
            return false;
        } catch (e) {
            log(`Error navigating to home page: ${e.message}`);
            return false;
        }
    }

    async function goToProf(art) {
        try {
            const link = art.querySelector('div[data-testid="User-Name"] a[href*="/"]');
            if (link) {
                const profile = link.href.split('/').pop();
                if (profile !== currentProfile) {
                    config.pCount = 0;
                    currentProfile = profile;
                    save();
                    updateUI();
                }
                await delay(500);
                link.click();
                await delay(1000); // Reduced delay for page load

                if (config.followProfileOwner && config.pCount < config.pLimit) {
                    const followBtn = document.querySelector('div[data-testid="placementTracking"] button[data-testid*="-follow"]');
                    if (followBtn) {
                        followBtn.click();
                        await delay(config.followDelay);
                        if (await checkRateLimit()) {
                            return false;
                        }
                        config.pCount++;
                        config.hCount++;
                        if (!config.dStart) config.dStart = getDayStart();
                        if (!config.hStart) config.hStart = getHourStart();
                        save();
                        updateUI();
                        log(`Followed profile owner @${profile} (Profile: ${config.pCount}/${config.pLimit}, Hour: ${config.hCount}/${config.hLimit})`);
                    } else {
                        log(`Already following profile owner @${profile} or no follow button`);
                    }
                }
                lastHandle = profile;
                return true;
            }
            log('Profile link not found');
            return false;
        } catch (e) {
            log(`Error navigating to profile: ${e.message}`);
            return false;
        }
    }

    async function goToFollowers() {
        try {
            const followersLink = document.querySelector('a[href*="/verified_followers"][role="link"]');
            if (followersLink) {
                followersLink.click();
                await delay(1000); // Reduced delay
                log('Navigated to followers page');
                return true;
            }
            log('Followers link not found');
            return false;
        } catch (e) {
            log(`Error navigating to followers: ${e.message}`);
            return false;
        }
    }

    async function goHome() {
        try {
            let btn = document.querySelector('button[data-testid="app-bar-back"]');
            let attempts = 0;
            while (btn && attempts < 2) {
                btn.click();
                await delay(1000); // Reduced delay
                btn = document.querySelector('button[data-testid="app-bar-back"]');
                attempts++;
            }
            if (attempts > 0) {
                log('Navigated back to homepage');
                await delay(1000); // Reduced delay
                return true;
            }
            log('Back button not found');
            return false;
        } catch (e) {
            log(`Error navigating back: ${e.message}`);
            return false;
        }
    }

    async function scrollToCell(cell, pos = 'top') {
        try {
            if (!cell) {
                window.scrollBy(0, 1000);
                await delay(500); // Reduced delay
                return;
            }
            const rect = cell.getBoundingClientRect();
            const scrollY = pos === 'top' ? rect.top : rect.bottom;
            window.scrollTo({ top: scrollY + window.scrollY + followersOffset, behavior: 'smooth' });
            await delay(500);
        } catch (e) {
            log(`Error scrolling to cell: ${e.message}`);
        }
    }

    async function scrollToTweet(tweet, pos = 'top') {
        try {
            if (!tweet) {
                window.scrollBy(0, 1000);
                await delay(500); // Reduced delay
                scrollAttempts++;
                return;
            }
            const rect = tweet.getBoundingClientRect();
            const scrollY = pos === 'top' ? rect.top : rect.bottom;
            window.scrollTo({ top: scrollY + window.scrollY + homeOffset, behavior: 'smooth' });
            await delay(500);
            scrollAttempts = 0;
        } catch (e) {
            log(`Error scrolling to tweet: ${e.message}`);
            scrollAttempts++;
        }
    }

    async function followUser(cell) {
        try {
            const protectedIcon = cell.querySelector('svg[aria-label="Protected account"]');
            if (protectedIcon) {
                log('Skipping protected account');
                return false;
            }
            const followBtn = cell.querySelector('button[data-testid*="-follow"]');
            if (followBtn) {
                followBtn.click();
                await delay(config.followDelay);
                if (await checkRateLimit()) {
                    return false;
                }
                config.pCount++;
                config.hCount++;
                if (!config.dStart) config.dStart = getDayStart();
                if (!config.hStart) config.hStart = getHourStart();
                save();
                updateUI();
                log(`Followed user (Profile: ${config.pCount}/${config.pLimit}, Hour: ${config.hCount}/${config.hLimit})`);
                return true;
            }
            log('Follow button not found');
            return false;
        } catch (e) {
            log(`Error following user: ${e.message}`);
            return false;
        }
    }

    function getValidTweets() {
        const cells = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
        const tweets = [];
        cells.forEach(cell => {
            // Skip pinned button
            if (cell.querySelector('a[href="/i/topics/pinned"]')) {
                return;
            }
            // Handle carousel tweets
            if (cell.querySelector('section[aria-labelledby*="accessible-list"]')) {
                const carouselTweets = cell.querySelectorAll('article[data-testid="tweet"]');
                tweets.push(...carouselTweets);
            }
            // Handle regular tweets
            const tweet = cell.querySelector('article[data-testid="tweet"]');
            if (tweet && cell.querySelector('div[data-testid="tweetText"]')) {
                tweets.push(tweet);
            }
        });
        return tweets;
    }

    async function scanFollow() {
        try {
            if (config.paused || busy) {
                log('Scan stopped: paused or busy');
                return;
            }
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            busy = true;
            await delay(500);

            await resetLimits();
            if (config.hCount >= config.hLimit) {
                log(`Hourly limit reached: ${config.hCount}/${config.hLimit}, waiting 1 hour`);
                config.paused = true;
                save();
                updateUI();
                setTimeout(() => {
                    config.hCount = 0;
                    config.hStart = getHourStart();
                    config.paused = false;
                    save();
                    updateUI();
                    log('Hourly limit wait ended, resuming');
                    if (!busy) scanFollow();
                }, 3600000 - (Date.now() - config.hStart));
                busy = false;
                return;
            }

            if (window.location.pathname.includes('/verified_followers')) {
                const cells = Array.from(document.querySelectorAll('div[data-testid="cellInnerDiv"]'));
                for (let i = 0; i < cells.length && config.pCount < config.pLimit; i++) {
                    const cell = cells[i];
                    const unfollowBtn = cell.querySelector('button[data-testid*="-unfollow"]');
                    const blockBtn = cell.querySelector('button[data-testid*="-unblock"]');
                    if (unfollowBtn) {
                        log(`Already following user at cell ${i + 1}`);
                        await scrollToCell(cell, 'bottom');
                        continue;
                    }
                    if (blockBtn) {
                        log(`Skipping blocked user at cell ${i + 1}`);
                        await scrollToCell(cell, 'bottom');
                        continue;
                    }
                    if (cell.querySelector('button[data-testid*="-follow"]')) {
                        await scrollToCell(cell, 'top');
                        const followed = await followUser(cell);
                        if (!followed) {
                            busy = false;
                            return;
                        }
                        if (config.paused || config.hCount >= config.hLimit) {
                            log('Paused or limit reached during follow');
                            busy = false;
                            return;
                        }
                    }
                }
                if (config.pCount >= config.pLimit) {
                    log('Profile limit reached, returning to homepage');
                    await goHome();
                    const arts = getValidTweets();
                    tweetIndex++;
                    if (arts[tweetIndex]) {
                        const handle = arts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                        const prevHandle = lastHandle || 'unknown';
                        if (handle === lastHandle) {
                            log(`Duplicate handle detected at index ${tweetIndex} (handle: ${handle}), incrementing index`);
                            tweetIndex++;
                            if (arts[tweetIndex]) {
                                const newHandle = arts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                                log(`Scrolling to next tweet at index ${tweetIndex} (handle: ${newHandle}, prev handle: ${prevHandle})`);
                                await scrollToTweet(arts[tweetIndex], 'top');
                            } else {
                                log('No tweets found after duplicate, scrolling down');
                                await scrollToTweet(null, 'top');
                                scrollAttempts++;
                            }
                        } else {
                            log(`Scrolling to next tweet at index ${tweetIndex} (handle: ${handle}, prev handle: ${prevHandle})`);
                            await scrollToTweet(arts[tweetIndex], 'top');
                        }
                    } else {
                        log('No tweets found after returning to homepage, scrolling down');
                        await scrollToTweet(null, 'top');
                        scrollAttempts++;
                        if (scrollAttempts >= maxScrollAttempts) {
                            log('Max scroll attempts reached, resetting to first tweet');
                            tweetIndex = 0;
                            scrollAttempts = 0;
                            const newArts = getValidTweets();
                            if (newArts[tweetIndex]) {
                                const handle = newArts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                                log(`Scrolling to first tweet at index ${tweetIndex} (handle: ${handle})`);
                                await scrollToTweet(newArts[tweetIndex], 'top');
                            }
                        }
                    }
                } else {
                    window.scrollBy(0, 1000);
                    await delay(500);
                }
            } else {
                const arts = getValidTweets();
                if (arts.length === 0 || tweetIndex >= arts.length) {
                    log(`No more tweets found after ${scrollAttempts} scroll attempts, scrolling down`);
                    await scrollToTweet(null, 'top');
                    scrollAttempts++;
                    if (scrollAttempts >= maxScrollAttempts) {
                        log('Max scroll attempts reached, resetting to first tweet');
                        tweetIndex = 0;
                        scrollAttempts = 0;
                    }
                    const newArts = getValidTweets();
                    if (newArts[tweetIndex]) {
                        const handle = newArts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                        log(`Scrolling to first tweet at index ${tweetIndex} (handle: ${handle})`);
                        await scrollToTweet(newArts[tweetIndex], 'top');
                    }
                } else {
                    const art = arts[tweetIndex];
                    const handle = art.querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                    if (handle === lastHandle && lastHandle !== null) {
                        log(`Duplicate handle detected at index ${tweetIndex} (handle: ${handle}), incrementing index`);
                        tweetIndex++;
                        if (arts[tweetIndex]) {
                            const newHandle = arts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                            const prevHandle = lastHandle || 'unknown';
                            log(`Scrolling to next tweet at index ${tweetIndex} (handle: ${newHandle}, prev handle: ${prevHandle})`);
                            await scrollToTweet(arts[tweetIndex], 'top');
                        } else {
                            log('No tweets found after duplicate, scrolling down');
                            await scrollToTweet(null, 'top');
                            scrollAttempts++;
                        }
                        return;
                    }
                    log(`Processing tweet at index ${tweetIndex} (handle: ${handle})`);
                    await scrollToTweet(art, 'top');
                    if (await goToProf(art)) {
                        if (config.pCount < config.pLimit && await goToFollowers()) {
                            log('Navigated to followers page');
                        } else {
                            await goHome();
                            const newArts = getValidTweets();
                            tweetIndex++;
                            if (newArts[tweetIndex]) {
                                const newHandle = newArts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                                const prevHandle = lastHandle || 'unknown';
                                if (newHandle === lastHandle && lastHandle !== null) {
                                    log(`Duplicate handle detected at index ${tweetIndex} (handle: ${newHandle}), incrementing index`);
                                    tweetIndex++;
                                    if (newArts[tweetIndex]) {
                                        const nextHandle = newArts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                                        log(`Scrolling to next tweet at index ${tweetIndex} (handle: ${nextHandle}, prev handle: ${prevHandle})`);
                                        await scrollToTweet(newArts[tweetIndex], 'top');
                                    } else {
                                        log('No tweets found after duplicate, scrolling down');
                                        await scrollToTweet(null, 'top');
                                        scrollAttempts++;
                                    }
                                } else {
                                    log(`Scrolling to next tweet at index ${tweetIndex} (handle: ${newHandle}, prev handle: ${prevHandle})`);
                                    await scrollToTweet(newArts[tweetIndex], 'top');
                                }
                            } else {
                                log('No tweets found after navigation, scrolling down');
                                await scrollToTweet(null, 'top');
                                scrollAttempts++;
                            }
                        }
                    } else {
                        await goHome();
                        tweetIndex++;
                        const newArts = getValidTweets();
                        if (newArts[tweetIndex]) {
                            const newHandle = newArts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                            const prevHandle = lastHandle || 'unknown';
                            if (newHandle === lastHandle && lastHandle !== null) {
                                log(`Duplicate handle detected at index ${tweetIndex} (handle: ${newHandle}), incrementing index`);
                                tweetIndex++;
                                if (newArts[tweetIndex]) {
                                    const nextHandle = newArts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                                    log(`Scrolling to next tweet at index ${tweetIndex} (handle: ${nextHandle}, prev handle: ${prevHandle})`);
                                    await scrollToTweet(newArts[tweetIndex], 'top');
                                } else {
                                    log('No tweets found after duplicate, scrolling down');
                                    await scrollToTweet(null, 'top');
                                    scrollAttempts++;
                                }
                            } else {
                                log(`Scrolling to next tweet at index ${tweetIndex} (handle: ${newHandle}, prev handle: ${prevHandle})`);
                                await scrollToTweet(newArts[tweetIndex], 'top');
                            }
                        } else {
                            log('No tweets found after failed profile navigation, scrolling down');
                            await scrollToTweet(null, 'top');
                            scrollAttempts++;
                        }
                    }
                }
            }
            busy = false;
            timer = setTimeout(scanFollow, fDelay);
        } catch (e) {
            log(`Error in scanFollow: ${e.message}`);
            busy = false;
            timer = setTimeout(scanFollow, fDelay);
        }
    }

    async function init() {
        try {
            if (!acquireLock()) {
                return;
            }

            window.addEventListener('unload', releaseLock);

            log('Starting initialization');
            load();
            if (!config.dStart) config.dStart = getDayStart();
            if (!config.hStart) config.hStart = getHourStart();
            setupUI();
            if (!config.paused && !busy) {
                log('Starting follow scan');
                tweetIndex = 0;
                scrollAttempts = 0;
                lastHandle = null;
                const arts = getValidTweets();
                if (arts[tweetIndex]) {
                    const handle = arts[tweetIndex].querySelector('div[data-testid="User-Name"] a[href*="/"]')?.href.split('/').pop() || 'unknown';
                    log(`Scrolling to first tweet at index ${tweetIndex} (handle: ${handle})`);
                    await scrollToTweet(arts[tweetIndex], 'top');
                } else {
                    log('No tweets found on init, scrolling down');
                    await scrollToTweet(null, 'top');
                }
                scanFollow();
            }
            log('Initialization complete');
        } catch (e) {
            log(`Error initializing: ${e.message}`);
            releaseLock();
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        log('Document ready, initializing in 2 seconds');
        setTimeout(init, 2000); // Reduced init delay
    } else {
        log('Waiting for DOMContentLoaded');
        window.addEventListener('DOMContentLoaded', () => {
            log('DOMContentLoaded, initializing in 2 seconds');
            setTimeout(init, 2000);
        });
    }
})();
