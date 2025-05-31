import { SettingConfig } from "./types/betterdiscord";

declare const BdApi: import("./types/betterdiscord").BdApi;

export interface PluginSettings {
  enabled: boolean;
  autoSave: boolean;
  theme: 'dark' | 'light' | 'auto';
  apiProvider: 'openai' | 'anthropic';
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  anthropicModel: string;
  maxTokens: number;
  temperature: number;
  messageLimit: number;
  defaultPrompt: string;
  channelPrompts: Record<string, string>;
}

export const defaultSettings: PluginSettings = {
  enabled: true,
  autoSave: true,
  theme: 'auto',
  apiProvider: 'openai',
  openaiApiKey: '',
  openaiModel: 'gpt-4.1-nano',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-5-haiku-latest',
  maxTokens: 2048,
  temperature: 0.7,
  messageLimit: 20,
  defaultPrompt: '',
  channelPrompts: {}
};

// 하드코딩된 기본 프롬프트 (사용자가 아무것도 설정하지 않았을 때 사용)
export const HARDCODED_DEFAULT_PROMPT = `다음은 Discord 채팅 대화입니다. 이 대화를 한국어로 간결하고 이해하기 쉽게 요약해 주세요:

주요 요구사항:
1. 대화의 핵심 주제와 내용을 파악하여 요약
2. 중요한 의견이나 결정사항이 있다면 포함
3. 참여자들의 주요 관점이나 의견 차이가 있다면 언급
4. 3-5문장 정도의 간결한 요약
5. 불필요한 인사말이나 짧은 반응은 제외

답장 요구사항:
1. 답장이란, 대화의 흐름에 맞춰 작성된 {{username}}의 입장에서 하는 대답입니다.
2. 마지막 대화에 대한 적절한 반응을 작성

응답 형식:
\`\`\`json
{
  "summary": "여기에 요약 내용이 들어갑니다.",
  "examples": [
    "예시 대답 1",
    "예시 대답 2",
    "예시 대답 3"
  ]
}
\`\`\`

대화 내용:
\`\`\`
{{conversation}}
\`\`\``;

// 예제 프롬프트들
export const EXAMPLE_PROMPTS = {
  technical: `다음은 Discord 채팅 대화입니다. 이 대화를 한국어로 간결하고 이해하기 쉽게 요약해 주세요:

주요 요구사항:
1. 대화의 핵심 주제와 내용을 파악하여 요약
2. 중요한 의견이나 결정사항이 있다면 포함
3. 참여자들의 주요 관점이나 의견 차이가 있다면 언급
4. 3-5문장 정도의 간결한 요약
5. 불필요한 인사말이나 짧은 반응은 제외

답장 요구사항:
1. 답장이란, 대화의 흐름에 맞춰 작성된 {{username}}의 입장에서 하는 대답입니다.
2. 마지막 대화에 대한 적절한 반응을 작성

응답 형식:
\`\`\`json
{
  "summary": "여기에 요약 내용이 들어갑니다.",
  "examples": [
    "예시 대답 1",
    "예시 대답 2",
    "예시 대답 3"
  ]
}
\`\`\`

대화 내용:
\`\`\`
{{conversation}}
\`\`\``,
  
  default: `다음은 Discord 채팅 대화입니다. 이 대화를 한국어로 간결하고 이해하기 쉽게 요약해 주세요:

주요 요구사항:
1. 대화의 핵심 주제와 내용을 파악하여 요약
2. 중요한 의견이나 결정사항이 있다면 포함
3. 참여자들의 주요 관점이나 의견 차이가 있다면 언급
4. 3-5문장 정도의 간결한 요약
5. 불필요한 인사말이나 짧은 반응은 제외

답장 요구사항:
1. 답장이란, 대화의 흐름에 맞춰 작성된 {{username}}의 입장에서 하는 대답입니다.
2. 마지막 대화에 대한 적절한 반응을 작성

응답 형식:
\`\`\`json
{
  "summary": "여기에 요약 내용이 들어갑니다.",
  "examples": [
    "예시 대답 1",
    "예시 대답 2",
    "예시 대답 3"
  ]
}
\`\`\`

대화 내용:
\`\`\`
{{conversation}}
\`\`\``,
  
  casual: `다음은 Discord 채팅 대화입니다. 이 대화를 한국어로 간결하고 이해하기 쉽게 요약해 주세요:

주요 요구사항:
1. 대화의 핵심 주제와 내용을 파악하여 요약
2. 중요한 의견이나 결정사항이 있다면 포함
3. 참여자들의 주요 관점이나 의견 차이가 있다면 언급
4. 3-5문장 정도의 간결한 요약
5. 불필요한 인사말이나 짧은 반응은 제외

답장 요구사항:
1. 답장이란, 대화의 흐름에 맞춰 작성된 {{username}}의 입장에서 하는 대답입니다.
2. 마지막 대화에 대한 적절한 반응을 작성

응답 형식:
\`\`\`json
{
  "summary": "여기에 요약 내용이 들어갑니다.",
  "examples": [
    "예시 대답 1",
    "예시 대답 2",
    "예시 대답 3"
  ]
}
\`\`\`

대화 내용:
\`\`\`
{{conversation}}
\`\`\``
};

