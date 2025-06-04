import { SummarizeButton, TranslateButton, PromptEditor, ChannelPromptManager } from "./component";
import styles from "./styles.css";
import type { BetterDiscordPlugin, PluginMeta } from "./types/betterdiscord";
import { SettingsManager } from "./settings";
import { ConversationSummarizer } from "./summary";
import { ConversationTranslator } from "./translator";

// BdApi 전역 변수 선언
declare const BdApi: {
  DOM: {
    addStyle(id: string, css: string): void;
    removeStyle(id: string): void;
  };
  UI: {
    buildSettingsPanel(options: any): any;
    showToast(message: string, options?: { type?: 'info' | 'success' | 'error' | 'warning' }): void;
  };
  Patcher: {
    before(caller: string, moduleToPatch: any, functionName: string, callback: Function): Function;
    after(caller: string, moduleToPatch: any, functionName: string, callback: Function): Function;
    unpatchAll(caller: string): void;
  };
  Webpack: {
    getModule(filter: Function): any;
    getByDisplayName(displayName: string): any;
  };
  React: {
    useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    createElement(
      type: any,
      props?: any,
      ...children: any[]
    ): any;
    Fragment: any;
  };
};

// React를 BdApi에서 가져오기
declare const React: typeof BdApi.React;

export default class LMTools implements BetterDiscordPlugin {
  private meta: PluginMeta;
  private settingsManager: SettingsManager;
  private summarizer: ConversationSummarizer;
  private translator: ConversationTranslator;
  private channelTextAreaButtons: any;

  constructor(meta: PluginMeta) {
    this.meta = meta;
    this.settingsManager = new SettingsManager(meta.name);
    this.summarizer = new ConversationSummarizer(this.settingsManager);
    this.translator = new ConversationTranslator(this.settingsManager);
  }

  start(): void {
    BdApi.DOM.addStyle(this.meta.name, styles);
    console.log(`${this.meta.name} started with settings:`, this.settingsManager.getAll());
    
    this.patchChannelTextAreaButtons();
  }

  stop(): void {
    BdApi.DOM.removeStyle(this.meta.name);
    BdApi.Patcher.unpatchAll(this.meta.name);
  }

  private patchChannelTextAreaButtons(): void {
    // 더 안정적인 방법으로 채팅 입력창 컴포넌트 찾기
    const ChannelTextAreaButtons = BdApi.Webpack.getModule(
      (m: any) => m?.type?.render?.toString?.()?.includes('attachButton') ||
           m?.default?.toString?.()?.includes('attachButton') ||
           m?.type?.toString?.()?.includes('ChannelTextAreaButtons')
    );

    if (ChannelTextAreaButtons) {
      console.log('Found ChannelTextAreaButtons component, applying patch...');
      
      // render 함수 패치
      BdApi.Patcher.after(this.meta.name, ChannelTextAreaButtons, 'type', (thisObject: any, args: any[], returnValue: any) => {
        this.injectSummarizeButton(returnValue, args[0]);
      });
      
      // default export가 있는 경우도 처리
      if (ChannelTextAreaButtons.default) {
        BdApi.Patcher.after(this.meta.name, ChannelTextAreaButtons, 'default', (thisObject: any, args: any[], returnValue: any) => {
          this.injectSummarizeButton(returnValue, args[0]);
        });
      }
    } else {
      console.warn('ChannelTextAreaButtons component not found, trying alternative approach...');
      this.tryAlternativePatch();
    }
  }

  private tryAlternativePatch(): void {
    // 대안적인 패치 방법 - Observer를 사용하여 DOM 변화 감지
    console.log('Trying alternative patch methods...');
    
    // 1. DOM 관찰자를 통한 방법
    this.setupDOMObserver();
    
    // 2. 주기적으로 수동 주입 시도
    this.startPeriodicInjection();
    
    // 3. 다른 웹팩 모듈 패턴 시도
    this.tryOtherWebpackPatterns();
  }

  private setupDOMObserver(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const textAreaContainer = document.querySelector('[class*="channelTextArea"]') ||
                                  document.querySelector('[class*="textAreaContainer"]') ||
                                  document.querySelector('[data-slate-editor="true"]')?.closest('[class*="container"]');
          
          if (textAreaContainer && !textAreaContainer.querySelector('.summarize-button')) {
            console.log('Found textarea container via observer, injecting button...');
            this.injectButtonManually(textAreaContainer as HTMLElement);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 5분 후 observer 정리
    setTimeout(() => observer.disconnect(), 300000);
  }

  private startPeriodicInjection(): void {
    let attempts = 0;
    const maxAttempts = 10;
    
    const intervalId = setInterval(() => {
      attempts++;
      
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        return;
      }

      const textAreaContainer = document.querySelector('[class*="channelTextArea"]') ||
                              document.querySelector('[class*="textAreaContainer"]');
      
      if (textAreaContainer && !textAreaContainer.querySelector('.summarize-button')) {
        console.log(`Periodic injection attempt ${attempts}: injecting button...`);
        this.injectButtonManually(textAreaContainer as HTMLElement);
        clearInterval(intervalId); // 성공하면 중단
      }
    }, 3000);
  }

