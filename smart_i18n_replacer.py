#!/usr/bin/env python3
"""
Smart i18n Replacer for SubsTracker
智能 i18n 替換工具 - 保守且安全的策略
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict

class I18nReplacer:
    def __init__(self):
        self.locales_dir = Path('src/i18n/locales')
        self.zh_cn = self.load_locale('zh-CN')
        self.zh_tw = self.load_locale('zh-TW')
        self.en = self.load_locale('en')
        self.replacements = {}  # {original_text: placeholder}
        
    def load_locale(self, lang: str) -> Dict:
        """載入語言檔"""
        path = self.locales_dir / f'{lang}.json'
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def save_locale(self, lang: str, data: Dict):
        """保存語言檔"""
        path = self.locales_dir / f'{lang}.json'
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def find_existing_key(self, text: str) -> str:
        """在現有語言檔中查找是否已有對應的 key"""
        for category, items in self.zh_cn.items():
            if isinstance(items, dict):
                for key, value in items.items():
                    if value == text:
                        return f'{category}.{key}'
        return None
    
    def text_to_key_name(self, text: str, category: str) -> str:
        """將中文轉換為 key 名稱"""
        # 常見映射
        key_map = {
            '仪表板': 'dashboard', '仪表盘': 'dashboard',
            '订阅': 'subscription', '订阅管理': 'subscriptionManagement',
            '系统配置': 'systemConfig', '配置': 'config',
            '登出': 'logout', '退出登录': 'logout',
            '切换导航菜单': 'toggleMenu',
            '过去7天内没有支付记录': 'noRecentPayments',
            '未来7天内没有即将续费的订阅': 'noUpcomingRenewals',
            '暂无支出数据': 'noExpenseData',
            '暂无定时任务执行记录（等待下一次 Cron）': 'noCronHistory',
            '暂无历史记录': 'noHistory',
            '暂无详情': 'noDetails',
            '即将到期': 'expiringSoon',
            '活跃订阅': 'activeSubscriptions',
            '总订阅数': 'totalSubscriptions',
            '月度支出': 'monthlyExpense',
            '年度支出': 'yearlyExpense',
            '本月折合支出': 'currentMonthExpense',
            '月均支出': 'avgMonthlyExpense',
            '最近执行时间': 'lastRunTime',
            '状态': 'status',
            '检查与命中': 'checkAndMatch',
            '发送结果': 'sendResult',
            '当前小时 / 配置时段（UTC）': 'currentHourAndConfiguredHours',
            '本次有发送': 'sentThisTime',
            '本次未发送': 'notSentThisTime',
            '检查': 'check', '命中': 'match',
            '尝试': 'attempted', '成功': 'success', '失败': 'failed',
            '去重跳过': 'dedupeSkipped',
            '渠道': 'channel', '个': 'items',
            '天后': 'daysLater', '已发送': 'sent', '未发送': 'notSent',
            '未知': 'unknown', '未知时间': 'unknownTime',
            '全部时段': 'allHours',
            '加载仪表盘数据失败': 'loadDashboardFailed',
            '格式化时区显示失败': 'formatTimezoneFailed',
        }
        
        if text in key_map:
            return key_map[text]
        
        # 生成通用 key
        # 簡化處理：取前幾個字的拼音或簡寫
        if len(text) <= 6:
            # 短文字，用簡寫
            return f'text_{len(text)}_{hash(text) % 10000}'
        else:
            # 長文字，用 hash
            return f'longText_{hash(text) % 100000}'
    
    def translate_to_traditional(self, text: str) -> str:
        """簡體轉繁體"""
        s2t_map = {
            '订阅': '訂閱', '仪表盘': '儀錶板', '仪表板': '儀錶板',
            '系统': '系統', '配置': '設定', '设置': '設定',
            '退出': '登出', '登录': '登入',
            '切换': '切換', '导航': '導航', '菜单': '選單',
            '过去': '過去', '没有': '沒有', '支付': '支付',
            '记录': '記錄', '未来': '未來', '即将': '即將',
            '续费': '續費', '暂无': '暫無', '支出': '支出',
            '数据': '資料', '定时': '定時', '任务': '任務',
            '执行': '執行', '等待': '等待', '历史': '歷史',
            '详情': '詳情', '到期': '到期', '活跃': '活躍',
            '总': '總', '月度': '月度', '年度': '年度',
            '本月': '本月', '折合': '折合', '月均': '月均',
            '最近': '最近', '时间': '時間', '状态': '狀態',
            '检查': '檢查', '命中': '命中', '发送': '發送',
            '结果': '結果', '当前': '當前', '小时': '小時',
            '时段': '時段', '本次': '本次', '尝试': '嘗試',
            '成功': '成功', '失败': '失敗', '去重': '去重',
            '跳过': '跳過', '渠道': '渠道', '个': '個',
            '天后': '天後', '已': '已', '未': '未',
            '未知': '未知', '全部': '全部', '加载': '載入',
            '失败': '失敗', '格式化': '格式化', '时区': '時區',
            '显示': '顯示',
        }
        result = text
        for s, t in s2t_map.items():
            result = result.replace(s, t)
        return result
    
    def translate_to_english(self, text: str) -> str:
        """中文轉英文"""
        en_map = {
            '仪表板': 'Dashboard', '仪表盘': 'Dashboard',
            '订阅': 'Subscription', '订阅管理': 'Subscription Management',
            '系统配置': 'System Settings', '配置': 'Settings',
            '退出登录': 'Logout', '登出': 'Logout',
            '切换导航菜单': 'Toggle Menu',
            '过去7天内没有支付记录': 'No payments in the past 7 days',
            '未来7天内没有即将续费的订阅': 'No upcoming renewals in the next 7 days',
            '暂无支出数据': 'No expense data',
            '暂无定时任务执行记录（等待下一次 Cron）': 'No cron execution history (waiting for next run)',
            '暂无历史记录': 'No history',
            '暂无详情': 'No details',
            '即将到期': 'Expiring Soon',
            '活跃订阅': 'Active Subscriptions',
            '总订阅数': 'Total Subscriptions',
            '月度支出': 'Monthly Expense',
            '年度支出': 'Yearly Expense',
            '本月折合支出': 'Current Month Expense',
            '月均支出': 'Avg Monthly Expense',
            '最近执行时间': 'Last Run Time',
            '状态': 'Status',
            '检查与命中': 'Check & Match',
            '发送结果': 'Send Result',
            '当前小时 / 配置时段（UTC）': 'Current Hour / Configured Hours (UTC)',
            '本次有发送': 'Sent This Time',
            '本次未发送': 'Not Sent This Time',
            '检查': 'checked', '命中': 'matched',
            '尝试': 'Attempted', '成功': 'successful', '失败': 'failed',
            '去重跳过': 'dedupe skipped',
            '渠道': 'channels', '个': '',
            '天后': 'days later', '已发送': 'Sent', '未发送': 'Not Sent',
            '未知': 'Unknown', '未知时间': 'Unknown Time',
            '全部时段': 'All Hours',
            '加载仪表盘数据失败': 'Failed to load dashboard data',
            '格式化时区显示失败': 'Failed to format timezone display',
            ' Cron 可观测性': 'Cron Observability',
        }
        
        if text in en_map:
            return en_map[text]
        
        # 部分匹配
        for zh, en in en_map.items():
            if zh in text:
                return text.replace(zh, en)
        
        return text
    
    def add_translation(self, text: str, category: str):
        """為中文文字添加翻譯到語言檔"""
        # 檢查是否已存在
        existing_key = self.find_existing_key(text)
        if existing_key:
            self.replacements[text] = '{{' + existing_key + '}}'
            return existing_key
        
        # 生成新 key
        key_name = self.text_to_key_name(text, category)
        
        # 確保 key 唯一
        original_key = key_name
        counter = 1
        while key_name in self.zh_cn.get(category, {}):
            key_name = f'{original_key}_{counter}'
            counter += 1
        
        # 添加到語言檔
        if category not in self.zh_cn:
            self.zh_cn[category] = {}
            self.zh_tw[category] = {}
            self.en[category] = {}
        
        self.zh_cn[category][key_name] = text
        self.zh_tw[category][key_name] = self.translate_to_traditional(text)
        self.en[category][key_name] = self.translate_to_english(text)
        
        full_key = f'{category}.{key_name}'
        self.replacements[text] = '{{' + full_key + '}}'
        return full_key
    
    def categorize_text(self, text: str) -> str:
        """根據內容判斷分類"""
        if any(kw in text for kw in ['仪表', '概览', '统计', '支出', '活动']):
            return 'dashboard'
        elif any(kw in text for kw in ['配置', '设置', '管理员', '通知', '测试']):
            return 'config'
        elif any(kw in text for kw in ['订阅', '续费', '到期', '提醒', '支付', '历史']):
            return 'subscriptions'
        elif any(kw in text for kw in ['成功', '失败', '错误', '警告', '加载']):
            return 'messages'
        elif any(kw in text for kw in ['检查', '发送', '执行', '任务', 'Cron']):
            return 'cron'
        else:
            return 'misc'
    
    def extract_chinese_safe(self, content: str) -> List[Tuple[str, int, str]]:
        """安全地提取中文（排除註解和已有佔位符）"""
        # 移除註解
        content_clean = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        content_clean = re.sub(r'<!--.*?-->', '', content_clean, flags=re.DOTALL)
        
        results = []
        
        # 1. HTML 標籤內的純文字 >中文<
        for match in re.finditer(r'>([^<]*[\u4e00-\u9fff][^<]*)<', content_clean):
            text = match.group(1).strip()
            if text and not text.startswith('{{') and not text.startswith('t('):
                results.append(('html_text', match.start(1), text))
        
        # 2. HTML 屬性中的中文
        for match in re.finditer(r'(placeholder|title|aria-label)="([^"]*[\u4e00-\u9fff][^"]*)"', content_clean):
            attr, text = match.group(1), match.group(2).strip()
            if text and not text.startswith('{{'):
                results.append((f'attr_{attr}', match.start(2), text))
        
        # 3. JavaScript 簡單字串（不在模板字符串中的）
        # 只處理單獨的簡單字符串，避免破壞複雜的JS代碼
        for match in re.finditer(r"'([\u4e00-\u9fff]{1,20})'", content_clean):
            text = match.group(1).strip()
            results.append(('js_simple', match.start(1), text))
        
        for match in re.finditer(r'"([\u4e00-\u9fff]{1,20})"', content_clean):
            text = match.group(1).strip()
            results.append(('js_simple', match.start(1), text))
        
        return results
    
    def process_file(self, filepath: str):
        """處理單個檔案"""
        print(f"\n處理 {filepath}...")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # 提取中文
        chinese_items = self.extract_chinese_safe(original_content)
        unique_texts = list(set([item[2] for item in chinese_items]))
        
        print(f"  發現 {len(unique_texts)} 個不同的中文文字")
        
        # 為每個中文添加翻譯
        for text in unique_texts:
            category = self.categorize_text(text)
            self.add_translation(text, category)
        
        # 替換內容
        # 按位置從後往前替換（避免位置偏移）
        chinese_items_sorted = sorted(chinese_items, key=lambda x: x[1], reverse=True)
        
        content = original_content
        replaced_count = 0
        
        for item_type, pos, text in chinese_items_sorted:
            placeholder = self.replacements.get(text)
            if not placeholder:
                continue
            
            # 根據類型進行替換
            if item_type == 'html_text':
                # HTML 文字：直接替換
                pattern = r'>' + re.escape(text) + r'<'
                if re.search(pattern, content):
                    content = re.sub(pattern, f'>{placeholder}<', content, count=1)
                    replaced_count += 1
            
            elif item_type.startswith('attr_'):
                # HTML 屬性：替換屬性值
                attr_name = item_type.split('_')[1]
                pattern = f'{attr_name}="' + re.escape(text) + '"'
                if re.search(pattern, content):
                    content = re.sub(pattern, f'{attr_name}="{placeholder}"', content, count=1)
                    replaced_count += 1
            
            elif item_type == 'js_simple':
                # JavaScript 簡單字符串：使用 t() 函數
                key = placeholder.strip('{}')
                # 單引號版本
                pattern1 = r"'" + re.escape(text) + r"'"
                if re.search(pattern1, content):
                    content = re.sub(pattern1, f"t('{key}')", content, count=1)
                    replaced_count += 1
                else:
                    # 雙引號版本
                    pattern2 = r'"' + re.escape(text) + r'"'
                    if re.search(pattern2, content):
                        content = re.sub(pattern2, f't("{key}")', content, count=1)
                        replaced_count += 1
        
        # 保存
        if replaced_count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ 已替換 {replaced_count} 處")
        else:
            print(f"  ⚠️  沒有進行替換")
    
    def run(self, files: List[str]):
        """執行處理"""
        print("=" * 60)
        print("SubsTracker i18n Smart Replacer")
        print("=" * 60)
        
        # 處理每個檔案
        for filepath in files:
            self.process_file(filepath)
        
        # 保存語言檔
        self.save_locale('zh-CN', self.zh_cn)
        self.save_locale('zh-TW', self.zh_tw)
        self.save_locale('en', self.en)
        
        print(f"\n✨ 完成！")
        print(f"  共添加 {len(self.replacements)} 個新的翻譯")
        print(f"  語言檔已更新")

if __name__ == '__main__':
    replacer = I18nReplacer()
    files = [
        'src/views/dashboardPage.html',
        'src/views/configPage.html',
        'src/views/adminPage.html',
    ]
    replacer.run(files)
