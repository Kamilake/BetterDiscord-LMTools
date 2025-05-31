# LM Tools - 개발자 가이드

## 📋 프로젝트 개요

**LM Tools**는 Discord에서 AI 언어 모델을 활용한 대화 요약 및 답변 제안 기능을 제공하는 BetterDiscord 플러그인입니다. OpenAI와 Anthropic API를 지원하며, TypeScript + React로 개발되었습니다.

### 🎯 핵심 기능
- **대화 요약**: Discord 채팅 메시지를 AI로 요약
- **답변 제안**: 맥락에 맞는 3개의 답변 예시 자동 생성
- **프롬프트 커스터마이징**: 기본/채널별 프롬프트 설정
- **다중 API 지원**: OpenAI, Anthropic API 통합
- **스마트 메시지 처리**: 인용, 이모지, 스티커 등 다양한 메시지 형태 지원

---

## 🏗️ 프로젝트 아키텍처

### 디렉토리 구조
```
├── src/
│   ├── index.tsx           # 메인 플러그인 클래스 (LMTools)
│   ├── component.tsx       # React 컴포넌트들
│   ├── settings.ts         # 설정 관리 시스템
│   ├── summary.ts          # 대화 요약 로직
│   ├── styles.css          # CSS 스타일
│   ├── config.json         # 플러그인 메타 정보
│   └── types/
│       ├── betterdiscord.d.ts  # BetterDiscord API 타입 정의
│       └── css.d.ts           # CSS 모듈 타입 정의
├── package.json            # 프로젝트 의존성
├── webpack.config.js       # 웹팩 빌드 설정
├── tsconfig.json          # TypeScript 설정
├── .babelrc               # Babel 설정
└── dist/                  # 빌드 결과물
```

### 핵심 클래스 구조

#### 1. **LMTools** (index.tsx)
```typescript
export default class LMTools implements BetterDiscordPlugin {
  private settingsManager: SettingsManager;
  private summarizer: ConversationSummarizer;
  
  // 주요 메서드
  start(): void                                    // 플러그인 초기화
  stop(): void                                     // 플러그인 정리
  patchChannelTextAreaButtons(): void              // Discord UI 패치
  handleSummarize(channelId: string): Promise<void> // 요약 실행
  showSummaryModal(summary: any): void             // 결과 모달 표시
}
```

#### 2. **SettingsManager** (settings.ts)
```typescript
export class SettingsManager {
  // 설정 관리
  get<K extends keyof PluginSettings>(key: K): PluginSettings[K]
  set<K extends keyof PluginSettings>(key: K, value: PluginSettings[K]): void
  
  // API 설정
  getCurrentApiKey(): string
  getCurrentModel(): string
  getApiConfiguration(): APIConfig
  
  // 프롬프트 관리
  getPromptForChannel(channelId: string): string
  setChannelPrompt(channelId: string, prompt: string): void
}
```

#### 3. **ConversationSummarizer** (summary.ts)
```typescript
export class ConversationSummarizer {
  async summarizeChannel(channelId: string): Promise<MessageSummary>
  private extractDiscordMessages(): DiscordMessage[]  // DOM에서 메시지 추출
  private callLMAPI(messages: string[], channelId: string): Promise<string>
  private callOpenAIAPI(conversationText: string, config: any, channelId: string): Promise<string>
  private callAnthropicAPI(conversationText: string, config: any, channelId: string): Promise<string>
}
```

#### 4. **React 컴포넌트** (component.tsx)
```typescript
// 요약 버튼 컴포넌트
export function SummarizeButton({ channelId, onSummarize }: SummarizeButtonProps)

// 프롬프트 편집기
export function PromptEditor({ value, onChange, ... }: PromptEditorProps)

// 채널별 프롬프트 관리
export function ChannelPromptManager({ settingsManager, currentChannelId }: ChannelPromptManagerProps)
```

---

## 🔧 기술 스택 및 의존성

### 개발 환경
- **언어**: TypeScript 5.8.3
- **UI 프레임워크**: React (BdApi.React 사용)
- **빌드 도구**: Webpack 5.99.9 + Babel
- **타입 체킹**: TypeScript + @types 패키지들

