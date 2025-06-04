import { SettingsManager, EXAMPLE_PROMPTS } from "./settings";

// React 타입 임포트
import type { ComponentType, ReactElement } from 'react';

// BdApi 전역 변수 선언
declare const BdApi: {
  React: {
    useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    useEffect(effect: () => void | (() => void), deps?: any[]): void;
    createElement<P>(
      type: ComponentType<P> | string,
      props?: P & { key?: string | number | null },
      ...children: any[]
    ): ReactElement;
    Fragment: ComponentType<{ children?: any }>;
  };
  UI: {
    showToast(message: string, options?: { type?: 'info' | 'success' | 'error' | 'warning' }): void;
  };
  Webpack: {
    getModule(filter: Function): any;
  };
};

// React를 BdApi에서 가져오기
const React = BdApi.React;

interface MyComponentProps {
  disabled?: boolean;
}

export default function MyComponent({ disabled = false }: MyComponentProps): React.ReactElement {
  const [isDisabled, setDisabled] = BdApi.React.useState(disabled);
  
  return (
    <button className="my-component" disabled={isDisabled}>
      Hello World from JSX!
    </button>
  );
}

interface SummarizeButtonProps {
  channelId: string;
  onSummarize?: (channelId: string) => void;
  settingsManager?: SettingsManager;
}

export function SummarizeButton({ channelId, onSummarize, settingsManager }: SummarizeButtonProps): React.ReactElement {
  const [isLoading, setIsLoading] = BdApi.React.useState(false);
  const [showPromptModal, setShowPromptModal] = BdApi.React.useState(false);

  const handleClick = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[SummarizeButton] Click detected, channelId:', channelId);
    
    if (isLoading) {
      console.log('[SummarizeButton] Already loading, ignoring click');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('[SummarizeButton] Starting summarization...');
      if (onSummarize) {
        await onSummarize(channelId);
      }
      BdApi.UI.showToast('대화 요약이 완료되었습니다.', { type: 'success' });
    } catch (error) {
      console.error('[SummarizeButton] Error during summarization:', error);
      BdApi.UI.showToast('대화 요약 중 오류가 발생했습니다.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRightClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[SummarizeButton] Right click detected - opening prompt modal for channel:', channelId);
    
    if (!settingsManager) {
      console.error('[SummarizeButton] No settings manager provided');
      BdApi.UI.showToast('설정 관리자를 찾을 수 없습니다.', { type: 'error' });
      return;
    }
    
    setShowPromptModal(true);
  };

  return (
    <>
      <button
        className={`summarize-button ${isLoading ? 'loading' : ''}`}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        disabled={isLoading}
        title="대화 요약 (우클릭: 프롬프트 설정)"
        type="button"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '8px',
          margin: '0 4px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          color: 'var(--interactive-normal, #b9bbbe)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          position: 'relative',
          width: '32px',
          height: '32px',
          minWidth: '32px',
          flexShrink: 0,
          opacity: isLoading ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'var(--background-modifier-hover, #4f545c)';
            e.currentTarget.style.color = 'var(--interactive-hover, #dcddde)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--interactive-normal, #b9bbbe)';
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{
            display: isLoading ? 'none' : 'block'
          }}
        >
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
        </svg>
        {isLoading && (
          <span
            className="loading-spinner"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'spin 1s linear infinite',
              fontSize: '12px'
            }}
          >
            ⟳
          </span>
        )}
      </button>
      
      {showPromptModal && settingsManager && (
        <ChannelPromptModal
          channelId={channelId}
          settingsManager={settingsManager}
          onClose={() => setShowPromptModal(false)}
        />
      )}
    </>
  );
}

interface TranslateButtonProps {
  channelId: string;
  onTranslate?: (channelId: string) => void;
}

export function TranslateButton({ channelId, onTranslate }: TranslateButtonProps): React.ReactElement {
  const [isLoading, setIsLoading] = BdApi.React.useState(false);

  const handleClick = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[TranslateButton] Click detected, channelId:', channelId);
    
    if (isLoading) {
      console.log('[TranslateButton] Already loading, ignoring click');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('[TranslateButton] Starting translation...');
      if (onTranslate) {
        await onTranslate(channelId);
      }
      BdApi.UI.showToast('번역이 완료되었습니다.', { type: 'success' });
    } catch (error) {
      console.error('[TranslateButton] Error during translation:', error);
      BdApi.UI.showToast('번역 중 오류가 발생했습니다.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`translate-button ${isLoading ? 'loading' : ''}`}
      onClick={handleClick}
      disabled={isLoading}
      title="마지막 대화 번역"
      type="button"
      style={{
        background: 'transparent',
        border: 'none',
        padding: '8px',
        margin: '0 4px',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        color: 'var(--interactive-normal, #b9bbbe)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        position: 'relative',
        width: '32px',
        height: '32px',
        minWidth: '32px',
        flexShrink: 0,
        opacity: isLoading ? 0.5 : 1
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = 'var(--background-modifier-hover, #4f545c)';
          e.currentTarget.style.color = 'var(--interactive-hover, #dcddde)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--interactive-normal, #b9bbbe)';
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{
          display: isLoading ? 'none' : 'block'
        }}
      >
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
      {isLoading && (
        <span
          className="loading-spinner"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'spin 1s linear infinite',
            fontSize: '12px'
          }}
        >
          ⟳
        </span>
      )}
    </button>
  );
}

