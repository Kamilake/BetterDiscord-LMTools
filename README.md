# LM Tools - Discord 대화 요약 플러그인

AI 언어 모델을 활용하여 Discord 채팅 대화를 자동으로 요약하고 적절한 답변을 제안하는 BetterDiscord 플러그인입니다.

## ✨ 주요 기능

### 🤖 대화 요약
- **원클릭 요약**: 채팅 입력창에 추가된 버튼으로 현재 채널의 대화를 즉시 요약
- **스마트 분석**: 대화의 핵심 주제, 중요한 결정사항, 참여자들의 주요 관점을 파악
- **시간 범위 표시**: 요약된 메시지 개수와 시간 범위 정보 제공

### 💬 답변 제안
- **맞춤형 답변**: 대화 맥락에 맞는 3개의 답변 예시 자동 생성
- **입력 컨텍스트 반영**: 채팅창에 입력 중인 텍스트를 고려하여 더 정확한 답변 생성
- **원클릭 복사**: 제안된 답변을 클릭 한 번으로 클립보드에 복사

### ⚙️ 프롬프트 커스터마이징
- **기본 프롬프트 설정**: 모든 채널에서 사용할 기본 요약 프롬프트 설정
- **채널별 프롬프트**: 특정 채널에만 적용되는 커스텀 프롬프트 설정
- **예제 프롬프트**: 기술 토론, 게이밍, 일상 대화용 사전 정의된 프롬프트 제공

### 🔌 다중 AI API 지원
- **OpenAI**: GPT-4.1 Nano, Mini, GPT-4.1, GPT-4o, o4-Mini 지원
- **Anthropic**: Claude 3.5 Haiku, Sonnet, Claude 4 Sonnet, Opus 지원
- **유연한 설정**: 모델별 최대 토큰, 온도(창의성) 조절 가능

### 🎯 스마트 메시지 처리
- **인용 메시지 처리**: 답장된 메시지의 맥락 포함
- **이모지 및 스티커 지원**: 텍스트가 아닌 요소들도 적절히 처리
- **메시지 개수 제한**: 요약에 포함할 최대 메시지 개수 설정 가능

## 🚀 기술 스택

- **TypeScript** - 타입 안전성과 개발자 경험 향상
- **React JSX** - 설정 UI 컴포넌트 작성
- **Webpack** - 모듈 번들링 및 최적화
- **Babel** - TypeScript 및 JSX 트랜스파일링

## 📁 프로젝트 구조

```
├── dist/                    # 빌드 결과물
│   └── LMTools.plugin.js   # BetterDiscord 호환 플러그인 파일
├── src/                    # 소스 코드
│   ├── types/             # TypeScript 타입 정의
│   │   ├── betterdiscord.d.ts  # BetterDiscord API 타입
│   │   └── css.d.ts           # CSS 모듈 타입
│   ├── component.tsx      # React UI 컴포넌트들
│   ├── settings.ts        # 설정 관리 및 프롬프트 예제
│   ├── summary.ts         # 대화 요약 및 API 호출 로직
│   ├── index.tsx          # 메인 플러그인 클래스
│   ├── config.json        # 플러그인 메타데이터
│   └── styles.css         # 스타일시트
├── .babelrc              # Babel 설정
├── tsconfig.json         # TypeScript 설정
├── webpack.config.js     # Webpack 설정
└── package.json          # NPM 설정
```

## 🛠️ 개발 가이드

### 환경 설정

```bash
# 의존성 설치
npm install
```

### 개발 명령어

```bash
# 개발 빌드
npm run build

# 개발 모드 (파일 변경 감지 및 자동 빌드)
npm run dev

# 프로덕션 빌드
npm run build:prod

# TypeScript 타입 체크
npm run type-check

# 실시간 타입 체크
npm run type-check:watch
```

### 개발 워크플로우

1. `src/` 폴더에서 TypeScript/JSX 코드 수정
2. `npm run dev`로 개발 모드 실행 (파일 변경 시 자동 빌드)
3. 빌드된 플러그인이 자동으로 BetterDiscord 플러그인 폴더에 복사됨
4. Discord를 재시작하거나 플러그인을 다시 로드

## 📦 설치 및 사용

### 설치

1. [Releases](../../releases) 페이지에서 최신 `LMTools.plugin.js` 파일 다운로드
2. BetterDiscord 플러그인 폴더에 파일 복사:
   - **Windows**: `%APPDATA%/BetterDiscord/plugins/`
   - **macOS**: `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux**: `~/.config/BetterDiscord/plugins/`
3. Discord 재시작 또는 플러그인 새로고침

### 초기 설정

1. Discord 설정 → 플러그인 → LM Tools 활성화
2. 플러그인 설정에서 사용할 AI API 선택 (OpenAI 또는 Anthropic)
3. 해당 API의 키 입력 및 모델 선택
4. 필요시 기본 프롬프트 및 채널별 프롬프트 설정

### 사용법

1. **대화 요약**: 채팅 입력창 옆의 요약 버튼(≡) 클릭
   - 채팅창에 텍스트를 입력한 상태로 클릭하면, 해당 텍스트가 컨텍스트로 포함되어 더 맞춤화된 답변을 생성합니다
2. **요약 결과 확인**: 모달 창에서 요약 내용과 추천 답변 확인
3. **답변 복사**: 원하는 답변 클릭으로 클립보드에 복사
4. **설정 관리**: 플러그인 설정에서 프롬프트 및 API 설정 조정

## ⚙️ 설정 옵션

### API 설정
- **API 공급자**: OpenAI 또는 Anthropic 선택
- **모델 선택**: 각 공급자별 다양한 모델 지원
- **최대 토큰**: 응답 길이 제한 (1-4096)
- **온도**: 창의성 조절 (0.0-1.0)

### 요약 설정
- **메시지 개수 제한**: 요약에 포함할 최대 메시지 개수 (0=무제한)
- **기본 프롬프트**: 모든 채널에서 사용할 기본 요약 프롬프트
- **채널별 프롬프트**: 특정 채널에만 적용되는 커스텀 프롬프트

## 🔧 TypeScript 개발 특징

- **완전한 타입 안전성**: 컴파일 타임 오류 검출
- **IntelliSense 지원**: IDE에서 자동완성 및 타입 정보 제공
- **안전한 리팩토링**: 타입 시스템을 통한 안전한 코드 변경
- **BetterDiscord API 타입**: 완전한 API 타입 정의 제공

## 📄 라이선스

MIT License

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 새 기능 브랜치를 만드세요 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/AmazingFeature`)
5. Pull Request를 만드세요

## 🐛 버그 신고

버그를 발견하셨다면 [Issues](../../issues) 페이지에서 신고해 주세요.
