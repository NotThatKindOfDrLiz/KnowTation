import React from 'react';
import { NPool, NRelay1, NostrEvent } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';

// Default relays for KnowTation
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.snort.social',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];

interface NostrProviderProps {
  children: React.ReactNode;
  relays?: string[];
}

/**
 * KnowTation-specific Nostr provider with default relays
 */
const NostrProvider: React.FC<NostrProviderProps> = ({ 
  children,
  relays = DEFAULT_RELAYS
}) => {
  // Create NPool instance
  const pool = React.useMemo(() => {
    return new NPool({
      open(url: string) {
        return new NRelay1(url);
      },
      reqRouter(filters) {
        return new Map(relays.map((url) => [url, filters]));
      },
      eventRouter(_event: NostrEvent) {
        return relays;
      },
    });
  }, [relays]);

  return (
    <NostrContext.Provider value={{ nostr: pool }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;