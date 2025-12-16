import type { SettingsT } from "../App";

type PropsT = React.PropsWithChildren<{
  id: keyof SettingsT;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}>;

const OptionEl = (props: PropsT) => {
  const { id, label, checked, onChange, children } = props;

  return (
    <>
      <label
        className={
          "flex cursor-pointer items-center whitespace-nowrap py-1 transition-colors hover:text-stone-100"
        }
        htmlFor={id}
      >
        <input
          className={"mr-3 cursor-pointer"}
          type={"checkbox"}
          aria-label={`Toggle "${label}"`}
          checked={checked}
          id={id}
          onChange={onChange}
        />
        {label}
      </label>
      <div
        className={`ml-13 transition-opacity ${checked ? "pointer-events-auto" : "pointer-events-none opacity-15"}`}
      >
        {children}
      </div>
    </>
  );
};

export default OptionEl;
