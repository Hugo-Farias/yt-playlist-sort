import OptionEl from "./components/OptionEl";

// TODO: finish this
// add option to change the date format
function App() {
  return (
    <div
      className={
        "min-w-80 select-none bg-stone-900 p-1 text-base text-stone-300"
      }
    >
      <form className={"items-center divide-y divide-white/20"}>
        <OptionEl id="date" label="Display dates" />
        <OptionEl id="scroll" label="Scroll to currently playing" />
      </form>
    </div>
  );
}

export default App;
