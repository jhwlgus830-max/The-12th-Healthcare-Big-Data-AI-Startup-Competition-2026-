import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv

# .env.local 파일 로드 (Next.js 컨벤션에 맞춤)
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

class MockResponse:
    def __init__(self, data):
        self.data = data

    def execute(self):
        return self

class MockTable:
    def __init__(self, name):
        self.name = name
        self.filters = []
        self.order_by = None
        self.limit_val = None

    def select(self, *args, **kwargs):
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def order(self, field, desc=False):
        self.order_by = (field, desc)
        return self

    def limit(self, val):
        self.limit_val = val
        return self

    def insert(self, data):
        file_path = os.path.join(os.path.dirname(__file__), f"{self.name}.json")
        if self.name == "custom_users":
            file_path = os.path.join(os.path.dirname(__file__), "users.json")
            
        try:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    records = json.load(f)
            else:
                records = {} if self.name == "custom_users" else []
        except Exception:
            records = {} if self.name == "custom_users" else []

        if self.name == "custom_users":
            # custom_users insert logic (mapping to local users.json format)
            # data is a dict: {"id": user_id, "email": ..., "password": ..., "nickname": ...}
            uid = data.get("id", f"user-{uuid.uuid4().hex[:8]}")
            records[uid] = {
                "email": data.get("email"),
                "password": data.get("password"),
                "nickname": data.get("nickname")
            }
            inserted_data = [{"id": uid, **data}]
        else:
            # General records (list)
            if isinstance(data, list):
                new_records = []
                for item in data:
                    item_copy = dict(item)
                    if "id" not in item_copy:
                        item_copy["id"] = str(uuid.uuid4())
                    if "created_at" not in item_copy:
                        item_copy["created_at"] = datetime.utcnow().isoformat() + "Z"
                    records.append(item_copy)
                    new_records.append(item_copy)
                inserted_data = new_records
            else:
                item_copy = dict(data)
                if "id" not in item_copy:
                    item_copy["id"] = str(uuid.uuid4())
                if "created_at" not in item_copy:
                    item_copy["created_at"] = datetime.utcnow().isoformat() + "Z"
                records.append(item_copy)
                inserted_data = [item_copy]

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[Mock DB Error] Failed to write {self.name}.json: {e}")

        return MockResponse(inserted_data)

    def execute(self):
        file_path = os.path.join(os.path.dirname(__file__), f"{self.name}.json")
        if self.name == "custom_users":
            file_path = os.path.join(os.path.dirname(__file__), "users.json")
            
        try:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as f:
                    raw_records = json.load(f)
            else:
                raw_records = {} if self.name == "custom_users" else []
        except Exception:
            raw_records = {} if self.name == "custom_users" else []

        # Convert custom_users to standard list form
        if self.name == "custom_users":
            records = []
            for uid, u in raw_records.items():
                records.append({
                    "id": uid,
                    "email": u.get("email"),
                    "password": u.get("password"),
                    "nickname": u.get("nickname")
                })
        else:
            records = raw_records

        # Apply filters
        filtered_records = []
        for r in records:
            match = True
            for field, value in self.filters:
                if r.get(field) != value:
                    match = False
                    break
            if match:
                filtered_records.append(r)

        # Apply order
        if self.order_by:
            field, desc = self.order_by
            filtered_records.sort(key=lambda x: x.get(field, ""), reverse=desc)

        # Apply limit
        if self.limit_val:
            filtered_records = filtered_records[:self.limit_val]

        return MockResponse(filtered_records)

class SafeSupabaseClient:
    def __init__(self, real_client):
        self.real_client = real_client
        self.mock_client = MockSupabaseClient()

    def table(self, name):
        return SafeTable(self.real_client, self.mock_client, name)

FORCE_LOCAL_MOCK = False

class SafeTable:
    def __init__(self, real_client, mock_client, name):
        self.real_client = real_client
        self.mock_client = mock_client
        self.name = name
        self.filters = []
        self.order_by = None
        self.limit_val = None
        self.insert_data = None

    def select(self, *args, **kwargs):
        return self

    def eq(self, field, value):
        self.filters.append((field, value))
        return self

    def order(self, field, desc=False):
        self.order_by = (field, desc)
        return self

    def limit(self, val):
        self.limit_val = val
        return self

    def insert(self, data):
        self.insert_data = data
        return self

    def execute(self):
        global FORCE_LOCAL_MOCK
        if FORCE_LOCAL_MOCK or self.real_client is None:
            # 즉시 Mock DB 사용
            mock_table = self.mock_client.table(self.name)
            for field, value in self.filters:
                mock_table = mock_table.eq(field, value)
            if self.order_by:
                mock_table = mock_table.order(self.order_by[0], desc=self.order_by[1])
            if self.limit_val:
                mock_table = mock_table.limit(self.limit_val)
            
            if self.insert_data is not None:
                return mock_table.insert(self.insert_data).execute()
            else:
                return mock_table.execute()

        try:
            # 실제 Supabase 호출 시도
            real_table = self.real_client.table(self.name)
            for field, value in self.filters:
                real_table = real_table.eq(field, value)
            if self.order_by:
                real_table = real_table.order(self.order_by[0], desc=self.order_by[1])
            if self.limit_val:
                real_table = real_table.limit(self.limit_val)
            
            if self.insert_data is not None:
                res = real_table.insert(self.insert_data).execute()
            else:
                res = real_table.execute()
            return res
        except Exception as e:
            print(f"[Supabase Fallback Activated] Error on table '{self.name}': {e}. Enforcing global Mock database from now on...")
            FORCE_LOCAL_MOCK = True
            # 실패 시 Mock DB 사용
            mock_table = self.mock_client.table(self.name)
            for field, value in self.filters:
                mock_table = mock_table.eq(field, value)
            if self.order_by:
                mock_table = mock_table.order(self.order_by[0], desc=self.order_by[1])
            if self.limit_val:
                mock_table = mock_table.limit(self.limit_val)
            
            if self.insert_data is not None:
                return mock_table.insert(self.insert_data).execute()
            else:
                return mock_table.execute()

class MockSupabaseClient:
    def table(self, name):
        return MockTable(name)

# Supabase 클라이언트 초기화 및 Fallback 처리
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        real_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        supabase = SafeSupabaseClient(real_client)
        print("[DB Server] Supabase client initialized and wrapped with SafeSupabaseClient successfully!")
    except Exception as e:
        print(f"[DB Server Warning] Failed to initialize Supabase client: {e}")

if supabase is None:
    print("[DB Server Warning] Supabase credentials missing or invalid. Initializing Local Mock Database Client...")
    supabase = MockSupabaseClient()


