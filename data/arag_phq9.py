"""
이 파일은 [SECTION 4] aRAG 엔진: PHQ-9 자동 추론을 구현합니다.
(Ravenda 등 적용: 적응형 증거 검색, Chain-of-Thought 기반 채점)
"""

import json
import numpy as np
from typing import List, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from openai import OpenAI
from sqlalchemy.orm import Session
from db_schema import Message, Phq9Estimate

# 기존 app.py / model.py / mallang_최종파일.py 설정 참조
PHQ9_QUESTIONS = [
    "기분이 가라앉거나 우울하거나 희망이 없다고 느꼈다",
    "평소 하던 일에 대한 흥미가 없어지거나 즐거움을 느끼지 못했다",
    "잠들기가 어렵거나 자주 깼다 (혹은 너무 많이 잤다)",
    "평소보다 식욕이 줄었다 (혹은 평소보다 많이 먹었다)",
    "다른 사람들이 눈치 챌 정도로 말과 행동이 느려졌다 (혹은 너무 안절부절 못했다)",
    "피곤하고 기운이 없었다",
    "내가 잘못했거나 실패했다는 생각이 들었다 (혹은 자신과 가족을 실망시켰다고 생각했다)",
    "신문을 읽거나 TV를 보는 것과 같은 일상적인 일에도 집중할 수가 없었다",
    "차라리 죽는 것이 더 낫겠다고 생각했다 (혹은 자해할 생각을 했다)",
]

# 임상적 의미를 보존한 검색 쿼리 변환 (4-1)
PHQ9_QUERIES = [
    "요즘 기분이 우울하고 희망이 없거나 절망적인가요?",
    "예전에 즐거워하던 일들에 흥미를 잃었나요?",
    "불면증이나 수면 과다 등 수면 문제가 있나요?",
    "식욕이 떨어지거나 폭식을 하는 등 식욕 변화가 있나요?",
    "행동이 너무 느려지거나 반대로 너무 불안하고 초조한가요?",
    "항상 피곤하고 에너지가 고갈된 느낌인가요?",
    "내 자신이 실패자 같고 죄책감이 드나요?",
    "집중력이 떨어져서 책을 읽거나 TV 보기가 어렵나요?",
    "차라리 죽는 것이 낫겠다고 생각하거나 자해/자살 충동을 느끼나요?"
]

