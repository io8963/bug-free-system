document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const select = document.getElementById('engine-select');

    // --- 新增函数：更新 Placeholder ---
    function updatePlaceholder() {
        const selectedOption = select.options[select.selectedIndex];
        const engineName = selectedOption.textContent;
        
        // 设置新的 Placeholder 文本
        input.placeholder = `使用 ${engineName} 搜索...`;
    }

    // 1. 初始化 Placeholder
    updatePlaceholder();
    
    // 2. 监听 select 改变事件，实时更新 Placeholder
    select.addEventListener('change', updatePlaceholder);


    // --- 核心搜索提交逻辑（保持不变）---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const selectedEngineUrl = select.value;
        const rawQuery = input.value.trim();
        
        if (!rawQuery) {
            input.focus();
            return; 
        }
        
        const encodedQuery = encodeURIComponent(rawQuery);
        const searchUrl = selectedEngineUrl + encodedQuery;
        
        window.open(searchUrl, '_blank');
    });
});
