# 🌿 초등 6학년 1학기 과학: 식물의 구조와 기능 단계별 아케이드 미니게임

> 초등학교 6학년 1학기 과학 **'식물의 구조와 기능' (뿌리, 줄기, 잎, 꽃과 열매)** 단원의 학습 내용을 바탕으로 제작된 **단계별 아케이드 타임어택 미니게임** 웹 애플리케이션입니다.

---

## 🎮 게임 특징 및 주요 기능

1. **4단계 organ별 독창적인 아케이드 미니게임 (각 5라운드, 25초 타임어택)**
   - **🌱 1단계: 뿌리 (Roots)** - *뿌리 굴착 & 물분자 터치 아케이드* (지지/흡수/저장 작용, 뿌리털, 물과 무기양분 흡수)
   - **🪵 2단계: 줄기 (Stems)** - *물관·체관 파이프 라인 스위처 아케이드* (안쪽 물관 vs 바깥쪽 체관 수송, 줄기 펌핑, 셀러리 색소 관찰)
   - **🍃 3단계: 잎 (Leaves)** - *광합성 & 증산작용 버블 아케이드* (햇빛/물/CO2 광합성 원료 버블, 증산작용 기공 수증기, 아이오딘 녹말검출)
   - **🌸 4단계: 꽃과 열매 (Flowers)** - *꿀벌 수분 비행 & 씨앗 대포 아케이드* (수술 꽃가루 ➔ 암술머리 전달, 꽃 4요소, 씨방/밑씨 변신, 씨앗 퍼뜨리기)

2. **💰 골드 경제 시스템 & 단계별 도전**
   - 라운드 정답 및 시간 보너스로 **Gold 획득** 및 **★1~3개 별점** 부여
   - 모은 골드로 다음 미니게임 단계 해금 (1단계 무료 → 2단계 100G → 3단계 250G → 4단계 450G)
   - 이미 클리어한 스테이지 언제든 재도전하여 골드 농사 가능

3. **🏆 명예의 전당 (Hall of Fame Top 10)**
   - **골드 부자 Top 10** 랭킹
   - **클리어 마스터 Top 10** 랭킹
   - Firebase Firestore 연동 실시간 글로벌 전당 & LocalStorage 데이터 저장 지원

4. **🔑 Firebase Authentication**
   - **Google 계정 로그인**
   - **익명 게스트 로그인**

5. **🛒 아이템 상점 & Web Audio API 음향**
   - ⏱️ 시간 +10초 연장, 💡 오답 힌트 제거 아이템 구매
   - Web Audio API 기반 오디오 효과음 & canvas-confetti 파티클 팡파르

---

## 🚀 로컬 실행 방법 (Local Development)

```bash
# 1. 의존성 패키지 설치
npm install

# 2. 로컬 개발 서버 실행 (http://localhost:3000)
npm run dev

# 3. 프로덕션 빌드 테스트
npm run build
```

---

## 🌐 GitHub 업로드 방법 (Push to GitHub)

1. [GitHub.com](https://github.com)에서 새로운 레포지토리 `plant-science-arcade`를 생성합니다.
2. 터미널에서 아래 명령어 실행:

```bash
git init
git add .
git commit -m "Feat: 초등 6학년 과학 식물의 구조와 기능 단계별 아케이드 앱 완성"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/plant-science-arcade.git
git push -u origin main
```

---

## 🔥 Firebase 연동 설정 (Google 로그인 & Firestore)

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 추가.
2. **Authentication** 설정:
   - 로그인 방법에서 **Google**과 **익명 (Anonymous)** 활성화.
3. **Cloud Firestore** 설정:
   - 데이터베이스 생성 (`leaderboards` 컬렉션 자동 생성됨).
   - Rules(규칙)을 `allow read, write: if true;` 로 설정.
4. 프로젝트 `.env` 파일에 아래 환경 변수 입력:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## ⚡ Vercel 배포 방법 (Deploy to Vercel)

1. [Vercel.com](https://vercel.com) 로그인 후 **"Add New Project"** 클릭.
2. 생성한 GitHub 레포지토리 `plant-science-arcade` 선택.
3. **Environment Variables**에 위의 `VITE_FIREBASE_*` 환경 변수를 등록합니다.
4. **Deploy** 버튼을 누르면 단 수 초 만에 배포 URL이 생성됩니다!

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: HTML5, Vanilla CSS3 (Custom Properties & Glassmorphism & Animations), JavaScript ES6 Modules, Vite
- **Audio Engine**: Web Audio API Synthesizer
- **Backend & Database**: Firebase Auth (Google & Anonymous), Firebase Firestore
- **Deployment**: Vercel, GitHub
