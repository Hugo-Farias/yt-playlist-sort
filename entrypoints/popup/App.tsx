import { effect, signal } from "@preact/signals-react";
import type LANGUAGES from "@/data/LANGUAGES";
import { debounce, getSettings } from "@/helper";
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

// Checks if the id is a valid setting key
function isSettingKey(id: string): id is keyof SettingsT {
  return id in initialSettings;
}

const settings = signal<SettingsT>(initialSettings);

getSettings().then((storedSettings) => {
  if (storedSettings) {
    settings.value = { ...settings.value, ...storedSettings };
  }
});

function App() {
  effect(() => {
    debounce(() => {
      chrome.storage.local.set(settings.value);
    }, 260);
  });

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;

    if (!isSettingKey(id)) return null;
    if (value.length > 70) return null;

    const newValue =
      value === "on" || value === "off" ? !settings.value[id] : value;

    settings.value = {
      ...settings.value,
      [id]: newValue,
    };
  };

  return (
    <div
      className={`m-3 min-w-xs select-none bg-stone-900 text-sm text-stone-300`}
    >
      <form className="space-y-3">
        <OptionEl
          id="scroll"
          label={i18n.t("settingsScroll")}
          checked={settings.value.scroll}
          onChange={onChange}
        />
        <OptionEl
          id="date"
          label={i18n.t("settingsDate")}
          checked={settings.value.date}
          onChange={onChange}
        >
          <SelectDateFormat
            settings={settings.value}
            onChange={onChange}
            className={"block rounded-sm border border-stone-500"}
          />
        </OptionEl>

        <OptionEl
          id="optApi"
          label={i18n.t("apiInputLabel")}
          checked={settings.value.optApi}
          onChange={onChange}
        >
          <CustomApiInput
            apiInput={settings.value.apiString}
            id={"apiString"}
            onChange={onChange}
          />
        </OptionEl>
      </form>
      <div className="mt-5 flex">
        <a
          className="ml-auto text-blue-300 hover:underline"
          href="https://chromewebstore.google.com/detail/playlist-sorter-for-youtu/pknlkjehmikkbfpmfoiboncjnlopopjf/support"
          target="_blank"
          rel="noopener"
        >
          {i18n.t("report")}
        </a>
      </div>
    </div>
  );
}

export default App;