interface ChannelPromptModalProps {
  channelId: string;
  settingsManager: SettingsManager;
  onClose: () => void;
}

function ChannelPromptModal({ channelId, settingsManager, onClose }: ChannelPromptModalProps): React.ReactElement {
  const [prompt, setPrompt] = BdApi.React.useState(settingsManager.getChannelPrompt(channelId) || '');
  const [isSaving, setIsSaving] = BdApi.React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      settingsManager.setChannelPrompt(channelId, prompt);
      BdApi.UI.showToast('채널 프롬프트가 저장되었습니다.', { type: 'success' });
      onClose();
    } catch (error) {
      console.error('[ChannelPromptModal] Error saving prompt:', error);
      BdApi.UI.showToast('프롬프트 저장 중 오류가 발생했습니다.', { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    settingsManager.setChannelPrompt(channelId, '');
    setPrompt('');
    BdApi.UI.showToast('채널 프롬프트가 삭제되었습니다.', { type: 'info' });
  };

  // 모달 외부 클릭 시 닫기
  const handleOverlayClick = (e: any) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ESC 키로 닫기
  BdApi.React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="lm-tools-modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        className="lm-tools-prompt-modal"
        style={{
          backgroundColor: 'var(--background-primary, #36393f)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.24)',
          animation: 'slideIn 0.3s ease'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            color: 'var(--header-primary, #ffffff)',
            fontSize: '20px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--brand-experiment, #5865f2)">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            채널 프롬프트 설정
          </h2>
          <div style={{
            color: 'var(--text-muted, #72767d)',
            fontSize: '14px'
          }}>
            채널 ID: {channelId}
          </div>
        </div>

        <PromptEditor
          value={prompt}
          onChange={setPrompt}
          label="이 채널의 프롬프트"
          note="이 채널에서만 사용할 커스텀 프롬프트를 설정합니다. 비워두면 기본 프롬프트를 사용합니다."
          showExampleButton={true}
        />

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end',
          marginTop: '20px'
        }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--button-danger-background, #ed4245)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'opacity 0.2s ease',
              marginRight: 'auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            프롬프트 삭제
          </button>
          
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--button-secondary-background, #4f545c)',
              color: 'var(--text-normal, #dcddde)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            취소
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--button-positive-background, #3ba55c)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              opacity: isSaving ? 0.5 : 1
            }}
            onMouseEnter={(e) => !isSaving && (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => !isSaving && (e.currentTarget.style.opacity = '1')}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  note?: string;
  showExampleButton?: boolean;
  onLoadExample?: (example: string) => void;
}

export function PromptEditor({
  value,
  onChange,
  placeholder = "프롬프트를 입력하세요...",
  label = "프롬프트",
  note,
  showExampleButton = true,
  onLoadExample
}: PromptEditorProps): React.ReactElement {
  const [showExamples, setShowExamples] = BdApi.React.useState(false);
  
  const handleExampleSelect = (exampleKey: keyof typeof EXAMPLE_PROMPTS) => {
    const example = EXAMPLE_PROMPTS[exampleKey];
    onChange(example);
    setShowExamples(false);
    if (onLoadExample) {
      onLoadExample(example);
    }
    BdApi.UI.showToast('예제 프롬프트를 불러왔습니다.', { type: 'success' });
  };

  return (
    <div className="prompt-editor" style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '8px' }}>
        <label style={{
          color: 'var(--header-primary)',
          fontWeight: 600,
          fontSize: '16px',
          display: 'block',
          marginBottom: '4px'
        }}>
          {label}
        </label>
        {note && (
          <div style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '8px'
          }}>
            {note}
          </div>
        )}
      </div>
      
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '10px',
            backgroundColor: 'var(--input-background)',
            color: 'var(--text-normal)',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            resize: 'vertical',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        />
        
        {showExampleButton && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => setShowExamples(!showExamples)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--brand-experiment)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              예제 프롬프트 {showExamples ? '닫기' : '보기'}
            </button>
            
            {showExamples && (
              <div style={{
                marginTop: '8px',
                padding: '12px',
                backgroundColor: 'var(--background-secondary)',
                borderRadius: '4px',
                border: '1px solid var(--background-modifier-accent)'
              }}>
                <div style={{ marginBottom: '8px', color: 'var(--header-secondary)', fontWeight: 600 }}>
                  예제 프롬프트 선택:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleExampleSelect('technical')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--button-secondary-background)',
                      color: 'var(--text-normal)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    기술 토론
                  </button>
                  <button
                    onClick={() => handleExampleSelect('default')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--button-secondary-background)',
                      color: 'var(--text-normal)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    기본값
                  </button>
                  <button
                    onClick={() => handleExampleSelect('casual')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--button-secondary-background)',
                      color: 'var(--text-normal)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    일상 대화
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        사용 가능한 변수: {"{{username}}"} (현재 사용자 이름), {"{{conversation}}"} (대화 내용)
      </div>
    </div>
  );
}

