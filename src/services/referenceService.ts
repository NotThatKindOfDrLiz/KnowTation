/**
 * Reference service for KnowTation
 * Handles CRUD operations for references using localStorage/IndexedDB
 */

import { Reference, ReferenceFormData } from '@/types/reference';

// LocalStorage key for references
const REFERENCES_STORAGE_KEY = 'knowtation:references';

/**
 * Retrieve all references from local storage
 */
export async function getAllReferences(): Promise<Reference[]> {
  try {
    const storedReferences = localStorage.getItem(REFERENCES_STORAGE_KEY);
    if (!storedReferences) {
      return [];
    }
    return JSON.parse(storedReferences);
  } catch (error) {
    console.error('Failed to retrieve references:', error);
    return [];
  }
}

/**
 * Retrieve a specific reference by ID
 */
export async function getReference(id: string): Promise<Reference | null> {
  const references = await getAllReferences();
  return references.find(ref => ref.id === id) || null;
}

/**
 * Create a new reference
 */
export async function createReference(referenceData: ReferenceFormData): Promise<Reference> {
  const references = await getAllReferences();
  
  // Create a new reference object with generated ID
  const newReference: Reference = {
    ...referenceData,
    id: generateUniqueId(),
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    tags: referenceData.tags || []
  };
  
  // Add to the list and save
  references.push(newReference);
  await saveReferences(references);
  
  return newReference;
}

/**
 * Update an existing reference
 */
export async function updateReference(id: string, referenceData: ReferenceFormData): Promise<Reference | null> {
  const references = await getAllReferences();
  const index = references.findIndex(ref => ref.id === id);
  
  if (index === -1) {
    return null;
  }
  
  // Update the reference while preserving the original ID and creation date
  const updatedReference: Reference = {
    ...references[index],
    ...referenceData,
    updatedAt: Math.floor(Date.now() / 1000)
  };
  
  references[index] = updatedReference;
  await saveReferences(references);
  
  return updatedReference;
}

/**
 * Delete a reference by ID
 */
export async function deleteReference(id: string): Promise<boolean> {
  const references = await getAllReferences();
  const filteredReferences = references.filter(ref => ref.id !== id);
  
  if (filteredReferences.length === references.length) {
    // Reference not found
    return false;
  }
  
  await saveReferences(filteredReferences);
  return true;
}

/**
 * Update a reference's eventId after publishing to Nostr
 */
export async function updateReferenceEventId(id: string, eventId: string): Promise<Reference | null> {
  const references = await getAllReferences();
  const index = references.findIndex(ref => ref.id === id);
  
  if (index === -1) {
    return null;
  }
  
  references[index] = {
    ...references[index],
    eventId,
    updatedAt: Math.floor(Date.now() / 1000)
  };
  
  await saveReferences(references);
  return references[index];
}

/**
 * Search for references based on criteria
 */
export async function searchReferences(
  query: string,
  filters: {
    authors?: string[],
    year?: number,
    tags?: string[],
    visibility?: 'public' | 'private'
  } = {}
): Promise<Reference[]> {
  const references = await getAllReferences();
  
  return references.filter(reference => {
    // Filter by search query (title, authors, journal)
    if (query) {
      const lowerQuery = query.toLowerCase();
      const matchesTitle = reference.title.toLowerCase().includes(lowerQuery);
      const matchesAuthors = reference.authors.some(author => 
        author.toLowerCase().includes(lowerQuery)
      );
      const matchesJournal = reference.journalOrBook?.toLowerCase().includes(lowerQuery);
      
      if (!(matchesTitle || matchesAuthors || matchesJournal)) {
        return false;
      }
    }
    
    // Apply additional filters
    if (filters.authors?.length && !filters.authors.some(author => 
      reference.authors.some(a => a.toLowerCase().includes(author.toLowerCase()))
    )) {
      return false;
    }
    
    if (filters.year !== undefined && reference.year !== filters.year) {
      return false;
    }
    
    if (filters.tags?.length && !filters.tags.some(tag => 
      reference.tags.includes(tag)
    )) {
      return false;
    }
    
    if (filters.visibility && reference.visibility !== filters.visibility) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get all unique tags from references
 */
export async function getAllTags(): Promise<string[]> {
  const references = await getAllReferences();
  const tagsSet = new Set<string>();
  
  references.forEach(reference => {
    reference.tags.forEach(tag => {
      tagsSet.add(tag);
    });
  });
  
  return [...tagsSet].sort();
}

/**
 * Get all unique authors from references
 */
export async function getAllAuthors(): Promise<string[]> {
  const references = await getAllReferences();
  const authorsSet = new Set<string>();
  
  references.forEach(reference => {
    reference.authors.forEach(author => {
      authorsSet.add(author);
    });
  });
  
  return [...authorsSet].sort();
}

/**
 * Save references to local storage
 */
async function saveReferences(references: Reference[]): Promise<void> {
  try {
    localStorage.setItem(REFERENCES_STORAGE_KEY, JSON.stringify(references));
  } catch (error) {
    console.error('Failed to save references:', error);
    throw error;
  }
}

/**
 * Generate a unique ID for new references
 */
function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}