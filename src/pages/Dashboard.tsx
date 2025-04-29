import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUpDown, Share2, AlertTriangle, FileUp, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SearchBar from '@/components/SearchBar';
import FilterControls from '@/components/FilterControls';
import ReferenceCard from '@/components/ReferenceCard';
import { LoginArea } from '@/components/auth/LoginArea';
import { Reference } from '@/types/reference';
import {
  getAllReferences,
  getAllTags,
  getAllAuthors,
  searchReferences,
  deleteReference,
} from '@/services/referenceService';
import { useRetractReference } from '@/services/nostrService';
import { exportToBibTeX } from '@/services/bibtexService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { mutateAsync: retractReference } = useRetractReference();

  // State variables
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    author: string | null;
    tag: string | null;
    year: number | null;
    visibility: 'public' | 'private' | null;
  }>({
    author: null,
    tag: null,
    year: null,
    visibility: null,
  });
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');
  
  // Data for filters
  const [authors, setAuthors] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  
  // Alert dialog for deletion confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [referenceToDelete, setReferenceToDelete] = useState<Reference | null>(null);

  // Load references data
  useEffect(() => {
    loadReferences();
  }, [searchQuery, filters, sortOrder]);

  // Load filter data
  useEffect(() => {
    loadFilterData();
  }, []);

  const loadReferences = async () => {
    setLoading(true);
    try {
      // Get references
      let results = await searchReferences(searchQuery, {
        authors: filters.author ? [filters.author] : undefined,
        year: filters.year || undefined,
        tags: filters.tag ? [filters.tag] : undefined,
        visibility: filters.visibility,
      });
      
      // Apply sorting
      results = sortReferences(results, sortOrder);
      
      setReferences(results);
    } catch (error) {
      console.error('Failed to load references:', error);
      toast({
        title: 'Error',
        description: 'Failed to load references. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFilterData = async () => {
    try {
      // Get all authors
      const authorsList = await getAllAuthors();
      setAuthors(authorsList);
      
      // Get all tags
      const tagsList = await getAllTags();
      setTags(tagsList);
      
      // Get all years (unique)
      const allReferences = await getAllReferences();
      const yearsSet = new Set<number>();
      allReferences.forEach(ref => {
        if (ref.year) {
          yearsSet.add(ref.year);
        }
      });
      setYears(Array.from(yearsSet).sort());
      
    } catch (error) {
      console.error('Failed to load filter data:', error);
    }
  };

  const sortReferences = (refs: Reference[], order: 'newest' | 'oldest' | 'title'): Reference[] => {
    return [...refs].sort((a, b) => {
      switch (order) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSortChange = () => {
    const orders: Array<'newest' | 'oldest' | 'title'> = ['newest', 'oldest', 'title'];
    const currentIndex = orders.indexOf(sortOrder);
    const nextIndex = (currentIndex + 1) % orders.length;
    setSortOrder(orders[nextIndex]);
  };

  const handleAddReference = () => {
    navigate('/add');
  };

  const handleEditReference = (id: string) => {
    navigate(`/edit/${id}`);
  };

  const handleViewReference = (id: string) => {
    navigate(`/view/${id}`);
  };

  const handleDeleteReference = (id: string) => {
    const reference = references.find(ref => ref.id === id);
    if (reference) {
      setReferenceToDelete(reference);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!referenceToDelete) return;
    
    try {
      // Delete from local storage
      await deleteReference(referenceToDelete.id);
      
      // If the reference is published, retract it from Nostr
      if (referenceToDelete.eventId && referenceToDelete.visibility === 'public') {
        await retractReference({
          reference: referenceToDelete,
          reason: 'Deleted by user'
        });
      }
      
      // Refresh the list
      loadReferences();
      
      toast({
        title: 'Success',
        description: 'Reference deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete reference:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reference. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setReferenceToDelete(null);
    }
  };

  const handleShareReference = (reference: Reference) => {
    // For MVP, just copy the reference title to clipboard
    navigator.clipboard.writeText(reference.title);
    toast({
      title: 'Copied to clipboard',
      description: 'Reference title copied to clipboard',
    });
  };

  const handleExportReferences = () => {
    try {
      // Convert references to BibTeX format
      const bibtex = exportToBibTeX(references);
      
      // Create a download link
      const blob = new Blob([bibtex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'knowtation-references.bib';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: `Exported ${references.length} references to BibTeX format`,
      });
    } catch (error) {
      console.error('Failed to export references:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export references to BibTeX',
        variant: 'destructive',
      });
    }
  };

  const handleImportReferences = () => {
    // Navigate to import page (to be implemented)
    navigate('/import');
  };

  // Get appropriate sort button text
  const getSortButtonText = () => {
    switch (sortOrder) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'title': return 'By Title';
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KnowTation</h1>
            <p className="text-muted-foreground mt-1">
              Own your sources. Organize your knowledge.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LoginArea />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <div className="flex-1">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search references..."
              className="w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="whitespace-nowrap"
              onClick={handleSortChange}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {getSortButtonText()}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleImportReferences}
              title="Import BibTeX"
            >
              <FileUp className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleExportReferences}
              title="Export as BibTeX"
              disabled={references.length === 0}
            >
              <FileDown className="h-4 w-4" />
            </Button>
            
            <Button onClick={handleAddReference}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reference
            </Button>
          </div>
        </div>
        
        <FilterControls 
          authors={authors}
          tags={tags}
          years={years}
          onFilterChange={handleFilterChange}
        />
      </header>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading references...</p>
        </div>
      ) : references.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">No references found</p>
          {searchQuery || filters.author || filters.tag || filters.year || filters.visibility ? (
            <p>Try adjusting your search or filters</p>
          ) : (
            <Button onClick={handleAddReference} variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              Add your first reference
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {references.map((reference) => (
            <ReferenceCard
              key={reference.id}
              reference={reference}
              onEdit={handleEditReference}
              onDelete={handleDeleteReference}
              onView={handleViewReference}
              onShare={handleShareReference}
            />
          ))}
        </div>
      )}

      {!user && references.length > 0 && (
        <div className="mt-6 p-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Not logged in</p>
            <p className="text-sm">Sign in with your Nostr key to sync references across devices and publish to the Nostr network.</p>
          </div>
        </div>
      )}

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>Built with ❤️ using Nostr</p>
      </footer>

      {/* Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reference</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reference?
              {referenceToDelete?.visibility === 'public' && referenceToDelete?.eventId && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  This reference has been published to the Nostr network and will be retracted.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;