### 핵심 의존성
```json
{
  "devDependencies": {
    "@babel/core": "^7.27.3",
    "@babel/preset-env": "^7.27.2", 
    "@babel/preset-react": "^7.27.1",
    "@babel/preset-typescript": "^7.27.1",
    "@types/react": "^19.1.6",
    "typescript": "^5.8.3",
    "webpack": "^5.99.9"
  }
}
```

### 외부 API
- **OpenAI API**: GPT-4 시리즈 모델 지원
- **Anthropic API**: Claude 시리즈 모델 지원

---

## 🚀 개발 환경 설정

### 1. 프로젝트 설정
```bash
# 저장소 클론
git clone <repository-url>
cd Betterdiscord-LMTools

# 의존성 설치
npm install

# 타입 체크
npm run type-check

# 개발 모드 (자동 빌드 + 감시)
npm run dev

# 프로덕션 빌드
npm run build
```

### 2. BetterDiscord 연동
- 빌드 시 자동으로 BetterDiscord 플러그인 폴더에 복사됨
- Windows: `%APPDATA%/BetterDiscord/plugins/`
- macOS: `~/Library/Application Support/BetterDiscord/plugins/`
- Linux: `~/.config/BetterDiscord/plugins/`

### 3. API 키 설정
플러그인 설정에서 다음 중 하나 설정:
- OpenAI API 키 (sk-로 시작)
- Anthropic API 키

---

## 🧩 주요 구현 세부사항

### Discord UI 패치 메커니즘

#### 1. **다단계 패치 전략**
```typescript
// 1차: 웹팩 모듈 패치
const ChannelTextAreaButtons = BdApi.Webpack.getModule(/* 필터 조건 */);
BdApi.Patcher.after(this.meta.name, ChannelTextAreaButtons, 'type', callback);

// 2차: DOM 관찰자
const observer = new MutationObserver(/* DOM 변화 감지 */);

// 3차: 주기적 주입
setInterval(() => { /* 수동 버튼 주입 */ }, 3000);
```

#### 2. **버튼 주입 로직**
- React 요소 구조에서 버튼 컨테이너 탐색
- 동적 CSS 클래스명 대응을 위한 다중 셀렉터 사용
- 수동 DOM 조작을 통한 대안 방법 제공

### 메시지 추출 시스템

#### 1. **DOM 셀렉터 전략**
```typescript
// 메인 셀렉터
const messageItems = document.querySelectorAll('li.messageListItem_d5deea');

// 대안 셀렉터들
const altSelectors = [
  'li[id^="chat-messages-"]',
  '.messageListItem',
  '[class*="messageListItem"]',
  '[data-list-item-id]'
];
```

#### 2. **메시지 구조 분석**
- 사용자명 추출: 연속 메시지에서 사용자명 기억
- 내용 추출: 텍스트, 이모지, 스티커 처리
- 인용 메시지: 답장 구조 분석 및 컨텍스트 보존

### API 통합 아키텍처

#### 1. **통합 설정 시스템**
```typescript
interface APIConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  endpoint: string;
  maxTokens: number;
  temperature: number;
}
```

#### 2. **모델별 최적화**
- **OpenAI**: o-시리즈 모델의 특별한 파라미터 처리
- **Anthropic**: 브라우저 직접 접근을 위한 헤더 설정

### 프롬프트 시스템

#### 1. **계층적 프롬프트 우선순위**
```
채널별 프롬프트 > 사용자 기본 프롬프트 > 하드코딩된 기본 프롬프트
```

#### 2. **변수 치환 시스템**
```typescript
const prompt = promptTemplate
  .replace(/\{\{username\}\}/g, currentUsername)
  .replace(/\{\{conversation\}\}/g, conversationText);
```

#### 3. **예제 프롬프트**
- **technical**: 기술 토론용
- **gaming**: 게이밍 대화용  
- **casual**: 일상 대화용

---

## 🔄 업데이트 및 확장 가이드

### 새로운 API 공급자 추가

#### 1. **설정 확장**
```typescript
// settings.ts에서
export interface PluginSettings {
  // 기존 설정...
  newApiProvider: 'newapi';
  newApiKey: string;
  newApiModel: string;
}

// settingsConfig에 새 옵션 추가
{
  type: 'dropdown',
  id: 'apiProvider',
  options: [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Anthropic', value: 'anthropic' },
    { label: 'New API', value: 'newapi' }  // 추가
  ]
}
```

