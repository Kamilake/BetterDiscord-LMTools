import { SettingsManager } from "./settings";
import { DiscordUtils } from "./discord-utils";
import { APIClient } from "./api-client";
import { DiscordMessage } from "./types/betterdiscord";

export interface TranslationResult {
  channelId: string;
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  username: string;
  createdAt: Date;
  detailedTranslation?: {
    originalLastMessage: string;
    translatedLastMessage: string;
    slangAndIdioms?: Array<{
      original: string;
      meaning: string;
      koreanEquivalent: string;
      usage: string;
      formality: 'formal' | 'informal' | 'slang';
    }>;
    abbreviations?: Array<{
      abbr: string;
      fullForm: string;
      meaning: string;
      commonUsage: string;
    }>;
    grammarNotes?: Array<{
      pattern: string;
      explanation: string;
      examples: string[];
    }>;
  };
}

export class ConversationTranslator {
  private settingsManager: SettingsManager;
  private apiClient: APIClient;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.apiClient = new APIClient(settingsManager);
  }

  async translateLastMessage(channelId: string): Promise<TranslationResult> {
    console.log(`Translating last message in channel: ${channelId}`);
    
    // API 설정 확인
    if (!this.settingsManager.isApiKeyConfigured()) {
      throw new Error('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
    }

    try {
      // Discord 채팅 메시지 가져오기
      const messageLimit = this.settingsManager.get('messageLimit');
      const messages = DiscordUtils.extractDiscordMessages(messageLimit);
      console.log(`Extracted ${messages.length} messages for translation context`);

      if (messages.length === 0) {
        throw new Error('현재 채널에서 메시지를 찾을 수 없습니다.');
      }

      // 마지막 메시지 찾기 (봇 메시지나 시스템 메시지 제외)
      // 규칙: 내가 마지막으로 말한 이후의 모든 메시지 수집
      const selfName = DiscordUtils.getCurrentUsername();
      
      // 메시지 배열을 역순으로 탐색하여 내가 마지막으로 보낸 메시지의 인덱스 찾기
      let lastSelfMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].username === selfName) {
          lastSelfMessageIndex = i;
          console.log(`Found last self message at index ${i}: "${messages[i].content.substring(0, 50)}..."`);
          break;
        }
      }
      
      // 읽지 않은 메시지 수집
      let unReadMessages: DiscordMessage[] = [];
      
      if (lastSelfMessageIndex === -1) {
        // 내가 한 번도 말하지 않은 경우, 모든 메시지를 읽지 않은 것으로 간주
        unReadMessages = messages;
        console.log('No self messages found. Treating all messages as unread.');
      } else if (lastSelfMessageIndex === messages.length - 1) {
        // 마지막 메시지가 내 메시지인 경우 - 이전 대화 문맥 찾기
        console.log('Last message is self message. Looking for previous conversation context...');
        
        // 내 메시지를 제외하고 다른 사람의 메시지 찾기
        let otherUserMessageEndIndex = -1;
        let consecutiveSelfMessages = 1;
        
        // 마지막 내 메시지부터 역순으로 탐색
        for (let i = lastSelfMessageIndex - 1; i >= 0; i--) {
          if (messages[i].username === selfName) {
            consecutiveSelfMessages++;
          } else {
            // 다른 사람의 메시지를 찾음
            otherUserMessageEndIndex = i;
            break;
          }
        }
        
        if (otherUserMessageEndIndex === -1) {
          throw new Error('다른 사용자의 메시지를 찾을 수 없습니다. 번역할 메시지가 없습니다.');
        }
        
        // 다른 사람의 연속된 메시지들 수집 (내가 마지막으로 말하기 전까지)
        let previousSelfMessageIndex = -1;
        for (let i = otherUserMessageEndIndex - 1; i >= 0; i--) {
          if (messages[i].username === selfName) {
            previousSelfMessageIndex = i;
            break;
          }
        }
        
        // 이전 내 메시지 이후부터 다른 사람의 메시지들까지 수집
        const startIndex = previousSelfMessageIndex + 1;
        const endIndex = otherUserMessageEndIndex + 1;
        unReadMessages = messages.slice(startIndex, endIndex);
        
        console.log(`Found ${consecutiveSelfMessages} consecutive self messages at the end`);
        console.log(`Collecting messages from index ${startIndex} to ${endIndex - 1}`);
        console.log(`Found ${unReadMessages.length} messages from other users to translate`);
      } else {
        // 내 마지막 메시지 이후의 모든 메시지 수집
        unReadMessages = messages.slice(lastSelfMessageIndex + 1);
        console.log(`Found ${unReadMessages.length} unread messages after last self message`);
      }
      
      if (unReadMessages.length === 0) {
        throw new Error('번역할 메시지가 없습니다.');
      }
      
      // 읽지 않은 메시지 로그
      console.log('Unread messages:', unReadMessages.map(m => ({
        username: m.username,
        content: m.content.substring(0, 50) + '...'
      })));
      
      const unReadMessagesContext = unReadMessages.map(m => `${m.username}: ${m.content}`).join('\n');
      const conversationContext = messages.map(m => `${m.username}: ${m.content}`).join('\n');

      // 번역 프롬프트 생성
      const prompt = this.generateTranslationPrompt(selfName, unReadMessagesContext, conversationContext);
      const systemPrompt = "당신은 전문 번역가입니다. 대화의 맥락을 고려하여 자연스럽고 정확한 번역을 제공해주세요.";
      
      // API 호출하여 번역
      const translationResponse = await this.apiClient.callAPI(prompt, systemPrompt);
      
      // JSON 응답 파싱
      let parsedResponse: any;
      try {
        // JSON 코드 블록 추출
        const jsonMatch = translationResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[1]);
        } else {
          // 직접 JSON 파싱 시도
          parsedResponse = JSON.parse(translationResponse);
        }
      } catch (error) {
        console.error('JSON 파싱 실패, 기본 형식으로 처리:', error);
        // JSON 파싱 실패시 단순 텍스트로 처리
        parsedResponse = {
          originalLastMessage: unReadMessages[unReadMessages.length - 1].content,
          translatedLastMessage: translationResponse
        };
      }
      
      // 파싱된 데이터 검증 및 기본값 설정
      const detailedTranslation = {
        originalLastMessage: parsedResponse.originalLastMessage || unReadMessages[unReadMessages.length - 1].content,
        translatedLastMessage: parsedResponse.translatedLastMessage || translationResponse,
        slangAndIdioms: Array.isArray(parsedResponse.slangAndIdioms) ? parsedResponse.slangAndIdioms : [],
        abbreviations: Array.isArray(parsedResponse.abbreviations) ? parsedResponse.abbreviations : [],
        grammarNotes: Array.isArray(parsedResponse.grammarNotes) ? parsedResponse.grammarNotes : []
      };
      
      const result: TranslationResult = {
        channelId,
        originalText: detailedTranslation.originalLastMessage,
        translatedText: detailedTranslation.translatedLastMessage,
        targetLanguage: 'ko', // 기본값은 한국어로 설정
        username: unReadMessages[unReadMessages.length - 1].username,
        createdAt: new Date(),
        detailedTranslation
      };

      console.log('Translation completed with details:', {
        hasSlang: detailedTranslation.slangAndIdioms.length > 0,
        hasAbbreviations: detailedTranslation.abbreviations.length > 0,
        hasGrammarNotes: detailedTranslation.grammarNotes.length > 0
      });
      
      return result;
    } catch (error) {
      console.error('Error during translation:', error);
      throw error;
    }
  }

  private generateTranslationPrompt(
    selfName: string,
    unReadMessagesContext: string,
    conversationContext: string,
  ): string {
    const basePrompt = `다음 Discord 대화의 맥락을 고려하여 사용자가 읽어야 하는 부분을 한국어로 자연스럽게 번역해주세요.
    

사용자 이름: ${selfName}

대화 문맥:
\`\`\`
${conversationContext}
\`\`\`

읽어야 할 메시지(아직 읽지 않은 메시지):
\`\`\`
${unReadMessagesContext}
\`\`\`

번역 시 다음 사항을 고려해주세요:
1. 대화의 흐름과 문맥을 고려하여 자연스러운 번역
2. 인터넷 슬랭이나 줄임말은 한국어 문화에 맞게 적절히 번역
3. 기술 용어는 일반적으로 사용되는 한국어 표현으로 번역
4. 슬랭, 관용구, 줄임말에 대한 상세한 설명 제공

번역 결과는 JSON 형식으로 반환해주세요. 예시:
\`\`\`json
{
  "originalLastMessage": "원본 메시지",
  "translatedLastMessage": "번역된 메시지",
  "slangAndIdioms": [
    {
      "original": "원본 슬랭/관용구",
      "meaning": "실제 의미",
      "koreanEquivalent": "한국어 상응 표현",
      "usage": "사용 상황 설명",
      "formality": "formal/informal/slang"
    }
  ],
  "abbreviations": [
    {
      "abbr": "줄임말",
      "fullForm": "전체 형태",
      "meaning": "의미",
      "commonUsage": "일반적인 사용법"
    }
  ],
  "grammarNotes": [
    {
      "pattern": "문법 패턴",
      "explanation": "설명",
      "examples": ["예시1", "예시2"]
    }
  ],
}
\`\`\``;

    return basePrompt;
  }
}