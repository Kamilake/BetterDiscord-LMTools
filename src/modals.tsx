import { TranslationResult } from "./translator";
import { MessageSummary } from "./types/betterdiscord";

declare const BdApi: {
  React: {
    useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    useEffect(effect: () => void | (() => void), deps?: any[]): void;
    createElement: any;
  };
  UI: {
    showToast(message: string, options?: { type?: 'info' | 'success' | 'error' | 'warning' }): void;
  };
};
const React = BdApi.React;

interface SummaryData {
  summary: string;
  suggested_replies?: string[];
}

interface SummaryModalProps {
  summary: MessageSummary & { summary: any };
  onClose: () => void;
}

export function SummaryModal({ summary, onClose }: SummaryModalProps): React.ReactElement {
  const [summaryData, setSummaryData] = React.useState<SummaryData>({ summary: '' });

  React.useEffect(() => {
    // JSON 응답 파싱
    let data: SummaryData = { summary: summary.summary };
    
    try {
      if (typeof summary.summary === 'object' && summary.summary.summary) {
        data = summary.summary;
      } else if (typeof summary.summary === 'string') {
        const jsonMatch = summary.summary.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[1]);
        } else {
          try {
            data = JSON.parse(summary.summary);
          } catch {
            data = { summary: summary.summary };
          }
        }
      }
    } catch (error) {
      console.error('Error parsing summary JSON:', error);
    }
    
    setSummaryData(data);
  }, [summary]);

  const handleCopySummary = () => {
    const fullText = `대화 요약 (${summary.messageCount}개 메시지, ${summary.timeRange})\n\n${summaryData.summary}${
      summaryData.suggested_replies ? '\n\n추천 답변 예시:\n' + summaryData.suggested_replies.map((ex: string, i: number) => `${i + 1}. ${ex}`).join('\n') : ''
    }`;
    navigator.clipboard.writeText(fullText).then(() => {
      BdApi.UI.showToast('요약이 클립보드에 복사되었습니다!', { type: 'success' });
    }).catch(() => {
      BdApi.UI.showToast('복사에 실패했습니다.', { type: 'error' });
    });
  };

  const handleCopyExample = (example: string) => {
    navigator.clipboard.writeText(example).then(() => {
      BdApi.UI.showToast('예시 답변이 클립보드에 복사되었습니다!', { type: 'success' });
    }).catch(() => {
      BdApi.UI.showToast('복사에 실패했습니다.', { type: 'error' });
    });
  };

  // ESC 키로 닫기
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="lm-tools-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lm-tools-summary-modal">
        <div className="modal-header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--brand-experiment, #5865f2)">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            대화 요약
          </h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="summary-box">
            <div className="summary-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-muted, #72767d)">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>메시지 {summary.messageCount}개 · {summary.timeRange}</span>
            </div>
            
            <div className="summary-content">
              {summaryData.summary}
            </div>
          </div>

          {summaryData.suggested_replies && summaryData.suggested_replies.length > 0 && (
            <div className="examples-section">
              <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                추천 답변 예시
              </h3>
              <div className="examples-list">
                {summaryData.suggested_replies.map((example: string, index: number) => (
                  <div
                    key={index}
                    className="example-item"
                    onClick={() => handleCopyExample(example)}
                  >
                    <span className="example-number">{index + 1}</span>
                    <p>{example}</p>
                    <svg className="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="button-primary" onClick={handleCopySummary}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            요약 복사
          </button>
          <button className="button-secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

interface TranslationModalProps {
  translation: TranslationResult;
  onClose: () => void;
}

export function TranslationModal({ translation, onClose }: TranslationModalProps): React.ReactElement {
  const details = translation.detailedTranslation || {
    originalLastMessage: translation.originalText,
    translatedLastMessage: translation.translatedText,
    slangAndIdioms: [],
    abbreviations: [],
    grammarNotes: []
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      BdApi.UI.showToast('클립보드에 복사되었습니다!', { type: 'success' });
    });
  };

  // ESC 키로 닫기
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="lm-tools-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lm-tools-translation-modal">
        <div className="modal-header">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--brand-experiment, #5865f2)">
              <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
            </svg>
            번역 결과
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="currentColor" d="M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z"/>
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <div className="translation-info">
            <div className="info-item">
              <span className="info-label">사용자:</span>
              <span className="info-value">{translation.username}</span>
            </div>
          </div>
          
          <TranslationSection 
            title="원문" 
            text={translation.originalText} 
            onCopy={() => handleCopy(translation.originalText)}
          />
          
          <TranslationSection 
            title="번역" 
            text={translation.translatedText} 
            onCopy={() => handleCopy(translation.translatedText)}
          />
          
          {details.slangAndIdioms && details.slangAndIdioms.length > 0 && (
            <SlangSection items={details.slangAndIdioms} />
          )}
          
          {details.abbreviations && details.abbreviations.length > 0 && (
            <AbbreviationSection items={details.abbreviations} />
          )}
          
          {details.grammarNotes && details.grammarNotes.length > 0 && (
            <GrammarSection items={details.grammarNotes} />
          )}
        </div>
      </div>
    </div>
  );
}

// 하위 컴포넌트들
function TranslationSection({ title, text, onCopy }: { title: string; text: string; onCopy: () => void }) {
  return (
    <div className="translation-section main-translation">
      <div className="section-header">
        <h3>{title}</h3>
        <button className="copy-button" onClick={onCopy} title="복사">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        </button>
      </div>
      <div className={`translation-text ${title === '원문' ? 'original-text' : 'translated-text'}`}>
        {text}
      </div>
    </div>
  );
}

function SlangSection({ items }: { items: any[] }) {
  return (
    <div className="translation-details-section">
      <h3 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        </svg>
        슬랭 & 관용구 설명
      </h3>
      <div className="detail-list">
        {items.map((item, index) => (
          <div key={index} className="detail-item">
            <div className="detail-header">
              <span className="original-term">"{item.original}"</span>
              <span className={`formality-badge ${item.formality}`}>
                {item.formality === 'formal' ? '격식체' :
                 item.formality === 'informal' ? '비격식' : '슬랭'}
              </span>
            </div>
            <div className="detail-content">
              <div className="meaning">💡 의미: {item.meaning}</div>
              <div className="korean-equiv">🇰🇷 한국어 표현: "{item.koreanEquivalent}"</div>
              <div className="usage">📝 사용법: {item.usage}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbbreviationSection({ items }: { items: any[] }) {
  return (
    <div className="translation-details-section">
      <h3 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5 4v3h5.5v12h3V7H19V4z"/>
        </svg>
        약어 & 줄임말
      </h3>
      <div className="detail-list">
        {items.map((item, index) => (
          <div key={index} className="detail-item">
            <div className="detail-header">
              <span className="abbr-term">"{item.abbr}"</span>
              <span className="full-form">→ {item.fullForm}</span>
            </div>
            <div className="detail-content">
              <div className="meaning">💭 의미: {item.meaning}</div>
              <div className="usage">💬 일반적 사용: {item.commonUsage}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrammarSection({ items }: { items: any[] }) {
  return (
    <div className="translation-details-section">
      <h3 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        문법 포인트
      </h3>
      <div className="detail-list">
        {items.map((item, index) => (
          <div key={index} className="detail-item">
            <div className="grammar-pattern">{item.pattern}</div>
            <div className="detail-content">
              <div className="explanation">📖 설명: {item.explanation}</div>
              {item.examples && item.examples.length > 0 && (
                <div className="examples">
                  <strong>예시:</strong>
                  <ul>
                    {item.examples.map((ex: string, i: number) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
