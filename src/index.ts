import React from "react";
import MyComponent from "./component";
import styles from "./styles.css";
import { BetterDiscordPlugin, PluginMeta } from "./types/betterdiscord";
import { SettingsManager } from "./settings";

declare const BdApi: {
  DOM: {
    addStyle(id: string, css: string): void;
    removeStyle(id: string): void;
  };
  UI: {
    buildSettingsPanel(options: any): React.ReactElement;
  };
};

export default class LMTools implements BetterDiscordPlugin {
  private meta: PluginMeta;
  private settingsManager: SettingsManager;

  constructor(meta: PluginMeta) {
    this.meta = meta;
    this.settingsManager = new SettingsManager(meta.name);
  }

  start(): void {
    BdApi.DOM.addStyle(this.meta.name, styles);
    console.log(`${this.meta.name} started with settings:`, this.settingsManager.getAll());
  }

  stop(): void {
    BdApi.DOM.removeStyle(this.meta.name);
  }

  getSettingsPanel(): React.ReactElement {
    return BdApi.UI.buildSettingsPanel({
      settings: this.settingsManager.updateSettingsConfig(),
      onChange: (category: string, id: string, value: any) => {
        console.log(`Setting changed - Category: ${category}, ID: ${id}, Value:`, value);
        this.settingsManager.set(id as any, value);
        this.onSettingChanged(id, value);
      }
    });
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
