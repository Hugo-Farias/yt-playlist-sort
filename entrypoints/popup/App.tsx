import type LANGUAGES from "@/data/LANGUAGES";
import { cleanCache, debounce, getSettings } from "@/helper";
import Button from "./components/Button";
import CustomApiInput from "./components/CustomApiInput";
import OptionEl from "./components/OptionEl";
import SelectDateFormat from "./components/SelectDateFormat";

export type LanguageCodeT = Intl.Locale;

export type SettingsT = {
  date: boolean;
  dateFormat: "short" | "long" | "2-digit";
  dateLanguage: (typeof LANGUAGES)[number]["opt"];
  scroll: boolean;
  lang?: string;
  optApi: boolean;
  apiString: string;
};

const initialSettings: SettingsT = {
  date: true,
  dateFormat: "short",
  dateLanguage: "youtube",
  scroll: true,
  optApi: false,
  apiString: "",
};

function isSettingKey(id: string): id is keyof SettingsT {
  return id in initialSettings;
}

// TODO: add functionality for donate and report bug button
// TODO: add clear cache button

function App() {
  const [settings, setSettings] = useState<SettingsT>(initialSettings);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    getSettings().then((stored) => {
      if (stored) {
        setSettings((prev) => ({ ...prev, ...stored }));
      }
    });
    setTimeout(() => {
      setReady(true);
    }, 20);
  }, []);

  useEffect(() => {
    debounce(() => {
      console.log("settings saved");

      chrome.storage.local.set(settings);
    }, 200);
  }, [settings]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;

    if (!isSettingKey(id)) return null;
    if (value.length > 70) return null;

    if (value === "on" || value === "off") {
      setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
    } else {
      setSettings((prev) => ({ ...prev, [id]: value }));
    }
  };

  if (!ready) return;

  return (
    <div
      className={"m-5 min-w-xs select-none bg-stone-900 text-sm text-stone-300"}
    >
      <form className={"flex flex-col space-y-0.5"}>
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
            className={`block rounded-sm border border-stone-500`}
          />
        </OptionEl>

        <OptionEl
          id="optApi"
          label={i18n.t("apiInputLabel")}
          checked={settings.optApi}
          onChange={onChange}
        >
          <CustomApiInput
            apiInput={settings.apiString}
            id={"apiString"}
            onChange={onChange}
          />
        </OptionEl>

        <Button
          className="ml-auto"
          label={i18n.t("clearCacheBtnLabel")}
          onClick={() => cleanCache("Cleaning Cache")}
        ></Button>
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
