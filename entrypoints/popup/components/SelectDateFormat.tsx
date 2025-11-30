import LANGUAGES from "@/data/languages";
import { formatDate } from "@/helper";
import type { SettingsT } from "../App";

type PropsT = {
  className?: string;
  settings: SettingsT;
};

const SAMPLE_DATE = new Date(2025, 8, 24); // 23 April 2025

const dateFormats = (langSetting: string | undefined) => {
  const lang = langSetting || navigator.language;
  return [
    {
      id: 3,
      label: formatDate(
        SAMPLE_DATE,
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
        lang,
      ),
      value: "DD/MMM/YYYY",
      options: { day: "2-digit", month: "short", year: "numeric" } as const,
    },
    {
      id: 1,
      label: formatDate(
        SAMPLE_DATE,
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
        lang,
      ),
      value: "DD/MM/YYYY",
      options: { day: "2-digit", month: "2-digit", year: "numeric" } as const,
    },
    {
      id: 2,
      label: formatDate(
        SAMPLE_DATE,
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        },
        lang,
      ),
      value: "DD MMMM YYYY",
      options: { day: "2-digit", month: "long", year: "numeric" } as const,
    },
  ] as const;
};

const SelectDateFormat = (props: PropsT) => {
  const { className, settings } = props;

  const dupCheck: string[] = [];

  return (
    <div className="space-y-1">
      <div>
        <span>Format: </span>
        <select className={`rounded-sm border border-stone-500 ${className}`}>
          {dateFormats(settings.lang).map((date) => {
            if (dupCheck.includes(date.label)) return null;
            dupCheck.push(date.label);
            return (
              <option
                key={date.id}
                className={"bg-stone-900 text-center text-inherit"}
                value={date.value}
              >
                {date.label}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        <span>Language: </span>
        <select
          className={`w-fit rounded-sm border border-stone-500 px-1 ${className}`}
        >
          {LANGUAGES.map((language) => {
            return (
              <option
                key={language.id}
                className={"bg-stone-900 text-inherit"}
                value={language.code}
              >
                {language.name}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

export default SelectDateFormat;
