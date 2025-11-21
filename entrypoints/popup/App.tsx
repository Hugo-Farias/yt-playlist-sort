import type { ReactNode } from "react";

type SettingsT = {
  date: boolean;
  scroll: boolean;
};

const initialSettings: SettingsT = {
  date: true,
  scroll: false,
};

// TODO: finish this
function App() {
  const [settings, setSettings] = useState<SettingsT>(initialSettings);

  // const onClick = () => {
  //   console.log("key down");
  //   setSettings((prev) => ({ ...prev, date: !prev.date }));
  // };

  const onChange = (id: keyof SettingsT) => {
    setSettings((prev) => {
      console.log(prev);
      return { ...prev, [id]: !prev[id] };
    });
  };

  const optionEl = (id: keyof SettingsT, label: string): ReactNode => {
    return (
      <label
        key={id}
        className={
          "inline-block w-full cursor-pointer items-center px-3 transition-colors hover:text-stone-100"
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

  return (
    <div
      className={
        "min-w-80 select-none bg-stone-900 p-1 text-base text-stone-300"
      }
    >
      <form className={"items-center space-y-1"}>
        {optionEl("date", "Display dates")}
        {optionEl("scroll", "Scroll to currently playing")}
      </form>
    </div>
  );
}

export default App;
