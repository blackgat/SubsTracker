#!/usr/bin/env python3
"""
SubsTracker i18n 自動轉換器
- 掃描所有 HTML 檔案中的中文
- 自動分配 key 並更新語言檔
- 替換 HTML 中的中文為佔位符
"""

import re
import json
import os
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Set

# 語言檔路徑
LOCALES_DIR = Path('src/i18n/locales')
VIEWS_DIR = Path('src/views')

# Key 分類規則（根據內容自動判斷）
KEY_CATEGORIES = {
    'common': ['确认', '取消', '保存', '删除', '编辑', '添加', '搜索', '筛选', '导出', '导入', '刷新', 
               '关闭', '提交', '重置', '返回', '下一步', '上一步', '操作', '状态', '成功', '错误', 
               '警告', '信息', '加载', '正在', '请', '暂无', '全部', '选择', '请输入', '请选择'],
    'nav': ['仪表盘', '订阅列表', '系统配置', '退出登录', '切换导航'],
    'subscriptions': ['订阅', '订阅名称', '金额', '周期', '续费', '分类', '到期', '提醒', '备注', 
                      '支付', '历史', '模式', '循环', '重置', '类型'],
    'calendar': ['月', '日', '年', '今天', '选择日期', '农历', '显示农历', '公历', '正月', '腊月',
                 '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                 '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
                 '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪',
                 '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
                 '一', '二', '三', '四', '五', '六', '日'],
    'config': ['配置', '设置', '管理员', '账户', '用户名', '密码', '修改', '留空', '测试', '通知'],
    'dashboard': ['仪表板', '概览', '统计', '活动', '支出', '排行', '最近', '未来'],
    'form': ['必填', '可选', '格式', '验证', '输入', '单位', '天数', '次数'],
    'messages': ['成功', '失败', '错误', '更新', '网络', '服务器', '发生'],
}

def categorize_key(text: str) -> str:
    """根據文字內容自動判斷 key 所屬分類"""
    for category, keywords in KEY_CATEGORIES.items():
        if any(kw in text for kw in keywords):
            return category
    return 'misc'

def text_to_key(text: str, category: str) -> str:
    """將中文文字轉換為 key 名稱"""
    # 常見對應
    key_map = {
        '订阅': 'subscription', '订阅名称': 'subscriptionName',
        '添加': 'add', '编辑': 'edit', '删除': 'delete', '保存': 'save',
        '取消': 'cancel', '确认': 'confirm', '关闭': 'close',
        '金额': 'amount', '周期': 'cycle', '续费': 'renewal', '到期': 'expiry',
        '分类': 'category', '类型': 'type', '状态': 'status', '备注': 'notes',
        '提醒': 'notification', '通知': 'notification',
        '仪表盘': 'dashboard', '系统配置': 'config', '退出登录': 'logout',
        '切换导航菜单': 'toggleMenu',
        '显示农历': 'showLunar', '农历': 'lunar', '公历': 'solar',
        '选择日期': 'selectDate', '选择年份': 'selectYear', '选择月份': 'selectMonth',
        '循环订阅': 'cyclicSubscription', '到期重置': 'resetOnExpiry',
        '正常': 'normal', '暂停': 'paused', '停用': 'inactive', '续订': 'renewed',
        '即将到期': 'expiringSoon', '已过期': 'expired',
        '请输入': 'pleaseEnter', '请选择': 'pleaseSelect',
        '全部': 'all', '暂无': 'none', '加载中': 'loading',
        '订阅费用和活动概览': 'subscriptionOverview',
        '统计金额已折合为': 'amountConvertedTo',
        '自动提醒任务状态': 'autoReminderStatus',
        '最近支付': 'recentPayments', '即将续费': 'upcomingRenewals',
        '过去': 'past', '未来': 'future', '天': 'days',
        '管理员账户': 'adminAccount', '用户名': 'username', '密码': 'password',
        '如不修改密码，请留空': 'leaveBlankToKeepPassword',
        '留空表示不修改当前密码': 'leaveBlankKeepsCurrentPassword',
        '周期单位': 'periodUnit', '周期数量': 'periodValue',
        '订阅模式': 'subscriptionMode',
        '支付记录': 'paymentHistory', '编辑支付记录': 'editPayment',
        '支付日期': 'paymentDate', '支付金额': 'paymentAmount',
        '当前到期': 'currentExpiry', '新到期日': 'newExpiry',
        '测试通知': 'testNotification', '发送测试': 'sendTest',
        '发送测试通知时发生网络错误，请稍后重试': 'testNotificationNetworkError',
        '更新时发生错误': 'updateError', '更新失败': 'updateFailed',
        '支付记录已更新': 'paymentUpdated', '删除成功': 'deleteSuccess',
    }
    
    if text in key_map:
        return key_map[text]
    
    # 月份
    month_match = re.match(r'(\d+)月', text)
    if month_match:
        return f'month{month_match.group(1)}'
    
    # 星期
    weekday_map = {'一': 'mon', '二': 'tue', '三': 'wed', '四': 'thu', 
                   '五': 'fri', '六': 'sat', '日': 'sun'}
    if text in weekday_map:
        return f'weekday_{weekday_map[text]}'
    
    # 生成通用 key
    # 移除標點，轉拼音（簡化版）
    clean_text = re.sub(r'[^\w\s]', '', text).strip()
    words = clean_text.split()
    if len(words) <= 3:
        return '_'.join(words[:3]).lower()
    return clean_text[:20].replace(' ', '_').lower()

