import os

def replace_in_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        modified = content.replace("또치", "우울빼미")
        
        if modified != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(modified)
            print(f"[SUCCESS] Modified: {file_path}")
            return True
        else:
            print(f"[INFO] No changes needed: {file_path}")
            return False
    except Exception as e:
        print(f"[ERROR] processing {file_path}: {e}")
        return False

def main():
    workspace_dir = r"d:\The-12th-Healthcare-Big-Data-AI-Startup-Competition-2026-"
    
    targets = [
        os.path.join(workspace_dir, "lib", "mockData.ts"),
        os.path.join(workspace_dir, "components", "CounselorReport.tsx"),
        os.path.join(workspace_dir, "components", "CounselorDashboard.tsx"),
        os.path.join(workspace_dir, "components", "UserFlow.tsx"),
        os.path.join(workspace_dir, "backend", "messages.json"),
        os.path.join(workspace_dir, "backend", "memory_vectors.json"),
        os.path.join(workspace_dir, "backend", "users.json"),
        os.path.join(workspace_dir, "backend", "chat_sessions.json"),
        os.path.join(workspace_dir, "data", "model.py")
    ]
    
    for target in targets:
        replace_in_file(target)
        
if __name__ == "__main__":
    main()
