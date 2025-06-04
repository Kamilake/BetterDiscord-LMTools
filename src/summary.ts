import { MessageSummary } from "./types/betterdiscord";
import { SettingsManager } from "./settings";
import { DiscordUtils } from "./discord-utils";
import { APIClient } from "./api-client";

export class ConversationSummarizer {
  private settingsManager: SettingsManager;
  private apiClient: APIClient;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.apiClient = new APIClient(settingsManager);
  }

  async summarizeChannel(channelId: string, inputText?: string): Promise<MessageSummary> {
    console.log(`Summarizing conversation in channel: ${channelId}`);
    if (inputText) {
      console.log(`Additional input text provided: ${inputText.substring(0, 100)}...`);
    }
    
    // API 설정 확인
    if (!this.settingsManager.isApiKeyConfigured()) {
      throw new Error('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
    }

    try {
      // Discord 채팅 메시지 가져오기
      const messageLimit = this.settingsManager.get('messageLimit');
      const messages = DiscordUtils.extractDiscordMessages(messageLimit);
      console.log(`Extracted ${messages.length} messages:`, messages);

      if (messages.length === 0) {
        throw new Error('현재 채널에서 메시지를 찾을 수 없습니다. 메시지가 로드된 상태에서 다시 시도해주세요.');
      }

      // 대화 내용 구성
      const conversationText = messages.map(m => `${m.username}: ${m.content}`).join('\n');
      
      // 프롬프트 생성
      const prompt = this.generateSummaryPrompt(conversationText, channelId, inputText);
      const systemPrompt = "당신은 Discord 대화를 요약하는 전문가입니다. 대화의 핵심 내용과 주요 논점을 간결하고 이해하기 쉽게 요약해 주세요. 응답은 JSON 형식만 허용됩니다.";
      
      // API 호출
      const summary = await this.apiClient.callAPI(prompt, systemPrompt);
      
      const result: MessageSummary = {
        channelId,
        summary,
        messageCount: messages.length,
        timeRange: DiscordUtils.calculateTimeRange(messages),
        createdAt: new Date()
      };

      console.log('Summary generated:', result);
      return result;
    } catch (error) {
      console.error('Error during summarization:', error);
      // 에러 발생 시 더미 결과 반환
      const dummySummary: MessageSummary = {
        channelId,
        summary: `요약 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        messageCount: 0,
        timeRange: '알 수 없음',
        createdAt: new Date()
      };
      return dummySummary;
    }
  }

  private generateSummaryPrompt(conversationText: string, channelId: string, inputText?: string): string {
    // 현재 사용자의 이름 가져오기
    const username = DiscordUtils.getCurrentUsername();
    console.log(`Current username for prompt: ${username}`);
    
    // 채널별 프롬프트 가져오기
    const promptTemplate = this.settingsManager.getPromptForChannel(channelId);
    console.log(`Using prompt for channel ${channelId}:`, promptTemplate.substring(0, 100) + '...');
    
    // 변수 치환
    let prompt = promptTemplate
      .replace(/\{\{username\}\}/g, username)
      .replace(/\{\{conversation\}\}/g, conversationText);
    
    // 입력 텍스트가 있으면 프롬프트 끝에 추가
    if (inputText && inputText.trim()) {
      prompt += `\n\n사용자가 원래 하려던 답장:\n\`\`\`\n${inputText}\n\`\`\`\n이 답장도 고려하여 대화를 요약하고, 특히 이 답변의 맥락과 의도를 반영한 답변 예시를 생성해주세요.`;
    }
    
    return prompt;
  }
}
