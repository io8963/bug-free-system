document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-btn');
    
    const engineTrigger = document.getElementById('engine-trigger');
    const engineMenu = document.getElementById('engine-menu');
    const engineNameDisplay = document.getElementById('current-engine-name');
    const directBadge = document.getElementById('direct-badge');
    const menuItems = engineMenu.querySelectorAll('li');

    let currentSearchUrl = "https://www.bing.com/search?q=";
    let activeIndex = -1; 

    // --- 1. 直达功能配置 (包含显示名称) ---
    const directShortcuts = {
        'gh': { name: 'GitHub', url: 'https://github.com/search?q=' },
        'yt': { name: 'YouTube', url: 'https://www.youtube.com/results?search_query=' },
        'bili': { name: 'Bilibili', url: 'https://search.bilibili.com/all?keyword=' },
        'wiki': { name: '维基百科', url: 'https://zh.wikipedia.org/wiki/' },
        'z': { name: '知乎', url: 'https://www.zhihu.com/search?q=' },
        'db': { name: '豆瓣', url: 'https://www.douban.com/search?q=' }
    };

    // --- 2. 初始化引擎状态 ---
    const savedEngineName = localStorage.getItem('selectedEngineName');
    const savedEngineUrl = localStorage.getItem('selectedEngineUrl');

    if (savedEngineName && savedEngineUrl) {
        updateEngineState(savedEngineName, savedEngineUrl);
    }

    function updateEngineState(name, url) {
        engineNameDisplay.textContent = name;
        currentSearchUrl = url;
        input.placeholder = `使用 ${name} 搜索...`;
        
        menuItems.forEach(item => {
            if (item.getAttribute('data-name') === name) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });

        localStorage.setItem('selectedEngineName', name);
        localStorage.setItem('selectedEngineUrl', url);
    }

    // --- 3. 菜单开关逻辑 ---
    function toggleMenu(show) {
        // 如果处于直达模式，点击左侧不触发菜单
        if (form.classList.contains('direct-mode') && show) return;

        if (show) {
            engineMenu.classList.add('active');
            engineTrigger.classList.add('is-open'); 
            engineTrigger.setAttribute('aria-expanded', 'true');
            activeIndex = -1; 
        } else {
            engineMenu.classList.remove('active');
            engineTrigger.classList.remove('is-open');
            engineTrigger.setAttribute('aria-expanded', 'false');
            menuItems.forEach(item => item.classList.remove('key-active'));
        }
    }

    engineTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(!engineMenu.classList.contains('active')); 
    });

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const name = item.getAttribute('data-name');
            const url = item.getAttribute('data-url');
            updateEngineState(name, url);
            toggleMenu(false); 
            input.focus();
        });
    });

    // --- 4. 键盘与全局点击 ---
    document.addEventListener('keydown', (e) => {
        if (engineMenu.classList.contains('active')) {
            const items = Array.from(menuItems);
            if (e.key === 'ArrowDown') {
                e.preventDefault(); 
                activeIndex = (activeIndex + 1) % items.length;
                updateMenuHighlight(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                updateMenuHighlight(items);
            } else if (e.key === 'Enter' && activeIndex > -1) {
                e.preventDefault();
                items[activeIndex].click();
            } else if (e.key === 'Escape') {
                toggleMenu(false);
            }
        }
        
        if (e.key === '/' && document.activeElement !== input) {
            e.preventDefault();
            input.focus();
        }
    });

    function updateMenuHighlight(items) {
        items.forEach((item, index) => {
            item.classList.toggle('key-active', index === activeIndex);
        });
    }

    document.addEventListener('click', () => toggleMenu(false));

    // --- 5. 输入框监听 (核心直达模式识别逻辑) ---
    const checkDirectMode = (val) => {
        const query = val.trim();
        const parts = query.split(/\s+/); // 使用正则匹配空格
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

    const toggleClearBtn = () => {
        const hasText = input.value.length > 0;
        clearBtn.classList.toggle('visible', hasText);
        checkDirectMode(input.value);
    };
    
    const clearInput = () => {
        input.value = ''; 
        toggleClearBtn(); 
        input.focus();    
    };

    input.addEventListener('input', toggleClearBtn);
    clearBtn.addEventListener('click', clearInput);
    
    toggleClearBtn();

    // --- 6. 提交搜索逻辑 ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const query = input.value.trim();
        if (!query) return;

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
                targetUrl = currentSearchUrl + encodeURIComponent(query);
            }
        }

        setTimeout(() => {
            window.open(targetUrl, '_blank');
            searchBtn.classList.remove('is-loading');
        }, 300); 
    });
});