type SettingsT = {
  date: boolean;
  scroll: boolean;
};

type PropsT = {
  id: keyof SettingsT;
  label: string;
  type?: "text" | "password" | "checkbox" | "radio" | "email" | "number";
  storedSettings: SettingsT;
};

const initialSettings: SettingsT = {
  date: true,
  scroll: false,
};

function isSettingKey(id: string): id is keyof SettingsT {
  return id in initialSettings;
}

const OptionEl = ({
  id,
  label,
  type = "checkbox",
  storedSettings = initialSettings,
}: PropsT) => {
  const [settings, setSettings] = useState<SettingsT>(
    storedSettings || initialSettings,
  );

  // console.log(chrome);
  // console.log(chrome.storage.local);

  useEffect(() => {
    chrome.storage.local.set(settings);
  }, [settings]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id;

    if (!isSettingKey(id)) return null;

    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
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
        type={type}
        aria-label={label}
        checked={settings[id]}
        id={id}
        onChange={onChange}
      />
      {label}
    </label>
  );
};

export default OptionEl;
