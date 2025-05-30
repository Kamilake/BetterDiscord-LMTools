import { MessageSummary } from "./types/betterdiscord";
import { SettingsManager } from "./settings";

export class ConversationSummarizer {
  private settingsManager: SettingsManager;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  async summarizeChannel(channelId: string): Promise<MessageSummary> {
    // 더미 로직 - 실제 채팅 내용을 불러오는 코드가 미완성이므로
    console.log(`Summarizing conversation in channel: ${channelId}`);
    
    // API 설정 확인
    if (!this.settingsManager.isApiKeyConfigured()) {
      throw new Error('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
    }

    // 더미 지연 시간 (실제 API 호출 시뮬레이션)
    await this.delay(2000);

    // 더미 요약 결과
    const dummySummary: MessageSummary = {
      channelId,
      summary: this.generateDummySummary(),
      messageCount: Math.floor(Math.random() * 50) + 10,
      timeRange: this.generateTimeRange(),
      createdAt: new Date()
    };

    console.log('Summary generated:', dummySummary);
    return dummySummary;
  }

  private generateDummySummary(): string {
    const summaryTemplates = [
      "최근 대화에서는 프로젝트 진행 상황과 기술적 이슈들에 대해 논의했습니다. 주요 내용으로는 새로운 기능 구현, 버그 수정, 그리고 향후 개발 방향에 대한 의견 교환이 있었습니다.",
      "사용자들이 제품 사용 경험을 공유하고, 개선사항에 대한 피드백을 제공했습니다. 특히 UI/UX 개선과 성능 최적화에 대한 요청이 많았습니다.",
      "팀 회의에서 다음 스프린트 계획과 작업 분배에 대해 논의했습니다. 각 팀원의 역할과 책임, 마감일정 등이 정해졌습니다.",
      "기술 토론에서 새로운 도구와 라이브러리 도입에 대해 논의했습니다. 장단점을 비교하고 프로젝트에 적합한 선택을 하기 위한 의견을 나누었습니다."
    ];
    
    return summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
  }

  private generateTimeRange(): string {
    const hours = Math.floor(Math.random() * 12) + 1;
    return `지난 ${hours}시간`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 실제 API 호출 메서드 (향후 구현 예정)
  private async callLMAPI(messages: string[]): Promise<string> {
    const config = this.settingsManager.getApiConfiguration();
    
    // TODO: 실제 API 호출 로직 구현
    // - OpenAI 또는 Anthropic API 호출
    // - 메시지 배열을 요약 프롬프트와 함께 전송
    // - 응답 파싱 및 반환
    
    throw new Error('API 호출 로직이 아직 구현되지 않았습니다.');
  }
}