  private tryOtherWebpackPatterns(): void {
    // 다른 패턴으로 채팅 입력창 컴포넌트 찾기
    const patterns = [
      (m: any) => m?.default?.displayName === 'ChannelTextAreaContainer',
      (m: any) => m?.type?.displayName === 'ChannelTextArea',
      (m: any) => m?.render?.toString?.()?.includes('textAreaContainer'),
      (m: any) => typeof m === 'function' && m.toString().includes('channelTextArea') && m.toString().includes('buttons')
    ];

    patterns.forEach((pattern, index) => {
      try {
        const component = BdApi.Webpack.getModule(pattern);
        if (component) {
          console.log(`Found component with pattern ${index}, applying patch...`);
          this.patchFoundComponent(component);
        }
      } catch (error) {
        console.warn(`Pattern ${index} failed:`, error);
      }
    });
  }

  private patchFoundComponent(component: any): void {
    try {
      if (component.default) {
        BdApi.Patcher.after(this.meta.name, component, 'default', (thisObject: any, args: any[], returnValue: any) => {
          this.injectSummarizeButton(returnValue, args[0]);
        });
      }
      
      if (component.type) {
        BdApi.Patcher.after(this.meta.name, component, 'type', (thisObject: any, args: any[], returnValue: any) => {
          this.injectSummarizeButton(returnValue, args[0]);
        });
      }
      
      if (typeof component === 'function') {
        BdApi.Patcher.after(this.meta.name, { func: component }, 'func', (thisObject: any, args: any[], returnValue: any) => {
          this.injectSummarizeButton(returnValue, args[0]);
        });
      }
    } catch (error) {
      console.error('Error patching found component:', error);
    }
  }

  private injectSummarizeButton(returnValue: any, props: any): void {
    if (!returnValue || !props?.channel) return;

    try {
      // React 요소 구조에서 버튼들을 찾아서 요약 버튼 추가
      const buttons = this.findButtonsInReactElement(returnValue);
      if (buttons && buttons.props?.children) {
        // 이미 요약 버튼이 있는지 확인
        const existingButton = Array.isArray(buttons.props.children)
          ? buttons.props.children.find((child: any) => child?.key === 'summarize-button')
          : null;
        
        if (!existingButton) {
          // 자식 요소가 배열이 아닌 경우 배열로 변환
          if (!Array.isArray(buttons.props.children)) {
            buttons.props.children = [buttons.props.children];
          }
          
          // 요약 버튼 추가
          buttons.props.children.unshift(
            BdApi.React.createElement(SummarizeButton, {
              key: 'summarize-button',
              channelId: props.channel.id,
              onSummarize: this.handleSummarize.bind(this),
              settingsManager: this.settingsManager
            })
          );
          
          // 번역 버튼 추가
          buttons.props.children.unshift(
            BdApi.React.createElement(TranslateButton, {
              key: 'translate-button',
              channelId: props.channel.id,
              onTranslate: this.handleTranslate.bind(this)
            })
          );
          
          console.log('Summarize and Translate buttons injected successfully');
        }
      } else {
        console.warn('Could not find buttons container in React element');
      }
    } catch (error) {
      console.error('Error injecting summarize button:', error);
    }
  }

  private findButtonsInReactElement(element: any): any {
    if (!element) return null;
    
    // 특정 클래스명을 가진 버튼 컨테이너 찾기
    if (element.props?.className && typeof element.props.className === 'string') {
      // Discord의 채팅 입력창 버튼들을 담는 일반적인 클래스명들
      if (element.props.className.includes('buttons') ||
          element.props.className.includes('channelTextArea') ||
          element.props.className.includes('toolbar')) {
        // 자식 요소가 배열인지 확인 (버튼들을 추가할 수 있는 구조)
        if (element.props.children && Array.isArray(element.props.children)) {
          return element;
        }
      }
    }
    
    // React 요소 구조를 재귀적으로 탐색
    if (element.props?.children) {
      if (Array.isArray(element.props.children)) {
        // 배열 형태의 자식 요소들을 검사
        for (const child of element.props.children) {
          const result = this.findButtonsInReactElement(child);
          if (result) return result;
        }
        
        // 배열 자체가 버튼 컨테이너일 수도 있음
        if (element.props.children.some((child: any) =>
            child?.type?.toString?.()?.includes('Button') ||
            child?.props?.className?.includes?.('button')
        )) {
          return element;
        }
      } else {
        return this.findButtonsInReactElement(element.props.children);
      }
    }
    
    return null;
  }

