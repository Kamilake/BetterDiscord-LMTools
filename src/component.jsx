export default function MyComponent({disabled = false}) {
  const [isDisabled, setDisabled] = BdApi.React.useState(disabled);
  return (
    <button className="my-component" disabled={isDisabled}>
      Hello World from JSX!
    </button>
  );
}
