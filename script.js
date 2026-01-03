document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-btn');
    
    const engineTrigger = document.getElementById('engine-trigger');
    const engineMenu = document.getElementById('engine-menu');
    const engineNameDisplay = document.getElementById('current-engine-name');
    const menuItems = engineMenu.querySelectorAll('li');

    let currentSearchUrl = "https://www.bing.com/search?q=";
    let activeIndex = -1; 

    // --- 1. 初始化引擎状态 ---
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

    // --- 2. 菜单开关逻辑 ---
    function toggleMenu(show) {
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

    // --- 3. 键盘与全局点击 ---
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
        
        // "/" 键快速聚焦
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

    // --- 4. 输入框逻辑 ---
    const toggleClearBtn = () => {
        clearBtn.style.display = input.value.trim() ? 'flex' : 'none';
    };
    
    const clearInput = () => {
        input.value = ''; 
        input.focus();    
        toggleClearBtn(); 
    };

    input.addEventListener('input', toggleClearBtn);
    clearBtn.addEventListener('click', clearInput);

    // --- 5. 提交搜索 ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const query = input.value.trim();
        if (!query) return;

        const searchBtn = form.querySelector('.search-button');
        searchBtn.classList.add('is-loading'); 

        setTimeout(() => {
            window.open(currentSearchUrl + encodeURIComponent(query), '_blank');
            searchBtn.classList.remove('is-loading');
        }, 300); 
    });
});