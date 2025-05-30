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

## API 제한사항 및 해결책

## API 지원 현황

### Anthropic API CORS 지원 업데이트 (2025년 최신)
🎉 **중요한 업데이트**: Anthropic API가 이제 브라우저에서의 직접 호출을 지원합니다!

Anthropic에서 새롭게 도입한 `anthropic-dangerous-direct-browser-access: true` 헤더를 사용하여 브라우저에서 직접 Claude API를 호출할 수 있습니다.

### 현재 지원 상태
- ✅ **OpenAI API**: 완전 지원, 즉시 사용 가능
- ✅ **Anthropic API**: CORS 지원으로 브라우저에서 직접 호출 가능

### 브라우저 직접 호출 시 보안 고려사항

**"Bring Your Own API Key" 패턴 사용**
- 사용자가 자신의 API 키를 직접 입력하여 사용
- API 키가 클라이언트 코드에 하드코딩되지 않음
- 각 사용자가 자신의 API 사용량과 비용을 관리

**권장 사용 시나리오**
1. 내부 도구 (신뢰할 수 있는 사용자만 접근)
2. 개인용 플러그인 (사용자 본인의 API 키 사용)
3. 개발/테스트 환경

**주의사항**
- API 키를 코드에 직접 포함하지 마세요
- 프로덕션 환경에서는 적절한 보안 검토 필요
- API 키 노출 위험성 인지 필요

- API 키는 로컬에만 저장되며, 외부로 전송되지 않습니다.
- BetterDiscord의 `BdApi.Data` API를 사용하여 안전하게 저장됩니다.
- API 키는 절대 다른 사람과 공유하지 마세요.