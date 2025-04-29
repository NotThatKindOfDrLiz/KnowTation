import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Trash, FileDown, FileUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
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
import { getAllReferences, deleteReference } from '@/services/referenceService';
import { exportToBibTeX } from '@/services/bibtexService';
import { Reference } from '@/types/reference';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  
  // Settings state
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load references for stats
  useEffect(() => {
    const loadReferences = async () => {
      setLoading(true);
      try {
        const allReferences = await getAllReferences();
        setReferences(allReferences);
      } catch (error) {
        console.error('Failed to load references:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReferences();
  }, []);

  // Calculate stats
  const totalReferences = references.length;
  const publicReferences = references.filter(ref => ref.visibility === 'public').length;
  const privateReferences = references.filter(ref => ref.visibility === 'private').length;

  // Handle export all references
  const handleExportAll = () => {
    try {
      // Convert references to BibTeX format
      const bibtex = exportToBibTeX(references);
      
      // Create a download link
      const blob = new Blob([bibtex], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'knowtation-all-references.bib';
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

  // Handle delete all references
  const handleDeleteAllReferences = async () => {
    setDeleteDialogOpen(true);
  };

  // Confirm delete all references
  const confirmDeleteAll = async () => {
    try {
      for (const ref of references) {
        await deleteReference(ref.id);
      }
      
      toast({
        title: 'References Deleted',
        description: `Successfully deleted all ${totalReferences} references`,
      });
      
      // Update references list
      setReferences([]);
    } catch (error) {
      console.error('Failed to delete references:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete all references',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure KnowTation preferences and manage your data
        </p>
      </div>

      {/* Account Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your Nostr account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Nostr Login</h3>
              <p className="text-sm text-muted-foreground">
                {user 
                  ? 'Currently logged in with Nostr' 
                  : 'Log in to sync references across devices'}
              </p>
            </div>
            <LoginArea />
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Sync References</h3>
              <p className="text-sm text-muted-foreground">
                Automatically sync references with Nostr relays
              </p>
            </div>
            <Switch 
              checked={syncEnabled} 
              onCheckedChange={setSyncEnabled}
              disabled={!user}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your reference library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Library Stats */}
          <div className="bg-muted rounded-md p-4 mb-6">
            <h3 className="font-medium mb-2">Library Statistics</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading stats...</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">{totalReferences}</p>
                  <p className="text-sm text-muted-foreground">Total References</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{publicReferences}</p>
                  <p className="text-sm text-muted-foreground">Public</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{privateReferences}</p>
                  <p className="text-sm text-muted-foreground">Private</p>
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Export All References</h3>
              <p className="text-sm text-muted-foreground">
                Export your entire library as BibTeX
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportAll}
              disabled={references.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Import */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Import References</h3>
              <p className="text-sm text-muted-foreground">
                Import references from BibTeX
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/import')}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Delete All */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-destructive">Delete All References</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete all references in your library
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAllReferences}
              disabled={references.length === 0}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About KnowTation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>
            <strong>KnowTation</strong> is a lightweight, privacy-first, decentralized citation management tool.
          </p>
          <p className="text-sm text-muted-foreground">
            Own your sources. Organize your knowledge.
          </p>
          <p className="text-sm mt-4">
            Version 1.0.0
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ using Nostr
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All References</AlertDialogTitle>
            <AlertDialogDescription>
              <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
              This will permanently delete all {totalReferences} references in your library.
              This action cannot be undone.
              
              {publicReferences > 0 && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                  Note: This will not retract already published references from the Nostr network.
                  You may want to manually retract published references first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAll} className="bg-destructive text-destructive-foreground">
              Yes, Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;