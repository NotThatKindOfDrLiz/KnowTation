/**
 * BibTeX service for KnowTation
 * Handles import and export of references in BibTeX format
 */

import { Reference } from '@/types/reference';
import { createCitationKey } from '@/utils/validators';

/**
 * Parse BibTeX string into Reference objects
 */
export function parseBibTeX(bibtex: string): Reference[] {
  const references: Reference[] = [];
  
  // Simple regex-based parsing (a full parser would be more robust)
  const entryRegex = /@(\w+)\s*{\s*([^,]+)\s*,([\s\S]+?)\n}/g;
  const fieldRegex = /(\w+)\s*=\s*{([^}]*)}/g;
  
  let match;
  while ((match = entryRegex.exec(bibtex)) !== null) {
    const entryType = match[1].toLowerCase();
    const citationKey = match[2].trim();
    const fieldsText = match[3];
    
    const fields: Record<string, string> = {};
    let fieldMatch;
    
    while ((fieldMatch = fieldRegex.exec(fieldsText)) !== null) {
      const fieldName = fieldMatch[1].toLowerCase();
      const fieldValue = fieldMatch[2].trim();
      fields[fieldName] = fieldValue;
    }
    
    // Map BibTeX fields to Reference object
    const reference: Reference = {
      id: citationKey, // Use the citation key as the ID
      title: fields.title || 'Untitled Reference',
      authors: parseAuthors(fields.author || ''),
      year: fields.year ? parseInt(fields.year) : undefined,
      journalOrBook: fields.journal || fields.booktitle,
      doi: fields.doi,
      url: fields.url,
      tags: [], // BibTeX doesn't have a standard tags field
      visibility: 'private', // Default to private for imported references
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    };
    
    references.push(reference);
  }
  
  return references;
}

/**
 * Export Reference objects to BibTeX format
 */
export function exportToBibTeX(references: Reference[]): string {
  let bibtex = '';
  
  for (const reference of references) {
    // Determine entry type based on journalOrBook field
    // This is a simplification; real logic would be more complex
    const entryType = reference.journalOrBook ? 
      (reference.journalOrBook.toLowerCase().includes('proceedings') ? 'inproceedings' : 'article') : 
      'misc';
    
    // Create citation key
    const citationKey = createCitationKey(reference);
    
    // Start entry
    bibtex += `@${entryType}{${citationKey},\n`;
    
    // Add required fields
    bibtex += `  title = {${escapeBibTeX(reference.title)}},\n`;
    
    if (reference.authors.length > 0) {
      bibtex += `  author = {${formatAuthorsForBibTeX(reference.authors)}},\n`;
    }
    
    // Add optional fields if they exist
    if (reference.year !== undefined) {
      bibtex += `  year = {${reference.year}},\n`;
    }
    
    if (reference.journalOrBook) {
      const fieldName = entryType === 'article' ? 'journal' : 
                        entryType === 'inproceedings' ? 'booktitle' : 'howpublished';
      bibtex += `  ${fieldName} = {${escapeBibTeX(reference.journalOrBook)}},\n`;
    }
    
    if (reference.doi) {
      bibtex += `  doi = {${escapeBibTeX(reference.doi)}},\n`;
    }
    
    if (reference.url) {
      bibtex += `  url = {${escapeBibTeX(reference.url)}},\n`;
    }
    
    // Add tags as keywords
    if (reference.tags.length > 0) {
      bibtex += `  keywords = {${reference.tags.join(', ')}},\n`;
    }
    
    // Close the entry
    bibtex = bibtex.slice(0, -2) + '\n}\n\n';
  }
  
  return bibtex;
}

/**
 * Parse author string into array of authors
 */
function parseAuthors(authorString: string): string[] {
  // Handle BibTeX author format: "Lastname, Firstname and Lastname2, Firstname2"
  const authors = authorString
    .split(' and ')
    .map(author => author.trim())
    .filter(author => author);
    
  // Reformat "Lastname, Firstname" to "Firstname Lastname"
  return authors.map(author => {
    const parts = author.split(',').map(part => part.trim());
    return parts.length === 2 ? `${parts[1]} ${parts[0]}` : author;
  });
}

/**
 * Format authors for BibTeX output
 */
function formatAuthorsForBibTeX(authors: string[]): string {
  // Convert "Firstname Lastname" to "Lastname, Firstname" for BibTeX
  return authors.map(author => {
    const parts = author.split(' ');
    if (parts.length >= 2) {
      const lastName = parts.pop() || '';
      const firstName = parts.join(' ');
      return `${lastName}, ${firstName}`;
    }
    return author;
  }).join(' and ');
}

/**
 * Escape special characters in BibTeX
 */
function escapeBibTeX(text: string): string {
  return text
    .replace(/[\\{}]/g, '\\$&') // Escape \ and { }
    .replace(/[&%$#_^~]/g, '\\$&'); // Escape other special characters
}