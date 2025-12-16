type PropsT = {
  className?: string;
};

const TextInput = ({ className }: PropsT) => {
  return (
    <div>
      {/* <span className={"mt-2 block"}>Custom API (Optional)</span> */}
      <input className={className} type="text" placeholder="Default" />
    </div>
  );
};

export default TextInput;
