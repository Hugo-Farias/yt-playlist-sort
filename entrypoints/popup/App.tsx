type settingsT = {
  date: boolean;
};

const initialSettings: settingsT = {
  date: false,
};

function App() {
  const [settings, setSettings] = useState<settingsT>(initialSettings);

  // const onClick = () => {
  //   console.log("key down");
  //   setSettings((prev) => ({ ...prev, date: !prev.date }));
  // };

  const onChange = () => {
    setSettings((prev) => ({ ...prev, date: !prev.date }));
  };

  return (
    <div
      className={
        "min-w-80 select-none bg-stone-900 p-1 pb-5 text-base text-stone-300"
      }
    >
      <form className={"flex px-1"}>
        <label
          className={
            "w-full cursor-pointer bg-red-700/30 px-3 transition-colors hover:bg-stone-300/15 hover:text-stone-100"
          }
          htmlFor={"test"}
        >
          <input
            className={"mr-3 cursor-pointer"}
            type={"checkbox"}
            aria-label={"Toggle display dates"}
            checked={settings.date}
            id={"test"}
            onChange={onChange}
          />
          Display Dates
        </label>
      </form>
    </div>
  );
}

export default App;
