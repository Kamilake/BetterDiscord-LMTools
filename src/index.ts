import React from "react";
import MyComponent from "./component";
import styles from "./styles.css";
import { BetterDiscordPlugin, PluginMeta } from "./types/betterdiscord";

declare const BdApi: {
  DOM: {
    addStyle(id: string, css: string): void;
    removeStyle(id: string): void;
  };
};

export default class LMTools implements BetterDiscordPlugin {
  private meta: PluginMeta;

  constructor(meta: PluginMeta) {
    this.meta = meta;
  }

  start(): void {
    BdApi.DOM.addStyle(this.meta.name, styles);
  }

  stop(): void {
    BdApi.DOM.removeStyle(this.meta.name);
  }

  getSettingsPanel(): React.ComponentType {
    return MyComponent;
  }
}
