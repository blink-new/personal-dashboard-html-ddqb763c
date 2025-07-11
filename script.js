class Dashboard {
    constructor() {
        this.shortcuts = JSON.parse(localStorage.getItem('dashboard-shortcuts') || '[]');
        this.backgroundSettings = JSON.parse(localStorage.getItem('dashboard-background') || '{"type": "gradient", "color": "#1a1a2e", "gradientStart": "#1a1a2e", "gradientEnd": "#16213e", "image": ""}');
        this.timezone = Dashboard.validateTimezone(localStorage.getItem('dashboard-timezone')) || 'America/New_York';
        this.timezone2 = Dashboard.validateTimezone(localStorage.getItem('dashboard-timezone-2')) || 'Europe/London';
        this.weatherCity = localStorage.getItem('dashboard-weather-city') || 'New York';
        
        this.init();
    }

    static validateTimezone(timezone) {
        if (!timezone) return null;
        
        // Fix common invalid timezone mappings
        const timezoneMap = {
            'Asia/Mumbai': 'Asia/Kolkata',
            'Asia/Delhi': 'Asia/Kolkata'
        };
        
        if (timezoneMap[timezone]) {
            timezone = timezoneMap[timezone];
        }
        
        try {
            // Test if timezone is valid by attempting to use it
            new Date().toLocaleTimeString([], { timeZone: timezone });
            return timezone;
        } catch (error) {
            console.warn(`Invalid timezone: ${timezone}, falling back to default`);
            return null;
        }
    }

    init() {
        this.cleanupInvalidTimezones();
        this.setupEventListeners();
        this.loadShortcuts();
        this.updateDateTime();
        this.updateWeather();
        this.applyBackground();
        
        // Update time every second
        setInterval(() => this.updateDateTime(), 1000);
        
        // Update weather every 30 minutes
        setInterval(() => this.updateWeather(), 30 * 60 * 1000);
    }

    cleanupInvalidTimezones() {
        // Clean up any invalid stored timezones
        const storedTimezone = localStorage.getItem('dashboard-timezone');
        const storedTimezone2 = localStorage.getItem('dashboard-timezone-2');
        
        if (storedTimezone && !Dashboard.validateTimezone(storedTimezone)) {
            console.warn(`Removing invalid timezone from localStorage: ${storedTimezone}`);
            localStorage.removeItem('dashboard-timezone');
            this.timezone = 'America/New_York';
        }
        
        if (storedTimezone2 && !Dashboard.validateTimezone(storedTimezone2)) {
            console.warn(`Removing invalid timezone from localStorage: ${storedTimezone2}`);
            localStorage.removeItem('dashboard-timezone-2');
            this.timezone2 = 'Europe/London';
        }
    }

    setupEventListeners() {
        // Edit button
        const editButton = document.getElementById('edit-button');
        if (editButton) {
            editButton.addEventListener('click', () => {
                document.getElementById('edit-modal').classList.add('active');
                this.populateEditModal();
                this.setupModalEventListeners(); // Set up modal listeners when modal opens
            });
        }

        // Close modal - only if it exists
        const closeButton = document.getElementById('close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.getElementById('edit-modal').classList.remove('active');
            });
        }

        // Modal backdrop click - only if modal exists
        const editModal = document.getElementById('edit-modal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    editModal.classList.remove('active');
                }
            });
        }

        // Tab switching - only if tab buttons exist
        const tabButtons = document.querySelectorAll('.tab-button');
        if (tabButtons.length > 0) {
            tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const tabName = e.target.dataset.tab;
                    this.switchTab(tabName);
                });
            });
        }
    }

    setupModalEventListeners() {
        // Add shortcut - only if element exists
        const addShortcutBtn = document.getElementById('add-shortcut');
        if (addShortcutBtn && !addShortcutBtn.dataset.listenerAdded) {
            addShortcutBtn.addEventListener('click', () => {
                this.addShortcut();
            });
            addShortcutBtn.dataset.listenerAdded = 'true';
        }

        // Background type change - only if elements exist
        const bgTypeRadios = document.querySelectorAll('input[name="bg-type"]');
        if (bgTypeRadios.length > 0) {
            bgTypeRadios.forEach(radio => {
                if (!radio.dataset.listenerAdded) {
                    radio.addEventListener('change', (e) => {
                        this.handleBackgroundTypeChange(e.target.value);
                    });
                    radio.dataset.listenerAdded = 'true';
                }
            });
        }

        // Background controls - only if elements exist
        const bgColor = document.getElementById('bg-color');
        if (bgColor && !bgColor.dataset.listenerAdded) {
            bgColor.addEventListener('change', (e) => {
                this.backgroundSettings.color = e.target.value;
                this.applyBackground();
                this.saveBackgroundSettings();
            });
            bgColor.dataset.listenerAdded = 'true';
        }

        const gradientStart = document.getElementById('gradient-start');
        if (gradientStart && !gradientStart.dataset.listenerAdded) {
            gradientStart.addEventListener('change', (e) => {
                this.backgroundSettings.gradientStart = e.target.value;
                this.applyBackground();
                this.saveBackgroundSettings();
            });
            gradientStart.dataset.listenerAdded = 'true';
        }

        const gradientEnd = document.getElementById('gradient-end');
        if (gradientEnd && !gradientEnd.dataset.listenerAdded) {
            gradientEnd.addEventListener('change', (e) => {
                this.backgroundSettings.gradientEnd = e.target.value;
                this.applyBackground();
                this.saveBackgroundSettings();
            });
            gradientEnd.dataset.listenerAdded = 'true';
        }

        const bgImage = document.getElementById('bg-image');
        if (bgImage && !bgImage.dataset.listenerAdded) {
            bgImage.addEventListener('change', (e) => {
                this.backgroundSettings.image = e.target.value;
                this.applyBackground();
                this.saveBackgroundSettings();
            });
            bgImage.dataset.listenerAdded = 'true';
        }

        // Timezone change - only if elements exist
        const timezoneSelect = document.getElementById('timezone-select');
        if (timezoneSelect && !timezoneSelect.dataset.listenerAdded) {
            timezoneSelect.addEventListener('change', (e) => {
                const newTimezone = this.validateTimezone(e.target.value) || 'America/New_York';
                this.timezone = newTimezone;
                localStorage.setItem('dashboard-timezone', this.timezone);
                this.updateDateTime();
            });
            timezoneSelect.dataset.listenerAdded = 'true';
        }

        // Second timezone change - only if elements exist
        const timezoneSelect2 = document.getElementById('timezone-select-2');
        if (timezoneSelect2 && !timezoneSelect2.dataset.listenerAdded) {
            timezoneSelect2.addEventListener('change', (e) => {
                const newTimezone = this.validateTimezone(e.target.value) || 'Europe/London';
                this.timezone2 = newTimezone;
                localStorage.setItem('dashboard-timezone-2', this.timezone2);
                this.updateDateTime();
            });
            timezoneSelect2.dataset.listenerAdded = 'true';
        }

        // Weather city change - only if element exists
        const citySelect = document.getElementById('city-select');
        if (citySelect && !citySelect.dataset.listenerAdded) {
            citySelect.addEventListener('change', (e) => {
                this.weatherCity = e.target.value;
                localStorage.setItem('dashboard-weather-city', this.weatherCity);
                this.updateWeather();
            });
            citySelect.dataset.listenerAdded = 'true';
        }
    }

    updateDateTime() {
        const now = new Date();
        
        // Main time (local)
        const mainTime = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        const mainDate = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('main-time').textContent = mainTime;
        document.getElementById('main-date').textContent = mainDate;
        
        // Secondary time (selected timezone)
        try {
            const timezoneTime = now.toLocaleTimeString([], { 
                timeZone: this.timezone,
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            
            const timezoneName = this.timezone.split('/')[1]?.replace('_', ' ') || this.timezone;
            document.getElementById('timezone-time').textContent = timezoneTime;
            document.getElementById('timezone-label').textContent = timezoneName;
        } catch (error) {
            console.error(`Invalid timezone: ${this.timezone}`, error);
            // Fix the timezone and try again
            this.timezone = this.validateTimezone(this.timezone) || 'America/New_York';
            localStorage.setItem('dashboard-timezone', this.timezone);
            const timezoneName = this.timezone.split('/')[1]?.replace('_', ' ') || this.timezone;
            document.getElementById('timezone-time').textContent = now.toLocaleTimeString([], { 
                timeZone: this.timezone,
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            document.getElementById('timezone-label').textContent = timezoneName;
        }
        
        // Third timezone
        try {
            const timezoneTime2 = now.toLocaleTimeString([], { 
                timeZone: this.timezone2,
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            
            const timezoneName2 = this.timezone2.split('/')[1]?.replace('_', ' ') || this.timezone2;
            document.getElementById('timezone-time-2').textContent = timezoneTime2;
            document.getElementById('timezone-label-2').textContent = timezoneName2;
        } catch (error) {
            console.error(`Invalid timezone: ${this.timezone2}`, error);
            // Fix the timezone and try again
            this.timezone2 = this.validateTimezone(this.timezone2) || 'Europe/London';
            localStorage.setItem('dashboard-timezone-2', this.timezone2);
            const timezoneName2 = this.timezone2.split('/')[1]?.replace('_', ' ') || this.timezone2;
            document.getElementById('timezone-time-2').textContent = now.toLocaleTimeString([], { 
                timeZone: this.timezone2,
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            document.getElementById('timezone-label-2').textContent = timezoneName2;
        }
    }

    async updateWeather() {
        try {
            // Mock weather data since we don't have an API key
            const mockWeatherData = {
                'New York': {
                    current: { temp: 22, icon: '☀️' },
                    forecast: [
                        { day: 'Today', icon: '☀️', temp: '22°/15°' },
                        { day: 'Tomorrow', icon: '🌤️', temp: '20°/13°' },
                        { day: 'Wed', icon: '🌧️', temp: '18°/11°' },
                        { day: 'Thu', icon: '⛅', temp: '19°/12°' },
                        { day: 'Fri', icon: '☀️', temp: '23°/16°' }
                    ]
                },
                'London': {
                    current: { temp: 15, icon: '🌤️' },
                    forecast: [
                        { day: 'Today', icon: '🌤️', temp: '15°/8°' },
                        { day: 'Tomorrow', icon: '🌧️', temp: '14°/7°' },
                        { day: 'Wed', icon: '🌧️', temp: '13°/6°' },
                        { day: 'Thu', icon: '⛅', temp: '16°/9°' },
                        { day: 'Fri', icon: '☀️', temp: '18°/11°' }
                    ]
                },
                'Tokyo': {
                    current: { temp: 25, icon: '☀️' },
                    forecast: [
                        { day: 'Today', icon: '☀️', temp: '25°/18°' },
                        { day: 'Tomorrow', icon: '🌤️', temp: '23°/17°' },
                        { day: 'Wed', icon: '🌧️', temp: '21°/16°' },
                        { day: 'Thu', icon: '⛅', temp: '24°/17°' },
                        { day: 'Fri', icon: '☀️', temp: '26°/19°' }
                    ]
                },
                'Sydney': {
                    current: { temp: 28, icon: '☀️' },
                    forecast: [
                        { day: 'Today', icon: '☀️', temp: '28°/20°' },
                        { day: 'Tomorrow', icon: '🌤️', temp: '26°/19°' },
                        { day: 'Wed', icon: '🌧️', temp: '24°/17°' },
                        { day: 'Thu', icon: '⛅', temp: '25°/18°' },
                        { day: 'Fri', icon: '☀️', temp: '29°/21°' }
                    ]
                },
                'Paris': {
                    current: { temp: 17, icon: '⛅' },
                    forecast: [
                        { day: 'Today', icon: '⛅', temp: '17°/10°' },
                        { day: 'Tomorrow', icon: '🌧️', temp: '16°/9°' },
                        { day: 'Wed', icon: '🌧️', temp: '15°/8°' },
                        { day: 'Thu', icon: '🌤️', temp: '18°/11°' },
                        { day: 'Fri', icon: '☀️', temp: '20°/13°' }
                    ]
                }
            };

            const weatherData = mockWeatherData[this.weatherCity] || mockWeatherData['New York'];
            
            // City name is now handled by the city selector
            
            // Update forecast
            const forecastContainer = document.getElementById('weather-forecast');
            forecastContainer.innerHTML = '';
            
            weatherData.forecast.forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'forecast-day';
                dayElement.innerHTML = `
                    <div class="day">${day.day}</div>
                    <div class="icon">${day.icon}</div>
                    <div class="temp">${day.temp}</div>
                `;
                forecastContainer.appendChild(dayElement);
            });
            
        } catch (error) {
            console.error('Error updating weather:', error);
        }
    }

    loadShortcuts() {
        const shortcutsGrid = document.getElementById('shortcuts-grid');
        
        if (!shortcutsGrid) {
            console.warn('Shortcuts grid not found, skipping shortcut loading');
            return;
        }
        
        // Clear existing shortcuts
        shortcutsGrid.innerHTML = '';
        
        // Add default shortcuts if none exist
        if (this.shortcuts.length === 0) {
            this.shortcuts = [
                { name: 'Gmail', url: 'https://gmail.com', icon: 'https://img.icons8.com/color/48/000000/gmail.png' },
                { name: 'GitHub', url: 'https://github.com', icon: 'https://img.icons8.com/material-outlined/48/000000/github.png' },
                { name: 'Twitter', url: 'https://twitter.com', icon: 'https://img.icons8.com/color/48/000000/twitter.png' },
                { name: 'YouTube', url: 'https://youtube.com', icon: 'https://img.icons8.com/color/48/000000/youtube-play.png' }
            ];
            this.saveShortcuts();
        }
        
        // Add shortcuts to grid
        this.shortcuts.forEach(shortcut => {
            const shortcutElement = document.createElement('div');
            shortcutElement.className = 'shortcut';
            shortcutElement.innerHTML = `
                <img src="${shortcut.icon}" alt="${shortcut.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;48&quot; height=&quot;48&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;white&quot; stroke-width=&quot;2&quot;><rect x=&quot;3&quot; y=&quot;3&quot; width=&quot;18&quot; height=&quot;18&quot; rx=&quot;2&quot; ry=&quot;2&quot;/><circle cx=&quot;8.5&quot; cy=&quot;8.5&quot; r=&quot;1.5&quot;/><polyline points=&quot;21,15 16,10 5,21&quot;/></svg>'">
                <span>${shortcut.name}</span>
            `;
            shortcutElement.addEventListener('click', () => {
                window.open(shortcut.url, '_blank');
            });
            shortcutsGrid.appendChild(shortcutElement);
        });
    }

    addShortcut() {
        const nameInput = document.getElementById('shortcut-name');
        const urlInput = document.getElementById('shortcut-url');
        const iconInput = document.getElementById('shortcut-icon');
        
        if (!nameInput || !urlInput || !iconInput) {
            console.error('Shortcut form elements not found');
            return;
        }
        
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        const icon = iconInput.value.trim();
        
        if (!name || !url) {
            alert('Please enter both name and URL');
            return;
        }
        
        const shortcut = {
            name,
            url: url.startsWith('http') ? url : `https://${url}`,
            icon: icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>'
        };
        
        this.shortcuts.push(shortcut);
        this.saveShortcuts();
        this.loadShortcuts();
        this.populateShortcutsList();
        
        // Clear form
        nameInput.value = '';
        urlInput.value = '';
        iconInput.value = '';
    }

    deleteShortcut(index) {
        this.shortcuts.splice(index, 1);
        this.saveShortcuts();
        this.loadShortcuts();
        this.populateShortcutsList();
    }

    saveShortcuts() {
        localStorage.setItem('dashboard-shortcuts', JSON.stringify(this.shortcuts));
    }

    populateEditModal() {
        this.populateShortcutsList();
        
        // Set background options - only if elements exist
        const bgTypeInput = document.querySelector(`input[name="bg-type"][value="${this.backgroundSettings.type}"]`);
        if (bgTypeInput) {
            bgTypeInput.checked = true;
        }
        
        const bgColorInput = document.getElementById('bg-color');
        if (bgColorInput) {
            bgColorInput.value = this.backgroundSettings.color;
        }
        
        const gradientStartInput = document.getElementById('gradient-start');
        if (gradientStartInput) {
            gradientStartInput.value = this.backgroundSettings.gradientStart;
        }
        
        const gradientEndInput = document.getElementById('gradient-end');
        if (gradientEndInput) {
            gradientEndInput.value = this.backgroundSettings.gradientEnd;
        }
        
        const bgImageInput = document.getElementById('bg-image');
        if (bgImageInput) {
            bgImageInput.value = this.backgroundSettings.image;
        }
        
        // Set timezones - only if elements exist
        const timezoneSelect = document.getElementById('timezone-select');
        if (timezoneSelect) {
            timezoneSelect.value = this.timezone;
        }
        
        const timezoneSelect2 = document.getElementById('timezone-select-2');
        if (timezoneSelect2) {
            timezoneSelect2.value = this.timezone2;
        }
        
        // Set weather city - only if element exists
        const citySelect = document.getElementById('city-select');
        if (citySelect) {
            citySelect.value = this.weatherCity;
        }
        
        this.handleBackgroundTypeChange(this.backgroundSettings.type);
    }

    populateShortcutsList() {
        const shortcutsList = document.getElementById('shortcuts-list');
        if (!shortcutsList) {
            return; // Exit if shortcuts list doesn't exist
        }
        
        shortcutsList.innerHTML = '';
        
        this.shortcuts.forEach((shortcut, index) => {
            const shortcutItem = document.createElement('div');
            shortcutItem.className = 'shortcut-item';
            shortcutItem.innerHTML = `
                <img src="${shortcut.icon}" alt="${shortcut.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;32&quot; height=&quot;32&quot; viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;white&quot; stroke-width=&quot;2&quot;><rect x=&quot;3&quot; y=&quot;3&quot; width=&quot;18&quot; height=&quot;18&quot; rx=&quot;2&quot; ry=&quot;2&quot;/><circle cx=&quot;8.5&quot; cy=&quot;8.5&quot; r=&quot;1.5&quot;/><polyline points=&quot;21,15 16,10 5,21&quot;/></svg>'">
                <div class="shortcut-item-info">
                    <div class="shortcut-item-name">${shortcut.name}</div>
                    <div class="shortcut-item-url">${shortcut.url}</div>
                </div>
                <button class="delete-shortcut" onclick="dashboard.deleteShortcut(${index})">Delete</button>
            `;
            shortcutsList.appendChild(shortcutItem);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    validateTimezone(timezone) {
        return Dashboard.validateTimezone(timezone);
    }

    handleBackgroundTypeChange(type) {
        this.backgroundSettings.type = type;
        
        // Hide all controls - only if they exist
        const colorControls = document.querySelector('.color-controls');
        const gradientControls = document.querySelector('.gradient-controls');
        const imageControls = document.querySelector('.image-controls');
        
        if (colorControls) colorControls.style.display = 'none';
        if (gradientControls) gradientControls.style.display = 'none';
        if (imageControls) imageControls.style.display = 'none';
        
        // Show relevant controls
        switch (type) {
            case 'color':
                if (colorControls) colorControls.style.display = 'block';
                break;
            case 'gradient':
                if (gradientControls) gradientControls.style.display = 'block';
                break;
            case 'image':
                if (imageControls) imageControls.style.display = 'block';
                break;
        }
        
        this.applyBackground();
        this.saveBackgroundSettings();
    }

    applyBackground() {
        const overlay = document.getElementById('background-overlay');
        
        switch (this.backgroundSettings.type) {
            case 'color':
                overlay.style.background = this.backgroundSettings.color;
                break;
            case 'gradient':
                overlay.style.background = `linear-gradient(135deg, ${this.backgroundSettings.gradientStart} 0%, ${this.backgroundSettings.gradientEnd} 100%)`;
                break;
            case 'image':
                if (this.backgroundSettings.image) {
                    overlay.style.background = `url(${this.backgroundSettings.image}) center center / cover no-repeat`;
                } else {
                    overlay.style.background = `linear-gradient(135deg, ${this.backgroundSettings.gradientStart} 0%, ${this.backgroundSettings.gradientEnd} 100%)`;
                }
                break;
        }
    }

    saveBackgroundSettings() {
        localStorage.setItem('dashboard-background', JSON.stringify(this.backgroundSettings));
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});