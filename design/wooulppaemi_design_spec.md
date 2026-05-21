# 🦉 우울빼미 UI/UX 디자인 가이드 및 피그마 구조 명세서

본 문서는 "우울빼미" 서비스의 웹 프론트엔드 구축을 위한 디자인 시스템 토큰, 피그마(Figma) 컴포넌트 위계 및 오토레이아웃 규칙, 그리고 브랜드의 중심이 되는 부엉이 로고 생성 프롬프트를 정의합니다.

---

## 🖼️ 1. Figma Wireframe Structure

웹서비스의 화면 구성을 위한 피그마 레이어 구조와 오토레이아웃 설정 가이드라인입니다.

### 📐 Spacing & Layout System
* **Grid**: 12-Column Grid (MaxWidth: 1200px, Gutter: 24px, Margin: Auto)
* **Spacing Scale (Rem / Px)**:
  * `xs`: 0.25rem (4px)
  * `sm`: 0.5rem (8px)
  * `md`: 1rem (16px)
  * `lg`: 1.5rem (24px)
  * `xl`: 2rem (32px)
  * `2xl`: 3rem (48px)
  * `3xl`: 4.5rem (72px)
  * `4xl`: 6rem (96px)

---

### 🌌 Section 1: Hero Section (Night Mode)
사용자가 밤에 느끼는 불안감을 안아주고 보호해주는 감성적 인상을 남기는 화면입니다.

* **Frame Name**: `Section: Hero (Night)`
  * **Layout**: Vertical Auto-layout
  * **Spacing**: `Padding-top: 120px`, `Padding-bottom: 120px`, `Gap: 48px`
  * **Background Fill**: Linear Gradient (`#0F172A` → `#111827`)
* **Layer Hierarchy & Rules**:
  ```text
  [Frame] Section: Hero (Night)
   ├── [Frame] Header (Auto-layout: Horizontal, Padding: 24px 0, Space-between)
   │    ├── [Frame] Brand Logo Group (Horizontal, Gap: 12px)
   │    │    ├── [Instance] Owl Logo Icon (Width: 40px, Height: 40px)
   │    │    └── [Text] Brand Name: "우울빼미" (Font: Noto Sans KR Bold, 20px, Color: #F8F5F0)
   │    └── [Button] Nav-Start (Auto-layout: Padding: 10px 20px, Border-radius: 9999px, Background: #F59E0B)
   │
   ├── [Frame] Hero Content Group (Auto-layout: Vertical, Align: Center, Gap: 32px)
   │    ├── [Frame] Floating Moon & Logo Icon (Group with Soft Glow, Width: 180px, Height: 180px)
   │    │    ├── [Ellipse] Moon Glow Background (Color: #F59E0B at 15% opacity, Effect: Layer Blur 40px)
   │    │    ├── [Vector] Crescent Moon Shape (Color: #FDBA24)
   │    │    └── [Instance] Owl Logo (Heart center, eyes wide)
   │    │
   │    ├── [Frame] Headline Text Group (Auto-layout: Vertical, Align: Center, Gap: 16px)
   │    │    ├── [Text] Main Headline: "우울빼미" (Size: 64px, Weight: Bold, Line-height: 120%, Color: #F8F5F0)
   │    │    └── [Text] Sub Headline: "밤에도 당신의 마음을 지켜보는 AI 심리 케어 솔루션" (Size: 20px, Weight: Regular, Color: #94A3B8)
   │    │
   │    └── [Instance] CTA Button: "시작하기" (Auto-layout: Vertical, Padding: 16px 48px, Border-radius: 9999px, Background: #F59E0B, Effect: Drop Shadow)
   │
   └── [Frame] Glassmorphism Feature Cards Container (Auto-layout: Horizontal, Align: Center, Gap: 24px, Width: Fill Container)
        ├── [Instance] Card 1: 과학적 진단 (PHQ-9 분석)
        ├── [Instance] Card 2: 맞춤 페르소나 (AI 상담 연결)
        └── [Instance] Card 3: 안전 보장 (고위험 시 전문가 연계)
        ※ Card Style: Fill: #FFFFFF (6% Opacity), Border: #FFFFFF (12% Opacity), Backdrop Blur: 20px, Corner Radius: 24px, Padding: 32px
  ```

---

### ☁️ Section 2: Scroll Transition Area
스크롤에 반응하여 감정을 서서히 변화시키는 전이 영역입니다.

* **Frame Name**: `Section: Transition`
  * **Layout**: Vertical Auto-layout
  * **Background Fill**: Dynamic Gradient (스크롤에 따라 `#111827`에서 `#F8F5F0`으로 선형 전환)
  * **Height**: 400px (충분한 시각적 호흡 확보)
  * **Content**: 
    * `[Text] "어둡고 불안하던 밤에서, 따뜻한 마음의 안식처로 머무는 시간."` (폰트 크기: 24px, 투명도 변화 연출)

