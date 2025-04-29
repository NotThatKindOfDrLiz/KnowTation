import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import ReferenceForm from '@/components/ReferenceForm';
import { useToast } from '@/hooks/useToast';
import { Reference, ReferenceFormData } from '@/types/reference';
import { getReference, updateReference } from '@/services/referenceService';
import { usePublishPublicReference, usePublishPrivateReference, useRetractReference } from '@/services/nostrService';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const EditReference: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { mutateAsync: publishPublic } = usePublishPublicReference();
  const { mutateAsync: publishPrivate } = usePublishPrivateReference();
  const { mutateAsync: retractReference } = useRetractReference();

  // State
  const [reference, setReference] = useState<Reference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Handle form submission
  const handleSubmit = async (data: ReferenceFormData) => {
    try {
      if (!id) {
        throw new Error('Reference ID is required');
      }
      
      // Check if visibility changed (public -> private or private -> public)
      const visibilityChanged = reference && reference.visibility !== data.visibility;
      const wasPublicNowPrivate = reference?.visibility === 'public' && data.visibility === 'private';
      const wasPrivateNowPublic = reference?.visibility === 'private' && data.visibility === 'public';
      
      // Update reference in local storage
      const updatedReference = await updateReference(id, data);
      
      if (!updatedReference) {
        throw new Error('Failed to update reference');
      }
      
      // Handle Nostr updates if user is logged in
      if (user) {
        try {
          // If visibility changed from public to private
          if (wasPublicNowPrivate && reference?.eventId) {
            // Retract the public reference
            await retractReference({
              reference: reference,
              reason: 'Changed to private by user'
            });
            
            // Publish as private
            await publishPrivate(updatedReference);
          }
          // If visibility changed from private to public
          else if (wasPrivateNowPublic) {
            // If there was a private event, we'd ideally delete it here
            
            // Publish as public
            await publishPublic(updatedReference);
          }
          // If visibility didn't change but content did
          else if (reference?.eventId) {
            // For public references, we retract the old one and publish a new one
            if (data.visibility === 'public') {
              await retractReference({
                reference: reference,
                reason: 'Updated by user'
              });
              await publishPublic(updatedReference);
            }
            // For private references, we just publish a new encrypted version
            else {
              await publishPrivate(updatedReference);
            }
          }
          
          toast({
            title: 'Reference Updated',
            description: 'Your reference was updated locally and on Nostr.',
          });
        } catch (error) {
          console.error('Failed to update on Nostr:', error);
          toast({
            title: 'Partial Update',
            description: 'Reference updated locally but failed to update on Nostr.',
            variant: 'warning',
          });
        }
      } else {
        toast({
          title: 'Reference Updated',
          description: 'Your reference was updated locally.',
        });
      }
      
      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      console.error('Failed to update reference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reference. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate('/');
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
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/')} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Reference</h1>
        <p className="text-muted-foreground mt-1">
          Update your citation reference
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <ReferenceForm 
          initialValues={reference} 
          onSubmit={handleSubmit} 
          onCancel={handleCancel} 
          isEditing
        />
      </div>

      {!user && (
        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> You're not logged in with Nostr. Changes will only be stored locally on this device.
          </p>
        </div>
      )}
    </div>
  );
};

export default EditReference;