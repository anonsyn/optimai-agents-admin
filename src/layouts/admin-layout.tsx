import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { Outlet } from 'react-router-dom'

export function AdminLayout() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