def load_locale(lang: str) -> Dict:
    """載入語言檔"""
    path = LOCALES_DIR / f'{lang}.json'
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_locale(lang: str, data: Dict):
    """保存語言檔"""
    path = LOCALES_DIR / f'{lang}.json'
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def translate_to_traditional(text: str) -> str:
    """簡體轉繁體（基礎映射）"""
    s2t_map = {
        '订阅': '訂閱', '费用': '費用', '统计': '統計', '历史': '歷史',
        '测试': '測試', '设置': '設定', '确认': '確認', '删除': '刪除',
        '编辑': '編輯', '添加': '新增', '搜索': '搜尋', '筛选': '篩選',
        '导出': '匯出', '导入': '匯入', '关闭': '關閉', '提交': '提交',
        '重置': '重置', '返回': '返回', '操作': '操作', '状态': '狀態',
        '错误': '錯誤', '信息': '資訊', '加载中': '載入中',
        '仪表盘': '儀錶板', '系统配置': '系統設定', '退出登录': '登出',
        '切换导航菜单': '切換導航選單', '农历': '農曆', '显示': '顯示',
        '循环': '循環', '暂停': '暫停', '请输入': '請輸入',
        '备注': '備註', '金额': '金額', '续费': '續費', '周期': '週期',
        '分类': '分類', '类型': '類型', '到期': '到期', '提醒': '提醒',
        '通知': '通知', '暂无': '暫無', '全部': '全部',
        '管理员': '管理員', '账户': '帳戶', '用户名': '使用者名稱',
        '密码': '密碼', '修改': '修改', '留空': '留空',
        '最近': '最近', '即将': '即將', '过去': '過去', '未来': '未來',
        '概览': '概覽', '活动': '活動', '支出': '支出',
        '个': '個', '天': '天', '月': '月', '年': '年',
    }
    result = text
    for s, t in s2t_map.items():
        result = result.replace(s, t)
    return result

