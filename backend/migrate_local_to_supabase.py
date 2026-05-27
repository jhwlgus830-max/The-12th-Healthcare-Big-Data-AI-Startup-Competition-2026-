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
            "columns": ["id", "user_id", "phq9_score", "p4_score", "p4_answers", "gender", "age_group", "region", "phone", "occupation", "created_at"]
        },
        {
            "file": "chat_sessions.json",
            "table": "chat_sessions",
            "columns": ["id", "user_id", "active_persona", "started_at", "ended_at"]
        },
        {
            "file": "messages.json",
            "table": "messages",
            "columns": ["id", "session_id", "role", "content", "timestamp", "nlp_analysis", "rag_context"]
        },
        {
            "file": "journals.json",
            "table": "journals",
            "columns": ["id", "user_id", "content", "created_at"]
        },
        {
            "file": "safety_plans.json",
            "table": "safety_plans",
            "columns": ["id", "user_id", "current_step", "step1_warning_signs", "step2_coping_strategies", "step3_social_distraction", "step4_social_support", "step5_professional_agencies", "step6_safe_environment"]
        },
        {
            "file": "counselor_notes.json",
            "table": "counselor_notes",
            "columns": ["id", "user_id", "counselor_id", "conducted_at", "content", "intervention_type", "status"]
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

            print(f"[Migration] Found {len(data)} records in {item['file']}. Filtering and uploading to '{item['table']}'...")

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
                        
                        # Special mapping: Counselor notes detail -> content
                        if item["table"] == "counselor_notes" and col == "content" and "detail" in record:
                            val = record["detail"]
                            
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
                            elif col == "content" and item["table"] == "counselor_notes":
                                val = record.get("detail", "내용 없음")
                        
                        rec[col] = val
                    formatted_chunk.append(rec)

                # Execute Upsert
                try:
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
