type PropsT = {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
};

const Button = (props: PropsT) => {
  const { label, className, onClick, disabled } = props;

  return (
    <button
      className={`min-w-23 rounded-sm border border-stone-500 px-1 ${className}`}
      onClick={onClick}
      type="button"
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;
