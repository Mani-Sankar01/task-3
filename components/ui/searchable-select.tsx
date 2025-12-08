"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
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
import axios from "axios";
import { useSession } from "next-auth/react";

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  type: "zone" | "mandal";
  disabled?: boolean;
}

interface Option {
  id: number;
  name: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder = "Select...",
  type,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<Option[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const { data: session } = useSession();

  // Determine API endpoints based on type
  // GET endpoints don't have /api prefix, POST endpoints do
  const getEndpoint = type === "zone" ? "/api/referenceData/getZone" : "/api/referenceData/getMandal";
  const addEndpoint = type === "zone" ? "/api/referenceData/addZone" : "/api/referenceData/addMandal";

  // Fetch options on mount and when popover opens
  React.useEffect(() => {
    if (open && !disabled) {
      fetchOptions();
    }
  }, [open, disabled]);

  const fetchOptions = async () => {
    if (!session?.user?.token) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.BACKEND_API_URL}${getEndpoint}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (response.data?.success && Array.isArray(response.data?.result)) {
        setOptions(response.data.result);
      }
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (!searchQuery.trim() || !session?.user?.token) return;

    // Check if the option already exists (case-insensitive)
    const exists = options.some(
      (opt) => opt.name.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    if (exists) {
      // If it exists, just select it
      const existingOption = options.find(
        (opt) => opt.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (existingOption) {
        onValueChange(existingOption.name);
        setOpen(false);
        setSearchQuery("");
      }
      return;
    }

    try {
      setIsAdding(true);
      const response = await axios.post(
        `${process.env.BACKEND_API_URL}${addEndpoint}`,
        { names: [searchQuery.trim()] },
        {
          headers: {
            Authorization: `Bearer ${session.user.token}`,
          },
        }
      );

      if (response.data?.success) {
        // Refresh options after adding
        await fetchOptions();
        // Select the newly added option
        onValueChange(searchQuery.trim());
        setOpen(false);
        setSearchQuery("");
      }
    } catch (error: any) {
      console.error(`Error adding ${type}:`, error);
      alert(error?.response?.data?.message || `Failed to add ${type}. Please try again.`);
    } finally {
      setIsAdding(false);
    }
  };

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value ? (
            selectedOption ? (
              selectedOption.name
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${type}...`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                {filteredOptions.length > 0 ? (
                  <CommandGroup>
                    {filteredOptions.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.name}
                        onSelect={() => {
                          onValueChange(option.name);
                          setOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty>
                    {searchQuery.trim() ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <span className="text-sm text-muted-foreground">
                          No {type} found matching "{searchQuery}"
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddNew}
                          disabled={isAdding}
                          className="mt-2"
                        >
                          {isAdding ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add "{searchQuery}"
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No {type}s found.
                      </span>
                    )}
                  </CommandEmpty>
                )}
                {searchQuery.trim() && filteredOptions.length === 0 && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleAddNew}
                      disabled={isAdding}
                      className="cursor-pointer"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add "{searchQuery}"
                        </>
                      )}
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

