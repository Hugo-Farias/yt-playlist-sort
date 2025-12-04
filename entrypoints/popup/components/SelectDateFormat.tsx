import type React from "react";
import { i18n } from "#i18n";
import LANGUAGES from "@/data/LANGUAGES";
import { formatDate } from "@/helper";
import type { SettingsT } from "../App";

type PropsT = {
  className?: string;
  settings: SettingsT;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
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
          day: "numeric",
          month: "short",
          year: "numeric",
        },
        lang,
      ),
      options: "short" as const,
    },
    {
      id: 1,
      label: formatDate(
        SAMPLE_DATE,
        {
          day: "numeric",
          month: "2-digit",
          year: "numeric",
        },
        lang,
      ),
      options: "2-digit" as const,
    },
    {
      id: 2,
      label: formatDate(
        SAMPLE_DATE,
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        },
        lang,
      ),
      options: "long" as const,
    },
  ] as const;
};

const SelectDateFormat = (props: PropsT) => {
  const { className, settings, onChange } = props;

  const dupCheck: string[] = [];

  return (
    <div className="space-y-1">
      <div>
        <span>{i18n.t("settingsDateFormat")}: </span>
        <select
          className={`rounded-sm border border-stone-500 ${className}`}
          onChange={onChange}
          value={settings.dateFormat}
          id={"dateFormat"}
        >
          {dateFormats(settings.dateLanguage || settings.lang).map((date) => {
            if (dupCheck.includes(date.label)) return null;
            dupCheck.push(date.label);
            return (
              <option
                key={date.id}
                className={"bg-stone-900 text-inherit"}
                value={date.options}
              >
                {date.label}
              </option>
            );
          })}
        </select>
      </div>
      <div>
        <span>{i18n.t("settingsDateLanguage")}: </span>
        <select
          className={`w-fit rounded-sm border border-stone-500 px-1 ${className}`}
          onChange={onChange}
          value={settings.dateLanguage}
          id={"dateLanguage"}
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