interface ChannelPromptManagerProps {
  settingsManager: SettingsManager;
  currentChannelId?: string;
}

export function ChannelPromptManager({
  settingsManager,
  currentChannelId
}: ChannelPromptManagerProps): React.ReactElement {
  const [channelPrompts, setChannelPrompts] = BdApi.React.useState(settingsManager.getAll().channelPrompts || {});
  const [editingChannel, setEditingChannel] = BdApi.React.useState<string | null>(null);
  const [tempPrompt, setTempPrompt] = BdApi.React.useState('');

  const handleEdit = (channelId: string) => {
    setEditingChannel(channelId);
    setTempPrompt(channelPrompts[channelId] || '');
  };

  const handleSave = (channelId: string) => {
    settingsManager.setChannelPrompt(channelId, tempPrompt);
    setChannelPrompts(settingsManager.getAll().channelPrompts);
    setEditingChannel(null);
    BdApi.UI.showToast('채널 프롬프트가 저장되었습니다.', { type: 'success' });
  };

  const handleDelete = (channelId: string) => {
    settingsManager.setChannelPrompt(channelId, '');
    setChannelPrompts(settingsManager.getAll().channelPrompts);
    BdApi.UI.showToast('채널 프롬프트가 삭제되었습니다.', { type: 'info' });
  };

  const handleAddCurrent = () => {
    console.log('[ChannelPromptManager] handleAddCurrent called with channelId:', currentChannelId);
    if (currentChannelId) {
      console.log('[ChannelPromptManager] Setting editing channel to:', currentChannelId);
      handleEdit(currentChannelId);
    } else {
      console.log('[ChannelPromptManager] No current channel ID available');
      BdApi.UI.showToast('현재 채널을 찾을 수 없습니다. 채널에서 이 기능을 사용해주세요.', { type: 'error' });
    }
  };

  const channelIds = Object.keys(channelPrompts).filter(id => channelPrompts[id]);

  return (
    <div className="channel-prompt-manager">
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--header-primary)', marginBottom: '8px' }}>채널별 프롬프트 관리</h3>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
          특정 채널에서만 사용할 커스텀 프롬프트를 설정할 수 있습니다.
        </div>
        
        {currentChannelId && (
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('[ChannelPromptManager] Add current channel button clicked, channelId:', currentChannelId);
              handleAddCurrent();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--button-positive-background)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            현재 채널에 프롬프트 추가
          </button>
        )}
      </div>

      {channelIds.length === 0 ? (
        <div style={{
          padding: '20px',
          backgroundColor: 'var(--background-secondary)',
          borderRadius: '4px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          아직 설정된 채널별 프롬프트가 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {channelIds.map(channelId => (
            <div
              key={channelId}
              style={{
                padding: '12px',
                backgroundColor: 'var(--background-secondary)',
                borderRadius: '4px',
                border: '1px solid var(--background-modifier-accent)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: editingChannel === channelId ? '12px' : '0'
              }}>
                <div>
                  <strong style={{ color: 'var(--header-primary)' }}>채널 ID: {channelId}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editingChannel === channelId ? (
                    <>
                      <button
                        onClick={() => handleSave(channelId)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'var(--button-positive-background)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingChannel(null)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'var(--button-secondary-background)',
                          color: 'var(--text-normal)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(channelId)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'var(--button-secondary-background)',
                          color: 'var(--text-normal)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleDelete(channelId)}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: 'var(--button-danger-background)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {editingChannel === channelId && (
                <div>
                  <textarea
                    value={tempPrompt}
                    onChange={(e) => setTempPrompt(e.target.value)}
                    placeholder="이 채널에서 사용할 프롬프트를 입력하세요..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '8px',
                      backgroundColor: 'var(--input-background)',
                      color: 'var(--text-normal)',
                      border: '1px solid var(--input-border)',
                      borderRadius: '4px',
                      resize: 'vertical',
                      fontFamily: 'monospace',
                      fontSize: '13px'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
