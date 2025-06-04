import React from "react";

declare global {
  interface Window {
    BdApi: BdApi;
  }
}

export interface BdApi {
  React: typeof React;
  ReactDOM: {
    unmountComponentAtNode?: (container: HTMLElement) => boolean;
    createRoot?: (container: HTMLElement) => {
      render: (element: any) => void;
      unmount: () => void;
    };
  };
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

export interface ChannelTextAreaButtonsProps {
  channel: {
    id: string;
    guild_id?: string;
    type: number;
  };
  disabled?: boolean;
}

export interface MessageSummary {
  channelId: string;
  summary: string;
  messageCount: number;
  timeRange: string;
  createdAt: Date;
}

export interface DiscordMessage {
  id: string;
  username: string;
  content: string;
  timestamp?: string;
  referenceMessage?: string;
  referenceUsername?: string;
}

declare const BdApi: BdApi;
