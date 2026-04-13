import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { Plus, Search, FolderOpen, Edit3, Trash2, Eye, Clock, BookOpen, X } from 'lucide-react'
import { fetchApi } from '../../bootstrap'
import useDebounce from '../../hooks/useDebounce'
import PageHeader from '../ui/PageHeader'
import { SkeletonList } from '../ui/Skeleton'

interface Category { id: number; name: string; parent_id: number | null; sort_order: number }
interface Article {
  id: number; title: string; category_id: number | null; tags: string | null
  status: 'draft' | 'published'; view_count: number; excerpt: string
  category_name: string | null; author_name: string; author_avatar: string | null
  created_at: string; updated_at: string; content?: string
}

export default function KnowledgeBase() {
  const { isMobile } = useOutletContext<{ isMobile: boolean }>() as { isMobile: boolean }
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedCat, setSelectedCat] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearchInput = useDebounce(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [editing, setEditing] = useState<Partial<Article> | null>(null)
  const [viewing, setViewing] = useState<Article | null>(null)
  const [catEditing, setCatEditing] = useState<{ id?: number; name: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const loadCategories = useCallback(async () => {
    const r = await fetchApi('/api/kb/categories')
    if (r.success) setCategories(r.data || [])
  }, [])

  const loadArticles = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (selectedCat) params.set('category_id', String(selectedCat))
    if (debouncedSearchInput.trim()) params.set('search', debouncedSearchInput.trim())
    if (statusFilter) params.set('status', statusFilter)
    const r = await fetchApi(`/api/kb/articles?${params}`)
    if (r.success) { setArticles(r.data.rows || []); setTotal(r.data.total || 0) }
    setLoading(false)
  }, [page, selectedCat, debouncedSearchInput, statusFilter])

  useEffect(() => { loadCategories() }, [loadCategories])
  useLayoutEffect(() => { setPage(1) }, [debouncedSearchInput])
  useEffect(() => { loadArticles() }, [loadArticles])

  const handleSearch = () => { setPage(1) }

  const openArticle = async (id: number) => {
    if (isMobile) {
      navigate(`/knowledge/${id}`)
      return
    }
    const r = await fetchApi(`/api/kb/articles/${id}`)
    if (r.success) setViewing(r.data)
  }

  const saveArticle = async () => {
    if (!editing) return
    try {
      const body = { title: editing.title, content: editing.content, category_id: editing.category_id, tags: editing.tags, status: editing.status || 'draft' }
      const r = editing.id
        ? await fetchApi(`/api/kb/articles/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : await fetchApi('/api/kb/articles', { method: 'POST', body: JSON.stringify(body) })
      if (r.success) { setEditing(null); loadArticles() }
    } catch { /* network error */ }
  }

  const deleteArticle = async (id: number) => {
    if (!confirm('确定删除这篇文章？')) return
    try {
      await fetchApi(`/api/kb/articles/${id}`, { method: 'DELETE' })
      loadArticles()
    } catch { /* network error */ }
  }

  const saveCat = async () => {
    if (!catEditing?.name?.trim()) return
    try {
      const r = catEditing.id
        ? await fetchApi(`/api/kb/categories/${catEditing.id}`, { method: 'PUT', body: JSON.stringify({ name: catEditing.name }) })
        : await fetchApi('/api/kb/categories', { method: 'POST', body: JSON.stringify({ name: catEditing.name }) })
      if (r.success) { setCatEditing(null); loadCategories() }
    } catch { /* network error */ }
  }

  const deleteCat = async (id: number) => {
    if (!confirm('删除分类后文章将变为未分类，确定？')) return
    try {
      await fetchApi(`/api/kb/categories/${id}`, { method: 'DELETE' })
      if (selectedCat === id) setSelectedCat(null)
      loadCategories(); loadArticles()
    } catch { /* network error */ }
  }

  const totalPages = Math.ceil(total / 20) || 1

  // Article editor modal
  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>
            &larr; 返回
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', flex: 1 }}>
            {editing.id ? '编辑文章' : '新建文章'}
          </span>
          <select value={editing.status || 'draft'} onChange={e => setEditing({ ...editing, status: e.target.value as any })}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 }}>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
          <button onClick={saveArticle}
            style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            保存
          </button>
        </div>

        <input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })}
          placeholder="文章标题" style={{
            fontSize: 20, fontWeight: 700, border: 'none', outline: 'none', padding: '8px 0',
            background: 'transparent', color: 'var(--text-heading)', width: '100%',
            borderBottom: '2px solid var(--border-primary)',
          }} />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select value={editing.category_id || ''} onChange={e => setEditing({ ...editing, category_id: e.target.value ? Number(e.target.value) : null })}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 }}>
            <option value="">未分类</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={editing.tags || ''} onChange={e => setEditing({ ...editing, tags: e.target.value })}
            placeholder="标签（逗号分隔）" style={{
              flex: 1, minWidth: 150, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-primary)',
              background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
            }} />
        </div>

        <textarea value={editing.content || ''} onChange={e => setEditing({ ...editing, content: e.target.value })}
          placeholder="在此输入文章内容...&#10;&#10;支持纯文本格式，后续可升级为富文本编辑器。"
          style={{
            flex: 1, minHeight: 300, padding: 16, borderRadius: 12, border: '1px solid var(--border-primary)',
            background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.8,
            resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }} />
      </div>
    )
  }

  // Article detail viewer
  if (viewing) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>
            &larr; 返回列表
          </button>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', marginBottom: 12, lineHeight: 1.4 }}>{viewing.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {viewing.category_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--brand)', background: 'var(--brand-light, rgba(59,130,246,0.1))', padding: '2px 8px', borderRadius: 10 }}>
              <FolderOpen size={12} /> {viewing.category_name}
            </span>
          )}
          {viewing.tags && viewing.tags.split(',').map(t => (
            <span key={t.trim()} style={{ fontSize: 12, color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 10 }}>
              #{t.trim()}
            </span>
          ))}
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={12} /> {viewing.view_count} 次浏览
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {viewing.author_name} · {new Date(viewing.updated_at).toLocaleDateString()}
          </span>
        </div>
        <div style={{
          padding: 24, background: 'var(--bg-primary)', borderRadius: 16, border: '1px solid var(--border-primary)',
          fontSize: 15, lineHeight: 1.9, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {viewing.content || '（空内容）'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => { setViewing(null); setEditing(viewing) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
            <Edit3 size={14} /> 编辑
          </button>
        </div>
      </div>
    )
  }

  // Main list view
  const catTabs = [{ id: null as number | null, label: '全部' }, ...categories.map(c => ({ id: c.id as number | null, label: c.name }))]
  const statusTabs = [{ key: '', label: '全部' }, { key: 'published', label: '已发布' }, { key: 'draft', label: '草稿' }]

  return (
    <div>
      <PageHeader title="知识库"
        actions={isMobile ? undefined :
          <button onClick={() => setEditing({ title: '', content: '', status: 'draft', category_id: selectedCat })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Plus size={16} /> 新建文章
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 20, marginTop: isMobile ? 0 : 16 }}>
        {/* Sidebar: categories */}
        {!isMobile && (
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ background: 'var(--bg-primary)', borderRadius: 12, border: '1px solid var(--border-primary)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border-secondary)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>分类</span>
                <span onClick={() => setCatEditing({ name: '' })} style={{ cursor: 'pointer', color: 'var(--brand)', display: 'flex' }}>
                  <Plus size={16} />
                </span>
              </div>

              {catEditing && (
                <div style={{ padding: '8px 12px', display: 'flex', gap: 6, borderBottom: '1px solid var(--border-secondary)' }}>
                  <input value={catEditing.name} onChange={e => setCatEditing({ ...catEditing, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && saveCat()}
                    placeholder="分类名称" autoFocus
                    style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-primary)', fontSize: 12, outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  <button onClick={saveCat} style={{ padding: '4px 8px', borderRadius: 6, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>
                    确定
                  </button>
                  <button onClick={() => setCatEditing(null)} style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              <div onClick={() => { setSelectedCat(null); setPage(1) }}
                style={{
                  padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                  color: selectedCat === null ? 'var(--brand)' : 'var(--text-secondary)',
                  background: selectedCat === null ? 'var(--bg-selected)' : 'transparent',
                  fontWeight: selectedCat === null ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (selectedCat !== null) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={e => { if (selectedCat !== null) e.currentTarget.style.background = 'transparent' }}>
                <BookOpen size={14} /> 全部文章
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' }}>{total}</span>
              </div>
              {categories.map(cat => (
                <div key={cat.id}
                  style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                    color: selectedCat === cat.id ? 'var(--brand)' : 'var(--text-secondary)',
                    background: selectedCat === cat.id ? 'var(--bg-selected)' : 'transparent',
                    fontWeight: selectedCat === cat.id ? 600 : 400,
                  }}
                  onClick={() => { setSelectedCat(cat.id); setPage(1) }}
                  onMouseEnter={e => { if (selectedCat !== cat.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (selectedCat !== cat.id) e.currentTarget.style.background = 'transparent' }}>
                  <FolderOpen size={14} />
                  <span style={{ flex: 1 }}>{cat.name}</span>
                  <span onClick={e => { e.stopPropagation(); deleteCat(cat.id) }}
                    style={{ display: 'flex', padding: 2, cursor: 'pointer', color: 'var(--text-disabled)', opacity: 0.5 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
                    <Trash2 size={12} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search & filters */}
          {isMobile ? (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 10 }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="搜索文章..." style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 10, border: '1px solid var(--border-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <button onClick={() => setEditing({ title: '', content: '', status: 'draft', category_id: selectedCat })}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Plus size={14} /> 新建
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' as any }}>
                {catTabs.map(t => {
                  const active = selectedCat === t.id
                  return (
                    <button key={String(t.id)} onClick={() => { setSelectedCat(t.id); setPage(1) }}
                      style={{ padding: '5px 12px', borderRadius: 20, border: active ? '1px solid var(--brand)' : '1px solid var(--border-primary)', background: active ? 'var(--brand)' : 'var(--bg-primary)', color: active ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {t.label}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, WebkitOverflowScrolling: 'touch' as any }}>
                {statusTabs.map(t => {
                  const active = statusFilter === t.key
                  return (
                    <button key={t.key} onClick={() => { setStatusFilter(t.key); setPage(1) }}
                      style={{ padding: '5px 12px', borderRadius: 20, border: active ? '1px solid var(--brand)' : '1px solid var(--border-primary)', background: active ? 'var(--brand)' : 'var(--bg-primary)', color: active ? '#fff' : 'var(--text-secondary)', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', gap: 8, minWidth: 180 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}>
                  <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="搜索文章..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', background: 'transparent', color: 'var(--text-primary)' }} />
                </div>
                <button onClick={handleSearch} style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--brand)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                  搜索
                </button>
              </div>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13 }}>
                <option value="">全部状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>
            </div>
          )}

          {/* Article list */}
          {loading ? (
            <SkeletonList rows={5} />
          ) : articles.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <BookOpen size={48} style={{ color: 'var(--text-disabled)', marginBottom: 12 }} />
              <div style={{ color: 'var(--text-tertiary)', fontSize: 15 }}>暂无文章</div>
              <div style={{ color: 'var(--text-disabled)', fontSize: 13, marginTop: 4 }}>点击"新建文章"开始创建知识库内容</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {articles.map(a => (
                <div key={a.id} onClick={() => openArticle(a.id)}
                  style={{
                    padding: 16, borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                    cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.title}
                        </span>
                        <span style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 600, flexShrink: 0,
                          background: a.status === 'published' ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                          color: a.status === 'published' ? '#16a34a' : '#6b7280',
                        }}>
                          {a.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </div>
                      {a.excerpt && (
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                          {a.excerpt.replace(/<[^>]+>/g, '')}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                        {a.category_name && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-tertiary)' }}>
                            <FolderOpen size={11} /> {a.category_name}
                          </span>
                        )}
                        {a.tags && a.tags.split(',').slice(0, 3).map(t => (
                          <span key={t.trim()} style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>#{t.trim()}</span>
                        ))}
                        <span style={{ fontSize: 11, color: 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Eye size={11} /> {a.view_count}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} /> {new Date(a.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <span onClick={e => { e.stopPropagation(); setEditing(a) }} title="编辑"
                        style={{ padding: 6, borderRadius: 6, cursor: 'pointer', color: 'var(--text-tertiary)', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                        <Edit3 size={15} />
                      </span>
                      <span onClick={e => { e.stopPropagation(); deleteArticle(a.id) }} title="删除"
                        style={{ padding: 6, borderRadius: 6, cursor: 'pointer', color: 'var(--text-tertiary)', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-danger)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                        <Trash2 size={15} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: p === page ? 'var(--brand)' : 'var(--bg-primary)',
                    color: p === page ? '#fff' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: p === page ? 600 : 400,
                  }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
