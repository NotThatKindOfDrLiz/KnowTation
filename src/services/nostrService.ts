/**
 * Nostr service for KnowTation
 * Handles interaction with Nostr relays for references
 */

import { useNostr } from '@nostrify/react';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { 
  Reference, 
  PublicReferenceEvent, 
  PrivateReferenceEvent 
} from '@/types/reference';
import { encryptData, deriveEncryptionKey } from '@/utils/encryption';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// Kind numbers for reference events
export const REFERENCE_PUBLIC_KIND = 50000;
export const REFERENCE_PRIVATE_KIND = 50001;
export const REFERENCE_DELETE_KIND = 5;

/**
 * Hook to publish a public reference to Nostr
 */
export function usePublishPublicReference() {
  const { mutate: publishEvent } = useNostrPublish();

  return useMutation({
    mutationFn: async (reference: Reference): Promise<string> => {
      // Convert reference to Nostr event tags format
      const tags: string[][] = [
        ['title', reference.title],
        ...reference.authors.map(author => ['author', author]),
      ];

      // Add optional fields if they exist
      if (reference.year) {
        tags.push(['year', reference.year.toString()]);
      }

      if (reference.journalOrBook) {
        tags.push(['journal', reference.journalOrBook]);
      }

      if (reference.doi) {
        tags.push(['doi', reference.doi]);
      }

      if (reference.url) {
        tags.push(['url', reference.url]);
      }

      // Add all tags
      reference.tags.forEach(tag => {
        tags.push(['t', tag]);
      });

      // Include reference ID for client-side syncing
      tags.push(['client-ref-id', reference.id]);
      
      // Build the event template
      const eventTemplate: PublicReferenceEvent = {
        kind: REFERENCE_PUBLIC_KIND,
        content: 'KnowTation public reference',
        tags,
        created_at: Math.floor(Date.now() / 1000)
      };

      // Return a promise that resolves when the event is published
      return new Promise((resolve, reject) => {
        try {
          publishEvent(eventTemplate, {
            onSuccess: (data) => {
              // The actual event id isn't directly returned from the mutation
              // but we should be able to retrieve it from the event content in a real implementation
              // For now, we'll use a placeholder
              const eventId = 'event:placeholder'; 
              resolve(eventId);
            },
            onError: (error) => {
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  });
}

/**
 * Hook to publish a private reference to Nostr
 */
export function usePublishPrivateReference() {
  const { mutate: publishEvent } = useNostrPublish();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (reference: Reference): Promise<string> => {
      if (!user) {
        throw new Error('User must be logged in to publish private references');
      }

      // Derive encryption key from user's public key
      const encryptionKey = await deriveEncryptionKey(user.pubkey);
      
      // Serialize reference data for encryption
      const dataToEncrypt = JSON.stringify(reference);
      
      // Encrypt the reference data
      const encryptedData = await encryptData(dataToEncrypt, encryptionKey);
      
      // Create minimal tags (just enough to identify it's a reference without revealing content)
      const tags: string[][] = [
        ['client-ref-id', reference.id],
        ['e-type', 'reference'] // Indicate this is an encrypted reference
      ];
      
      // Build event template
      const eventTemplate: PrivateReferenceEvent = {
        kind: REFERENCE_PRIVATE_KIND,
        content: encryptedData,
        tags,
        created_at: Math.floor(Date.now() / 1000)
      };
      
      // Return a promise that resolves when the event is published
      return new Promise((resolve, reject) => {
        try {
          publishEvent(eventTemplate, {
            onSuccess: (data) => {
              // The event id placeholder (would be properly implemented in production)
              const eventId = 'event:placeholder:private'; 
              resolve(eventId);
            },
            onError: (error) => {
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  });
}

/**
 * Hook to retract/delete a reference from Nostr
 */
export function useRetractReference() {
  const { mutate: publishEvent } = useNostrPublish();
  
  return useMutation({
    mutationFn: async ({ reference, reason = 'Deleted by user' }: { 
      reference: Reference;
      reason?: string; 
    }): Promise<boolean> => {
      if (!reference.eventId) {
        throw new Error('Cannot retract a reference that has not been published to Nostr');
      }
      
      // Create the retraction event
      const eventTemplate: PublicReferenceEvent = {
        kind: REFERENCE_DELETE_KIND,
        content: reason,
        tags: [['e', reference.eventId]],
        created_at: Math.floor(Date.now() / 1000)
      };
      
      // Return a promise that resolves when the retraction is published
      return new Promise((resolve, reject) => {
        try {
          publishEvent(eventTemplate, {
            onSuccess: () => {
              resolve(true);
            },
            onError: (error) => {
              reject(error);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  });
}

/**
 * Hook to fetch public references from Nostr
 */
export function useFetchPublicReferences(limit = 50, authors?: string[]) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  
  return useQuery({
    queryKey: ['publicReferences', limit, authors],
    queryFn: async () => {
      // Prepare filters
      const filters: any[] = [{
        kinds: [REFERENCE_PUBLIC_KIND],
        limit
      }];
      
      // Add author filter if specified
      if (authors && authors.length > 0) {
        filters[0].authors = authors;
      }
      
      // Query the Nostr network
      const events = await nostr.query(
        filters, 
        { signal: AbortSignal.timeout(5000) }
      );
      
      // Process the events into reference objects
      return events.map(event => {
        // Extract reference data from tags
        const titleTag = event.tags.find(tag => tag[0] === 'title');
        const authorTags = event.tags.filter(tag => tag[0] === 'author');
        const yearTag = event.tags.find(tag => tag[0] === 'year');
        const journalTag = event.tags.find(tag => tag[0] === 'journal');
        const doiTag = event.tags.find(tag => tag[0] === 'doi');
        const urlTag = event.tags.find(tag => tag[0] === 'url');
        const tagTags = event.tags.filter(tag => tag[0] === 't');
        const clientRefIdTag = event.tags.find(tag => tag[0] === 'client-ref-id');
        
        // Build reference object
        const reference: Reference = {
          id: clientRefIdTag?.[1] || event.id,
          title: titleTag?.[1] || 'Untitled Reference',
          authors: authorTags.map(tag => tag[1]),
          year: yearTag ? parseInt(yearTag[1]) : undefined,
          journalOrBook: journalTag?.[1],
          doi: doiTag?.[1],
          url: urlTag?.[1],
          tags: tagTags.map(tag => tag[1]),
          visibility: 'public',
          createdAt: event.created_at,
          updatedAt: event.created_at,
          eventId: event.id
        };
        
        return reference;
      });
    },
    enabled: !!user, // Only run the query if user is logged in
    refetchOnWindowFocus: false,
    staleTime: 300000 // 5 minutes
  });
}