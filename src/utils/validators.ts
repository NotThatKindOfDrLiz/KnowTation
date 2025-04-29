import { z } from 'zod';
import type { ReferenceFormData } from '@/types/reference';

// Define validation schema for Reference
export const referenceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  authors: z.array(z.string()).min(1, "At least one author is required"),
  year: z.number().int().min(0).max(new Date().getFullYear() + 10).optional(),
  journalOrBook: z.string().optional(),
  doi: z.string().optional()
    .refine(val => !val || /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(val), {
      message: "Invalid DOI format. Should start with 10. followed by numbers and a slash"
    }),
  url: z.string().url("Invalid URL format").optional().or(z.string().length(0)),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  visibility: z.enum(['public', 'private'])
});

/**
 * Validates a reference object against the schema
 * 
 * @param data - Reference data to validate
 * @returns Validation result with success flag and errors
 */
export function validateReference(data: ReferenceFormData): { 
  success: boolean; 
  errors?: Record<string, string[]>;
} {
  try {
    referenceSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format ZodError into a more usable structure
      const errors: Record<string, string[]> = {};
      
      for (const issue of error.errors) {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(issue.message);
      }
      
      return { success: false, errors };
    }
    
    // For any other errors
    return { 
      success: false, 
      errors: { 
        _general: ["An unexpected error occurred during validation"] 
      }
    };
  }
}

/**
 * Creates a citation key from reference data
 * Based on the common format: FirstAuthorLastName + Year + FirstTitleWord
 * 
 * @param reference - Reference data to create key from
 * @returns A unique citation key
 */
export function createCitationKey(reference: { 
  authors: string[], 
  year?: number, 
  title: string 
}): string {
  // Extract first author's last name
  const firstAuthor = reference.authors[0] || 'Unknown';
  const lastNameMatch = firstAuthor.match(/(\S+)$/);
  const lastName = lastNameMatch ? lastNameMatch[1] : 'Unknown';
  
  // Get year or use 'nd' for "no date"
  const year = reference.year?.toString() || 'nd';
  
  // Get first significant word from title (skip articles, prepositions, etc.)
  const skipWords = ['a', 'an', 'the', 'on', 'in', 'at', 'to', 'for', 'of'];
  const titleWords = reference.title.split(/\s+/);
  const firstSignificantWord = titleWords.find(word => 
    !skipWords.includes(word.toLowerCase())
  ) || titleWords[0] || 'untitled';
  
  // Combine and clean up (remove special characters)
  const rawCitationKey = `${lastName}${year}${firstSignificantWord}`;
  return rawCitationKey
    .replace(/[^\w]/g, '') // Remove non-alphanumeric chars
    .replace(/\s+/g, '')    // Remove spaces
    .toLowerCase();
}