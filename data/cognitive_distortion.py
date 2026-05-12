"""
이 파일은 [SECTION 5] 12가지 인지왜곡 자동 분류를 구현합니다.
GPT-4o mini를 활용하여 다중 라벨 분류를 수행하고 결과를 DB에 저장합니다.
"""

import json
from openai import OpenAI
from sqlalchemy.orm import Session
from db_schema import CognitiveDistortion, CognitiveDistortionType

DISTORTION_LABELS = {
    "흑백논리": "극단적으로 판단 (예: 이번 시험을 망쳤으니 내 인생은 끝이야)",
    "과잉일반화": "한 번 실패를 항상 실패로 연결 (예: 또 거절당했어. 난 항상 이래)",
    "정신적 여과": "부정적 부분만 확대 (예: 칭찬을 많이 받았지만, 한 가지 지적받은 것만 생각남)",
    "긍정 무시": "좋은 일을 평가절하 (예: 그건 누구나 운이 좋으면 할 수 있는 일이지)",
    "독심술": "타인의 생각을 부정적으로 단정 (예: 저 사람이 날 보며 웃는 건 비웃는 게 분명해)",
    "미래예언": "부정적 미래 확신 (예: 노력해봐야 어차피 떨어질 거야)",
    "파국화": "최악의 상황 상상 (예: 여기서 실수하면 모두가 날 쓰레기라 생각하고 잘릴 거야)",
    "감정추리": "감정을 사실로 믿음 (예: 내가 이렇게 불안한 걸 보니 분명 나쁜 일이 생길 거야)",
    "당위진술": "'반드시 ~해야 해'라는 억압 (예: 나는 무조건 착한 사람이어야 해)",
    "낙인찍기": "자신/타인 전체를 부정적으로 평가 (예: 난 완전 구제불능 루저야)",
    "개인화": "과도한 자기책임 (예: 부모님이 이혼하신 건 다 내 탓이야)",
    "비교왜곡": "자신을 불리하게 비교 (예: 내 친구는 저렇게 잘나가는데 난 왜 이 모양일까)"
}

class CognitiveDistortionClassifier:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.client = OpenAI()

    def classify(self, msg_id: int, text: str) -> list[CognitiveDistortion]:
        """
        사용자 발화를 분석하여 0~N개의 인지왜곡 라벨을 반환하고 DB에 저장합니다.
        """
        labels_str = "\n".join([f"- {k}: {v}" for k, v in DISTORTION_LABELS.items()])
        
        system_prompt = f"""당신은 임상 심리 분석가입니다.
사용자의 발화를 읽고 다음 12가지 인지왜곡 중 해당하는 것을 모두 찾으세요. (0개부터 여러 개까지 가능)

[12가지 인지왜곡 라벨 및 정의]
{labels_str}

분석 결과를 아래 JSON 배열 형식으로만 출력하세요. (인지왜곡이 없으면 빈 배열 [] 출력)
예시:
[
  {{
    "distortion_type": "흑백논리",
    "evidence_sentence": "해당 인지왜곡이 드러나는 발화 원문 부분",
    "confidence": 0.85
  }}
]
"""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"사용자 발화: {text}"}
            ],
            temperature=0.1
        )
        
        try:
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            
            results = json.loads(content)
            records = []
            
            for res in results:
                d_type_str = res.get("distortion_type")
                # 문자열을 Enum으로 변환
                d_type_enum = CognitiveDistortionType(d_type_str) if d_type_str in [e.value for e in CognitiveDistortionType] else None
                
                if d_type_enum:
                    record = CognitiveDistortion(
                        msg_id=msg_id,
                        distortion_type=d_type_enum,
                        evidence_sentence=res.get("evidence_sentence", ""),
                        confidence=res.get("confidence", 0.0)
                    )
                    self.db.add(record)
                    records.append(record)
            
            self.db.commit()
            return records
            
        except Exception as e:
            print(f"[Error] Cognitive distortion classification failed: {e}")
            return []
