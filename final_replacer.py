#!/usr/bin/env python3
"""最後一輪替換：處理新添加的翻譯"""

import re
from pathlib import Path

# 定義替換映射
replacements = {
    # Loading 狀態
    '保存中...': 'common.saving',
    '删除中...': 'common.deleting',
    '测试中...': 'common.testing',
    '启用中...': 'common.activating',
    '停用中...': 'common.deactivating',
    '续订中...': 'common.renewing',
    '更新中...': 'common.updating',
    '发送中': 'common.sending',
    
    # 特殊 HTML 片段
    '<i class="fas fa-check mr-1"></i>确认续订': 'subscriptions.confirmRenewal',
    '<i class="fas fa-sync-alt mr-2"></i>手动续订 -': 'subscriptions.manualRenewal',
    
    # 文字
    '0 = 仅在到期时提醒': 'subscriptions.reminderOnExpiryOnly',
    '农历:': 'subscriptions.lunarCalendar',
    '(农历:': '({{subscriptions.lunarCalendar}}',
    
    # Config
    'Bark iOS应用': 'config.barkIosApp',
    'Webhook 调试工具': 'config.webhookDebugTool',
    '企业微信机器人文档': 'config.wechatbotDoc',
    'NotifyX官网': 'config.notifyxWebsite',
    
    # 錯誤消息
    '加载仪表盘数据失败': 'messages.loadDashboardFailed',
    '格式化时区显示失败': 'messages.formatTimezoneFailed',
}

def replace_in_file(filepath, replacements):
    """在檔案中進行替換"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    replaced_count = 0
    
    # 按長度排序（先處理長的）
    sorted_items = sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True)
    
    for chinese_text, key_path in sorted_items:
        # 如果已經是 {{key}} 格式，直接使用
        if chinese_text.startswith('({{'):
            # 特殊情況：({{subscriptions.lunarCalendar}}
            old_pattern = '(农历:'
            if old_pattern in content:
                content = content.replace(old_pattern, chinese_text)
                replaced_count += 1
            continue
        
        # HTML 中的純文字（沒有嵌套在標籤中）
        # 1. 在 HTML 標籤內
        pattern_html = r'>(\s*)' + re.escape(chinese_text) + r'(\s*)<'
        matches = list(re.finditer(pattern_html, content))
        for match in reversed(matches):
            start, end = match.span()
            ws1, ws2 = match.group(1), match.group(2)
            content = content[:start] + f'>{ws1}{{{{{key_path}}}}}{ws2}<' + content[end:]
            replaced_count += 1
        
        # 2. 在 JavaScript 字串中（單引號）
        pattern_js_single = r"'" + re.escape(chinese_text) + r"'"
        matches = list(re.finditer(pattern_js_single, content))
        for match in reversed(matches):
            # 檢查是否已在 t() 中
            pos = match.start()
            before = content[max(0, pos-10):pos]
            if 't(' not in before and '{{' not in before:
                start, end = match.span()
                content = content[:start] + f"t('{key_path}')" + content[end:]
                replaced_count += 1
        
        # 3. 在 JavaScript 字串中（雙引號）
        pattern_js_double = r'"' + re.escape(chinese_text) + r'"'
        matches = list(re.finditer(pattern_js_double, content))
        for match in reversed(matches):
            pos = match.start()
            before = content[max(0, pos-10):pos]
            if 't(' not in before and '{{' not in before:
                start, end = match.span()
                content = content[:start] + f't("{key_path}")' + content[end:]
                replaced_count += 1
        
        # 4. 在 HTML 屬性中
        for attr in ['placeholder', 'title', 'aria-label', 'value']:
            pattern_attr = f'{attr}="' + re.escape(chinese_text) + '"'
            if pattern_attr in content:
                content = content.replace(pattern_attr, f'{attr}="{{{{{key_path}}}}}"')
                replaced_count += 1
    
    # 保存
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return replaced_count
    return 0

# 處理三個檔案
files = [
    'src/views/dashboardPage.html',
    'src/views/configPage.html',
    'src/views/adminPage.html',
]

print("=" * 60)
print("最後一輪替換")
print("=" * 60)

total = 0
for filepath in files:
    count = replace_in_file(filepath, replacements)
    if count > 0:
        print(f"✅ {filepath}: {count} 處")
    else:
        print(f"⚠️ {filepath}: 無變更")
    total += count

print(f"\n✨ 總共替換: {total} 處")
