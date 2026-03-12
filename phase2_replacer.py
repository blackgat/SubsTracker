#!/usr/bin/env python3
"""
Phase 2: 處理剩餘的中文（導航、按鈕、表格標題等）
"""

import re
import json
from pathlib import Path

class Phase2Replacer:
    def __init__(self):
        self.locales_dir = Path('src/i18n/locales')
        self.zh_cn = self.load_locale('zh-CN')
        
    def load_locale(self, lang: str):
        path = self.locales_dir / f'{lang}.json'
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def find_key_for_text(self, text: str) -> str:
        """在語言檔中查找對應的 key"""
        for category, items in self.zh_cn.items():
            if isinstance(items, dict):
                for key, value in items.items():
                    if value == text:
                        return f'{category}.{key}'
        return None
    
    def process_file(self, filepath: str):
        """處理檔案"""
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        replaced_count = 0
        
        # 定義需要替換的中文和對應的 placeholder
        # 這些是確定已在語言檔中的
        replacements = {
            # 導航選單
            '仪表盘': 'nav.dashboard',
            '订阅列表': 'nav.subscriptionList',
            '系统配置': 'nav.systemConfig',
            '退出登录': 'nav.logout',
            '切换导航菜单': 'nav.toggleMenu',
            
            # 訂閱管理
            '添加新订阅': 'subscriptions.addNew',
            '类型': 'subscriptions.type',
            '到期': 'subscriptions.expiry',
            '提醒': 'subscriptions.reminder',
            '状态': 'common.status',
            '操作': 'common.actions',
            '备注': 'subscriptions.notes',
            '支付历史': 'subscriptions.paymentHistory',
            '编辑': 'common.edit',
            '删除': 'common.delete',
            '确认': 'common.confirm',
            '取消': 'common.cancel',
            '保存': 'common.save',
            '关闭': 'common.close',
            
            # Dashboard
            '未来7天内没有即将续费的订阅': 'dashboard.noUpcomingRenewals',
            '过去7天内没有支付记录': 'dashboard.noRecentPayments',
            '暂无支出数据': 'dashboard.noExpenseData',
            '暂无定时任务执行记录（等待下一次 Cron）': 'cron.noCronHistory',
            '暂无历史记录': 'dashboard.noHistory',
            
            # Config
            '管理员账户': 'config.adminAccount',
            '用户名': 'login.username',
            '密码': 'login.password',
            '如不修改密码，请留空': 'config.leaveBlankToKeepPassword',
            '测试通知': 'config.testNotification',
            '保存配置': 'config.saveConfig',
            '保存中': 'common.saving',
            '测试中': 'common.testing',
            
            # 通用消息
            '加载失败': 'messages.loadFailed',
            '保存成功': 'messages.saveSuccess',
            '保存失败': 'messages.saveError',
            '删除成功': 'messages.deleteSuccess',
            '发送成功': 'messages.sendSuccess',
        }
        
        # 按長度排序（先替換長的，避免部分匹配）
        sorted_replacements = sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True)
        
        for chinese_text, key_path in sorted_replacements:
            # 在 HTML 標籤內的文字
            pattern1 = r'>(\s*)' + re.escape(chinese_text) + r'(\s*)<'
            if re.search(pattern1, content):
                content = re.sub(pattern1, r'>\1{{' + key_path + r'}}\2<', content)
                replaced_count += content.count('{{' + key_path + '}}') - original_content.count('{{' + key_path + '}}')
            
            # 在屬性中
            for attr in ['placeholder', 'title', 'aria-label']:
                pattern2 = f'{attr}="' + re.escape(chinese_text) + '"'
                if re.search(pattern2, content):
                    content = re.sub(pattern2, f'{attr}="{{{{' + key_path + '}}}}"', content)
                    replaced_count += 1
            
            # 在 JavaScript 字符串中（使用 t() 函數）
            # 單引號
            pattern3 = r"'(" + re.escape(chinese_text) + r")'"
            if re.search(pattern3, content):
                # 檢查是否已經在 t() 中
                matches = list(re.finditer(pattern3, content))
                for match in reversed(matches):  # 從後往前替換
                    pos = match.start()
                    before = content[max(0, pos-10):pos]
                    if 't(' not in before:
                        start, end = match.span()
                        content = content[:start] + f"t('{key_path}')" + content[end:]
                        replaced_count += 1
            
            # 雙引號
            pattern4 = r'"(' + re.escape(chinese_text) + r')"'
            if re.search(pattern4, content):
                matches = list(re.finditer(pattern4, content))
                for match in reversed(matches):
                    pos = match.start()
                    before = content[max(0, pos-10):pos]
                    if 't(' not in before:
                        start, end = match.span()
                        content = content[:start] + f't("{key_path}")' + content[end:]
                        replaced_count += 1
        
        # 保存
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ {filepath}: 替換了 {replaced_count} 處")
        else:
            print(f"  ⚠️  {filepath}: 沒有變更")
        
        return replaced_count

if __name__ == '__main__':
    replacer = Phase2Replacer()
    
    print("=" * 60)
    print("Phase 2: 處理剩餘的常見中文")
    print("=" * 60)
    
    files = [
        'src/views/dashboardPage.html',
        'src/views/configPage.html',
        'src/views/adminPage.html',
    ]
    
    total = 0
    for filepath in files:
        count = replacer.process_file(filepath)
        total += count
    
    print(f"\n✨ 完成！共替換 {total} 處")
