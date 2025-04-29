import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ReferenceForm from '@/components/ReferenceForm';
import { useToast } from '@/hooks/useToast';
import { ReferenceFormData } from '@/types/reference';
import { createReference } from '@/services/referenceService';
import { usePublishPublicReference, usePublishPrivateReference } from '@/services/nostrService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const AddReference: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { mutateAsync: publishPublic } = usePublishPublicReference();
  const { mutateAsync: publishPrivate } = usePublishPrivateReference();

  // Handle form submission
  const handleSubmit = async (data: ReferenceFormData) => {
    try {
      // Create the reference in local storage
      const newReference = await createReference(data);
      
      // If user is logged in and they want to sync to Nostr
      if (user) {
        try {
          let eventId: string | undefined;
          
          // Publish based on visibility setting
          if (data.visibility === 'public') {
            eventId = await publishPublic(newReference);
          } else {
            eventId = await publishPrivate(newReference);
          }
          
          // If we have an event ID, update the reference with it
          if (eventId) {
            // In a real implementation, we would update the reference with the event ID
            console.log(`Reference published with event ID: ${eventId}`);
          }
          
          toast({
            title: 'Reference Published',
            description: 'Your reference was saved locally and published to Nostr.',
          });
        } catch (error) {
          console.error('Failed to publish to Nostr:', error);
          toast({
            title: 'Local Only',
            description: 'Reference saved locally but failed to publish to Nostr.',
            variant: 'warning',
          });
        }
      } else {
        toast({
          title: 'Reference Saved',
          description: 'Your reference was saved locally.',
        });
      }
      
      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      console.error('Failed to create reference:', error);
      toast({
        title: 'Error',
        description: 'Failed to create reference. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Reference</h1>
        <p className="text-muted-foreground mt-1">
          Create a new citation reference
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <ReferenceForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>

      {!user && (
        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> You're not logged in with Nostr. References will be stored locally on this device only.
          </p>
        </div>
      )}
    </div>
  );
};

export default AddReference;