import type React from "react";
import { i18n } from "#i18n";
import LANGUAGES from "@/data/LANGUAGES";
import { formatDate, parseLang } from "@/helper";
import type { SettingsT } from "../App";

type PropsT = {
  className?: string;
  settings: SettingsT;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const SAMPLE_DATE = new Date(2025, 8, 24); // 23 April 2025

const dateFormats = (settings: SettingsT | undefined) => {
  const lang = parseLang(settings);
  return [
    {
      id: 1,
      label: formatDate(
        SAMPLE_DATE,
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
        lang,
      ),
      opt: "short" as const,
    },
    {
      id: 2,
      label: formatDate(
        SAMPLE_DATE,
        {
          day: "numeric",
          month: "2-digit",
          year: "numeric",
        },
        lang,
      ),
      opt: "2-digit" as const,
    },
    {
      id: 3,
      label: formatDate(
        SAMPLE_DATE,
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        },
        lang,
      ),
      opt: "long" as const,
    },
  ] as const;
};

const SelectDateFormat = (props: PropsT) => {
  const { className, settings, onChange } = props;

  const dupCheck: string[] = [];

  return (
    <div className={"space-y-1"}>
      <div>
        <span>{i18n.t("settingsDateFormat")}: </span>
        <select
          className={className}
          onChange={onChange}
          value={settings.dateFormat}
          aria-label={"Select Date Format"}
          id={"dateFormat"}
        >
          {dateFormats(settings).map((date) => {
            if (dupCheck.includes(date.label)) return null;
            dupCheck.push(date.label);
            return (
              <option
                key={date.id}
                className={"bg-stone-900 text-inherit"}
                aria-label={`Select ${date.label}`}
                value={date.opt}
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
          className={className}
          onChange={onChange}
          value={settings.dateLanguage}
          aria-label={"Select Date Language"}
          id={"dateLanguage"}
        >
          {LANGUAGES.map((language) => {
            return (
              <option
                key={language.id}
                className={"bg-stone-900 text-inherit"}
                aria-label={`Select ${language.label}`}
                value={language.opt}
              >
                {language.label}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
};

export default SelectDateFormat;
