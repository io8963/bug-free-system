document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-btn');
    
    const engineTrigger = document.getElementById('engine-trigger');
    const engineMenu = document.getElementById('engine-menu');
    const engineNameDisplay = document.getElementById('current-engine-name');
    const directBadge = document.getElementById('direct-badge');
    const menuItems = engineMenu.querySelectorAll('li');

    // --- 优化1: 使用状态对象管理引擎状态 ---
    const state = {
        currentSearchUrl: "https://www.bing.com/search?q=",
        activeIndex: -1,
        searchEngines: [
            { name: 'Bing', url: 'https://www.bing.com/search?q=', domain: 'bing.com' },
            { name: 'Google', url: 'https://www.google.com/search?q=', domain: 'google.com' },
            { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', domain: 'baidu.com' }
        ],
        // 新增：存储用户自定义引擎
        customEngines: []
    };

    // --- 优化2: 直达功能配置 ---
    const directShortcuts = {
        'gh': { name: 'GitHub', url: 'https://github.com/search?q=' },
        'yt': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=' },
        'bili': { name: 'Bilibili', url: 'https://search.bilibili.com/all?keyword=' },
        'wiki': { name: '维基百科', url: 'https://zh.wikipedia.org/wiki/' },
        'z': { name: '知乎', url: 'https://www.zhihu.com/search?q=' },
        'db': { name: '豆瓣', url: 'https://www.douban.com/search?q=' }
    };

    // --- 优化3: 防抖函数 ---
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

// 替换 script.js 中的 add 函数部分
    const customEngineCommands = {
    add: (params) => {
        if (params.length < 2) {
            showNotification('用法: /add <名称> <URL模板> [域名]');
            return;
        }
        
        const name = params[0];
        const urlTemplate = params[1];
        const domain = params[2] || extractDomain(urlTemplate);
        
        // 验证URL格式 - 允许使用 {query} 或其他占位符
        if (!urlTemplate.includes('{query}')) {
            showNotification('URL模板必须包含 {query} 占位符');
            return;
        }
        
        // 尝试创建一个临时URL来验证基本格式
        const testUrl = urlTemplate.replace(/{query}/g, 'test');
        try {
            new URL(testUrl);
        } catch (e) {
            showNotification('URL格式不正确');
            return;
        }
        
        // 检查是否已存在
        const existingIndex = state.customEngines.findIndex(engine => engine.name === name);
        if (existingIndex !== -1) {
            state.customEngines[existingIndex] = { name, url: urlTemplate, domain };
            showNotification(`搜索引擎 "${name}" 已更新`);
        } else {
            state.customEngines.push({ name, url: urlTemplate, domain });
            showNotification(`已添加搜索引擎 "${name}"`);
        }
        
        saveEnginesToStorage();
        updateEngineMenu();
    },
    
    // ... 其他命令保持不变
    }

    // --- 新增：从URL提取域名 ---
    const extractDomain = (url) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch (e) {
            return '自定义';
        }
    };

    // --- 新增：保存引擎到本地存储 ---
    const saveEnginesToStorage = () => {
        localStorage.setItem('customSearchEngines', JSON.stringify(state.customEngines));
    };

    // --- 新增：从本地存储加载引擎 ---
    const loadEnginesFromStorage = () => {
        const stored = localStorage.getItem('customSearchEngines');
        if (stored) {
            try {
                state.customEngines = JSON.parse(stored);
            } catch (e) {
                console.error('加载自定义引擎失败:', e);
            }
        }
    };

    // --- 新增：更新引擎菜单 ---
    const updateEngineMenu = () => {
        // 清空现有菜单项（保留预设引擎）
        engineMenu.innerHTML = '';
        
        // 添加预设引擎
        state.searchEngines.forEach((engine, index) => {
            const li = document.createElement('li');
            li.setAttribute('role', 'option');
            li.setAttribute('data-name', engine.name);
            li.setAttribute('data-url', engine.url);
            li.id = `engine-option-${index}`;
            
            if (engineNameDisplay.textContent === engine.name) {
                li.classList.add('selected');
                li.setAttribute('aria-selected', 'true');
            }
            
            li.innerHTML = `
                <div class="engine-info">
                    <span class="engine-main">${engine.name}</span>
                    <span class="engine-desc">${engine.domain}</span>
                </div>
            `;
            
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                updateEngineState(engine.name, engine.url);
                toggleMenu(false);
                input.focus();
            });
            
            li.addEventListener('mouseenter', () => {
                state.activeIndex = index;
                updateMenuHighlight(Array.from(engineMenu.querySelectorAll('li')));
            });
            
            engineMenu.appendChild(li);
        });
        
        // 添加自定义引擎分隔线
        if (state.customEngines.length > 0) {
            const separator = document.createElement('li');
            separator.classList.add('menu-separator');
            separator.innerHTML = '<div class="separator-line">自定义引擎</div>';
            separator.style.padding = '10px 16px';
            separator.style.fontSize = '12px';
            separator.style.opacity = '0.7';
            separator.style.textAlign = 'center';
            separator.style.borderTop = '1px solid var(--border-color)';
            separator.style.marginTop = '8px';
            separator.style.cursor = 'default';
            engineMenu.appendChild(separator);
            
            // 添加自定义引擎
            state.customEngines.forEach((engine, index) => {
                const li = document.createElement('li');
                li.setAttribute('role', 'option');
                li.setAttribute('data-name', engine.name);
                li.setAttribute('data-url', engine.url);
                li.id = `engine-option-custom-${index}`;
                
                if (engineNameDisplay.textContent === engine.name) {
                    li.classList.add('selected');
                    li.setAttribute('aria-selected', 'true');
                }
                
                li.innerHTML = `
                    <div class="engine-info">
                        <span class="engine-main">${engine.name}</span>
                        <span class="engine-desc">${engine.domain}</span>
                    </div>
                `;
                
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updateEngineState(engine.name, engine.url);
                    toggleMenu(false);
                    input.focus();
                });
                
                li.addEventListener('mouseenter', () => {
                    state.activeIndex = state.searchEngines.length + index;
                    updateMenuHighlight(Array.from(engineMenu.querySelectorAll('li')));
                });
                
                engineMenu.appendChild(li);
            });
        }
    };

    // --- 优化4: 初始化引擎状态 ---
    const initializeEngine = () => {
        loadEnginesFromStorage();
        updateEngineMenu();
        
        const savedEngineName = localStorage.getItem('selectedEngineName');
        const savedEngineUrl = localStorage.getItem('selectedEngineUrl');

        if (savedEngineName && savedEngineUrl) {
            // 验证保存的引擎是否存在
            const allEngines = [...state.searchEngines, ...state.customEngines];
            const foundEngine = allEngines.find(engine => 
                engine.name === savedEngineName && engine.url === savedEngineUrl);
            
            if (foundEngine) {
                updateEngineState(savedEngineName, savedEngineUrl);
            } else {
                // 如果保存的引擎不存在，使用默认引擎
                const defaultEngine = state.searchEngines[0];
                updateEngineState(defaultEngine.name, defaultEngine.url);
            }
        } else {
            // 设置默认引擎
            const defaultEngine = state.searchEngines[0];
            updateEngineState(defaultEngine.name, defaultEngine.url);
        }
    };

    // --- 优化5: 更新引擎状态 ---
    function updateEngineState(name, url) {
        engineNameDisplay.textContent = name;
        state.currentSearchUrl = url;
        input.placeholder = `使用 ${name} 搜索...`;
        
        // 更新菜单项选择状态
        const menuItems = engineMenu.querySelectorAll('li');
        menuItems.forEach(item => {
            const isSelected = item.getAttribute('data-name') === name;
            item.classList.toggle('selected', isSelected);
            item.setAttribute('aria-selected', isSelected.toString());
        });

        localStorage.setItem('selectedEngineName', name);
        localStorage.setItem('selectedEngineUrl', url);
    }

