import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Lock, Globe } from 'lucide-react';
import { referenceSchema } from '@/utils/validators';
import { ReferenceFormData } from '@/types/reference';

interface ReferenceFormProps {
  initialValues?: ReferenceFormData;
  onSubmit: (data: ReferenceFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

// Helper function to create empty form values
const createEmptyReference = (): ReferenceFormData => ({
  title: '',
  authors: [''],
  year: undefined,
  journalOrBook: '',
  doi: '',
  url: '',
  tags: [],
  notes: '',
  visibility: 'private',
});

const ReferenceForm: React.FC<ReferenceFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  // Form setup with validation
  const form = useForm<ReferenceFormData>({
    resolver: zodResolver(referenceSchema),
    defaultValues: initialValues || createEmptyReference(),
  });

  // State for handling dynamic authors and tags
  const [authors, setAuthors] = useState<string[]>(initialValues?.authors || ['']);
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>(initialValues?.tags || []);
  
  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
      setAuthors(initialValues.authors);
      setTags(initialValues.tags || []);
    }
  }, [initialValues, form]);

  // Handle form submission
  const handleSubmit = (data: ReferenceFormData) => {
    // Use the latest authors and tags states
    const formattedData = {
      ...data,
      authors: authors.filter(author => author.trim() !== ''),
      tags,
    };
    
    onSubmit(formattedData);
  };

  // Author management
  const addAuthorField = () => {
    setAuthors([...authors, '']);
  };

  const removeAuthorField = (index: number) => {
    const newAuthors = [...authors];
    newAuthors.splice(index, 1);
    setAuthors(newAuthors);
  };

  const updateAuthor = (index: number, value: string) => {
    const newAuthors = [...authors];
    newAuthors[index] = value;
    setAuthors(newAuthors);
    form.setValue('authors', newAuthors, { shouldValidate: true });
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() !== '' && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue('tags', newTags, { shouldValidate: true });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    form.setValue('tags', newTags, { shouldValidate: true });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Title Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Reference title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Authors Fields */}
        <div className="space-y-2">
          <FormLabel>Authors *</FormLabel>
          {authors.map((author, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder={`Author ${index + 1}`}
                value={author}
                onChange={(e) => updateAuthor(index, e.target.value)}
                className="flex-grow"
              />
              {authors.length > 1 && (
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAuthorField(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addAuthorField}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Author
          </Button>
          {form.formState.errors.authors && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.authors.message}
            </p>
          )}
        </div>

        {/* Year Field */}
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Publication year"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Journal/Book Field */}
        <FormField
          control={form.control}
          name="journalOrBook"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Journal/Book Title</FormLabel>
              <FormControl>
                <Input placeholder="Journal or book title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* DOI Field */}
        <FormField
          control={form.control}
          name="doi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>DOI</FormLabel>
              <FormControl>
                <Input placeholder="10.xxxx/xxxxx" {...field} />
              </FormControl>
              <FormDescription>
                Digital Object Identifier (e.g., 10.1000/xyz123)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL Field */}
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Field */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} className="flex items-center gap-1 px-3 py-1">
                {tag}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTag(tag)} 
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add tags..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="flex-grow"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={addTag}
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>
          <FormDescription>
            Press Enter or comma to add a tag
          </FormDescription>
        </div>

        {/* Notes Field */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Private Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Your private notes about this reference..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Notes are always encrypted when synced and never shared publicly.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Visibility Field */}
        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Visibility</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="private" />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center gap-1">
                      <Lock className="h-4 w-4" /> Private (Only visible to you)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="public" />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center gap-1">
                      <Globe className="h-4 w-4" /> Public (Visible on Nostr network)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Reference' : 'Save Reference'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ReferenceForm;