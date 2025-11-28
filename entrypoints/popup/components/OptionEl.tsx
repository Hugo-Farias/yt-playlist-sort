import type { SettingsT } from "../App";

type PropsT = React.PropsWithChildren<{
  id: keyof SettingsT;
  label: string;
  checked: boolean;
  type?: "text" | "password" | "checkbox" | "radio" | "email" | "number";
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}>;

const OptionEl = (props: PropsT) => {
  const { id, label, type, checked, onChange, children } = props;

  return (
    <label
      className={
        "flex min-h-8 w-full cursor-pointer items-center whitespace-nowrap p-1 px-3 transition-colors hover:bg-white/5 hover:text-stone-100"
      }
      htmlFor={id}
    >
      <input
        className={"mr-3 cursor-pointer"}
        type={type || "checkbox"}
        aria-label={label}
        checked={checked}
        id={id}
        onChange={onChange}
      />
      {label}
      {checked && <div className={`ml-4`}>{children}</div>}
    </label>
  );
};

export default OptionEl;
