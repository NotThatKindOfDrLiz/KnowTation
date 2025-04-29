// Types for the KnowTation citation management tool

/**
 * Defines the visibility of a reference
 */
export type ReferenceVisibility = 'public' | 'private';

/**
 * Core reference data structure
 */
export interface Reference {
  id: string;                   // Unique identifier for the reference
  title: string;                // Title of the book, paper, or article
  authors: string[];            // List of author names
  year?: number;                // Publication year
  journalOrBook?: string;       // Journal or book title 
  doi?: string;                 // Digital Object Identifier
  url?: string;                 // URL to the reference
  tags: string[];               // Tags for categorization
  notes?: string;               // Private notes (will be encrypted for private refs)
  visibility: ReferenceVisibility; // Public or private status
  createdAt: number;            // Unix timestamp when the reference was created
  updatedAt: number;            // Unix timestamp when the reference was last updated
  eventId?: string;             // Nostr event ID for published references
}

/**
 * Reference form data for creating or editing references
 */
export interface ReferenceFormData {
  title: string;
  authors: string[];
  year?: number;
  journalOrBook?: string;
  doi?: string;
  url?: string;
  tags: string[];
  notes?: string;
  visibility: ReferenceVisibility;
}

/**
 * Nostr event specific fields for public references
 */
export interface PublicReferenceEvent {
  kind: number;            // 50000 for our public references
  content: string;         // May contain additional info
  tags: string[][];        // Structured data about the reference
  created_at: number;      // Creation timestamp
}

/**
 * Nostr event specific fields for private references
 */
export interface PrivateReferenceEvent {
  kind: number;            // 50001 for our private references
  content: string;         // Encrypted reference data
  tags: string[][];        // Minimal metadata
  created_at: number;      // Creation timestamp
}

/**
 * Deletion/retraction event 
 */
export interface RetractionEvent {
  kind: number;            // 5 for deletion/replacement events
  content: string;         // Reason for deletion
  tags: string[][];        // Contains a tag with the event IDs being retracted
  created_at: number;      // Creation timestamp
}

/**
 * BibTeX representation of a reference
 */
export interface BibTeXReference {
  entryType: string;       // e.g., "article", "book", "inproceedings"
  citationKey: string;     // Unique reference key for citation
  fields: Record<string, string>; // BibTeX fields like author, title, year, etc.
}