  private injectButtonManually(container: HTMLElement): void {
    // DOM 조작을 통한 버튼 추가 (대안적 방법)
    const existingButton = container.querySelector('.summarize-button');
    if (existingButton) return;

    // Discord의 일반적인 버튼 컨테이너 찾기
    const buttonSelectors = [
      '[class*="buttons"]:not([class*="keyboardWrapper"])',
      '[class*="toolbar"]',
      '[class*="buttonContainer"]',
      '[role="toolbar"]'
    ];

    let buttonContainer: HTMLElement | null = null;
    for (const selector of buttonSelectors) {
      buttonContainer = container.querySelector(selector);
      if (buttonContainer) break;
    }

    // 버튼 컨테이너를 찾지 못한 경우 직접 생성
    if (!buttonContainer) {
      buttonContainer = this.createButtonContainer(container);
    }

    if (buttonContainer) {
      const summarizeButton = this.createSummarizeButtonElement();
      const translateButton = this.createTranslateButtonElement();
      
      // 첫 번째 위치에 버튼들 추가 (다른 버튼들보다 앞에)
      buttonContainer.insertBefore(translateButton, buttonContainer.firstChild);
      buttonContainer.insertBefore(summarizeButton, buttonContainer.firstChild);
      
      console.log('Summarize and Translate buttons injected manually into DOM');
    } else {
      console.warn('Could not find or create button container');
    }
  }

  private createButtonContainer(container: HTMLElement): HTMLElement | null {
    // 텍스트 에어리어 찾기
    const textArea = container.querySelector('[data-slate-editor="true"]') ||
                    container.querySelector('textarea') ||
                    container.querySelector('[class*="textArea"]');
    
    if (textArea) {
      const parentElement = textArea.parentElement;
      if (parentElement) {
        // 버튼 컨테이너 생성
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'lm-tools-button-container';
        buttonContainer.style.cssText = `
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 8px;
        `;
        
        // 텍스트 에어리어와 같은 레벨에 추가
        parentElement.appendChild(buttonContainer);
        return buttonContainer;
      }
    }
    
    return null;
  }

  private createSummarizeButtonElement(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'summarize-button';
    button.type = 'button';
    
    // Discord 스타일과 일치하는 CSS 적용
    button.style.cssText = `
      background: transparent;
      border: none;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      color: var(--interactive-normal, #b9bbbe);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      width: 32px;
      height: 32px;
    `;
    
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
      </svg>
    `;
    
    button.title = '대화 요약';
    
    // 호버 효과
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'var(--background-modifier-hover, #4f545c)';
      button.style.color = 'var(--interactive-hover, #dcddde)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
      button.style.color = 'var(--interactive-normal, #b9bbbe)';
    });
    
    // 클릭 이벤트
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const channelId = this.getCurrentChannelId();
      if (channelId) {
        // 로딩 상태 표시
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        
        try {
          await this.handleSummarize(channelId);
        } finally {
          // 로딩 상태 해제
          button.style.opacity = '1';
          button.style.cursor = 'pointer';
        }
      }
    });
    
    return button;
  }

  private createTranslateButtonElement(): HTMLElement {
    const button = document.createElement('button');
    button.className = 'translate-button';
    button.type = 'button';
    
    // Discord 스타일과 일치하는 CSS 적용
    button.style.cssText = `
      background: transparent;
      border: none;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      color: var(--interactive-normal, #b9bbbe);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      width: 32px;
      height: 32px;
    `;
    
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
    `;
    
    button.title = '마지막 대화 번역';
    
    // 호버 효과
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'var(--background-modifier-hover, #4f545c)';
      button.style.color = 'var(--interactive-hover, #dcddde)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent';
      button.style.color = 'var(--interactive-normal, #b9bbbe)';
    });
    