def translate_to_english(text: str) -> str:
    """中文轉英文（基礎映射）"""
    en_map = {
        '订阅': 'Subscription', '订阅名称': 'Subscription Name',
        '添加': 'Add', '编辑': 'Edit', '删除': 'Delete', '保存': 'Save',
        '取消': 'Cancel', '确认': 'Confirm', '关闭': 'Close',
        '金额': 'Amount', '周期': 'Cycle', '续费': 'Renewal', '到期': 'Expiry',
        '分类': 'Category', '类型': 'Type', '状态': 'Status', '备注': 'Notes',
        '提醒': 'Reminder', '通知': 'Notification',
        '仪表盘': 'Dashboard', '系统配置': 'Settings', '退出登录': 'Logout',
        '切换导航菜单': 'Toggle Menu',
        '显示农历': 'Show Lunar Calendar', '农历': 'Lunar', '公历': 'Solar',
        '选择日期': 'Select Date', '选择年份': 'Select Year', '选择月份': 'Select Month',
        '循环订阅': 'Cyclic Subscription', '到期重置': 'Reset on Expiry',
        '正常': 'Active', '暂停': 'Paused', '停用': 'Inactive', '续订': 'Renewed',
        '即将到期': 'Expiring Soon', '已过期': 'Expired',
        '请输入': 'Please enter', '请选择': 'Please select',
        '全部': 'All', '暂无': 'None', '加载中': 'Loading',
        '订阅费用和活动概览': 'Subscription cost and activity overview',
        '统计金额已折合为': 'Amounts converted to',
        'CNY': 'CNY',
        '自动提醒任务状态': 'Auto reminder task status',
        '最近支付': 'Recent Payments', '即将续费': 'Upcoming Renewals',
        '过去': 'Past', '未来': 'Future', '天': 'days',
        '管理员账户': 'Admin Account', '用户名': 'Username', '密码': 'Password',
        '如不修改密码，请留空': 'Leave blank to keep password',
        '留空表示不修改当前密码': 'Leave blank to keep current password',
        '周期单位': 'Period Unit', '周期数量': 'Period Value',
        '订阅模式': 'Subscription Mode',
        '支付记录': 'Payment History', '编辑支付记录': 'Edit Payment',
        '支付日期': 'Payment Date', '支付金额': 'Payment Amount',
        '当前到期': 'Current Expiry', '新到期日': 'New Expiry',
        '测试通知': 'Test Notification', '发送测试': 'Send Test',
        '发送测试通知时发生网络错误，请稍后重试': 'Network error sending test notification, please retry later',
        '更新时发生错误': 'Error occurred during update', '更新失败': 'Update failed',
        '支付记录已更新': 'Payment record updated', '删除成功': 'Deleted successfully',
        '一': 'Mon', '二': 'Tue', '三': 'Wed', '四': 'Thu', 
        '五': 'Fri', '六': 'Sat', '日': 'Sun',
        '1月': 'January', '2月': 'February', '3月': 'March', '4月': 'April',
        '5月': 'May', '6月': 'June', '7月': 'July', '8月': 'August',
        '9月': 'September', '10月': 'October', '11月': 'November', '12月': 'December',
        '个订阅': 'subscriptions', '订阅列表': 'Subscription List',
        '全部模式': 'All Modes', '全部分类': 'All Categories',
        '选择或输入自定义类型': 'Select or enter custom type',
        '必填': 'Required',
    }
    
    # 完整匹配
    if text in en_map:
        return en_map[text]
    
    # 月份
    month_match = re.match(r'(\d+)月', text)
    if month_match:
        months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
        month_num = int(month_match.group(1))
        if 1 <= month_num <= 12:
            return months[month_num - 1]
    
    # 數字 + 天
    days_match = re.match(r'(\d+)天', text)
    if days_match:
        return f'{days_match.group(1)} days'
    
    # 部分匹配
    for zh, en in en_map.items():
        if zh in text:
            return text.replace(zh, en)
    
    return text  # 無法翻譯的保留原文

def extract_chinese_from_html(content: str) -> List[Tuple[str, str, int]]:
    """從 HTML 提取所有中文（類型, 文字, 位置）"""
    # 移除註解
    content_clean = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content_clean = re.sub(r'<!--.*?-->', '', content_clean, flags=re.DOTALL)
    content_clean = re.sub(r'//.*?$', '', content_clean, flags=re.MULTILINE)
    
    results = []
    
    # 1. 標籤內的文字（排除已經是佔位符的）
    for match in re.finditer(r'>([^<]*[\u4e00-\u9fff][^<]*)<', content_clean):
        text = match.group(1).strip()
        if text and not text.startswith('{{') and not re.match(r'^\s*$', text):
            results.append(('html_text', text, match.start(1)))
    
    # 2. 屬性值中的中文
    for match in re.finditer(r'(placeholder|title|aria-label|value)="([^"]*[\u4e00-\u9fff][^"]*)"', content_clean):
        attr, text = match.group(1), match.group(2).strip()
        if text and not text.startswith('{{'):
            results.append((f'attr_{attr}', text, match.start(2)))
    
    # 3. JavaScript 字串中的中文
    for match in re.finditer(r'''['"]([^'"]*[\u4e00-\u9fff][^'"]*)['"]''', content_clean):
        text = match.group(1).strip()
        if text and not text.startswith('{{') and len(text) > 0:
            results.append(('js_string', text, match.start(1)))
    
    return results

