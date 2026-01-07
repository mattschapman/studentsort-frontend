// app/dashboard/(project)/project/[projectId]/branch/[branchId]/_actions/get-project-by-id.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProjectById(projectId: string): Promise<{
  data: { title: string; status: string } | null
  error: string | null
}> {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        data: null,
        error: 'Unauthorized. Please sign in to access project data.'
      }
    }
    
    // Validate input
    if (!projectId) {
      return {
        data: null,
        error: 'Project ID is required.'
      }
    }
    
    // Fetch the project
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('title, status')
      .eq('id', projectId)
      .single()
    
    if (fetchError) {
      console.error('Error fetching project:', fetchError)
      return {
        data: null,
        error: `Failed to fetch project: ${fetchError.message}`
      }
    }
    
    return {
      data: { 
        title: project.title,
        status: project.status
      },
      error: null
    }
  } catch (error) {
    console.error('Unexpected error in getProjectById:', error)
    return {
      data: null,
      error: 'An unexpected error occurred while fetching project data'
    }
  }
}