import OptionEl from "./components/OptionEl";

// TODO: finish this, add option to change the date format

export type SettingsT = {
  date: boolean;
  scroll: boolean;
};

let initialSettings: SettingsT = {
  date: true,
  scroll: true,
};

function isSettingKey(id: string): id is keyof SettingsT {
  return id in initialSettings;
}

chrome.storage.local.get<SettingsT>((settings) => {
  if (!settings) return;
  initialSettings = settings;
});

function App() {
  const [settings, setSettings] = useState<SettingsT>(initialSettings);

  useEffect(() => {
    chrome.storage.local.set(settings);
    console.log("settings ==> ", settings);
  }, [settings]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id;
    if (!isSettingKey(id)) return null;
    console.log("id ==> ", id);
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className={"min-w-80 select-none bg-stone-900 p-1 text-sm text-stone-300"}
    >
      <form className={"items-center divide-y divide-white/20"}>
        <OptionEl
          id="date"
          label="Display dates"
          checked={settings.date}
          onChange={onChange}
        />
        <OptionEl
          id="scroll"
          label="Scroll to current video after reorder"
          checked={settings.scroll}
          onChange={onChange}
        />
      </form>
    </div>
  );
}

export default App;
