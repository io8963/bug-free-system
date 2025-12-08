document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const select = document.getElementById('engine-select');
    const logoDisplay = document.getElementById('current-logo'); // 新 Logo 元素

    // Logo 切换函数：在 PC 和移动端都调用
    function updateLogo() {
        const selectedOption = select.options[select.selectedIndex];
        
        // 1. PC 端显示选项文本，移动端显示 Logo 图标名称
        if (window.innerWidth > 768) {
             // PC 端：将 Logo 占位符显示为选项的文本（Logo 容器同时展示文字和图标）
             logoDisplay.textContent = selectedOption.textContent;
        } else {
             // 移动端：将 Logo 占位符设置为对应的图标名称
             logoDisplay.textContent = selectedOption.getAttribute('data-logo');
        }
    }
    
    // 监听 select 改变事件和窗口大小变化
    select.addEventListener('change', updateLogo);
    window.addEventListener('resize', updateLogo);

    // 初始化时调用一次
    updateLogo(); 

    // 搜索表单提交逻辑（保持不变）
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const selectedEngineUrl = select.value;
        const query = encodeURIComponent(input.value.trim());
        
        if (query) {
            const searchUrl = selectedEngineUrl + query;
            window.open(searchUrl, '_blank');
        } else {
            input.focus();
        }
    });
});
