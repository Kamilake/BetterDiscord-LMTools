export default function MyComponent({disabled = false}) {
  const [isDisabled, setDisabled] = BdApi.React.useState(disabled);
  return BdApi.React.createElement("button", {className: "my-component", disabled: isDisabled}, "Hello World!");
}