    // 클릭 이벤트
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const channelId = this.getCurrentChannelId();
      if (channelId) {
        // 로딩 상태 표시
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
        
        try {
          await this.handleTranslate(channelId);
        } finally {
          // 로딩 상태 해제
          button.style.opacity = '1';
          button.style.cursor = 'pointer';
        }
      }
    });
    
    return button;
  }

  private getCurrentChannelId(): string | null {
    // 현재 채널 ID를 가져오는 로직 (더 안정적인 방법 사용)
    try {
      // Discord의 SelectedChannelStore 찾기
      const SelectedChannelStore = BdApi.Webpack.getModule((m: any) => m.getChannelId && m.getLastSelectedChannelId);
      if (SelectedChannelStore) {
        return SelectedChannelStore.getChannelId();
      }
      
      // 대안: URL에서 채널 ID 추출
      const urlMatch = window.location.pathname.match(/\/channels\/[^\/]+\/(\d+)/);
      if (urlMatch) {
        return urlMatch[1];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current channel ID:', error);
      return null;
    }
  }

  private async handleSummarize(channelId: string): Promise<void> {
    try {
      console.log(`Summarizing conversation in channel: ${channelId}`);
      
      // Discord 채팅 입력창에서 텍스트 가져오기
      let inputText = '';
      
      // Slate editor에서 텍스트 추출
      const textArea = document.querySelector('[data-slate-editor="true"]') as HTMLElement;
      if (textArea) {
        const textNodes = textArea.querySelectorAll('[data-slate-node="text"]');
        inputText = Array.from(textNodes).map(node => node.textContent || '').join('');
      } else {
        // 대체 방법: contenteditable div의 innerText
        const inputContainer = document.querySelector('[class*="slateTextArea"]');
        if (inputContainer) {
          const editableDiv = inputContainer.querySelector('[contenteditable="true"]');
          if (editableDiv) {
            inputText = (editableDiv as HTMLElement).innerText || '';
          }
        }
      }
      
      inputText = inputText.trim();
      
      // 시작 알림
      if (inputText) {
        BdApi.UI.showToast('입력된 텍스트와 함께 대화 요약을 시작합니다...', { type: 'info' });
        console.log(`Found input text: ${inputText.substring(0, 100)}...`);
      } else {
        BdApi.UI.showToast('대화 요약을 시작합니다...', { type: 'info' });
      }
      
      const summary = await this.summarizer.summarizeChannel(channelId, inputText);
      
      // 요약 결과를 모달로 표시
      this.showSummaryModal(summary);
      
    } catch (error) {
      console.error('Error during summarization:', error);
      
      // 에러 메시지 표시
      if (error instanceof Error) {
        BdApi.UI.showToast(`요약 실패: ${error.message}`, { type: 'error' });
      } else {
        BdApi.UI.showToast('대화 요약 중 알 수 없는 오류가 발생했습니다.', { type: 'error' });
      }
      
      throw error;
    }
  }

  private async handleTranslate(channelId: string): Promise<void> {
    try {
      console.log(`Translating last message in channel: ${channelId}`);
      
      // 시작 알림
      BdApi.UI.showToast('마지막 메시지 번역을 시작합니다...', { type: 'info' });
      
      const translation = await this.translator.translateLastMessage(channelId);
      
      // 번역 결과를 모달로 표시
      this.showTranslationModal(translation);
      
    } catch (error) {
      console.error('Error during translation:', error);
      
      // 에러 메시지 표시
      if (error instanceof Error) {
        BdApi.UI.showToast(`번역 실패: ${error.message}`, { type: 'error' });
      } else {
        BdApi.UI.showToast('번역 중 알 수 없는 오류가 발생했습니다.', { type: 'error' });
      }
      
      throw error;
    }
  }

  private showTranslationModal(translation: any): void {
    const details = translation.detailedTranslation || {};
    
    // 슬랭/관용구 섹션 HTML 생성
    let slangSection = '';
    if (details.slangAndIdioms && details.slangAndIdioms.length > 0) {
      slangSection = `
        <div class="translation-details-section">
          <h3 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            슬랭 & 관용구 설명
          </h3>
          <div class="detail-list">
            ${details.slangAndIdioms.map((item: any) => `
              <div class="detail-item">
                <div class="detail-header">
                  <span class="original-term">"${item.original}"</span>
                  <span class="formality-badge ${item.formality}">${
                    item.formality === 'formal' ? '격식체' :
                    item.formality === 'informal' ? '비격식' : '슬랭'
                  }</span>
                </div>
                <div class="detail-content">
                  <div class="meaning">💡 의미: ${item.meaning}</div>
                  <div class="korean-equiv">🇰🇷 한국어 표현: "${item.koreanEquivalent}"</div>
                  <div class="usage">📝 사용법: ${item.usage}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // 약어 섹션 HTML 생성
    let abbreviationSection = '';
    if (details.abbreviations && details.abbreviations.length > 0) {
      abbreviationSection = `
        <div class="translation-details-section">
          <h3 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 4v3h5.5v12h3V7H19V4z"/>
            </svg>
            약어 & 줄임말
          </h3>
          <div class="detail-list">
            ${details.abbreviations.map((item: any) => `
              <div class="detail-item">
                <div class="detail-header">
                  <span class="abbr-term">"${item.abbr}"</span>
                  <span class="full-form">→ ${item.fullForm}</span>
                </div>
                <div class="detail-content">
                  <div class="meaning">💭 의미: ${item.meaning}</div>
                  <div class="usage">💬 일반적 사용: ${item.commonUsage}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // 문법 노트 섹션 HTML 생성
    let grammarSection = '';
    if (details.grammarNotes && details.grammarNotes.length > 0) {
      grammarSection = `
        <div class="translation-details-section">
          <h3 class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            문법 포인트
          </h3>
          <div class="detail-list">
            ${details.grammarNotes.map((item: any) => `
              <div class="detail-item">
                <div class="grammar-pattern">${item.pattern}</div>
                <div class="detail-content">
                  <div class="explanation">📖 설명: ${item.explanation}</div>
                  ${item.examples && item.examples.length > 0 ? `
                    <div class="examples">
                      <strong>예시:</strong>
                      <ul>
                        ${item.examples.map((ex: string) => `<li>${ex}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 모달 HTML 생성
    const modalHTML = `
      <div class="lm-tools-translation-modal">
        <div class="modal-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--brand-experiment, #5865f2)">
              <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
            </svg>
            번역 결과
          </h2>
          <button class="close-button" title="닫기">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <div class="translation-info">
            <div class="info-item">
              <span class="info-label">사용자:</span>
              <span class="info-value">${translation.username}</span>
            </div>
          </div>
          
          <div class="translation-section main-translation">
            <div class="section-header">
              <h3>원문</h3>
              <button class="copy-button" data-text="${translation.originalText.replace(/"/g, '&quot;')}" title="복사">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            </div>
            <div class="translation-text original-text">
              ${translation.originalText}
            </div>
          </div>
          
          <div class="translation-section main-translation">
            <div class="section-header">
              <h3>번역</h3>
              <button class="copy-button" data-text="${translation.translatedText.replace(/"/g, '&quot;')}" title="복사">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            </div>
            <div class="translation-text translated-text">
              ${translation.translatedText}
            </div>
          </div>
          
          ${slangSection}
          ${abbreviationSection}
          ${grammarSection}
        </div>
      </div>
    `;

    // 모달 스타일 추가 (기존 스타일에 추가)
    const modalStyles = `
      <style>
                .lm-tools-translation-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--background-primary, #36393f);
          border-radius: 8px;
          padding: 0;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
          animation: slideIn 0.3s ease;
          z-index: 1001;
        }
        
        .lm-tools-translation-modal .modal-header {
          background: var(--background-secondary-alt, #2f3136);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--background-modifier-accent, #4f545c);
        }
        
        .lm-tools-translation-modal .modal-header h2 {
          margin: 0;
          color: var(--header-primary, #ffffff);
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .lm-tools-translation-modal .close-button {
          background: none;
          border: none;
          color: var(--interactive-normal, #b9bbbe);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .lm-tools-translation-modal .close-button:hover {
          background: var(--background-modifier-hover, #4f545c);
          color: var(--interactive-hover, #dcddde);
        }
        
        .lm-tools-translation-modal .modal-content {
          padding: 20px;
          overflow-y: auto;
          max-height: calc(80vh - 80px);
        }
        
        .lm-tools-translation-modal .translation-info {
          background: var(--background-secondary, #2f3136);
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 20px;
          display: flex;
          gap: 20px;
        }
        
        .lm-tools-translation-modal .info-item {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .lm-tools-translation-modal .info-label {
          color: var(--text-muted, #72767d);
          font-size: 14px;
        }
        
        .lm-tools-translation-modal .info-value {
          color: var(--text-normal, #dcddde);
          font-size: 14px;
          font-weight: 500;
        }
        
        .lm-tools-translation-modal .translation-section {
          margin-bottom: 20px;
        }
        
        .lm-tools-translation-modal .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .lm-tools-translation-modal .section-header h3 {
          margin: 0;
          color: var(--header-secondary, #b9bbbe);
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .lm-tools-translation-modal .copy-button {
          background: none;
          border: none;
          color: var(--interactive-normal, #b9bbbe);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .lm-tools-translation-modal .copy-button:hover {
          background: var(--background-modifier-hover, #4f545c);
          color: var(--interactive-hover, #dcddde);
        }
        
        .lm-tools-translation-modal .translation-text {
          background: var(--background-secondary, #2f3136);
          border: 1px solid var(--background-modifier-accent, #4f545c);
          border-radius: 4px;
          padding: 16px;
          color: var(--text-normal, #dcddde);
          font-size: 16px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .lm-tools-translation-modal .main-translation {
          margin-bottom: 20px;
        }
        
        .lm-tools-translation-modal .translation-details-section {
          margin-top: 24px;
        }
        
        .lm-tools-translation-modal .section-title {
          color: var(--header-primary, #ffffff);
          font-size: 16px;
          font-weight: 600;
          margin: 24px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--background-modifier-accent, #4f545c);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .lm-tools-translation-modal .detail-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .lm-tools-translation-modal .detail-item {
          background: var(--background-secondary, #2f3136);
          border: 1px solid var(--background-modifier-accent, #4f545c);
          border-radius: 4px;
          padding: 12px;
        }
        
        .lm-tools-translation-modal .detail-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        
        .lm-tools-translation-modal .original-term,
        .lm-tools-translation-modal .abbr-term {
          color: var(--text-brand, #00aef3);
          font-weight: 600;
          font-size: 15px;
        }
        
        .lm-tools-translation-modal .formality-badge {
          background: var(--background-tertiary, #202225);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          text-transform: uppercase;
        }
        
        .lm-tools-translation-modal .formality-badge.formal {
          color: var(--text-positive, #3ba55d);
        }
        
        .lm-tools-translation-modal .formality-badge.informal {
          color: var(--text-warning, #faa61a);
        }
        
        .lm-tools-translation-modal .formality-badge.slang {
          color: var(--text-danger, #ed4245);
        }
        
        .lm-tools-translation-modal .full-form {
          color: var(--text-muted, #72767d);
          font-size: 14px;
        }
        
        .lm-tools-translation-modal .detail-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .lm-tools-translation-modal .detail-content > div {
          color: var(--text-normal, #dcddde);
        }
        
        .lm-tools-translation-modal .meaning {
          font-weight: 500;
        }
        
        .lm-tools-translation-modal .korean-equiv {
          color: var(--text-positive, #3ba55d);
        }
        
        .lm-tools-translation-modal .usage,
        .lm-tools-translation-modal .explanation {
          color: var(--text-muted, #a3a6aa);
        }
        
        .lm-tools-translation-modal .grammar-pattern {
          color: var(--text-brand, #00aef3);
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 8px;
          font-family: monospace;
        }
        
        .lm-tools-translation-modal .examples ul {
          margin: 4px 0 0 20px;
          padding: 0;
        }
        
        .lm-tools-translation-modal .examples li {
          color: var(--text-normal, #dcddde);
          margin: 4px 0;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      </style>
    `;

    // 모달 오버레이 생성
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'lm-tools-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    `;
    
    modalOverlay.innerHTML = modalStyles + modalHTML;
    document.body.appendChild(modalOverlay);

    // 이벤트 리스너 설정
    const modal = modalOverlay.querySelector('.lm-tools-translation-modal');
    const closeButton = modal?.querySelector('.close-button');
    const copyButtons = modal?.querySelectorAll('.copy-button');

    const closeModal = () => {
      modalOverlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => {
        document.body.removeChild(modalOverlay);
      }, 200);
    };

    // 닫기 버튼 이벤트
    closeButton?.addEventListener('click', closeModal);

    // 복사 버튼 이벤트
    copyButtons?.forEach(button => {
      button.addEventListener('click', () => {
        const text = button.getAttribute('data-text') || '';
        navigator.clipboard.writeText(text).then(() => {
          BdApi.UI.showToast('클립보드에 복사되었습니다!', { type: 'success' });
        });
      });
    });

    // 오버레이 클릭 시 닫기
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // ESC 키로 닫기
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }

  private showSummaryModal(summary: any): void {
    // JSON 응답 파싱
    let summaryData: { summary: string; examples?: string[] } = { summary: summary.summary };
    
    try {
      // summary가 이미 파싱된 객체인지 확인
      if (typeof summary.summary === 'object' && summary.summary.summary) {
        summaryData = summary.summary;
      } else if (typeof summary.summary === 'string') {
        // JSON 문자열인지 확인하고 파싱 시도
        const jsonMatch = summary.summary.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          summaryData = JSON.parse(jsonMatch[1]);
        } else {
          // 일반 JSON 파싱 시도
          try {
            summaryData = JSON.parse(summary.summary);
          } catch {
            // 파싱 실패시 기본값 사용
            summaryData = { summary: summary.summary };
          }
        }
      }
    } catch (error) {
      console.error('Error parsing summary JSON:', error);
    }

    // 모달 컨테이너 생성
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'lm-tools-modal-overlay';
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.className = 'lm-tools-summary-modal';
    modal.style.cssText = `
      background-color: var(--background-primary, #36393f);
      border-radius: 8px;
      padding: 24px;
      max-width: 700px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
      color: var(--text-normal, #dcddde);
      font-family: Whitney, "Helvetica Neue", Helvetica, Arial, sans-serif;
      animation: slideIn 0.3s ease;
    `;

    // 예시 대답 HTML 생성
    let examplesHtml = '';
    if (summaryData.examples && Array.isArray(summaryData.examples) && summaryData.examples.length > 0) {
      examplesHtml = `
        <div style="margin-top: 20px;">
          <h3 style="
            color: var(--header-secondary, #b9bbbe);
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            추천 답변 예시
          </h3>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${summaryData.examples.map((example, index) => `
              <div class="example-item" data-example="${example.replace(/"/g, '&quot;')}" style="
                background-color: var(--background-secondary-alt, #292b2f);
                padding: 12px 16px;
                border-radius: 6px;
                border: 2px solid transparent;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
              ">
                <div style="display: flex; align-items: start; gap: 10px;">
                  <span style="
                    background-color: var(--brand-experiment, #5865f2);
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    padding: 2px 6px;
                    border-radius: 4px;
                    flex-shrink: 0;
                  ">${index + 1}</span>
                  <p style="margin: 0; line-height: 1.4; flex: 1;">
                    ${example}
                  </p>
                  <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    flex-shrink: 0;
                  ">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: var(--header-primary, #ffffff); font-size: 24px; font-weight: 600; display: flex; align-items: center; gap: 10px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--brand-experiment, #5865f2)">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
          대화 요약
        </h2>
        <button class="close-button" style="
          background: transparent;
          border: none;
          color: var(--interactive-normal, #b9bbbe);
          font-size: 28px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
        ">×</button>
      </div>
      
      <div style="
        background-color: var(--background-secondary, #2f3136);
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 16px;
        border-left: 4px solid var(--brand-experiment, #5865f2);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      ">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-muted, #72767d)">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span style="font-size: 13px; color: var(--text-muted, #72767d); font-weight: 500;">
            메시지 ${summary.messageCount}개 · ${summary.timeRange}
          </span>
        </div>
        <div style="line-height: 1.6; font-size: 15px; color: var(--text-normal, #dcddde);">
          ${summaryData.summary}
        </div>
      </div>

      ${examplesHtml}
      
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <button class="copy-summary-button" style="
          background-color: var(--brand-experiment, #5865f2);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          요약 복사
        </button>
        <button class="close-modal-button" style="
          background-color: var(--background-secondary, #2f3136);
          color: var(--text-normal, #dcddde);
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        ">닫기</button>
      </div>
    `;

    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      .lm-tools-summary-modal .close-button:hover {
        background-color: var(--background-modifier-hover, #4f545c) !important;
        color: var(--interactive-hover, #dcddde) !important;
      }
      
      .lm-tools-summary-modal .copy-summary-button:hover {
        background-color: var(--brand-experiment-560, #4752c4) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
      }
      
      .lm-tools-summary-modal .close-modal-button:hover {
        background-color: var(--background-modifier-hover, #4f545c) !important;
      }
      
      .lm-tools-summary-modal .example-item:hover {
        border-color: var(--brand-experiment, #5865f2) !important;
        background-color: var(--background-modifier-hover, #4f545c) !important;
      }
      
      .lm-tools-summary-modal .example-item:hover .copy-icon {
        opacity: 1 !important;
      }
      
      .lm-tools-summary-modal .example-item::after {
        content: "클릭하여 복사";
        position: absolute;
        bottom: 4px;
        right: 8px;
        font-size: 11px;
        color: var(--text-muted, #72767d);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .lm-tools-summary-modal .example-item:hover::after {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    // 이벤트 리스너
    const closeModal = () => {
      modalOverlay.style.animation = 'fadeIn 0.2s ease reverse';
      setTimeout(() => {
        document.body.removeChild(modalOverlay);
        document.head.removeChild(style);
      }, 200);
    };

    // 닫기 버튼들
    modal.querySelectorAll('.close-button, .close-modal-button').forEach(button => {
      button.addEventListener('click', closeModal);
    });

    // 요약 복사 버튼
    const copySummaryButton = modal.querySelector('.copy-summary-button') as HTMLButtonElement;
    if (copySummaryButton) {
      copySummaryButton.addEventListener('click', () => {
        const fullText = `대화 요약 (${summary.messageCount}개 메시지, ${summary.timeRange})\n\n${summaryData.summary}${
          summaryData.examples ? '\n\n추천 답변 예시:\n' + summaryData.examples.map((ex, i) => `${i + 1}. ${ex}`).join('\n') : ''
        }`;
        navigator.clipboard.writeText(fullText).then(() => {
          BdApi.UI.showToast('요약이 클립보드에 복사되었습니다!', { type: 'success' });
        }).catch(() => {
          BdApi.UI.showToast('복사에 실패했습니다.', { type: 'error' });
        });
      });
    }

    // 예시 항목 클릭 이벤트
    modal.querySelectorAll('.example-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const example = (item as HTMLElement).dataset.example;
        if (example) {
          navigator.clipboard.writeText(example).then(() => {
            BdApi.UI.showToast('예시 답변이 클립보드에 복사되었습니다!', { type: 'success' });
            
            // 시각적 피드백
            const originalBorder = (item as HTMLElement).style.borderColor;
            (item as HTMLElement).style.borderColor = 'var(--status-positive, #43b581)';
            setTimeout(() => {
              (item as HTMLElement).style.borderColor = originalBorder;
            }, 500);
          }).catch(() => {
            BdApi.UI.showToast('복사에 실패했습니다.', { type: 'error' });
          });
        }
      });
    });

    // 오버레이 클릭으로 닫기
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // ESC 키로 닫기
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }

  getSettingsPanel(): React.ReactElement {
    // BetterDiscord의 기본 설정 패널 생성
    const basePanel = BdApi.UI.buildSettingsPanel({
      settings: this.settingsManager.updateSettingsConfig(),
      onChange: (category: string, id: string, value: any) => {
        console.log(`Setting changed - Category: ${category}, ID: ${id}, Value:`, value);
        this.settingsManager.set(id as any, value);
        this.onSettingChanged(id, value);
      }
    });

    // 커스텀 프롬프트 설정 UI를 추가하기 위한 래퍼 컴포넌트
    const SettingsPanelWrapper = () => {
      const [defaultPrompt, setDefaultPrompt] = BdApi.React.useState(
        this.settingsManager.get('defaultPrompt') || ''
      );
      const [currentChannelId] = BdApi.React.useState(this.getCurrentChannelId());

      const handleDefaultPromptChange = (value: string) => {
        setDefaultPrompt(value);
        this.settingsManager.setDefaultPrompt(value);
      };

      return (
        <div>
          {/* 기본 설정 패널 */}
          {basePanel}
          
          {/* 프롬프트 설정 섹션 */}
          <div style={{
            marginTop: '20px',
            padding: '20px',
            backgroundColor: 'var(--background-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--background-modifier-accent)'
          }}>
            <h2 style={{
              color: 'var(--header-primary)',
              marginBottom: '16px',
              fontSize: '20px',
              fontWeight: 600
            }}>
              프롬프트 설정
            </h2>
            
            {/* 기본 프롬프트 편집기 */}
            <PromptEditor
              value={defaultPrompt}
              onChange={handleDefaultPromptChange}
              label="기본 프롬프트"
              note="모든 채널에서 사용할 기본 프롬프트입니다. 비워두면 내장된 기본 프롬프트를 사용합니다."
              showExampleButton={true}
            />
            
            {/* 채널별 프롬프트 관리자 */}
            <div style={{ marginTop: '30px' }}>
              <ChannelPromptManager
                settingsManager={this.settingsManager}
                currentChannelId={currentChannelId || undefined}
              />
            </div>
          </div>
        </div>
      );
    };

    return BdApi.React.createElement(SettingsPanelWrapper);
  }

  private onSettingChanged(id: string, value: any): void {
    // 특정 설정 변경에 대한 추가 로직
    switch (id) {
      case 'enabled':
        if (value) {
          console.log('Plugin enabled');
        } else {
          console.log('Plugin disabled');
        }
        break;
      case 'theme':
        console.log(`Theme changed to: ${value}`);
        // 테마 변경 로직 추가
        break;
      case 'apiProvider':
        console.log(`API Provider changed to: ${value}`);
        this.validateApiConfiguration();
        break;
      case 'openaiApiKey':
      case 'anthropicApiKey':
        console.log(`API Key updated for: ${id}`);
        this.validateApiConfiguration();
        break;
      case 'openaiModel':
      case 'anthropicModel':
        console.log(`Model changed: ${id} = ${value}`);
        break;
      default:
        break;
    }
  }

  private validateApiConfiguration(): void {
    if (this.settingsManager.isApiKeyConfigured()) {
      const provider = this.settingsManager.getCurrentProvider();
      const model = this.settingsManager.getCurrentModel();
      console.log(`API configuration valid - Provider: ${provider}, Model: ${model}`);
    } else {
      console.warn('API key not configured. Please set your API key in settings.');
    }
  }

  // API 메서드들 - 향후 번역 및 답장 추천 기능에 사용될 예정
  public getApiConfiguration() {
    return {
      provider: this.settingsManager.getCurrentProvider(),
      apiKey: this.settingsManager.getCurrentApiKey(),
      model: this.settingsManager.getCurrentModel(),
      endpoint: this.settingsManager.getApiEndpoint(),
      maxTokens: this.settingsManager.get('maxTokens'),
      temperature: this.settingsManager.get('temperature')
    };
  }

  public isApiReady(): boolean {
    return this.settingsManager.isApiKeyConfigured();
  }
}