export const settingsConfig: SettingConfig[] = [
  {
    type: 'switch',
    id: 'enabled',
    name: '플러그인 활성화',
    note: '플러그인의 전체적인 활성화 상태를 제어합니다.',
    value: true
  },
  {
    type: 'category',
    id: 'general',
    name: '일반 설정',
    collapsible: true,
    shown: true,
    settings: [
      {
        type: 'switch',
        id: 'autoSave',
        name: '자동 저장',
        note: '설정 변경 시 자동으로 저장합니다.',
        value: true
      },
      {
        type: 'dropdown',
        id: 'theme',
        name: '테마',
        note: 'UI 테마를 선택하세요.',
        value: 'auto',
        options: [
          { label: '자동', value: 'auto' },
          { label: '다크', value: 'dark' },
          { label: '라이트', value: 'light' }
        ]
      }
    ]
  },
  {
    type: 'category',
    id: 'api',
    name: 'API 설정',
    collapsible: true,
    shown: true,
    settings: [
      {
        type: 'dropdown',
        id: 'apiProvider',
        name: 'API 공급자',
        note: '사용할 언어 모델 API 공급자를 선택하세요.',
        value: 'openai',
        options: [
          { label: 'OpenAI', value: 'openai' },
          { label: 'Anthropic', value: 'anthropic' }
        ]
      },
      {
        type: 'text',
        id: 'openaiApiKey',
        name: 'OpenAI API 키',
        note: 'OpenAI API 키를 입력하세요. (sk-...로 시작)',
        value: ''
      },
      {
        type: 'dropdown',
        id: 'openaiModel',
        name: 'OpenAI 모델',
        note: '사용할 OpenAI 모델을 선택하세요. 가격은 100만 토큰당 USD입니다.',
        value: 'gpt-4.1-nano',
        options: [
          { label: 'GPT-4.1 Nano (입력: $0.1, 출력: $0.4)', value: 'gpt-4.1-nano' },
          { label: 'GPT-4.1 Mini (입력: $0.4, 출력: $1.6)', value: 'gpt-4.1-mini' },
          { label: 'GPT-4.1 (입력: $2, 출력: $8)', value: 'gpt-4.1' },
          { label: 'GPT-4o (입력: $2.5, 출력: $10)', value: 'gpt-4o' },
          { label: 'o4-Mini (입력: $1.1, 출력: $4.4)', value: 'o4-mini' }
        ]
      },
      {
        type: 'text',
        id: 'anthropicApiKey',
        name: 'Anthropic API 키',
        note: 'Anthropic API 키를 입력하세요.',
        value: ''
      },
      {
        type: 'dropdown',
        id: 'anthropicModel',
        name: 'Anthropic 모델',
        note: '사용할 Anthropic 모델을 선택하세요. 가격은 100만 토큰당 USD입니다.',
        value: 'claude-3-5-haiku-latest',
        options: [
          { label: 'Claude 3.5 Haiku (입력: $0.8, 출력: $4)', value: 'claude-3-5-haiku-latest' },
          { label: 'Claude 3.5 Sonnet (입력: $3, 출력: $15)', value: 'claude-3-5-sonnet-latest' },
          { label: 'Claude 3.7 Sonnet (입력: $3, 출력: $15)', value: 'claude-3-7-sonnet-latest' },
          { label: 'Claude 4 Sonnet (입력: $4, 출력: $15)', value: 'claude-sonnet-4-20250514' },
          { label: 'Claude 4 Opus (입력: $15, 출력: $75)', value: 'claude-opus-4-20250514' }
        ]
      },
      {
        type: 'slider',
        id: 'maxTokens',
        name: '최대 토큰 수',
        note: '응답의 최대 토큰 수를 설정합니다.',
        value: 2048,
        min: 1,
        max: 4096,
        step: 1,
        units: 'tokens'
      },
      {
        type: 'slider',
        id: 'temperature',
        name: '온도',
        note: '응답의 창의성을 조절합니다. (0.0 = 보수적, 1.0 = 창의적)',
        value: 0.7,
        min: 0,
        max: 1,
        step: 0.1
      }
    ]
  },
  {
    type: 'category',
    id: 'summary',
    name: '대화 요약 설정',
    collapsible: true,
    shown: true,
    settings: [
      {
        type: 'slider',
        id: 'messageLimit',
        name: '메시지 개수 제한',
        note: '요약에 포함할 최대 메시지 개수입니다. 0으로 설정하면 무제한입니다.',
        value: 20,
        min: 0,
        max: 100,
        step: 1,
        units: '개'
      },
      {
        type: 'text',
        id: 'defaultPrompt',
        name: '기본 프롬프트',
        note: '모든 채널에서 사용할 기본 프롬프트입니다. 비워두면 내장된 기본 프롬프트를 사용합니다. {{username}}과 {{conversation}}을 변수로 사용할 수 있습니다.',
        value: ''
      }
    ]
  },
  {
    type: 'category',
    id: 'channelPrompts',
    name: '채널별 프롬프트',
    collapsible: true,
    shown: false,
    settings: [
      {
        type: 'text',
        id: 'channelPromptsInfo',
        name: '채널별 프롬프트 설정',
        note: '특정 채널에서 사용할 커스텀 프롬프트를 설정하려면 해당 채널에서 플러그인을 사용하세요.',
        value: '',
        disabled: true
      }
    ]
  }
];

