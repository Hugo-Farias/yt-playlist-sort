import type LANGUAGES from "@/data/LANGUAGES";
import OptionEl from "./components/OptionEl";
import SelectDateFormat from "./components/SelectDateFormat";
import TextInput from "./components/TextInput";

export type LanguageCodeT = Intl.Locale;

export type SettingsT = {
  date: boolean;
  dateFormat: "short" | "long" | "2-digit";
  dateLanguage: (typeof LANGUAGES)[number]["opt"];
  scroll: boolean;
  lang?: string;
  optApi: boolean;
  apiString?: string;
};

let initialSettings: SettingsT = {
  date: true,
  dateFormat: "short",
  dateLanguage: "youtube",
  scroll: true,
  optApi: false,
};

function isSettingKey(id: string): id is keyof SettingsT {
  return id in initialSettings;
}

// TODO: add donate and report bug button
chrome.storage.local.get<SettingsT>((settings) => {
  if (!settings) return;
  initialSettings = { ...initialSettings, ...settings };
});

function App() {
  const [settings, setSettings] = useState<SettingsT>(initialSettings);

  useEffect(() => {
    chrome.storage.local.set(settings);
  }, [settings]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const id = e.target.id;
    const value = e.target.value;

    if (!isSettingKey(id)) return null;

    if (value === "on" || value === "off") {
      setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
    } else {
      setSettings((prev) => ({ ...prev, [id]: value }));
    }
  };

  return (
    <div className={"select-none bg-stone-900 p-5 text-sm text-stone-300"}>
      <form>
        <OptionEl
          id="scroll"
          label={i18n.t("settingsScroll")}
          checked={settings.scroll}
          onChange={onChange}
        />
        <OptionEl
          id="date"
          label={i18n.t("settingsDate")}
          checked={settings.date}
          onChange={onChange}
        >
          <SelectDateFormat
            settings={settings}
            onChange={onChange}
            className={"block rounded-sm border border-stone-500"}
          />
        </OptionEl>

        <OptionEl
          id="optApi"
          label="Use Custom Api (Optional)"
          checked={settings.optApi}
          onChange={onChange}
        >
          <TextInput className={"min-w-xs border border-stone-500"} />
        </OptionEl>
      </form>

      <div className={"mt-3 flex justify-end space-x-3"}>
        <a
          className={"text-blue-400 underline"}
          target="_blank"
          href="https:\\google.com"
          rel="noopener"
        >
          {i18n.t("donate")}
        </a>
        <a
          className={"text-blue-400 underline"}
          target="_blank"
          href="https:\\google.com"
          rel="noopener"
        >
          {i18n.t("report")}
        </a>
      </div>
    </div>
  );
}

export default App;