// 替换原有的 showNotification 函数
const showNotification = (content) => {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--surface-color);
            color: var(--text-color);
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            border: 1px solid var(--border-color);
            font-size: 14px;
            max-width: 400px;
            word-break: break-word;
        `;
        document.body.appendChild(notification);
    }
    
    // 判断内容类型，如果是 HTML 则使用 innerHTML，否则使用 textContent
    if (typeof content === 'string' && content.includes('<')) {
        notification.innerHTML = content;
    } else {
        notification.textContent = content;
    }
    
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
    }, 5000); // 增加显示时间到5秒，因为内容更复杂
};

    // --- 优化6: 菜单开关逻辑 ---
    function toggleMenu(show) {
        // 如果处于直达模式，点击左侧不触发菜单
        if (form.classList.contains('direct-mode') && show) return;

        if (show) {
            engineMenu.classList.add('active');
            engineTrigger.classList.add('is-open'); 
            engineTrigger.setAttribute('aria-expanded', 'true');
            state.activeIndex = -1; 
        } else {
            engineMenu.classList.remove('active');
            engineTrigger.classList.remove('is-open');
            engineTrigger.setAttribute('aria-expanded', 'false');
            
            // 移除键盘导航高亮
            const menuItems = engineMenu.querySelectorAll('li');
            menuItems.forEach(item => item.classList.remove('key-active'));
        }
    }

    engineTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(!engineMenu.classList.contains('active')); 
    });

    // --- 优化7: 菜单项事件处理 ---
    // 菜单项事件处理已移到 updateEngineMenu 中

    // --- 优化8: 键盘导航 ---
    document.addEventListener('keydown', (e) => {
        // 字母快速选择
        if (engineMenu.classList.contains('active') && e.key.length === 1 && e.key.match(/[a-z]/i)) {
            const key = e.key.toLowerCase();
            const menuItems = engineMenu.querySelectorAll('li[data-name]');
            const matchingItem = Array.from(menuItems).find(item => 
                item.getAttribute('data-name').toLowerCase().startsWith(key)
            );
            if (matchingItem) {
                matchingItem.click();
                return;
            }
        }
        
        if (engineMenu.classList.contains('active')) {
            const items = Array.from(engineMenu.querySelectorAll('li[data-name]'));
            if (e.key === 'ArrowDown') {
                e.preventDefault(); 
                state.activeIndex = (state.activeIndex + 1) % items.length;
                updateMenuHighlight(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                state.activeIndex = (state.activeIndex - 1 + items.length) % items.length;
                updateMenuHighlight(items);
            } else if (e.key === 'Enter' && state.activeIndex > -1) {
                e.preventDefault();
                items[state.activeIndex].click();
            } else if (e.key === 'Escape') {
                toggleMenu(false);
                input.focus();
            }
        }
        
        if (e.key === '/' && document.activeElement !== input) {
            e.preventDefault();
            input.focus();
        }
        
        // 新增：处理自定义引擎命令
        if (e.key === 'Enter' && input.value.startsWith('/')) {
            handleCustomEngineCommand(input.value);
        }
    });

    // --- 新增：处理自定义引擎命令 ---
// 替换 handleCustomEngineCommand 函数中的 help 部分
const handleCustomEngineCommand = (command) => {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].substring(1).toLowerCase(); // 去掉开头的 '/'
    const params = parts.slice(1);
    
    if (customEngineCommands[cmd]) {
        customEngineCommands[cmd](params);
        input.value = '';
        debouncedToggleClearBtn();
    } else if (cmd === 'help') {
        const helpContent = `
            <div style="line-height: 1.6;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">自定义搜索引擎帮助</h3>
                <div style="margin-bottom: 12px;">
                    <div style="margin-bottom: 8px; display: flex;">
                        <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; margin-right: 10px; flex-shrink: 0;">/add</code>
                        <span>添加搜索引擎: <code>/add &lt;名称&gt; &lt;URL模板&gt; [域名]</code></span>
                    </div>
                    <div style="margin-bottom: 8px; display: flex;">
                        <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; margin-right: 10px; flex-shrink: 0;">/remove</code>
                        <span>删除搜索引擎: <code>/remove &lt;名称&gt;</code></span>
                    </div>
                    <div style="margin-bottom: 8px; display: flex;">
                        <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; margin-right: 10px; flex-shrink: 0;">/list</code>
                        <span>列出所有自定义引擎</span>
                    </div>
                    <div style="margin-bottom: 8px; display: flex;">
                        <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; margin-right: 10px; flex-shrink: 0;">/help</code>
                        <span>显示此帮助信息</span>
                    </div>
                </div>
                <div style="font-size: 13px; opacity: 0.8;">
                    <p style="margin: 8px 0;">提示：URL模板中请使用 <code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">{query}</code> 作为查询占位符</p>
                    <p style="margin: 8px 0;">例如: <code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; word-break: break-all;">/add GitHub https://github.com/search?q={query}</code></p>
                </div>
            </div>
        `;
        showNotification(helpContent);
    } else {
        showNotification(`未知命令: /${cmd}\n输入 /help 查看可用命令`);
    }
};

    function updateMenuHighlight(items) {
        items.forEach((item, index) => {
            item.classList.toggle('key-active', index === state.activeIndex);
        });
    }

    // 点击菜单外部关闭菜单
    document.addEventListener('click', (e) => {
        if (!engineTrigger.contains(e.target)) {
            toggleMenu(false);
        }
    });

    // --- 优化9: 输入框防抖处理 ---
    const debouncedToggleClearBtn = debounce(() => {
        const hasText = input.value.length > 0;
        clearBtn.classList.toggle('visible', hasText);
        checkDirectMode(input.value);
    }, 100);

    // --- 优化10: 直达模式检测 ---
    const checkDirectMode = (val) => {
        const query = val.trim();
        
        // 如果是命令模式，不启用直达模式
        if (query.startsWith('/')) {
            form.classList.remove('direct-mode');
            return;
        }
        
        const parts = query.split(/\s+/);
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        
        let isDirect = false;
        let label = "跳转";

        // 识别 URL
        if (urlPattern.test(query)) {
            isDirect = true;
            label = "跳转";
        } 
        // 识别快捷键 (需空格触发，如 "gh ")
        else if (parts.length > 1) {
            const prefix = parts[0].toLowerCase();
            if (directShortcuts[prefix]) {
                isDirect = true;
                label = directShortcuts[prefix].name;
            }
        }

        if (isDirect) {
            directBadge.textContent = label;
            form.classList.add('direct-mode');
        } else {
            form.classList.remove('direct-mode');
        }
    };

    const clearInput = () => {
        input.value = ''; 
        debouncedToggleClearBtn(); 
        input.focus();    
    };

    input.addEventListener('input', debouncedToggleClearBtn);
    clearBtn.addEventListener('click', clearInput);
    
    // 初始化
    initializeEngine();
    debouncedToggleClearBtn();

// ... 之前的代码保持不变 ...

// --- 优化11: 提交搜索逻辑 ---
// 替换 script.js 中的表单提交处理部分
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const query = input.value.trim();
    if (!query) return;

    // 如果是命令，处理命令而不是搜索
    if (query.startsWith('/')) {
        handleCustomEngineCommand(query);
        return;
    }

    const searchBtn = form.querySelector('.search-button');
    searchBtn.classList.add('is-loading');

    let targetUrl = "";

    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (urlPattern.test(query)) {
        targetUrl = query.startsWith('http') ? query : `https://${query}`;
    } 
    else {
        const parts = query.split(/\s+/);
        const prefix = parts[0].toLowerCase();
        if (directShortcuts[prefix] && parts.length > 1) {
            const keyword = query.substring(parts[0].length).trim();
            targetUrl = directShortcuts[prefix].url + encodeURIComponent(keyword);
        } 
        else {
            // 检查当前是否为自定义引擎，并且URL包含{query}占位符
            const currentEngine = [...state.searchEngines, ...state.customEngines]
                .find(engine => engine.name === engineNameDisplay.textContent);
            
            if (currentEngine && currentEngine.url.includes('{query}')) {
                targetUrl = currentEngine.url.replace(/{query}/g, encodeURIComponent(query));
            } else {
                // 使用当前保存的搜索URL（对于预设引擎）
                targetUrl = state.currentSearchUrl + encodeURIComponent(query);
            }
        }
    }

    // 模拟网络延迟
    setTimeout(() => {
        try {
            window.open(targetUrl, '_blank');
        } catch (error) {
            console.error('无法打开搜索结果:', error);
            showNotification('无法打开搜索结果，请检查URL格式');
        } finally {
            searchBtn.classList.remove('is-loading');
        }
    }, 300); 
});

// ... 之后的代码保持不变 ...
    
    // --- 深色模式切换支持 ---
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 监听深色模式切换
    darkModeMediaQuery.addListener((e) => {
        // 可以在这里添加深色模式切换时的特殊处理
        console.log('深色模式状态已更改:', e.matches);
    });
});
