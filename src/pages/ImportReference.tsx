import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, FileUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { parseBibTeX } from '@/services/bibtexService';
import { createReference } from '@/services/referenceService';
import { Reference } from '@/types/reference';

const ImportReference: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bibtexInput, setBibtexInput] = useState('');
  const [parsedReferences, setParsedReferences] = useState<Reference[]>([]);
  const [importing, setImporting] = useState(false);
  const [parseStep, setParseStep] = useState<'input' | 'preview' | 'success'>('input');
  const [importStats, setImportStats] = useState({ 
    total: 0, 
    success: 0, 
    failed: 0 
  });

  // Handle BibTeX parsing
  const handleParse = () => {
    if (!bibtexInput.trim()) {
      toast({
        title: 'Empty Input',
        description: 'Please enter BibTeX data to import.',
        variant: 'warning',
      });
      return;
    }
    
    try {
      // Parse the BibTeX
      const references = parseBibTeX(bibtexInput);
      
      if (references.length === 0) {
        toast({
          title: 'No References Found',
          description: 'Could not find any valid references in the provided BibTeX.',
          variant: 'warning',
        });
        return;
      }
      
      // Set the parsed references for preview
      setParsedReferences(references);
      
      // Move to preview step
      setParseStep('preview');
      
      // Show success message
      toast({
        title: 'BibTeX Parsed',
        description: `Found ${references.length} references. Review before importing.`,
      });
    } catch (error) {
      console.error('Failed to parse BibTeX:', error);
      toast({
        title: 'Parse Error',
        description: 'Failed to parse the BibTeX data. Check format and try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle import after preview
  const handleImport = async () => {
    if (parsedReferences.length === 0) return;
    
    setImporting(true);
    
    // Track import results
    let succeeded = 0;
    let failed = 0;
    
    try {
      // Import each reference
      for (const ref of parsedReferences) {
        try {
          await createReference({
            title: ref.title,
            authors: ref.authors,
            year: ref.year,
            journalOrBook: ref.journalOrBook,
            doi: ref.doi,
            url: ref.url,
            tags: ref.tags,
            notes: ref.notes,
            visibility: 'private', // Default to private for imported references
          });
          succeeded++;
        } catch (err) {
          console.error(`Failed to import reference "${ref.title}":`, err);
          failed++;
        }
      }
      
      // Show result
      setImportStats({
        total: parsedReferences.length,
        success: succeeded,
        failed
      });
      
      // Move to success step
      setParseStep('success');
      
      // Only show toast if there were failures
      if (failed > 0) {
        toast({
          title: 'Partial Import',
          description: `Imported ${succeeded} of ${parsedReferences.length} references. ${failed} failed.`,
          variant: 'warning',
        });
      } else {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${succeeded} references.`,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Error',
        description: 'An error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBibtexInput(content);
      }
    };
    reader.onerror = () => {
      toast({
        title: 'File Error',
        description: 'Failed to read the file.',
        variant: 'destructive',
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <h1 className="text-3xl font-bold mb-6">Import References</h1>

      {parseStep === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Import BibTeX</CardTitle>
            <CardDescription>
              Paste BibTeX data or upload a .bib file to import references.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste BibTeX data here..."
                className="min-h-[250px] font-mono text-sm"
                value={bibtexInput}
                onChange={(e) => setBibtexInput(e.target.value)}
              />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Button variant="outline" asChild className="mr-2">
                    <label className="cursor-pointer">
                      <FileUp className="h-4 w-4 mr-2" />
                      Upload .bib file
                      <input
                        type="file"
                        accept=".bib"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </Button>
                </div>
                
                <Button 
                  onClick={handleParse} 
                  disabled={!bibtexInput.trim()}
                >
                  Parse BibTeX
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground mt-4">
                <p>
                  <strong>Note:</strong> Imported references will be stored as private by default.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {parseStep === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review References</CardTitle>
              <CardDescription>
                Found {parsedReferences.length} references to import. Review before confirming.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Title</th>
                        <th className="p-2 text-left">Authors</th>
                        <th className="p-2 text-left">Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedReferences.map((ref, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">
                            <div className="font-medium">{ref.title}</div>
                            {ref.journalOrBook && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {ref.journalOrBook}
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            {ref.authors.length > 2 
                              ? `${ref.authors[0]} et al.` 
                              : ref.authors.join('; ')}
                          </td>
                          <td className="p-2">{ref.year || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setParseStep('input')}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={importing}
                  >
                    {importing ? 'Importing...' : `Import ${parsedReferences.length} References`}
                  </Button>
                </div>
                
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">These references will be imported as private</p>
                    <p>After import, you can edit individual references to make them public.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {parseStep === 'success' && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
            <CardDescription>
              Your references have been imported to KnowTation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-300">
                  Import Summary
                </h3>
                <ul className="mt-2 space-y-1">
                  <li>Total references: {importStats.total}</li>
                  <li>Successfully imported: {importStats.success}</li>
                  {importStats.failed > 0 && (
                    <li className="text-destructive">Failed: {importStats.failed}</li>
                  )}
                </ul>
              </div>
              
              {importStats.failed > 0 && (
                <div className="text-sm text-muted-foreground">
                  Some references couldn't be imported. This may be due to invalid or
                  missing required fields.
                </div>
              )}
              
              <div className="flex justify-end">
                <Button onClick={() => navigate('/')}>
                  Return to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportReference;