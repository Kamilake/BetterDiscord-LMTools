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
