import { useSearchParams } from 'react-router'
import { AdminsTab } from '@/components/AdminsTab'
import { UsersTab } from '@/components/UsersTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Tab = 'users' | 'admins'

/** Users page: app users and admins, as two tabs (the tab is kept in the address: ?tab=admins). */
export function UsersPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'admins' ? 'admins' : 'users'

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Users</h1>
      <Tabs
        value={tab}
        onValueChange={(value) => setParams(value === 'admins' ? { tab: 'admins' } : {}, { replace: true })}
      >
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="admins" className="mt-4">
          <AdminsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
