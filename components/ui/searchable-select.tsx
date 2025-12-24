"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {value
            ? options.find(o => o.value === value)?.label
            : placeholder}
          <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 z-120"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Rechercher..." />
          <CommandList>
            <CommandEmpty>Aucun résultat.</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