class AdaptiveRAG_PHQ9:
    def __init__(self, db_session: Session, embedding_model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        self.db = db_session
        self.embedder = SentenceTransformer(embedding_model_name, device="cpu")
        self.client = OpenAI() # OPENAI_API_KEY 필요
        self.query_embeddings = self.embedder.encode(PHQ9_QUERIES)

    def check_trigger_condition(self, user_id: int) -> bool:
        """
        4-4. PHQ-9 자동 추론 트리거 조건:
        사용자 대화 누적 3턴 이상 + 누적 단어 수 10단어 이상일 때만 작동
        """
        user_msgs = self.db.query(Message).filter(
            Message.user_id == user_id,
            Message.role == 'user'
        ).all()
        
        if len(user_msgs) < 3:
            return False
            
        total_words = sum(len(msg.text.split()) for msg in user_msgs)
        if total_words < 10:
            return False
            
        return True

    def _adaptive_retrieve(self, question_idx: int, user_msgs: List[Message], min_sim: float = 0.65) -> List[Dict]:
        """
        4-2. 적응형 증거 검색 (Adaptive k*)
        고정 k 대신, 의미적 일관성(코사인 유사도 >= 0.65)이 유지되는 범위까지 자동 확장
        """
        if not user_msgs:
            return []
            
        texts = [msg.text for msg in user_msgs]
        msg_embeddings = self.embedder.encode(texts)
        
        q_emb = self.query_embeddings[question_idx].reshape(1, -1)
        similarities = cosine_similarity(q_emb, msg_embeddings)[0]
        
        # 유사도 내림차순 정렬
        sorted_indices = np.argsort(similarities)[::-1]
        
        evidence = []
        for idx in sorted_indices:
            sim = similarities[idx]
            if sim >= min_sim:
                evidence.append({
                    "msg_id": user_msgs[idx].msg_id,
                    "text": user_msgs[idx].text,
                    "date": user_msgs[idx].created_at.strftime("%Y-%m-%d %H:%M"),
                    "similarity": float(sim)
                })
            else:
                break
                
        # 만약 0.65 이상이 없다면 가장 높은 1개라도 반환을 고려할 수 있으나,
        # 엄격한 증거 기반을 위해 임계치를 넘지 않으면 빈 리스트 반환
        return evidence

    def evaluate_phq9_item(self, question_idx: int, evidence: List[Dict]) -> Dict:
        """
        4-3. Chain-of-Thought 채점 (GPT-4o mini)
        각 PHQ-9 문항(0~3점)을 LLM으로 산출
        """
        q_id = question_idx + 1
        q_text = PHQ9_QUESTIONS[question_idx]
        
        if not evidence:
            return {
                "question_id": q_id,
                "question_text": q_text,
                "retrieved_evidence": [],
                "cot_reasoning": "해당 문항과 관련된 발화(증거)가 부족하여 점수를 부여할 수 없음.",
                "estimated_score": 0,
                "confidence": 0.0
            }

        evidence_str = json.dumps(evidence, ensure_ascii=False, indent=2)
        
        system_prompt = f"""당신은 임상 심리 평가 전문가입니다.
사용자의 대화 발화를 바탕으로 PHQ-9 문항의 점수를 0~3점 사이로 평가하세요.
점수 기준:
0점: 전혀 방해받지 않음
1점: 며칠 동안 방해받음
2점: 7일 이상(절반 이상) 방해받음
3점: 거의 매일 방해받음

반드시 아래 JSON 포맷을 유지하여 응답하세요. (마크다운 백틱 없이 JSON만 출력)
{{
  "question_id": {q_id},
  "question_text": "{q_text}",
  "retrieved_evidence": {evidence_str},
  "cot_reasoning": "여기에 Chain-of-Thought 추론 근거를 작성하세요.",
  "estimated_score": 점수(정수 0,1,2,3),
  "confidence": 신뢰도(0.0~1.0 실수)
}}"""

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}],
            temperature=0.2,
        )
        
        try:
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            return json.loads(content)
        except Exception as e:
            print(f"[Error] PHQ9 parsing failed for q{q_id}: {e}")
            return {
                "question_id": q_id,
                "question_text": q_text,
                "retrieved_evidence": evidence,
                "cot_reasoning": "응답 파싱 오류 발생",
                "estimated_score": 0,
                "confidence": 0.0
            }

    def estimate_full_phq9(self, user_id: int) -> Phq9Estimate:
        """전체 9문항 자동 채점 및 DB 저장"""
        if not self.check_trigger_condition(user_id):
            return None
            
        user_msgs = self.db.query(Message).filter(
            Message.user_id == user_id,
            Message.role == 'user'
        ).all()
        
        results = []
        total_score = 0
        for i in range(9):
            evidence = self._adaptive_retrieve(i, user_msgs)
            item_result = self.evaluate_phq9_item(i, evidence)
            results.append(item_result)
            total_score += item_result.get("estimated_score", 0)
            
        if total_score >= 20: severity = "위험"
        elif total_score >= 15: severity = "중증"
        elif total_score >= 10: severity = "보통"
        elif total_score >= 5: severity = "경도"
        else: severity = "양호"
        
        estimate_record = Phq9Estimate(
            user_id=user_id,
            q1_score=results[0]["estimated_score"],
            q2_score=results[1]["estimated_score"],
            q3_score=results[2]["estimated_score"],
            q4_score=results[3]["estimated_score"],
            q5_score=results[4]["estimated_score"],
            q6_score=results[5]["estimated_score"],
            q7_score=results[6]["estimated_score"],
            q8_score=results[7]["estimated_score"],
            q9_score=results[8]["estimated_score"],
            total_score=total_score,
            severity=severity,
            cot_evidence=results,
            method="auto_arag"
        )
        
        self.db.add(estimate_record)
        self.db.commit()
        self.db.refresh(estimate_record)
        
        return estimate_record
