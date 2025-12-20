import { debounce } from "@/helper";
import type { SettingsT } from "../App";
import Button from "./Button";

type PropsT = {
  id: keyof SettingsT;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  apiInput: string;
};

const CustomApiInput = (props: PropsT) => {
  const { id, onChange, apiInput } = props;
  const [hideApi, setHideApi] = useState<boolean>(true);

  const apiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debounce(() => {
      onChange(e);
    }, 250);
  };

  return (
    <div>
      {/* TODO: hook this to the settings */}
      <input
        className={
          "my-1 block min-w-[42ch] rounded-sm border border-stone-500 px-1 outline-0"
        }
        id={id}
        type={`${hideApi ? "password" : "text"}`}
        placeholder="YoutubeV3 API KEY"
        defaultValue={apiInput ? apiInput : ""}
        onChange={apiInputChange}
      />
      <div className="space-x-3">
        <Button
          label={`${hideApi ? "Show" : "Hide"}`}
          onClick={() => setHideApi((prev) => !prev)}
        />
        <Button
          label={"Test API key"}
          onClick={() => console.log("Test button")}
        />
      </div>
    </div>
  );
};

export default CustomApiInput;
