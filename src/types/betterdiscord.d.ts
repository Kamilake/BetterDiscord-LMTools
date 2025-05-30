import React from "react";

declare global {
  interface Window {
    BdApi: BdApi;
  }
}

export interface BdApi {
  React: typeof React;
  DOM: {
    addStyle(id: string, css: string): void;
    removeStyle(id: string): void;
  };
  Data: {
    save(pluginName: string, key: string, data: any): void;
    load(pluginName: string, key: string): any;
  };
  UI: {
    buildSettingsPanel(options: SettingsPanelOptions): React.ReactElement;
  };
}

export interface SettingsPanelOptions {
  settings: SettingConfig[];
  onChange?: (category: string, id: string, value: any) => void;
}

export interface SettingConfig {
  type: 'switch' | 'text' | 'color' | 'dropdown' | 'slider' | 'number' | 'category';
  id: string;
  name: string;
  note?: string;
  value?: any;
  defaultValue?: any;
  disabled?: boolean;
  inline?: boolean;
  // Category specific
  collapsible?: boolean;
  shown?: boolean;
  settings?: SettingConfig[];
  // Dropdown specific
  options?: Array<{label: string; value: any}>;
  // Slider/Number specific
  min?: number;
  max?: number;
  step?: number;
  units?: string;
}

export interface PluginMeta {
  name: string;
  description: string;
  author: string;
  version: string;
}

export interface BetterDiscordPlugin {
  start(): void;
  stop(): void;
  getSettingsPanel?(): React.ComponentType | React.ReactElement;
}

declare const BdApi: BdApi;
