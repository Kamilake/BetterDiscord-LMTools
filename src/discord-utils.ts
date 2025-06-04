import { DiscordMessage } from "./types/betterdiscord";

export class DiscordUtils {
  /**
   * Discord 채팅창에서 메시지를 추출하는 함수
   */
  static extractDiscordMessages(messageLimit?: number): DiscordMessage[] {
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
      const recentMessages = messageLimit && messageLimit > 0 ? messages.slice(-messageLimit) : messages;
      
      console.log(`[DEBUG] Final results:`);
      console.log(`[DEBUG] Total valid messages extracted: ${messages.length}`);
      console.log(`[DEBUG] Message limit: ${messageLimit === 0 ? '무제한' : (messageLimit || '무제한') + '개'}`);
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
   * 현재 Discord 사용자의 이름을 가져옴
   */
  static getCurrentUsername(): string {
    try {
      // BdApi를 통해 현재 사용자 정보 가져오기
      const BdApi = (window as any).BdApi;
      
      if (BdApi && BdApi.Webpack) {
        // UserStore를 통해 현재 사용자 정보 가져오기
        const UserStore = BdApi.Webpack.getModule((m: any) => m.getCurrentUser);
        if (UserStore && UserStore.getCurrentUser) {
          const currentUser = UserStore.getCurrentUser();
          if (currentUser) {
            // globalName이 있으면 사용, 없으면 username 사용
            return currentUser.globalName || currentUser.username || "사용자";
          }
        }

        // 다른 방법: DiscordModules를 통해 가져오기
        const DiscordModules = BdApi.Webpack.getModule((m: any) => m.UserStore);
        if (DiscordModules && DiscordModules.UserStore) {
          const currentUser = DiscordModules.UserStore.getCurrentUser();
          if (currentUser) {
            return currentUser.globalName || currentUser.username || "사용자";
          }
        }
      }

      // 대안: DOM에서 사용자 이름 찾기
      const usernameElement = document.querySelector('[class*="nameTag"] [class*="username"]') ||
                              document.querySelector('[class*="accountProfileCard"] [class*="userTag"]') ||
                              document.querySelector('[class*="panelTitle"]');
      
      if (usernameElement && usernameElement.textContent) {
        return usernameElement.textContent.trim();
      }

      console.warn('Could not find current username, using default');
      return "사용자";
    } catch (error) {
      console.error('Error getting current username:', error);
      return "사용자";
    }
  }

  /**
   * 메시지들의 시간 범위를 계산
   */
  static calculateTimeRange(messages: DiscordMessage[]): string {
    if (messages.length === 0) return '알 수 없음';
    
    // 간단한 구현: 메시지 개수 기반으로 추정
    const hours = Math.min(Math.max(1, Math.floor(messages.length / 10)), 24);
    return `지난 ${hours}시간`;
  }
}