---

### 🤍 Section 3: Main Service Section (Ivory Mode)
차분함과 밝은 안정감을 주는 실질적인 감정 케어 기능 공간입니다.

* **Frame Name**: `Section: Main (Ivory)`
  * **Layout**: Vertical Auto-layout
  * **Spacing**: `Padding-top: 120px`, `Padding-bottom: 120px`, `Gap: 64px`
  * **Background Fill**: Solid Cream Ivory (`#F8F5F0`)
* **Layer Hierarchy & Rules**:
  ```text
  [Frame] Section: Main (Ivory)
   ├── [Frame] Section Title Group (Auto-layout: Vertical, Align: Left, Gap: 12px, Width: Fixed 1200px)
   │    ├── [Text] Accent Label: "MAIN SERVICE" (Font: Sans Bold, 14px, Color: #F59E0B, Tracking: 10%)
   │    └── [Text] Main Section Title: "마음을 돌보는 차분한 공간" (Font: Sans Bold, 36px, Color: #0F172A)
   │
   └── [Frame] Service Grid (Auto-layout: Horizontal/Grid, Align: Top, Gap: 32px, Width: Fill)
        ├── [Frame] Left Column: Interactive Module (Auto-layout: Vertical, Width: 1/2 Fill, Gap: 24px)
        │    ├── [Instance] Emotion Journal Input Card (감정 기록 입력)
        │    └── [Instance] Emotion Analytics Report Card (PHQ-9 자가진단 추이 보고서)
        │
        └── [Frame] Right Column: Conversation Module (Auto-layout: Vertical, Width: 1/2 Fill, Gap: 24px)
             └── [Instance] AI Chat Consultation Card (AI 동반자 상담 채팅 UI)
  ```

---

## 🦉 2. 5 Owl Logo Generation Prompts

우울빼미의 시각적 정체성을 구축하기 위한 생성형 AI(Midjourney, DALL-E 등)용 로고 디자인 프롬프트 5가지입니다.

### Prompt 1: Minimalist Flat Vector (실제 사용안)
> **Prompt**: A minimalist flat vector logo of an owl on a dark navy blue background. The owl has large, warm, wide-open eyes watching protectively. A simple heart shape is elegantly integrated into the center of the owl's body, symbolizing emotional care. Behind the owl, a sleek golden crescent moon is positioned, casting a soft warm orange glow (#F59E0B) around the silhouette. Clean lines, vector graphic, startup SaaS branding, premium quality, app icon style. --no 3d render, cartoonish, childish, cute, clinical, neon.

### Prompt 2: Elegant Line Art (라인 아트 스타일)
> **Prompt**: Monoline logo design of a protective owl, premium SaaS branding style, vector line art. The owl is outlined with a single continuous gold line, eyes open with a calm and caring expression. A heart shape is integrated into the chest line. A thin crescent moon is placed behind the owl's head. Dark blue background. Minimalist, sophisticated, elegant, high-end design.

### Prompt 3: Glassmorphism Icon (글래스모피즘 계열)
> **Prompt**: Modern 3D app icon design of an owl logo. Semi-transparent frosted glass textures on the owl's wings, showing a glowing orange heart shape in the center of the body. Behind the owl is a gold crescent moon that radiates a gentle, warm light. Dark navy background. Glassmorphism style, soft blur, premium startup look, high-resolution rendering, unreal engine 5 style.

### Prompt 4: Geometric Emblem (기하학적 엠블럼)
> **Prompt**: Geometric vector logo of an owl, consisting of clean circular lines and golden ratio symmetry. The owl has a friendly, alert posture with eyes open. A heart silhouette is formed in the negative space of the body. A crescent moon cradles the owl from behind. Color palette of deep navy, amber gold, and soft warm orange. Premium, sleek startup tech emblem.

### Prompt 5: Dual-tone Gradient Emblem (그라데이션 스타일)
> **Prompt**: Flat dual-tone gradient logo of an owl. The owl is rendered in a smooth color gradient transitioning from warm orange (#F59E0B) to amber yellow (#FDBA24). A heart design is embedded on its chest. The owl is sitting within a crescent moon silhouette. Deep slate navy background. Clean, high contrast, modern app icon, vector graphic.

---

## 🎨 3. AI Generated Logo

프로젝트에서 실제로 사용되는 우울빼미의 공식 AI 로고 자산입니다:

![우울빼미 공식 로고](file:///C:/Users/asia/.gemini/antigravity/brain/15ecacea-29dd-4e4c-a6ca-365ae5e5a6ac/owl_logo_1779269155997.png)
