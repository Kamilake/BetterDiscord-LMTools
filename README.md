# LM Tools - BetterDiscord Plugin (TypeScript)

언어 모델을 활용한 다양한 도구들을 제공하는 BetterDiscord 플러그인입니다.

## 기술 스택

- **TypeScript** - 타입 안전성과 개발자 경험 향상
- **React JSX** - UI 컴포넌트 작성
- **Webpack** - 모듈 번들링
- **Babel** - TypeScript 및 JSX 트랜스파일링

## 프로젝트 구조

```
├── dist/                    # 빌드 결과물
│   └── LMTools.plugin.js   # BetterDiscord 호환 플러그인 파일
├── src/                    # 소스 코드
│   ├── types/             # TypeScript 타입 정의
│   │   ├── betterdiscord.d.ts  # BetterDiscord API 타입
│   │   └── css.d.ts           # CSS 모듈 타입
│   ├── component.tsx      # React 컴포넌트
│   ├── config.json        # 플러그인 설정
│   ├── index.ts           # 메인 플러그인 클래스
│   └── styles.css         # 스타일시트
├── .babelrc              # Babel 설정
├── tsconfig.json         # TypeScript 설정
├── webpack.config.js     # Webpack 설정
└── package.json          # NPM 설정
```

## 개발

### 설치

```bash
npm install
```

### 개발 명령어

```bash
# 개발 빌드
npm run build

# 개발 모드 (파일 변경 감지)
npm run dev

# 프로덕션 빌드
npm run build:prod

# 타입 체크
npm run type-check

# 타입 체크 (실시간)
npm run type-check:watch
```

### 개발 플로우

1. `src/` 폴더에서 TypeScript/JSX 코드 작성
2. `npm run dev`로 개발 모드 실행 (파일 변경 시 자동 빌드)
3. 빌드된 플러그인이 자동으로 BetterDiscord 플러그인 폴더에 복사됨
4. BetterDiscord에서 플러그인 리로드

## TypeScript 특징

- **타입 안전성**: 컴파일 타임에 오류 검출
- **IntelliSense**: 자동완성 및 타입 정보 제공
- **리팩토링 지원**: 안전한 코드 변경
- **BetterDiscord API 타입 정의**: `src/types/betterdiscord.d.ts`에서 API 타입 제공

## 빌드 결과

빌드된 플러그인은 다음 위치에 자동으로 복사됩니다:
- Windows: `%APPDATA%/BetterDiscord/plugins/LMTools.plugin.js`
