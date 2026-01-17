// app/dashboard/(projects)/[orgId]/[projectId]/settings/versions/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowUp, Loader2, MoreHorizontal, MoreVertical, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { deleteProjectVersion } from './_actions/delete-project-version'
import { bulkDeleteProjectVersions } from './_actions/bulk-delete-project-versions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Version = {
  id: string
  version: number
  created_at: string
  created_by: string | null
  file_id: string | null
}

export default function VersionsSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  const orgId = params.orgId as string
  const projectId = params.projectId as string

  useEffect(() => {
    async function fetchVersions() {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from('projects_versions')
          .select('id, version, created_at, created_by, file_id')
          .eq('project_id', projectId)
          .eq('org_id', orgId)
          .order('version', { ascending: false })

        if (error) throw error

        setVersions(data || [])
      } catch (err) {
        console.error('Error fetching versions:', err)
        setError(err instanceof Error ? err.message : 'Failed to load versions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVersions()
  }, [projectId, orgId])

  const handleDeleteConfirm = async () => {
    if (!deleteVersionId) return

    try {
      setIsDeleting(true)
      const result = await deleteProjectVersion(orgId, projectId, deleteVersionId)

      if (!result.success) {
        toast.error(result.error || 'Failed to delete version')
        return
      }

      toast.success('Version deleted successfully')

      // Update local state
      setVersions(prev => prev.filter(v => v.id !== deleteVersionId))
      
      // Refresh the page
      router.refresh()
      
    } catch (err) {
      console.error('Error deleting version:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
      setDeleteVersionId(null)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedVersions.size === 0) return

    try {
      setIsDeleting(true)
      const versionIds = Array.from(selectedVersions)
      const result = await bulkDeleteProjectVersions(orgId, projectId, versionIds)

      if (!result.success) {
        toast.error(result.error || 'Failed to delete versions')
        return
      }

      toast.success(`${versionIds.length} version(s) deleted successfully`)

      // Update local state
      setVersions(prev => prev.filter(v => !selectedVersions.has(v.id)))
      setSelectedVersions(new Set())
      
      // Refresh the page
      router.refresh()
      
    } catch (err) {
      console.error('Error deleting versions:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
      setShowBulkDeleteDialog(false)
    }
  }

  const toggleVersionSelection = (versionId: string) => {
    setSelectedVersions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(versionId)) {
        newSet.delete(versionId)
      } else {
        newSet.add(versionId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedVersions.size === versions.length) {
      setSelectedVersions(new Set())
    } else {
      setSelectedVersions(new Set(versions.map(v => v.id)))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive font-medium">Error loading versions</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-screen">
        {/* Header - Fixed */}
        <div className="shrink-0 bg-background px-10 pt-14 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-medium">Versions</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your project versions
                </p>
              </div>
              
              {selectedVersions.size > 0 && (
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="text-xs"
                >
                  Delete ({selectedVersions.size})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-6">
            {versions.length === 0 ? (
              <div className="flex items-center justify-center h-48 border border-dashed rounded-lg">
                <p className="text-muted-foreground">No versions found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Header with select all */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedVersions.size === versions.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all versions"
                  />
                  <span className="text-xs text-muted-foreground">
                    {selectedVersions.size > 0 
                      ? `${selectedVersions.size} selected`
                      : 'Select all'}
                  </span>
                </div>

                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between mt-5"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedVersions.has(version.id)}
                        onCheckedChange={() => toggleVersionSelection(version.id)}
                        aria-label={`Select version ${version.version}`}
                      />
                      
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">Version {version.version}</span>
                        {version.version === versions[0].version && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Latest
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          • {new Date(version.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="xs">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <ArrowUp />
                          Promote to most recent
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteVersionId(version.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Single delete dialog */}
      <AlertDialog open={deleteVersionId !== null} onOpenChange={(open) => !open && setDeleteVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this version? This action cannot be undone.
              All associated files will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedVersions.size} Version(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedVersions.size} version(s)? This action cannot be undone.
              All associated files will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}