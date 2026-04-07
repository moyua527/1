import re

with open(r'e:\DuiJie\CHANGELOG.md', 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')

header_lines = []
entry_lines = []
for line in lines:
    if re.match(r'^\|\s*v[\d.~]+\s*\|', line):
        entry_lines.append(line)
    else:
        if not entry_lines:
            header_lines.append(line)

entry_lines.reverse()

version_counter = 0
new_entry_lines = []
for entry in entry_lines:
    m = re.match(r'^(\|\s*)v[\d.~]+(\s*\|.*)$', entry)
    if not m:
        new_entry_lines.append(entry)
        continue
    
    x = 1
    y = version_counter // 100
    z = version_counter % 100
    new_ver = f'v{x}.{y}.{z}'
    
    new_line = f'{m.group(1)}{new_ver}{m.group(2)}'
    new_entry_lines.append(new_line)
    version_counter += 1

new_entry_lines.reverse()

output = '\n'.join(header_lines) + '\n' + '\n'.join(new_entry_lines) + '\n'

with open(r'e:\DuiJie\CHANGELOG.md', 'w', encoding='utf-8') as f:
    f.write(output)

print(f'Total entries: {version_counter}')
print(f'Final version: v1.{(version_counter-1)//100}.{(version_counter-1)%100}')
print(f'Header lines: {len(header_lines)}, Entry lines: {len(new_entry_lines)}')
