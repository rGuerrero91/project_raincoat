export function Badge({
  className = "",
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge"
      className={`
        inline-flex items-center justify-center rounded-md border px-2 py-0.5
        text-xs font-medium w-fit whitespace-nowrap shrink-0
        gap-1 overflow-hidden transition-[color,box-shadow]
      ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
