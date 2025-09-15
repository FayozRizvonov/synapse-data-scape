import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const UserButton: React.FC = () => {
  const { user, userRole, signOut } = useAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getRoleLabel = (role: string | null) => {
    const roleLabels = {
      admin: 'Administrator',
      marketing: 'Marketing',
      finance: 'Finance',
      commercial: 'Commercial',
      gm: 'General Manager',
      commercial_lead: 'Commercial Lead',
      marketing_ops: 'Marketing Ops'
    };
    return role ? (roleLabels as any)[role] || role : 'User';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" className="relative h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm">
              {getInitials(user.email || '')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60 rounded-xl p-2 backdrop-blur-xl bg-white/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 shadow-blue-lg glow-effect"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal text-gray-900 dark:text-white/90">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {getRoleLabel(userRole)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/20" />
        <DropdownMenuItem className="rounded-md hover:bg-white/30 dark:hover:bg-white/10" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};