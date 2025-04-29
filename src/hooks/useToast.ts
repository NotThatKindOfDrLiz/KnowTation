/**
 * Custom hook for displaying toast notifications
 */
import { toast } from 'sonner';

type ToastType = 'default' | 'success' | 'warning' | 'destructive';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastType;
}

export function useToast() {
  const showToast = ({ title, description, variant = 'default' }: ToastOptions) => {
    switch (variant) {
      case 'success':
        toast.success(title, {
          description
        });
        break;
      case 'warning':
        toast.warning(title, {
          description
        });
        break;
      case 'destructive':
        toast.error(title, {
          description
        });
        break;
      default:
        toast(title, {
          description
        });
    }
  };

  return { toast: showToast };
}