export class SettingsManager {
  private pluginName: string;
  private settings: PluginSettings;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
    this.settings = this.loadSettings();
  }

  private loadSettings(): PluginSettings {
    const stored = BdApi.Data.load(this.pluginName, "settings");
    return Object.assign({}, defaultSettings, stored);
  }

  saveSettings(): void {
    BdApi.Data.save(this.pluginName, "settings", this.settings);
  }

  get<K extends keyof PluginSettings>(key: K): PluginSettings[K] {
    return this.settings[key];
  }

  set<K extends keyof PluginSettings>(key: K, value: PluginSettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  getAll(): PluginSettings {
    return { ...this.settings };
  }

  updateSettingsConfig(): SettingConfig[] {
    return this.updateConfigValues(settingsConfig);
  }

  private updateConfigValues(configs: SettingConfig[]): SettingConfig[] {
    return configs.map(config => {
      if (config.settings) {
        return {
          ...config,
          settings: this.updateConfigValues(config.settings)
        };
      }
      return {
        ...config,
        value: this.settings[config.id as keyof PluginSettings] ?? config.value
      };
    });
  }

  // API 설정 헬퍼 메서드들
  getCurrentApiKey(): string {
    const provider = this.get('apiProvider');
    return provider === 'openai'
      ? this.get('openaiApiKey')
      : this.get('anthropicApiKey');
  }

  getCurrentModel(): string {
    const provider = this.get('apiProvider');
    return provider === 'openai'
      ? this.get('openaiModel')
      : this.get('anthropicModel');
  }

  getCurrentProvider(): 'openai' | 'anthropic' {
    return this.get('apiProvider');
  }

  isApiKeyConfigured(): boolean {
    const apiKey = this.getCurrentApiKey();
    return apiKey !== null && apiKey !== undefined && apiKey.trim() !== '';
  }

  getApiEndpoint(): string {
    const provider = this.get('apiProvider');
    return provider === 'openai'
      ? 'https://api.openai.com/v1'
      : 'https://api.anthropic.com/v1';
  }

  getApiConfiguration() {
    return {
      provider: this.getCurrentProvider(),
      apiKey: this.getCurrentApiKey(),
      model: this.getCurrentModel(),
      endpoint: this.getApiEndpoint(),
      maxTokens: this.get('maxTokens'),
      temperature: this.get('temperature')
    };
  }

  // 프롬프트 관련 메서드들
  getPromptForChannel(channelId: string): string {
    // 우선순위: 채널별 프롬프트 > 사용자 지정 기본 프롬프트 > 하드코딩된 기본 프롬프트
    const channelPrompt = this.settings.channelPrompts[channelId];
    if (channelPrompt && channelPrompt.trim() !== '') {
      return channelPrompt;
    }

    const defaultPrompt = this.settings.defaultPrompt;
    if (defaultPrompt && defaultPrompt.trim() !== '') {
      return defaultPrompt;
    }

    return HARDCODED_DEFAULT_PROMPT;
  }

  setChannelPrompt(channelId: string, prompt: string): void {
    if (!this.settings.channelPrompts) {
      this.settings.channelPrompts = {};
    }
    
    if (prompt.trim() === '') {
      // 빈 문자열이면 채널 프롬프트 삭제
      delete this.settings.channelPrompts[channelId];
    } else {
      this.settings.channelPrompts[channelId] = prompt;
    }
    
    this.saveSettings();
  }

  getChannelPrompt(channelId: string): string {
    return this.settings.channelPrompts[channelId] || '';
  }

  setDefaultPrompt(prompt: string): void {
    this.set('defaultPrompt', prompt);
  }

  loadExamplePrompt(type: keyof typeof EXAMPLE_PROMPTS): string {
    return EXAMPLE_PROMPTS[type] || EXAMPLE_PROMPTS.technical;
  }

  getExamplePrompts(): typeof EXAMPLE_PROMPTS {
    return EXAMPLE_PROMPTS;
  }
}
