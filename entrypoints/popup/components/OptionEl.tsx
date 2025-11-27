import type { SettingsT } from "../App";

type PropsT = {
  id: keyof SettingsT;
  label: string;
  checked: boolean;
  type?: "text" | "password" | "checkbox" | "radio" | "email" | "number";
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const OptionEl = (props: PropsT) => {
  const { id, label, type, checked, onChange } = props;

  return (
    <label
      className={
        "inline-block w-full cursor-pointer items-center whitespace-nowrap p-1 px-3 transition-colors hover:bg-white/5 hover:text-stone-100"
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
    </label>
  );
};

export default OptionEl;
