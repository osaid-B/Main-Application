import { forwardRef } from "react";
import { Search } from "lucide-react";
import { Input, type InputProps } from "./Input";

export type SearchBoxProps = Omit<InputProps, "variant" | "leftIcon">;

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  function SearchBox(props, ref) {
    return (
      <Input
        ref={ref}
        variant="search"
        leftIcon={<Search size={14} />}
        {...props}
      />
    );
  }
);
