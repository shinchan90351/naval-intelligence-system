with open('index.html', 'r', encoding='utf-8') as f:
    c = f.read()

print('tab-settings id:', 'id="tab-settings"' in c)
print('data-tab settings:', 'data-tab="tab-settings"' in c)
print('P15B_CUTAWAY_SRC in c:', 'P15B_CUTAWAY_SRC' in c)
print('CARGO_CUTAWAY_SRC in c:', 'CARGO_CUTAWAY_SRC' in c)
print('injectRandomAnomaly in c:', 'injectRandomAnomaly' in c)
print('Scripts count open/close:', c.count('<script'), c.count('</script>'))
print('Total file size:', len(c), 'bytes')
