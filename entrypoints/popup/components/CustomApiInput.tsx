const CustomApiInput = () => {
  return (
    <div>
      {/* TODO: hook this to the settings */}
      <input
        className={
          "my-1 block min-w-xs rounded-sm border border-stone-500 px-1.5"
        }
        type="text"
        placeholder="YoutubeV3 API KEY"
      />
      <button className={"rounded-sm border border-stone-500"} type="button">
        Test API key
      </button>
    </div>
  );
};

export default CustomApiInput;
