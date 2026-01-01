import { useSignal } from "@preact/signals-react";
import { testYTApiKey } from "@/chromeAPI";
import { debounce } from "@/helper";
import type { SettingsT } from "../App";
import Button from "./Button";

type PropsT = {
  id: keyof SettingsT;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  apiInput: string;
};

const testBtnColors = {
  red: "bg-red-900",
  green: "bg-green-900",
  white: "",
} as const;

const CustomApiInput = (props: PropsT) => {
  const { id, onChange, apiInput } = props;
  const hideApi = useSignal<boolean>(!!apiInput);
  const [testBtnLabel, setTestBtnLabel] = useState<string>(
    i18n.t("apiBtnTest"),
  );
  const [testBtnStyle, setTestBtnStyle] =
    useState<keyof typeof testBtnColors>("white");

  const apiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hideApi.value) return;
    debounce(() => {
      onChange(e);
    }, 200);
  };

  const testBtn = async () => {
    setTestBtnLabel(i18n.t("apiTestTesting"));
    debounce(async () => {
      const testResponse = await testYTApiKey(apiInput);
      if (testResponse === 200) {
        // alert(i18n.t("apiTestSuccess"));
        setTestBtnLabel(i18n.t("apiTestSuccess"));
        setTestBtnStyle("green");
      } else {
        // alert(i18n.t("apiTestFail"));
        setTestBtnLabel(i18n.t("apiTestFail"));
        setTestBtnStyle("red");
      }
      setTimeout(() => {
        setTestBtnLabel(i18n.t("apiBtnTest"));
        setTestBtnStyle("white");
      }, 3000);
    });
  };

  return (
    <>
      <input
        className={`my-1 block min-w-[42ch] rounded-sm border border-stone-500 text-center outline-0 transition-opacity ${hideApi.value && "cursor-not-allowed select-none opacity-40"}`}
        id={id}
        type={`${hideApi.value ? "password" : "text"}`}
        placeholder="YoutubeV3 API KEY"
        defaultValue={apiInput}
        disabled={hideApi.value}
        readOnly={hideApi.value}
        onChange={apiInputChange}
      />
      <div className="space-x-3">
        <Button
          label={`${hideApi.value ? i18n.t("apiBtnShow") : i18n.t("apiBtnHide")}`}
          onClick={() => {
            hideApi.value = !hideApi.value;
          }}
        />
        <Button
          label={testBtnLabel}
          onClick={testBtn}
          className={`transition-opacity duration-500 ${testBtnColors[testBtnStyle]} disabled:opacity-40`}
          disabled={!apiInput}
        />
      </div>
    </>
  );
};

export default CustomApiInput;
