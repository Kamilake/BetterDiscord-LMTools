import MyComponent from "./component.jsx";
import styles from "./styles.css";
  
export default class LMTools { 
  constructor(meta) {
    this.meta = meta;
  }

  start() {
    BdApi.DOM.addStyle(this.meta.name, styles);
  }

  stop() {
    BdApi.DOM.removeStyle(this.meta.name);
  }

  getSettingsPanel() {
    return MyComponent;
  }
}