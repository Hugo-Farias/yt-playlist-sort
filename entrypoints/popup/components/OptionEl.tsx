type PropsT = {
  id: keyof SettingsT;
  label: string;
};

type SettingsT = {
  date: boolean;
  scroll: boolean;
};

const initialSettings: SettingsT = {
  date: true,
  scroll: false,
};

const OptionEl = ({ id, label }: PropsT) => {
  const [settings, setSettings] = useState<SettingsT>(initialSettings);

  const onChange = (id: keyof SettingsT) => {
    console.log(settings);

    setSettings((prev) => {
      return { ...prev, [id]: !prev[id] };
    });
  };

  return (
    <label
      key={id}
      className={
        "inline-block w-full cursor-pointer items-center p-1 px-3 transition-colors hover:bg-white/5 hover:text-stone-100"
      }
      htmlFor={id}
    >
      <input
        className={"mr-3 cursor-pointer"}
        type={"checkbox"}
        aria-label={label}
        checked={settings[id]}
        id={id}
        onChange={() => onChange(id)}
      />
      {label}
    </label>
  );
};

export default OptionEl;
