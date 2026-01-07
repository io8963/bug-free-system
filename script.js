document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const engineNameDisplay = document.getElementById('engineNameDisplay');
    const engineDomainDisplay = document.getElementById('engineDomainDisplay');
    const notification = document.getElementById('notification');

    // 状态管理
    const state = {
        searchEngines: [
            { name: 'Bing', url: 'https://www.bing.com/search?q=', domain: 'bing.com' },
            { name: 'Google', url: 'https://www.google.com/search?q=', domain: 'google.com' },
            { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', domain: 'baidu.com' }
        ],
        customEngines: [],
        currentEngineName: '',
        currentEngineUrl: ''
    };

    // 工具函数：从 URL 提取域名
    const extractDomain = (url) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'invalid-url';
        }
    };

    // 存储管理
    const saveEnginesToStorage = () => {
        localStorage.setItem('customSearchEngines', JSON.stringify(state.customEngines));
    };

    const loadEnginesFromStorage = () => {
        const stored = localStorage.getItem('customSearchEngines');
        if (stored) {
            try {
                state.customEngines = JSON.parse(stored);
            } catch (e) {
                console.error('加载自定义引擎失败:', e);
                state.customEngines = [];
            }
        }
    };

    // 显示通知
    const showNotification = (message) => {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    };

    // 更新当前引擎显示
    const updateEngineState = (name, url) => {
        state.currentEngineName = name;
        state.currentEngineUrl = url;
        engineNameDisplay.textContent = name;
        engineDomainDisplay.textContent = extractDomain(url);
        localStorage.setItem('selectedEngineName', name);
        localStorage.setItem('selectedEngineUrl', url);
    };

    // 初始化引擎
    const initializeEngine = () => {
        loadEnginesFromStorage();
        const savedName = localStorage.getItem('selectedEngineName');
        const savedUrl = localStorage.getItem('selectedEngineUrl');

        if (savedName && savedUrl) {
            updateEngineState(savedName, savedUrl);
        } else {
            const defaultEngine = state.searchEngines[0];
            updateEngineState(defaultEngine.name, defaultEngine.url);
        }
    };

    // 自定义命令处理器
    const customEngineCommands = {
        add: (parts) => {
            if (parts.length < 3) {
                showNotification('格式: /add 名称 URL');
                return false;
            }
            const name = parts[1];
            const url = parts.slice(2).join(' ');
            if (!url.includes('{query}') && !url.includes('?') && !url.endsWith('=')) {
                showNotification('URL 应包含查询参数占位符（如 ?q= 或 ?wd=）');
                return false;
            }
            const newEngine = {
                name,
                url,
                domain: extractDomain(url)
            };
            state.customEngines.push(newEngine);
            saveEnginesToStorage();
            showNotification(`已添加: ${name}`);
            renderEngineList(); // 👈 添加后刷新面板
            return true;
        },
        list: () => {
            const allEngines = [...state.searchEngines, ...state.customEngines];
            const names = allEngines.map(e => e.name).join(', ');
            showNotification(`可用引擎: ${names}`);
            return true;
        }
    };

    // 表单提交处理
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        // 检查是否为命令
        if (query.startsWith('/')) {
            const parts = query.split(' ');
            const command = parts[0].substring(1).toLowerCase();
            if (customEngineCommands[command]) {
                const handled = customEngineCommands[command](parts);
                if (handled) {
                    searchInput.value = '';
                    return;
                }
            }
            showNotification('未知命令。支持: /add, /list');
            return;
        }

        // 执行搜索
        const searchUrl = state.currentEngineUrl + encodeURIComponent(query);
        window.open(searchUrl, '_blank');
        searchInput.value = '';
    });

    // --- 悬浮设置面板逻辑 ---
    const settingsPanel = document.getElementById('settings-panel');
    const settingsBackdrop = document.getElementById('settings-backdrop');
    const settingsTrigger = document.getElementById('settings-trigger');
    const closeSettings = document.getElementById('close-settings');
    const engineList = document.getElementById('engine-list');
    const emptyState = document.getElementById('empty-state');

    const showSettingsPanel = () => {
        renderEngineList();
        settingsPanel.classList.add('active');
        settingsBackdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    const hideSettingsPanel = () => {
        settingsPanel.classList.remove('active');
        setTimeout(() => {
            settingsBackdrop.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    };

    const renderEngineList = () => {
        loadEnginesFromStorage();
        engineList.innerHTML = '';

        if (state.customEngines.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            state.customEngines.forEach(engine => {
                const li = document.createElement('li');
                li.className = 'engine-item';
                li.innerHTML = `
                    <div class="engine-info">
                        <div class="name" title="${engine.name}">${engine.name}</div>
                        <div class="domain" title="${engine.url}">${engine.domain || extractDomain(engine.url)}</div>
                    </div>
                    <button class="delete-btn" data-name="${engine.name}" title="删除">delete</button>
                `;
                engineList.appendChild(li);
            });
        }
    };

    const deleteEngine = (name) => {
        if (!confirm(`确定要删除 "${name}" 吗？`)) return;
        state.customEngines = state.customEngines.filter(engine => engine.name !== name);
        saveEnginesToStorage();
        showNotification(`已删除 "${name}"`);
        renderEngineList();

        if (engineNameDisplay.textContent === name) {
            const defaultEngine = state.searchEngines[0];
            updateEngineState(defaultEngine.name, defaultEngine.url);
        }
    };

    // 事件绑定
    settingsTrigger.addEventListener('click', showSettingsPanel);
    closeSettings.addEventListener('click', hideSettingsPanel);
    settingsBackdrop.addEventListener('click', hideSettingsPanel);

    engineList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const name = e.target.getAttribute('data-name');
            deleteEngine(name);
        }
    });

    // 初始化
    initializeEngine();
});
