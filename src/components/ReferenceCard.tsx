import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Edit, Trash, Share2, BookOpen } from 'lucide-react';
import { Reference } from '@/types/reference';
import { formatDistance } from 'date-fns';

interface ReferenceCardProps {
  reference: Reference;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (reference: Reference) => void;
  onView: (id: string) => void;
}

const ReferenceCard: React.FC<ReferenceCardProps> = ({
  reference,
  onEdit,
  onDelete,
  onShare,
  onView,
}) => {
  const {
    id,
    title,
    authors,
    year,
    journalOrBook,
    visibility,
    tags,
    updatedAt,
  } = reference;

  const displayAuthors = authors.length > 3
    ? `${authors[0]} et al.`
    : authors.join(', ');

  const updatedTimeAgo = formatDistance(updatedAt * 1000, new Date(), { addSuffix: true });

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold line-clamp-2 mb-1" title={title}>
            {title}
          </CardTitle>
          <Badge variant={visibility === 'public' ? 'default' : 'outline'} className="ml-2 shrink-0">
            {visibility === 'public' ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            {visibility}
          </Badge>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {displayAuthors}
          {year && ` (${year})`}
        </div>
        {journalOrBook && (
          <div className="text-sm italic text-gray-500 dark:text-gray-400 line-clamp-1 mt-1" title={journalOrBook}>
            {journalOrBook}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2 text-xs text-gray-500">
        <span>Updated {updatedTimeAgo}</span>
        <div className="flex space-x-1">
          <Button size="icon" variant="ghost" onClick={() => onView(id)} title="View">
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onEdit(id)} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(id)} title="Delete">
            <Trash className="h-4 w-4" />
          </Button>
          {visibility === 'public' && (
            <Button size="icon" variant="ghost" onClick={() => onShare(reference)} title="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ReferenceCard;