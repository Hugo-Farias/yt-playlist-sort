import Button from "./Button";

const CustomApiInput = () => {
  return (
    <div>
      {/* TODO: hook this to the settings */}
      <input
        className={
          "my-1 block min-w-[42ch] rounded-sm border border-stone-500 px-1 outline-0"
        }
        type="text"
        placeholder="YoutubeV3 API KEY"
      />
      <div className="space-x-3">
        <Button label="Hide" onClick={() => console.log("hide button")} />
        <Button
          label={"Test API key"}
          onClick={() => console.log("Test button")}
        />
      </div>
    </div>
  );
};

export default CustomApiInput;
