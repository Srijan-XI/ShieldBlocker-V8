// ShieldBlocker-V8 Demo Application
class ShieldBlockerDemo {
    constructor() {
        this.state = {
            adBlockerEnabled: true,
            currentSite: 'example.com',
            blockedCount: 247,
            allowedSites: ['news.ycombinator.com', 'reddit.com'],
            theme: 'light',
            siteAllowed: false,
            blockedToday: 247,
            savedTime: 2.1,
            totalBlocked: 1247,
            dataSaved: 2.1
        };

        this.adDomains = [
            'doubleclick.net',
            'googlesyndication.com', 
            'googleadservices.com',
            'facebook.com/tr',
            'google-analytics.com',
            'amazon-adsystem.com',
            'adsystem.amazon.com'
        ];

        this.adSelectors = [
            '.ad',
            '.advertisement', 
            '.banner',
            '.popup',
            '.sponsored',
            '[class*="ad-"]',
            '[id*="ad-"]'
        ];

        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('Initializing ShieldBlocker Demo...');
        this.setupEventListeners();
        this.updateUI();
        this.simulateRealTimeStats();
        this.detectCurrentSite();
        console.log('ShieldBlocker Demo initialized successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
            console.log('Theme toggle listener added');
        } else {
            console.warn('Theme toggle button not found');
        }

        // Main ad blocker toggle - Fixed to work properly
        const mainToggle = document.getElementById('mainToggle');
        if (mainToggle) {
            mainToggle.addEventListener('change', (e) => {
                console.log('Main toggle changed:', e.target.checked);
                this.toggleAdBlocker(e.target.checked);
            });
            
            // Also handle click events on the slider
            const slider = mainToggle.parentElement.querySelector('.slider');
            if (slider) {
                slider.addEventListener('click', (e) => {
                    e.preventDefault();
                    const newState = !mainToggle.checked;
                    mainToggle.checked = newState;
                    this.toggleAdBlocker(newState);
                });
            }
            console.log('Main toggle listener added');
        } else {
            console.warn('Main toggle not found');
        }

        // Site-specific toggle
        const siteToggle = document.getElementById('siteToggle');
        if (siteToggle) {
            siteToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSite();
            });
            console.log('Site toggle listener added');
        }

        // Refresh rules button
        const refreshRules = document.getElementById('refreshRules');
        if (refreshRules) {
            refreshRules.addEventListener('click', (e) => {
                e.preventDefault();
                this.refreshRules();
            });
            console.log('Refresh rules listener added');
        }

        // Settings modal
        const viewSettings = document.getElementById('viewSettings');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        const saveSettings = document.getElementById('saveSettings');
        const resetStats = document.getElementById('resetStats');

        if (viewSettings) {
            viewSettings.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Opening settings modal');
                this.openSettings();
            });
            console.log('View settings listener added');
        }

        if (closeSettings) {
            closeSettings.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeSettings();
            });
        }

        if (saveSettings) {
            saveSettings.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        if (resetStats) {
            resetStats.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetStatistics();
            });
        }

        // Click outside modal to close
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettings();
                }
            });
        }

        // Add site to allowlist
        const addSiteBtn = document.getElementById('addSiteBtn');
        const newSiteInput = document.getElementById('newSiteInput');
        
        if (addSiteBtn) {
            addSiteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addAllowedSite();
            });
        }

        if (newSiteInput) {
            newSiteInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addAllowedSite();
                }
            });
        }

        // Remove site buttons
        this.setupRemoveSiteListeners();

        // Installation tabs
        this.setupInstallationTabs();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case ',':
                        e.preventDefault();
                        this.openSettings();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.toggleAdBlocker(!this.state.adBlockerEnabled);
                        break;
                }
            }
        });

        console.log('All event listeners setup complete');
    }

    toggleTheme() {
        console.log('Toggling theme from', this.state.theme);
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', this.state.theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = this.state.theme === 'light' ? '🌙' : '☀️';
        }

        this.showNotification(`Switched to ${this.state.theme} theme`);
        console.log('Theme toggled to', this.state.theme);
    }

    toggleAdBlocker(enabled) {
        console.log('Toggling ad blocker:', enabled);
        this.state.adBlockerEnabled = enabled;
        
        // Ensure the toggle reflects the state
        const mainToggle = document.getElementById('mainToggle');
        if (mainToggle) {
            mainToggle.checked = enabled;
        }

        // Update UI based on blocker state
        this.updateAdVisibility();
        this.updateStats();
        this.updateSiteInfo();
        
        const message = enabled ? 'Ad blocker enabled' : 'Ad blocker disabled';
        this.showNotification(message);

        // Animate the toggle
        this.animateToggle();
    }

    toggleSite() {
        console.log('Toggling site allowlist for', this.state.currentSite);
        this.state.siteAllowed = !this.state.siteAllowed;
        const siteToggle = document.getElementById('siteToggle');
        
        if (this.state.siteAllowed) {
            if (siteToggle) {
                siteToggle.textContent = 'Block site';
                siteToggle.classList.add('btn--primary');
                siteToggle.classList.remove('btn--outline');
            }
            
            if (!this.state.allowedSites.includes(this.state.currentSite)) {
                this.state.allowedSites.push(this.state.currentSite);
            }
            
            this.showNotification(`${this.state.currentSite} added to allowlist`);
        } else {
            if (siteToggle) {
                siteToggle.textContent = 'Allow site';
                siteToggle.classList.remove('btn--primary');
                siteToggle.classList.add('btn--outline');
            }
            
            this.state.allowedSites = this.state.allowedSites.filter(
                site => site !== this.state.currentSite
            );
            
            this.showNotification(`${this.state.currentSite} removed from allowlist`);
        }

        this.updateAdVisibility();
        this.updateAllowedSitesList();
    }

    refreshRules() {
        this.showNotification('Refreshing filter rules...', 'info');
        
        // Simulate loading
        const refreshBtn = document.getElementById('refreshRules');
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<span>⏳</span> Updating...';
            refreshBtn.disabled = true;

            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
                this.showNotification('Filter rules updated successfully', 'success');
                
                // Simulate finding more ads to block
                this.state.blockedCount += Math.floor(Math.random() * 5) + 1;
                this.updateStats();
            }, 2000);
        }
    }

    openSettings() {
        console.log('Opening settings modal');
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
            console.log('Settings modal opened');
        } else {
            console.error('Settings modal not found!');
        }
    }

    closeSettings() {
        console.log('Closing settings modal');
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    saveSettings() {
        this.showNotification('Settings saved successfully', 'success');
        this.closeSettings();
    }

    resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics?')) {
            this.state.blockedCount = 0;
            this.state.blockedToday = 0;
            this.state.savedTime = 0;
            this.state.totalBlocked = 0;
            this.state.dataSaved = 0;
            
            this.updateStats();
            this.showNotification('Statistics reset successfully', 'info');
        }
    }

    addAllowedSite() {
        const input = document.getElementById('newSiteInput');
        if (!input) return;
        
        const site = input.value.trim();
        
        if (!site) return;
        
        // Basic URL validation
        const urlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!urlPattern.test(site)) {
            this.showNotification('Please enter a valid domain (e.g., example.com)', 'error');
            return;
        }

        if (this.state.allowedSites.includes(site)) {
            this.showNotification('Site already in allowlist', 'warning');
            return;
        }

        this.state.allowedSites.push(site);
        input.value = '';
        this.updateAllowedSitesList();
        this.showNotification(`${site} added to allowlist`, 'success');
    }

    removeSite(site) {
        this.state.allowedSites = this.state.allowedSites.filter(s => s !== site);
        this.updateAllowedSitesList();
        this.showNotification(`${site} removed from allowlist`, 'info');
    }

    setupRemoveSiteListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-site')) {
                e.preventDefault();
                const siteEntry = e.target.closest('.site-entry');
                if (siteEntry) {
                    const site = siteEntry.querySelector('span').textContent;
                    this.removeSite(site);
                }
            }
        });
    }

    setupInstallationTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = btn.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                btn.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    updateUI() {
        console.log('Updating UI...');
        this.updateStats();
        this.updateSiteInfo();
        this.updateAdVisibility();
        this.updateAllowedSitesList();
    }

    updateStats() {
        const blockedCount = document.getElementById('blockedCount');
        const savedTime = document.getElementById('savedTime');
        
        if (blockedCount) {
            blockedCount.textContent = this.formatNumber(this.state.blockedCount);
        }
        
        if (savedTime) {
            savedTime.textContent = `${this.state.savedTime}s`;
        }

        // Update modal statistics
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 3) {
            statValues[0].textContent = this.formatNumber(this.state.totalBlocked);
            statValues[1].textContent = `${this.state.savedTime}s`;
            statValues[2].textContent = `${this.state.dataSaved}MB`;
        }
    }

    updateSiteInfo() {
        const currentSiteEl = document.getElementById('currentSite');
        const siteStatus = document.getElementById('siteStatus');
        const siteToggle = document.getElementById('siteToggle');
        
        if (currentSiteEl) {
            currentSiteEl.textContent = this.state.currentSite;
        }
        
        if (siteStatus) {
            if (this.state.adBlockerEnabled && !this.state.siteAllowed) {
                const blockedOnSite = Math.floor(Math.random() * 5) + 1;
                siteStatus.textContent = `${blockedOnSite} ads blocked`;
                siteStatus.style.color = 'var(--color-success)';
            } else {
                siteStatus.textContent = 'Ads allowed';
                siteStatus.style.color = 'var(--color-warning)';
            }
        }
        
        if (siteToggle) {
            if (this.state.siteAllowed) {
                siteToggle.textContent = 'Block site';
                siteToggle.classList.add('btn--primary');
                siteToggle.classList.remove('btn--outline');
            } else {
                siteToggle.textContent = 'Allow site';
                siteToggle.classList.remove('btn--primary');
                siteToggle.classList.add('btn--outline');
            }
        }
    }

    updateAdVisibility() {
        const adContainers = document.querySelectorAll('.ad-container');
        const website = document.querySelector('.demo-website');
        
        if (!this.state.adBlockerEnabled || this.state.siteAllowed) {
            // Show ads
            if (website) {
                website.classList.add('ads-disabled');
            }
            adContainers.forEach(ad => {
                ad.classList.remove('animate-block');
                ad.classList.add('animate-unblock');
                const placeholder = ad.querySelector('.ad-placeholder span');
                if (placeholder) {
                    placeholder.textContent = '📢 Advertisement';
                }
            });
        } else {
            // Block ads
            if (website) {
                website.classList.remove('ads-disabled');
            }
            adContainers.forEach(ad => {
                ad.classList.remove('animate-unblock');
                ad.classList.add('animate-block');
                const placeholder = ad.querySelector('.ad-placeholder span');
                if (placeholder) {
                    placeholder.textContent = '🚫 Ad Blocked';
                }
            });
        }
    }

    updateAllowedSitesList() {
        const allowedSitesList = document.getElementById('allowedSitesList');
        if (!allowedSitesList) return;

        // Clear existing entries except the add form
        const existingEntries = allowedSitesList.querySelectorAll('.site-entry');
        existingEntries.forEach(entry => entry.remove());

        // Add current allowed sites
        this.state.allowedSites.forEach(site => {
            const siteEntry = document.createElement('div');
            siteEntry.className = 'site-entry';
            siteEntry.innerHTML = `
                <span>${site}</span>
                <button class="btn btn--sm remove-site">Remove</button>
            `;
            allowedSitesList.appendChild(siteEntry);
        });
    }

    simulateRealTimeStats() {
        setInterval(() => {
            if (this.state.adBlockerEnabled && !this.state.siteAllowed) {
                // Randomly increment blocked count
                if (Math.random() < 0.1) { // 10% chance every interval
                    this.state.blockedCount += Math.floor(Math.random() * 3) + 1;
                    this.state.blockedToday += 1;
                    this.state.totalBlocked += 1;
                    this.state.savedTime += Math.random() * 0.1;
                    this.state.dataSaved += Math.random() * 0.01;
                    this.updateStats();
                }
            }
        }, 5000); // Check every 5 seconds
    }

    detectCurrentSite() {
        // Simulate different websites
        const sites = [
            'example.com',
            'news.website.com', 
            'social-media.com',
            'shopping-site.com',
            'blog.example.org'
        ];
        
        // Change site every 30 seconds for demo
        setInterval(() => {
            const randomSite = sites[Math.floor(Math.random() * sites.length)];
            this.state.currentSite = randomSite;
            this.state.siteAllowed = this.state.allowedSites.includes(randomSite);
            this.updateSiteInfo();
            this.updateAdVisibility();
        }, 30000);
    }

    animateToggle() {
        const toggleElement = document.querySelector('.main-toggle');
        if (toggleElement) {
            toggleElement.classList.add('animate-pulse');
            setTimeout(() => {
                toggleElement.classList.remove('animate-pulse');
            }, 300);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Add styles for notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-surface);
            border: 1px solid var(--color-card-border);
            border-radius: var(--radius-base);
            padding: var(--space-12) var(--space-16);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform var(--duration-normal) var(--ease-standard);
            max-width: 300px;
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

// Initialize the demo when DOM is loaded
let shieldBlockerDemo;

function initializeDemo() {
    console.log('Initializing ShieldBlocker-V8 Demo...');
    shieldBlockerDemo = new ShieldBlockerDemo();
    
    // Add some demo-specific styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-pulse {
            animation: pulse 0.3s ease-in-out;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: var(--space-8);
        }
        
        .notification-icon {
            flex-shrink: 0;
        }
        
        .notification-message {
            font-size: var(--font-size-sm);
            color: var(--color-text);
        }
    `;
    document.head.appendChild(style);
}

// Multiple ways to ensure initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDemo);
} else {
    initializeDemo();
}

// Fallback initialization
window.addEventListener('load', () => {
    if (!shieldBlockerDemo) {
        initializeDemo();
    }
});

// Global functions for demo purposes
window.exportConfig = () => {
    shieldBlockerDemo?.exportConfig();
};

// Keyboard shortcut help
document.addEventListener('keydown', (e) => {
    if (e.key === '?' && e.shiftKey) {
        alert(`ShieldBlocker-V8 Keyboard Shortcuts:
        
Ctrl/Cmd + B - Toggle ad blocker
Ctrl/Cmd + , - Open settings
Shift + ? - Show this help

Demo Features:
- Real-time ad blocking simulation
- Cross-browser compatibility demo
- Settings persistence simulation
- Performance statistics tracking`);
    }
});

console.log('🛡️ ShieldBlocker-V8 Demo script loaded successfully!');