#### 2. **API 호출 로직 추가**
```typescript
// summary.ts에서
private async callLMAPI(messages: string[], channelId: string): Promise<string> {
  if (config.provider === 'openai') {
    return await this.callOpenAIAPI(conversationText, config, channelId);
  } else if (config.provider === 'anthropic') {
    return await this.callAnthropicAPI(conversationText, config, channelId);
  } else if (config.provider === 'newapi') {
    return await this.callNewAPI(conversationText, config, channelId);  // 추가
  }
}

private async callNewAPI(conversationText: string, config: any, channelId: string): Promise<string> {
  // 새 API 호출 로직 구현
}
```

### 새로운 UI 컴포넌트 추가

#### 1. **컴포넌트 생성**
```typescript
// component.tsx에서
interface NewComponentProps {
  // props 정의
}

export function NewComponent({ ... }: NewComponentProps): React.ReactElement {
  // 컴포넌트 구현
}
```

#### 2. **메인 플러그인에서 사용**
```typescript
// index.tsx에서
import { NewComponent } from "./component";

// 설정 패널이나 다른 곳에서 사용
BdApi.React.createElement(NewComponent, { /* props */ })
```

### Discord 셀렉터 업데이트

Discord UI 변경 시 셀렉터 업데이트가 필요할 수 있습니다:

#### 1. **새 셀렉터 추가**
```typescript
// summary.ts의 extractDiscordMessages에서
const altSelectors = [
  'li.messageListItem_d5deea',  // 기존
  'li.newMessageClass_abc123',  // 새로 추가
  // 기타 대안 셀렉터들...
];
```

#### 2. **디버깅 로그 활용**
```typescript
console.log(`[DEBUG] Found component with selector: ${selector}`);
```

### 설정 옵션 확장

#### 1. **새 설정 추가**
```typescript
// settings.ts에서
export interface PluginSettings {
  // 기존 설정들...
  newFeatureEnabled: boolean;
  newFeatureValue: string;
}

// settingsConfig에 새 카테고리/설정 추가
{
  type: 'category',
  id: 'newFeature',
  name: '새 기능 설정',
  settings: [
    {
      type: 'switch',
      id: 'newFeatureEnabled',
      name: '새 기능 활성화',
      value: false
    }
  ]
}
```

---

## 🐛 디버깅 및 문제 해결

### 일반적인 문제들

#### 1. **버튼이 표시되지 않음**
- **원인**: Discord UI 변경으로 인한 셀렉터 미스매치
- **해결**: 브라우저 개발자 도구로 새 셀렉터 확인 후 업데이트

#### 2. **메시지 추출 실패**
- **원인**: CSS 클래스명 변경 또는 DOM 구조 변화  
- **해결**: `extractDiscordMessages`의 디버그 로그 확인

#### 3. **API 호출 실패**
- **원인**: API 키 오류, 네트워크 문제, 모델명 변경
- **해결**: API 키 재확인, 콘솔 오류 메시지 분석

### 디버깅 도구

#### 1. **콘솔 로그 활용**
```typescript
console.log(`[DEBUG] ${설명}:`, 변수);
console.warn(`[DEBUG] 경고 메시지`);
console.error(`[DEBUG] 오류 메시지`);
```

#### 2. **BetterDiscord 개발자 도구**
- `Ctrl+Shift+I` (개발자 도구 열기)
- Console 탭에서 로그 확인
- Elements 탭에서 DOM 구조 분석

#### 3. **설정 초기화**
```javascript
// 콘솔에서 실행
BdApi.Data.save("LM Tools", "settings", {});
```

---

## 📦 빌드 및 배포

### 빌드 프로세스

#### 1. **개발 빌드**
```bash
npm run dev  # 감시 모드로 자동 빌드
```

#### 2. **프로덕션 빌드**
```bash
npm run build:prod  # 최적화된 빌드
```

#### 3. **빌드 결과**
- 출력: `dist/LMTools.plugin.js`
- 자동 복사: BetterDiscord 플러그인 폴더

---

## 🤝 기여하기

### 코드 스타일

#### 1. **TypeScript 규칙**
- interface 사용 권장 (type 대신)

#### 2. **React 컴포넌트**
- Props 인터페이스 정의 필수
- BdApi.React 사용 (일반 React 대신)

*이 문서는 프로젝트와 함께 업데이트되며, 새로운 기능이나 변경사항이 있을 때마다 갱신해주세요.*