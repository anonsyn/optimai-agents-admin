import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

import { Sidebar } from './sidebar'
import { ThemeToggle } from './theme-toggle'
import { UserPopover } from './user-popover'

export function Header() {
  return (
    <header className="flex h-16 items-center border-b bg-background px-6">
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Separator orientation="vertical" className="h-6" />
        <UserPopover />
      </div>
    </header>
  )
}
