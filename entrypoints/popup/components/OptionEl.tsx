import type { SettingsT } from "../App";

type PropsT = React.PropsWithChildren<{
  id: keyof SettingsT;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}>;

const OptionEl = (props: PropsT) => {
  const { id, label, checked, onChange, children } = props;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [childState, setChildState] = useState<boolean>(checked);

  useEffect(() => {
    if (checked) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setChildState(true);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        setChildState(false);
      }, 150);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [checked]);

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
        className={`grid transition-[grid-template-rows,opacity] duration-200 ${checked ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-10"}`}
      >
        {childState && <div className="overflow-hidden p-px">{children}</div>}
      </div>
    </div>
  );
};

export default OptionEl;
