import React from "react";

declare const BdApi: {
  React: typeof React;
  UI: {
    showToast(message: string, options?: { type?: 'info' | 'success' | 'error' | 'warning' }): void;
  };
};

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
}

export function SummarizeButton({ channelId, onSummarize }: SummarizeButtonProps): React.ReactElement {
  const [isLoading, setIsLoading] = BdApi.React.useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (onSummarize) {
        await onSummarize(channelId);
      }
      BdApi.UI.showToast('대화 요약이 완료되었습니다.', { type: 'success' });
    } catch (error) {
      BdApi.UI.showToast('대화 요약 중 오류가 발생했습니다.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`summarize-button ${isLoading ? 'loading' : ''}`}
      onClick={handleClick}
      disabled={isLoading}
      title="대화 요약"
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
  );
}
