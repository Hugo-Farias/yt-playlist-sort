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
    <div className={"py-1.5"}>
      <label
        className={
          "flex cursor-pointer items-center whitespace-nowrap transition-colors hover:text-stone-100"
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
        className={`grid transition-[grid-template-rows] duration-500 ${checked ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
  `}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

export default OptionEl;
