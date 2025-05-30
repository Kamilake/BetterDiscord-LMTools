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
}

export const defaultSettings: PluginSettings = {
  enabled: true,
  autoSave: true,
  theme: 'auto',
  apiProvider: 'openai',
  openaiApiKey: '',
  openaiModel: 'gpt-3.5-turbo',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-sonnet-20240229',
  maxTokens: 2048,
  temperature: 0.7,
  messageLimit: 20
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
        note: '사용할 OpenAI 모델을 선택하세요.',
        value: 'gpt-3.5-turbo',
        options: [
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { label: 'GPT-3.5 Turbo 16k', value: 'gpt-3.5-turbo-16k' },
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-4 Turbo', value: 'gpt-4-turbo-preview' },
          { label: 'GPT-4 Vision', value: 'gpt-4-vision-preview' }
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
        note: '사용할 Anthropic 모델을 선택하세요.',
        value: 'claude-3-sonnet-20240229',
        options: [
          { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
          { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
          { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
          { label: 'Claude 2.1', value: 'claude-2.1' },
          { label: 'Claude 2.0', value: 'claude-2.0' },
          { label: 'Claude Instant 1.2', value: 'claude-instant-1.2' }
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
}
