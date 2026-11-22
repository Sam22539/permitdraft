// Foundable SDK: email-code form
import * as React from "react";

type EmailCodeFormProps = {
  label: string;
  submitLabel: string;
  onVerify(code: string): void;
  busy?: boolean;
  describedBy?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
};

/** The website verifies the code and reports the result. This form passes exactly what the visitor entered. */
export function EmailCodeForm(props: EmailCodeFormProps) {
  const input = React.useRef<HTMLInputElement>(null);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = input.current?.value;
    if (hydrated && !props.busy && code) props.onVerify(code);
  }
  return (
    <form method="post" onSubmit={submit} className={props.className} aria-busy={props.busy}>
      <label className={props.labelClassName}>
        {props.label}
        <input ref={input} type="text" inputMode="numeric" autoComplete="one-time-code" required
          className={props.inputClassName} aria-describedby={props.describedBy} />
      </label>
      <button type="submit" disabled={!hydrated || props.busy} className={props.buttonClassName}>{props.submitLabel}</button>
    </form>
  );
}
