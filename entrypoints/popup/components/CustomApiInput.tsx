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
      <input
        className={
          "my-1 block min-w-[42ch] rounded-sm border border-stone-500 text-center outline-0"
        }
        id={id}
        type={`${hideApi ? "password" : "text"}`}
        placeholder="YoutubeV3 API KEY"
        defaultValue={apiInput}
        onChange={apiInputChange}
      />
      <div className="space-x-3">
        <Button
          label={`${hideApi ? "Show" : "Hide"}`}
          onClick={() => setHideApi((prev) => !prev)}
        />
        {/* TODO: finish the functionallity of this button */}
        <Button
          label={"Test API key"}
          onClick={() => console.log("Test button")}
        />
      </div>
    </div>
  );
};

export default CustomApiInput;
