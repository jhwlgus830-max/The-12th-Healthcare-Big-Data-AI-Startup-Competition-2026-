import urllib.request
import json
import sys

try:
    url = "http://localhost:8000/api/resources/search?region=%EC%84%9C%EC%9A%B8"
    print("Fetching URL:", url)
    response = urllib.request.urlopen(url)
    data = json.loads(response.read().decode('utf-8'))
    
    print("Status:", data.get("status"))
    results = data.get("data", [])
    print(f"Total results: {len(results)}")
    
    # Print the first 3 items with escape characters so we can see the exact Korean text
    for idx, item in enumerate(results[:3]):
        print(f"\n--- Item {idx} ---")
        for k, v in item.items():
            escaped_val = v.encode('ascii', 'backslashreplace').decode('ascii')
            print(f"{k}: {escaped_val}")
            
except Exception as e:
    import traceback
    traceback.print_exc()
