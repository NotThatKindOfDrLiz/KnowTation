import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Eye, EyeOff, Edit, Trash, ExternalLink, Copy, FileDown } from 'lucide-react';
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
import { useToast } from '@/hooks/useToast';
import { formatDistance } from 'date-fns';
import { Reference } from '@/types/reference';
import { getReference, deleteReference } from '@/services/referenceService';
import { useRetractReference } from '@/services/nostrService';
import { exportToBibTeX } from '@/services/bibtexService';

const ViewReference: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { mutateAsync: retractReference } = useRetractReference();

  // State
  const [reference, setReference] = useState<Reference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load reference data
  useEffect(() => {
    const loadReference = async () => {
      setLoading(true);
      try {
        if (!id) {
          throw new Error('Reference ID is required');
        }
        const ref = await getReference(id);
        if (!ref) {
          throw new Error('Reference not found');
        }
        setReference(ref);
        setError(null);
      } catch (err) {
        console.error('Failed to load reference:', err);
        setError('Failed to load reference');
      } finally {
        setLoading(false);
      }
    };

    loadReference();
  }, [id]);

  // Handle edit button
  const handleEdit = () => {
    if (id) {
      navigate(`/edit/${id}`);
    }
  };

  // Handle delete button
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      if (!id || !reference) return;
      
      // Delete from local storage
      await deleteReference(id);
      
      // If reference was published to Nostr, retract it
      if (reference.eventId && reference.visibility === 'public') {
        await retractReference({
          reference,
          reason: 'Deleted by user'
        });
      }
      
      toast({
        title: 'Reference Deleted',
        description: 'The reference was successfully deleted.',
      });
      
      navigate('/');
    } catch (error) {
      console.error('Failed to delete reference:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reference. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Handle copy citation
  const handleCopyCitation = async () => {
    if (!reference) return;
    
    try {
      // Generate BibTeX for just this reference
      const bibtex = exportToBibTeX([reference]);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(bibtex);
      
      toast({
        title: 'Citation Copied',
        description: 'BibTeX citation copied to clipboard',
      });
    } catch (error) {
      console.error('Failed to copy citation:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy citation to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Handle export as BibTeX
  const handleExportBibTeX = () => {
    if (!reference) return;
    
    try {
      // Generate BibTeX for just this reference
      const bibtex = exportToBibTeX([reference]);
      
      // Create download link
      const blob = new Blob([bibtex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reference-${reference.id}.bib`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Reference exported as BibTeX',
      });
    } catch (error) {
      console.error('Failed to export reference:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not export reference as BibTeX',
        variant: 'destructive',
      });
    }
  };

  // If loading or error
  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-8">Loading reference...</div>
      </div>
    );
  }

  if (error || !reference) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-destructive">Error</h2>
          <p className="mt-2">{error || 'Reference not found'}</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-bold">
              {reference.title}
            </CardTitle>
            <Badge 
              variant={reference.visibility === 'public' ? 'default' : 'outline'} 
              className="ml-2"
            >
              {reference.visibility === 'public' ? (
                <Eye className="h-3 w-3 mr-1" />
              ) : (
                <EyeOff className="h-3 w-3 mr-1" />
              )}
              {reference.visibility}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Authors */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Authors</h3>
            <p>{reference.authors.join('; ')}</p>
          </div>

          {/* Publication Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year */}
            {reference.year && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Year</h3>
                <p>{reference.year}</p>
              </div>
            )}
            
            {/* Journal/Book */}
            {reference.journalOrBook && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Journal/Book
                </h3>
                <p>{reference.journalOrBook}</p>
              </div>
            )}
            
            {/* DOI */}
            {reference.doi && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">DOI</h3>
                <p className="flex items-center">
                  <a
                    href={`https://doi.org/${reference.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    {reference.doi}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </p>
              </div>
            )}
            
            {/* URL */}
            {reference.url && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">URL</h3>
                <p className="flex items-center">
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center truncate"
                  >
                    {reference.url}
                    <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                  </a>
                </p>
              </div>
            )}
          </div>
          
          {/* Tags */}
          {reference.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {reference.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Private Notes */}
          {reference.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
              <div className="bg-muted p-3 rounded-md">
                <p className="whitespace-pre-wrap">{reference.notes}</p>
              </div>
            </div>
          )}
          
          {/* Event ID for Published References */}
          {reference.eventId && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Nostr Event ID
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {reference.eventId}
              </p>
            </div>
          )}
          
          <Separator />
          
          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p>
                Created: {formatDistance(reference.createdAt * 1000, new Date(), { addSuffix: true })}
              </p>
            </div>
            <div>
              <p>
                Updated: {formatDistance(reference.updatedAt * 1000, new Date(), { addSuffix: true })}
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-3">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopyCitation} title="Copy BibTeX">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportBibTeX} title="Download BibTeX">
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reference</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reference?
              {reference.visibility === 'public' && reference.eventId && (
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

export default ViewReference;