def replace_chinese_in_html(content: str, replacements: Dict[str, str]) -> str:
    """替換 HTML 中的中文為佔位符"""
    result = content
    
    # 按照位置從後往前替換（避免位置偏移）
    for chinese, placeholder in sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True):
        # HTML 文字替換
        result = re.sub(
            r'>(\s*)' + re.escape(chinese) + r'(\s*)<',
            r'>\1' + placeholder + r'\2<',
            result
        )
        
        # 屬性值替換
        for attr in ['placeholder', 'title', 'aria-label', 'value']:
            result = re.sub(
                f'{attr}="([^"]*){re.escape(chinese)}([^"]*)"',
                f'{attr}="\\1{placeholder}\\2"',
                result
            )
        
        # JavaScript 字串替換（使用 t() 函數）
        # 單引號
        result = re.sub(
            r"'([^']*)" + re.escape(chinese) + r"([^']*)'",
            lambda m: f"t('{placeholder.strip('{}')}')" if m.group(1).strip() == '' and m.group(2).strip() == '' else m.group(0),
            result
        )
        # 雙引號
        result = re.sub(
            r'"([^"]*)' + re.escape(chinese) + r'([^"]*)"',
            lambda m: f't("{placeholder.strip("{}")}")' if m.group(1).strip() == '' and m.group(2).strip() == '' else m.group(0),
            result
        )
    
    return result

def main():
    """主流程"""
    print("=" * 60)
    print("SubsTracker i18n 自動轉換器")
    print("=" * 60)
    
    # 載入現有語言檔
    zh_cn = load_locale('zh-CN')
    zh_tw = load_locale('zh-TW')
    en = load_locale('en')
    
    print(f"\n📚 已載入語言檔:")
    print(f"  zh-CN: {sum(len(v) if isinstance(v, dict) else 1 for v in zh_cn.values())} keys")
    print(f"  zh-TW: {sum(len(v) if isinstance(v, dict) else 1 for v in zh_tw.values())} keys")
    print(f"  en: {sum(len(v) if isinstance(v, dict) else 1 for v in en.values())} keys")
    
    # 處理每個 HTML 檔案
    html_files = ['adminPage.html', 'configPage.html', 'dashboardPage.html']
    
    all_replacements = {}
    new_keys_count = 0
    
    for filename in html_files:
        print(f"\n📄 處理 {filename}...")
        filepath = VIEWS_DIR / filename
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取所有中文
        chinese_texts = extract_chinese_from_html(content)
        unique_texts = list(set([t[1] for t in chinese_texts]))
        print(f"  發現 {len(unique_texts)} 個不同的中文文字")
        
        # 為每個中文分配 key
        for text in unique_texts:
            # 檢查是否已存在
            existing_key = None
            for category, items in zh_cn.items():
                if isinstance(items, dict):
                    for key, value in items.items():
                        if value == text:
                            existing_key = f'{category}.{key}'
                            break
            
            if existing_key:
                all_replacements[text] = '{{' + existing_key + '}}'
                continue
            
            # 生成新 key
            category = categorize_key(text)
            key_name = text_to_key(text, category)
            
            # 確保 key 唯一
            original_key = key_name
            counter = 1
            while key_name in zh_cn.get(category, {}):
                key_name = f'{original_key}{counter}'
                counter += 1
            
            # 添加到語言檔
            if category not in zh_cn:
                zh_cn[category] = {}
                zh_tw[category] = {}
                en[category] = {}
            
            zh_cn[category][key_name] = text
            zh_tw[category][key_name] = translate_to_traditional(text)
            en[category][key_name] = translate_to_english(text)
            
            all_replacements[text] = '{{' + f'{category}.{key_name}' + '}}'
            new_keys_count += 1
        
        # 替換 HTML 內容
        new_content = replace_chinese_in_html(content, all_replacements)
        
        # 儲存
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  ✅ 已替換並保存")
    
    # 保存語言檔
    save_locale('zh-CN', zh_cn)
    save_locale('zh-TW', zh_tw)
    save_locale('en', en)
    
    print(f"\n✨ 完成！")
    print(f"  新增 {new_keys_count} 個 key")
    print(f"  總共處理 {len(all_replacements)} 個不同的中文文字")
    print(f"\n💾 語言檔已更新")

if __name__ == '__main__':
    main()
