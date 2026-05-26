import json

file_path = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-\backend\messages.json"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Recursively replace emojis to restore 🎓 for mentor
    def replace_emojis(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k == "icon" and v == "🧑‍🏫":
                    obj[k] = "🎓"
                else:
                    replace_emojis(v)
        elif isinstance(obj, list):
            for item in obj:
                replace_emojis(item)

    replace_emojis(data)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print("Successfully restored 🎓 in backend/messages.json!")
except Exception as e:
    print(f"Error occurred: {e}")
