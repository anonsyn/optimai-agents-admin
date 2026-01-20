import { LayoutDashboard, LogOut, MessageSquareText, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Mentions',
    href: '/mentions',
    icon: MessageSquareText,
  },
  {
    title: 'Accounts',
    href: '/accounts',
    icon: Users,
  },
]

export function Sidebar({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  return (
    <div className={cn('flex h-full w-64 flex-col border-r bg-card', className)}>
      <div className="flex h-16 items-center px-6 border-b">
        <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
        <span className="ml-2 text-lg font-bold">Mention Admin</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button variant={pathname === item.href ? 'secondary' : 'ghost'} className="w-full justify-start gap-2">
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
