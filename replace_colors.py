"""批量替换 features/ 下硬编码颜色为 CSS 变量"""
import re
import os

# 颜色到 CSS 变量的映射
COLOR_MAP = {
    # 文字色 - 无歧义映射
    '#0f172a': 'var(--text-heading)',
    '#1e293b': 'var(--text-primary)',
    '#334155': 'var(--text-body)',
    '#64748b': 'var(--text-secondary)',
    '#94a3b8': 'var(--text-tertiary)',
    '#cbd5e1': 'var(--text-disabled)',

    # 品牌色
    '#2563eb': 'var(--brand)',
    '#3b82f6': 'var(--brand)',
    '#eff6ff': 'var(--brand-light)',
    '#dbeafe': 'var(--brand-light-2)',
    '#bfdbfe': 'var(--brand-border)',

    # 语义色
    '#dc2626': 'var(--color-danger)',
    '#fef2f2': 'var(--bg-danger)',
    '#fee2e2': 'var(--bg-danger-hover)',
    '#16a34a': 'var(--color-success)',
    '#f0fdf4': 'var(--bg-success)',
    '#d97706': 'var(--color-warning)',
    '#fffbeb': 'var(--bg-warning)',
    '#fef3c7': 'var(--bg-warning-hover)',
    '#7c3aed': 'var(--color-purple)',
    '#ea580c': 'var(--color-orange)',
    '#f59e0b': 'var(--color-amber)',

    # 背景色
    '#f8fafc': 'var(--bg-secondary)',
    '#f1f5f9': 'var(--bg-tertiary)',

    # 边框色
    '#e2e8f0': 'var(--border-primary)',
}

# 需要区分上下文的颜色 (border vs background) — #f1f5f9 在 border 中用 --border-secondary
BORDER_CONTEXT_MAP = {
    '#f1f5f9': 'var(--border-secondary)',
}

# #fff/#ffffff 的映射 (只在 background/bg 上下文中替换)
WHITE_MAP = {
    '#ffffff': 'var(--bg-primary)',
    '#fff': 'var(--bg-primary)',
}

FEATURES_DIR = r'E:\DuiJie\frontend\duijieReact\src\features'

def replace_colors_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    count = 0

    # 1. 替换明确的颜色 (非 #fff/#ffffff)
    for hex_color, css_var in COLOR_MAP.items():
        # 处理 border 上下文中的特殊映射
        if hex_color in BORDER_CONTEXT_MAP:
            # border 相关属性中用 border 变量
            border_pattern = r"(border(?:Top|Bottom|Left|Right|Color)?:\s*'[^']*)" + re.escape(hex_color)
            content, n = re.subn(border_pattern, lambda m: m.group(1) + BORDER_CONTEXT_MAP[hex_color], content)
            count += n

        # 普通替换: 作为独立值 '#xxx' 或 "#xxx" 或在字符串中间
        # 匹配 '#hex' (单引号包裹的完整值)
        pattern = re.escape(hex_color)
        content, n = re.subn(pattern, css_var, content, flags=re.IGNORECASE)
        count += n

    # 2. 替换 #fff/#ffffff (只在 background 上下文)
    for hex_color, css_var in WHITE_MAP.items():
        # background/bg 属性中的白色
        if hex_color == '#ffffff':
            pattern = r"(background:\s*')" + re.escape(hex_color) + r"'"
            content, n = re.subn(pattern, r"\g<1>" + css_var + "'", content)
            count += n
        elif hex_color == '#fff':
            # '#fff' 作为完整值 (不匹配 #fff 在其他颜色中间如 #fff7ed)
            pattern = r"'#fff'"
            content, n = re.subn(pattern, f"'{css_var}'", content)
            count += n
            # color="#fff"
            pattern = r'"#fff"'
            content, n = re.subn(pattern, f'"{css_var}"', content)
            count += n

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return count
    return 0

def main():
    total_files = 0
    total_replacements = 0

    for root, dirs, files in os.walk(FEATURES_DIR):
        for fname in files:
            if fname.endswith(('.tsx', '.ts')):
                fpath = os.path.join(root, fname)
                n = replace_colors_in_file(fpath)
                if n > 0:
                    rel = os.path.relpath(fpath, FEATURES_DIR)
                    print(f'  {n:4d} replacements  {rel}')
                    total_files += 1
                    total_replacements += n

    print(f'\nTotal: {total_replacements} replacements in {total_files} files')

if __name__ == '__main__':
    main()
