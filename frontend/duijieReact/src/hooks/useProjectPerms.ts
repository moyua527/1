import { useState, useEffect } from 'react'
import { fetchApi } from '../bootstrap'

export interface ProjectPerms {
  projectRole: string
  source: string
  enterpriseRoleId: number | null
  can_manage_members: boolean
  can_manage_roles: boolean
  can_create_project: boolean
  can_edit_project: boolean
  can_delete_project: boolean
  can_manage_client: boolean
  can_view_report: boolean
  can_manage_task: boolean
}

/**
 * 获取当前用户在指定项目中的有效权限（第二身份）
 */
export default function useProjectPerms(projectId: number | string | undefined) {
  const [perms, setPerms] = useState<ProjectPerms | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) { setLoading(false); return }
    setLoading(true)
    fetchApi(`/api/projects/${projectId}/my-perms`)
      .then(r => { if (r.success) setPerms(r.data) })
      .finally(() => setLoading(false))
  }, [projectId])

  const canInProject = (perm: keyof ProjectPerms): boolean => {
    if (!perms) return false
    return !!perms[perm]
  }

  return { perms, loading, canInProject }
}
