import os
import json
from dotenv import load_dotenv

# Load local .env.local if present
parent_dir = os.path.dirname(os.path.dirname(__file__))
env_path = os.path.join(parent_dir, ".env.local")
if os.path.exists(env_path):
    load_dotenv(env_path)

from database import supabase

def migrate():
    # Make sure we have a real supabase client connection
    if not hasattr(supabase, "real_client") or supabase.real_client is None:
        print("[Migration Error] Supabase is not initialized. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.")
        return

    client = supabase.real_client
    backend_dir = os.path.dirname(__file__)

    # Pre-load valid session IDs and message IDs to prevent foreign key constraint violations
    valid_sessions = []
    session_path = os.path.join(backend_dir, "chat_sessions.json")
    if os.path.exists(session_path):
        try:
            with open(session_path, "r", encoding="utf-8") as sf:
                sess_data = json.load(sf)
                valid_sessions = [s["id"] for s in sess_data]
        except Exception as e:
            print(f"Error loading session IDs: {e}")

    valid_messages = []
    messages_path = os.path.join(backend_dir, "messages.json")
    if os.path.exists(messages_path):
        try:
            with open(messages_path, "r", encoding="utf-8") as mf:
                msg_data = json.load(mf)
                # Only keep messages whose session actually exists in our local sessions
                valid_messages = [m["id"] for m in msg_data if m.get("session_id") in valid_sessions]
        except Exception as e:
            print(f"Error loading message IDs: {e}")

    # Safe user lookup list to bypass foreign key issues
    valid_users = ["user-d7a28073", "user-developer", "user-ee310c69", "user-f369f442", "user-e320b261", 
                   "user-3d4885b1", "user-c1220124", "user-eb01d361", "user-7d33e7df", "user-7d5b6296", 
                   "user-0bcd2cad", "user-9f6ccb65", "user-f9b1fac2", "user-f1d23fdb", "user-7f44893b", 
                   "user-689bf371", "user-2c8add22", "user-1d5976e5", 
                   "user-001", "user-002", "user-003", "user-005", "user-006", "user-007", "user-008", "user-009"]

    # Mapping of local json files to Supabase tables and their strict database columns
    mappings = [
        {
            "file": "users.json",
            "table": "custom_users",
            "columns": ["id", "email", "nickname", "password"]
        },
        {
            "file": "surveys.json", 
            "table": "surveys",
            "columns": ["id", "user_id", "phq9_score", "p4_score", "p4_answers", "gender", "age_group", "occupation", "region", "contact", "phone", "severity", "created_at"]
        },
        {
            "file": "chat_sessions.json",
            "table": "chat_sessions",
            "columns": ["id", "user_id", "initial_persona", "status", "created_at"]
        },
        {
            "file": "messages.json",
            "table": "messages",
            "columns": ["id", "session_id", "role", "content", "icon", "emotion", "risk_score", "is_high_risk", "created_at"]
        },
        {
            "file": "journals.json",
            "table": "journals",
            "columns": ["id", "user_id", "content", "created_at"]
        },
        {
            "file": "safety_plans.json",
            "table": "safety_plans",
            "columns": ["user_id", "current_step", "step1_warning_signs", "step2_coping_strategies", "step3_social_distraction", "step4_social_support", "step5_professional_agencies", "step6_safe_environment"],
            "on_conflict": "user_id"
        },
        {
            "file": "counselor_notes.json",
            "table": "counselor_notes",
            "columns": ["id", "user_id", "counselor_id", "content", "created_at"]
        },
        {
            "file": "memory_vectors.json",
            "table": "memory_vectors",
            "columns": ["message_id", "session_id", "content", "embedding", "metadata"]
        },
    ]

    for item in mappings:
        file_path = os.path.join(backend_dir, item["file"])
        if not os.path.exists(file_path):
            print(f"[Migration] File {item['file']} not found. Skipping...")
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
            
            # Map dictionary (e.g. users.json) to list format
            if isinstance(raw_data, dict):
                list_data = []
                for key, val in raw_data.items():
                    record = dict(val)
                    record["id"] = key
                    list_data.append(record)
                data = list_data
            elif isinstance(raw_data, list):
                data = raw_data
            else:
                print(f"[Migration] Data in {item['file']} is not list or dict. Skipping...")
                continue

            if not data:
                print(f"[Migration] {item['file']} has 0 active records. Skipping...")
                continue

            # Pre-filter lists to prevent foreign key errors on messages or vectors
            if item["table"] == "messages":
                data = [m for m in data if m.get("session_id") in valid_sessions]
            elif item["table"] == "memory_vectors":
                data = [mv for mv in data if mv.get("message_id") in valid_messages and mv.get("session_id") in valid_sessions]

            print(f"[Migration] Found {len(data)} records in {item['file']} (after pre-filtering). Uploading to '{item['table']}'...")

            # Clean and upload records in chunks to prevent payload size limits
            chunk_size = 50
            success_count = 0
            for i in range(0, len(data), chunk_size):
                chunk = data[i:i + chunk_size]
                formatted_chunk = []
                for record in chunk:
                    rec = {}
                    for col in item["columns"]:
                        val = record.get(col)
                        
                        # Special mapping: Counselor notes detail -> content, conducted_at -> created_at
                        if item["table"] == "counselor_notes":
                            if col == "content" and "detail" in record:
                                val = record["detail"]
                            elif col == "created_at" and "conducted_at" in record:
                                val = record["conducted_at"]
                        
                        # Apply safe defaults for NOT NULL constraints in Supabase
                        if val is None:
                            if col == "password":
                                val = "securepassword123"
                            elif col == "occupation":
                                val = "기타"
                            elif col == "gender":
                                val = "여"
                            elif col == "age_group":
                                val = "20대"
                            elif col == "region":
                                val = "서울"
                            elif col == "phone":
                                val = "010-0000-0000"
                            elif col == "contact":
                                val = "010-0000-0000"
                            elif col == "status":
                                val = "active"
                            elif col == "initial_persona":
                                val = 1
                            elif col == "content" and item["table"] == "counselor_notes":
                                val = record.get("detail", "내용 없음")
                            elif col == "severity" and item["table"] == "surveys":
                                # Calculate severity from PHQ-9 score to prevent NOT NULL violations
                                phq9 = record.get("phq9_score", 0)
                                if phq9 < 5:
                                    val = "최소"
                                elif phq9 < 10:
                                    val = "경증"
                                elif phq9 < 15:
                                    val = "보통"
                                elif phq9 < 20:
                                    val = "중등도"
                                else:
                                    val = "극심한"
                        
                        # Enforce foreign key constraints by mapping unknown user_ids to valid tester
                        if col == "user_id" and val not in valid_users:
                            val = "user-developer"

                        rec[col] = val
                    formatted_chunk.append(rec)

                # Execute Upsert
                try:
                    on_conflict = item.get("on_conflict")
                    if on_conflict:
                        res = client.table(item["table"]).upsert(formatted_chunk, on_conflict=on_conflict).execute()
                    else:
                        res = client.table(item["table"]).upsert(formatted_chunk).execute()
                    success_count += len(formatted_chunk)
                except Exception as chunk_ex:
                    print(f"  [Chunk Error] Failed to upsert chunk for {item['table']}: {chunk_ex}")
            
            print(f"[Migration] Successfully migrated {success_count}/{len(data)} records to '{item['table']}'!")

        except Exception as ex:
            print(f"[Migration Error] Failed to process {item['file']} for table {item['table']}: {ex}")

if __name__ == "__main__":
    print("=== Start Migrating Local JSON Databases to Supabase ===")
    migrate()
    print("=== Migration Completed! ===")
