#!/usr/bin/env python3
# Quick fix for MyPage_updated.tsx

with open('/components/MyPage_updated.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix line 672 - remove backslashes
content = content.replace(
    'className={`border rounded-lg p-4 cursor-pointer transition-all ${\\n                    isDarkMode \\n                      ? \'bg-gray-700 border-gray-600 hover:border-blue-500 hover:shadow-lg\' \\n                      : \'bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg\'\\n                  }`}',
    '''className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 hover:border-blue-500 hover:shadow-lg' 
                      : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg'
                  }`}'''
)

# Fix line 821 - remove backslash-n
content = content.replace('})}\\\\n        </div>', '''})}
        </div>''')

# Also need to fix the closing divs
content = content.replace(
    '''          })}
        </div>
      )}
    </div>
  );''',
    '''          })}
        </div>
      )}
        </div>
      </div>
    );
  };'''
)

with open('/components/MyPage_updated.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed MyPage_updated.tsx")
