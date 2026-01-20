import { LogOut, Settings, User } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/auth-context'

export function UserPopover() {
  const { logout, user } = useAuth()

  const displayName = user?.display_name || user?.username || 'Admin'
  const username = user?.username || 'admin'
  const role = user?.role || 'admin'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full ring-1 ring-border/50 transition-all hover:ring-2 hover:ring-primary/50"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end" sideOffset={8}>
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{username}</p>
          </div>
        </div>
        <Separator />
        <div className="p-2">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Role:</span>
            <span className="ml-auto text-sm font-medium capitalize text-foreground">{role}</span>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            disabled
          >
            <Settings className="h-4 w-4" />
            Settings
            <span className="ml-auto text-xs text-muted-foreground/60">Coming soon</span>
          </Button>
        </div>
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
