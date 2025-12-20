type PropsT = {
  label: string;
  onClick: () => void;
  className?: string;
};

const Button = (props: PropsT) => {
  const { label, className, onClick } = props;

  return (
    <button
      className={`min-w-22 rounded-sm border border-stone-500 px-1 ${className}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
};

export default Button;
