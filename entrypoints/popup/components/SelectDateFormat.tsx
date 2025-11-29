import { formatDate } from "@/helper";

type PropsT = {
  className?: string;
};

const SAMPLE_DATE = new Date(2025, 3, 23); // 23 September 2025

const dateFormats = [
  {
    id: 3,
    label: formatDate(SAMPLE_DATE, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    value: "DD/MMM/YYYY",
    options: { day: "2-digit", month: "short", year: "numeric" } as const,
  },
  {
    id: 1,
    label: formatDate(SAMPLE_DATE, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    value: "DD/MM/YYYY",
    options: { day: "2-digit", month: "2-digit", year: "numeric" } as const,
  },
  {
    id: 2,
    label: formatDate(SAMPLE_DATE, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    value: "DD MMMM YYYY",
    options: { day: "2-digit", month: "long", year: "numeric" } as const,
  },
] as const;

const SelectDateFormat = (props: PropsT) => {
  return (
    <select className={`rounded-sm border border-stone-500 ${props.className}`}>
      {dateFormats.map((date) => {
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
  );
};

export default SelectDateFormat;
