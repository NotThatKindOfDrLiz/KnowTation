import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterControlsProps {
  authors: string[];
  tags: string[];
  years: number[];
  onFilterChange: (filters: {
    author?: string | null;
    tag?: string | null;
    year?: number | null;
    visibility?: 'public' | 'private' | null;
  }) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  authors,
  tags,
  years,
  onFilterChange,
}) => {
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'private' | null>(null);
  const [authorSearchValue, setAuthorSearchValue] = useState('');
  const [tagSearchValue, setTagSearchValue] = useState('');
  const [filtersApplied, setFiltersApplied] = useState(0);

  // Apply filters when they change
  useEffect(() => {
    onFilterChange({
      author: selectedAuthor,
      tag: selectedTag,
      year: selectedYear,
      visibility: selectedVisibility,
    });

    // Count active filters
    let count = 0;
    if (selectedAuthor) count++;
    if (selectedTag) count++;
    if (selectedYear) count++;
    if (selectedVisibility) count++;
    setFiltersApplied(count);
  }, [selectedAuthor, selectedTag, selectedYear, selectedVisibility, onFilterChange]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedAuthor(null);
    setSelectedTag(null);
    setSelectedYear(null);
    setSelectedVisibility(null);
    setAuthorSearchValue('');
    setTagSearchValue('');
  };

  // Filter authors based on search
  const filteredAuthors = authorSearchValue
    ? authors.filter(author =>
        author.toLowerCase().includes(authorSearchValue.toLowerCase())
      )
    : authors;

  // Filter tags based on search
  const filteredTags = tagSearchValue
    ? tags.filter(tag =>
        tag.toLowerCase().includes(tagSearchValue.toLowerCase())
      )
    : tags;

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        {/* Author Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              Author
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[200px]" align="start">
            <Command>
              <CommandInput
                placeholder="Search authors..."
                value={authorSearchValue}
                onValueChange={setAuthorSearchValue}
              />
              <CommandList>
                <CommandEmpty>No authors found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[200px]">
                    {filteredAuthors.map((author) => (
                      <CommandItem
                        key={author}
                        value={author}
                        onSelect={() => {
                          setSelectedAuthor(selectedAuthor === author ? null : author);
                          setAuthorSearchValue('');
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedAuthor === author ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span>{author}</span>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Tag Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              Tag
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[200px]" align="start">
            <Command>
              <CommandInput
                placeholder="Search tags..."
                value={tagSearchValue}
                onValueChange={setTagSearchValue}
              />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[200px]">
                    {filteredTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={() => {
                          setSelectedTag(selectedTag === tag ? null : tag);
                          setTagSearchValue('');
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedTag === tag ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span>{tag}</span>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Year Filter */}
        <Select
          value={selectedYear !== null ? selectedYear.toString() : "any"}
          onValueChange={(value) => setSelectedYear(value === "any" ? null : Number(value))}
        >
          <SelectTrigger className="w-24 h-9">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Year</SelectLabel>
              {years
                .sort((a, b) => b - a)
                .map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              <SelectItem value="any">Clear selection</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Visibility Filter */}
        <Select
          value={selectedVisibility ?? "any"}
          onValueChange={(value) => 
            setSelectedVisibility(value === "any" ? null : value as 'public' | 'private')
          }
        >
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Visibility</SelectLabel>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="any">Clear selection</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Reset button */}
        {filtersApplied > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9"
          >
            <X className="mr-1 h-4 w-4" />
            Reset ({filtersApplied})
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      <div className="flex flex-wrap gap-1 mt-2">
        {selectedAuthor && (
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            Author: {selectedAuthor}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => setSelectedAuthor(null)}
            />
          </Badge>
        )}
        {selectedTag && (
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            Tag: {selectedTag}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => setSelectedTag(null)}
            />
          </Badge>
        )}
        {selectedYear && (
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            Year: {selectedYear}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => setSelectedYear(null)}
            />
          </Badge>
        )}
        {selectedVisibility && (
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            Visibility: {selectedVisibility}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => setSelectedVisibility(null)}
            />
          </Badge>
        )}
      </div>
    </div>
  );
};

export default FilterControls;
