import { signal, useSignal } from "@preact/signals-react";
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

const testBtnLabel = signal<string>(i18n.t("apiBtnTest"));
let testBtnStyle: keyof typeof testBtnColors = "white";

const CustomApiInput = (props: PropsT) => {
  const { id, onChange, apiInput } = props;
  const hideApi = useSignal<boolean>(!!apiInput);

  const apiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hideApi.value) return;
    debounce(() => {
      onChange(e);
    }, 200);
  };

  const testBtn = async () => {
    testBtnLabel.value = i18n.t("apiTestTesting");
    debounce(async () => {
      const testResponse = await testYTApiKey(apiInput);
      if (testResponse === 200) {
        testBtnLabel.value = i18n.t("apiTestSuccess");
        testBtnStyle = "green";
      } else {
        testBtnLabel.value = i18n.t("apiTestFail");
        testBtnStyle = "red";
      }
      setTimeout(() => {
        testBtnLabel.value = i18n.t("apiBtnTest");
        testBtnStyle = "white";
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
          label={testBtnLabel.value}
          onClick={testBtn}
          className={`transition-[opacity,background-color] duration-500 disabled:opacity-40 ${testBtnColors[testBtnStyle]}`}
          disabled={!apiInput}
        />
      </div>
    </>
  );
};

export default CustomApiInput;
