import { SettingConfig } from "./types/betterdiscord";

declare const BdApi: import("./types/betterdiscord").BdApi;

export interface PluginSettings {
  enabled: boolean;
  autoSave: boolean;
  theme: 'dark' | 'light' | 'auto';
  apiEndpoint: string;
  maxTokens: number;
  temperature: number;
}

export const defaultSettings: PluginSettings = {
  enabled: true,
  autoSave: true,
  theme: 'auto',
  apiEndpoint: 'https://api.openai.com/v1',
  maxTokens: 2048,
  temperature: 0.7
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
    shown: false,
    settings: [
      {
        type: 'text',
        id: 'apiEndpoint',
        name: 'API 엔드포인트',
        note: '언어 모델 API의 엔드포인트 URL을 입력하세요.',
        value: 'https://api.openai.com/v1'
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
}
