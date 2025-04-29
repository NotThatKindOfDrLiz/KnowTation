import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, Settings, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';

export function LoginArea() {
  const { user, login, logout } = useCurrentUser();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Handle demo login (in a real app, this would use nostr authentication)
  const handleDemoLogin = () => {
    login({
      pubkey: 'npub1random0000000pubkey00000000000000000000000000000',
      name: 'Demo User',
    });
    setLoginDialogOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Navigate to settings
  const handleSettings = () => {
    navigate('/settings');
  };

  // If user is logged in, show avatar with dropdown
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.picture} alt={user.name || 'User'} />
              <AvatarFallback>
                {user.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user.name || 'Nostr User'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If user is not logged in, show login button
  return (
    <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center">
          <LogIn className="mr-2 h-4 w-4" />
          Log in
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login with Nostr</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This is a demo version of KnowTation. In a real implementation, you would be
            able to log in with your Nostr key using NIP-07 or other methods.
          </p>
          <div className="flex justify-center pt-4">
            {/* This is a simplified login for the demo */}
            <Button onClick={handleDemoLogin}>
              Demo Login
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            All data is stored locally in your browser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}