import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, FolderOpen, Eye, Edit3 } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import { toast } from '../ui/Toast'

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateArticle = (location.state as any)?.article
  const [article, setArticle] = useState<any>(stateArticle || null)
  const [loading, setLoading] = useState(!stateArticle)

  useEffect(() => {
    if (stateArticle) return
    if (!id) return
    setLoading(true)
    fetchApi(`/api/kb/articles/${id}`).then(r => {
      setLoading(false)
      if (r.success) setArticle(r.data)
      else { toast('文章不存在', 'error'); navigate(-1) }
    })
  }, [id, stateArticle, navigate])

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>
  if (!article) return null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-secondary)' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px', background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-primary)',
      }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-heading)' }}>
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-heading)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>知识库</span>
        <button onClick={() => navigate('/knowledge', { state: { editArticle: article } })} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Edit3 size={14} /> 编辑
        </button>
      </div>

      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, lineHeight: 1.4 }}>{article.title}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {article.category_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--brand)', background: 'var(--brand-light, rgba(59,130,246,0.1))', padding: '2px 8px', borderRadius: 10 }}>
              <FolderOpen size={12} /> {article.category_name}
            </span>
          )}
          {article.tags && article.tags.split(',').map((t: string) => (
            <span key={t.trim()} style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 10 }}>
              #{t.trim()}
            </span>
          ))}
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={12} /> {article.view_count} 次浏览
          </span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
          {article.author_name} · {article.updated_at ? new Date(article.updated_at).toLocaleDateString() : ''}
        </div>

        <div style={{
          padding: 16, background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)',
          fontSize: 15, lineHeight: 1.9, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {article.content || '（空内容）'}
        </div>
      </div>
    </div>
  )
}
