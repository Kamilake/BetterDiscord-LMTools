# LM Tools API 사용 가이드

## API 설정

플러그인 설정에서 다음을 구성할 수 있습니다:

### 1. API 공급자 선택
- **OpenAI**: GPT-3.5, GPT-4 등의 모델 사용
- **Anthropic**: Claude 3, Claude 2 등의 모델 사용

### 2. API 키 설정
- OpenAI API 키: `sk-...` 형식
- Anthropic API 키: Anthropic에서 발급받은 키

### 3. 모델 선택
각 공급자별로 사용 가능한 모델을 선택할 수 있습니다.

## 코드에서 API 설정 사용하기

```typescript
// 플러그인 인스턴스에서 API 설정 가져오기
const apiConfig = plugin.getApiConfiguration();

// API 설정 확인
if (plugin.isApiReady()) {
  console.log('API 준비 완료!');
  console.log('Provider:', apiConfig.provider);
  console.log('Model:', apiConfig.model);
  console.log('Endpoint:', apiConfig.endpoint);
}

// 설정 값 예시
{
  provider: 'openai',        // 또는 'anthropic'
  apiKey: 'sk-...',         // API 키 (보안상 직접 노출하지 않음)
  model: 'gpt-3.5-turbo',   // 선택된 모델
  endpoint: 'https://api.openai.com/v1',  // API 엔드포인트
  maxTokens: 2048,          // 최대 토큰 수
  temperature: 0.7          // 응답 창의성
}
```

## 향후 구현 예정 기능

1. **번역 기능**
   - 선택한 텍스트를 다른 언어로 번역
   - 컨텍스트 메뉴에 번역 옵션 추가

2. **답장 추천**
   - 메시지에 대한 답장 제안
   - 다양한 톤과 스타일의 답장 생성

3. **텍스트 요약**
   - 긴 메시지나 대화 요약
   - 주요 포인트 추출

4. **코드 설명**
   - 코드 블록에 대한 설명 생성
   - 프로그래밍 질문에 대한 답변

## 보안 주의사항

- API 키는 로컬에만 저장되며, 외부로 전송되지 않습니다.
- BetterDiscord의 `BdApi.Data` API를 사용하여 안전하게 저장됩니다.
- API 키는 절대 다른 사람과 공유하지 마세요.