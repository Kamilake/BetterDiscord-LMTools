import { MessageSummary, DiscordMessage } from "./types/betterdiscord";
import { SettingsManager } from "./settings";

export class ConversationSummarizer {
  private settingsManager: SettingsManager;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
  }

  async summarizeChannel(channelId: string): Promise<MessageSummary> {
    console.log(`Summarizing conversation in channel: ${channelId}`);
    
    // API 설정 확인
    if (!this.settingsManager.isApiKeyConfigured()) {
      throw new Error('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
    }

    try {
      // Discord 채팅 메시지 가져오기
      const messages = this.extractDiscordMessages();
      console.log(`Extracted ${messages.length} messages:`, messages);

      if (messages.length === 0) {
        throw new Error('현재 채널에서 메시지를 찾을 수 없습니다. 메시지가 로드된 상태에서 다시 시도해주세요.');
      }

      // 실제 API 호출 (아직 더미)
      const summary = await this.callLMAPI(messages.map(m => `${m.username}: ${m.content}`));
      
      const result: MessageSummary = {
        channelId,
        summary,
        messageCount: messages.length,
        timeRange: this.calculateTimeRange(messages),
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

  /**
   * Discord 채팅창에서 메시지를 추출하는 함수
   * GUIDE.md의 코드를 기반으로 구현
   */
  private extractDiscordMessages(): DiscordMessage[] {
    try {
      console.log('=== Discord Message Extraction Debug ===');
      
      // 50개의 메시지를 가지고 있는 컨테이너
      const messageItems = document.querySelectorAll('li.messageListItem_d5deea');
      console.log(`[DEBUG] Primary selector 'li.messageListItem_d5deea': Found ${messageItems.length} message items`);

      let selectedItems: NodeListOf<Element> = messageItems;
      let selectedSelector = 'li.messageListItem_d5deea';

      if (messageItems.length === 0) {
        console.warn('[DEBUG] No message items found with primary selector. Trying alternative selectors...');
        
        // 대안 셀렉터들 시도
        const altSelectors = [
          'li[id^="chat-messages-"]',
          '.messageListItem',
          '[class*="messageListItem"]',
          '[data-list-item-id]',
          'li[class*="message"]',
          'div[class*="message"]',
          '[role="listitem"]'
        ];
        
        for (const selector of altSelectors) {
          const items = document.querySelectorAll(selector);
          console.log(`[DEBUG] Alternative selector '${selector}': Found ${items.length} items`);
          if (items.length > 0) {
            selectedItems = items;
            selectedSelector = selector;
            console.log(`[DEBUG] Using selector: ${selector} with ${items.length} items`);
            break;
          }
        }
      }

      console.log(`[DEBUG] Final selector: ${selectedSelector}, Items count: ${selectedItems.length}`);

      // 첫 번째 몇 개 아이템의 구조를 분석
      if (selectedItems.length > 0) {
        console.log(`[DEBUG] Analyzing first 3 items structure:`);
        for (let i = 0; i < Math.min(3, selectedItems.length); i++) {
          const item = selectedItems[i];
          console.log(`[DEBUG] Item ${i}:`, {
            tagName: item.tagName,
            className: item.className,
            id: item.id,
            innerHTML: item.innerHTML.substring(0, 200) + '...'
          });
        }
      }

      // 한 사람이 여러번 말하면 Username이 제공되지 않기에 기억해야 한다
      let lastUsername = '';
      
      const messages: DiscordMessage[] = Array.from(selectedItems).map((item, index) => {
        try {
          console.log(`[DEBUG] Processing item ${index}:`);
          
          // 다양한 contents 셀렉터 시도
          const contentsSelectors = [
            '.contents_f9f2ca',
            '.contents',
            '[class*="contents"]',
            '.messageContent',
            '[class*="messageContent"]'
          ];
          
          let contents: Element | null = null;
          let usedContentsSelector = '';
          
          for (const selector of contentsSelectors) {
            contents = item.querySelector(selector);
            if (contents) {
              usedContentsSelector = selector;
              console.log(`[DEBUG] Found contents with selector: ${selector}`);
              break;
            }
          }
          
          if (!contents) {
            console.warn(`[DEBUG] No contents found for item ${index}. Tried selectors:`, contentsSelectors);
            console.log(`[DEBUG] Item ${index} structure:`, item.innerHTML.substring(0, 300));
            return null;
          }

          // 다양한 username 셀렉터 시도
          const usernameSelectors = [
            '.username_f9f2ca',
            '.username',
            '[class*="username"]',
            '.author',
            '[class*="author"]'
          ];
          
          let usernameElement: Element | null = null;
          let usedUsernameSelector = '';
          
          for (const selector of usernameSelectors) {
            usernameElement = contents.querySelector(selector);
            if (usernameElement) {
              usedUsernameSelector = selector;
              console.log(`[DEBUG] Found username with selector: ${selector}`);
              break;
            }
          }

          // 다양한 message content 셀렉터 시도
          const messageSelectors = [
            '.messageContent_f9f2ca',
            '.messageContent',
            '[class*="messageContent"]',
            '.content',
            '[class*="content"]'
          ];
          
          let messageElement: Element | null = null;
          let usedMessageSelector = '';
          
          for (const selector of messageSelectors) {
            messageElement = contents.querySelector(selector);
            if (messageElement) {
              usedMessageSelector = selector;
              console.log(`[DEBUG] Found message content with selector: ${selector}`);
              break;
            }
          }

          if (!messageElement) {
            console.warn(`[DEBUG] No message content found for item ${index}. Tried selectors:`, messageSelectors);
            console.log(`[DEBUG] Contents structure:`, contents.innerHTML.substring(0, 300));
            return null;
          }

          // message-content-1308457639944126515에서 숫자 부분이 메시지ID, 순차 증가하기에 타임스탬프로 활용 가능
          const messageIdString = messageElement ? messageElement.id : '';
          const messageId = messageIdString ? messageIdString.match(/\d+/g)?.join('') || `${Date.now()}-${index}` : `${Date.now()}-${index}`;

          let username = usernameElement ? usernameElement.textContent?.trim() || '' : lastUsername;
          
          let message = '';
          if (messageElement) {
            message = Array.from(messageElement.childNodes).map(node => {
              let text = '';
              if (node.nodeType === Node.TEXT_NODE) {
                text = node.textContent?.trimStart() || '';
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // 인용 메시지 무시
                if (element.classList.contains('blockquoteContainer_f8f345')) {
                  console.log("[DEBUG] 인용 메시지 무시");
                  return '';
                }
                
                // 이모지 처리
                const emojiImg = element.querySelector('.emojiContainer_bae8cb img');
                if (emojiImg) {
                  text += emojiImg.getAttribute('alt') || '';
                } else {
                  text = element.textContent?.trimStart() || '';
                }
              }
              return text;
            }).join('');
          }

          // 스티커 텍스트 처리
          const stickerText = item.querySelector('.clickableSticker_a1debe div div img');
          if (stickerText) {
            message += "<" + (stickerText.getAttribute('alt') || 'sticker') + ">";
          }

          if (usernameElement) {
            lastUsername = username;
          }

          // 답장한 메시지가 있는 경우
          let referenceMessage = '';
          let referenceUsername = '';
          const repliedTextContent = item.querySelector('.repliedMessage_f9f2ca');
          if (repliedTextContent) {
            console.log("[DEBUG] repliedTextContent 가 존재함");
            const referenceMessageElement = repliedTextContent.querySelector('.repliedTextContent_f9f2ca span');
            if (referenceMessageElement) {
              referenceMessage = referenceMessageElement.textContent?.trim() || '';
              const referenceUsernameElement = item.querySelector('.username_f9f2ca');
              if (referenceUsernameElement) {
                referenceUsername = referenceUsernameElement.textContent?.trim() || '';
                message = `Reference: ${referenceUsername} - ${referenceMessage}\n\n${message}`;
              }
            }
          }

          console.log(`[DEBUG] Item ${index} extracted:`, {
            id: messageId,
            username: username,
            content: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            usedSelectors: {
              contents: usedContentsSelector,
              username: usedUsernameSelector,
              message: usedMessageSelector
            }
          });

          return {
            id: messageId,
            username: username,
            content: message,
            referenceMessage: referenceMessage || undefined,
            referenceUsername: referenceUsername || undefined
          } as DiscordMessage;
        } catch (error) {
          console.error(`[DEBUG] Error processing message ${index}:`, error);
          return null;
        }
      }).filter((msg): msg is DiscordMessage => msg !== null && msg.content !== '');

      // 설정된 개수만큼 최근 메시지 유지 (0이면 무제한)
      const messageLimit = this.settingsManager.get('messageLimit');
      const recentMessages = messageLimit > 0 ? messages.slice(-messageLimit) : messages;
      
      console.log(`[DEBUG] Final results:`);
      console.log(`[DEBUG] Total valid messages extracted: ${messages.length}`);
      console.log(`[DEBUG] Message limit setting: ${messageLimit === 0 ? '무제한' : messageLimit + '개'}`);
      console.log(`[DEBUG] Returning recent messages: ${recentMessages.length}`);
      
      if (recentMessages.length > 0) {
        console.log(`[DEBUG] Sample messages:`, recentMessages.slice(0, 3).map(msg => ({
          username: msg.username,
          content: msg.content.substring(0, 50) + '...',
          id: msg.id
        })));
      } else {
        console.warn(`[DEBUG] No valid messages found. Check CSS selectors or message structure.`);
      }
      
      console.log('=== End Discord Message Extraction Debug ===');
      
      return recentMessages;
    } catch (error) {
      console.error('[DEBUG] Error extracting Discord messages:', error);
      return [];
    }
  }

  /**
   * 메시지들의 시간 범위를 계산
   */
  private calculateTimeRange(messages: DiscordMessage[]): string {
    if (messages.length === 0) return '알 수 없음';
    
    // 간단한 구현: 메시지 개수 기반으로 추정
    const hours = Math.min(Math.max(1, Math.floor(messages.length / 10)), 24);
    return `지난 ${hours}시간`;
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
    
    // 임시로 더미 지연과 함께 더미 요약 반환
    await this.delay(1000);
    return this.generateDummySummary();
  }
}
