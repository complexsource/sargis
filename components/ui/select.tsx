import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, placeholder, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "focus-ring h-10 w-full appearance-none rounded-md border border-input bg-white px-3 py-2 pr-9 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
));
Select.displayName = "Select";

export { Select };
