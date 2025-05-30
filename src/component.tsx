import React from "react";

declare const BdApi: {
  React: typeof React;
};

interface MyComponentProps {
  disabled?: boolean;
}

export default function MyComponent({ disabled = false }: MyComponentProps): React.ReactElement {
  const [isDisabled, setDisabled] = BdApi.React.useState(disabled);
  
  return (
    <button className="my-component" disabled={isDisabled}>
      Hello World from JSX!
    </button>
  );
}
