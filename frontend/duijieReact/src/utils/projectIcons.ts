import {
  FolderKanban, Briefcase, Code2, ShoppingCart, Palette, Rocket,
  Building2, Globe, Heart, Star, Zap, BookOpen, Camera, Music,
  Gamepad2, Cpu, Coffee, Lightbulb, Target, Trophy,
  type LucideIcon,
} from 'lucide-react'

export const PROJECT_ICONS: { key: string; icon: LucideIcon; label: string }[] = [
  { key: 'FolderKanban', icon: FolderKanban, label: '项目' },
  { key: 'Briefcase', icon: Briefcase, label: '商务' },
  { key: 'Code2', icon: Code2, label: '开发' },
  { key: 'ShoppingCart', icon: ShoppingCart, label: '电商' },
  { key: 'Palette', icon: Palette, label: '设计' },
  { key: 'Rocket', icon: Rocket, label: '创业' },
  { key: 'Building2', icon: Building2, label: '企业' },
  { key: 'Globe', icon: Globe, label: '网站' },
  { key: 'BookOpen', icon: BookOpen, label: '教育' },
  { key: 'Camera', icon: Camera, label: '影视' },
  { key: 'Music', icon: Music, label: '音乐' },
  { key: 'Gamepad2', icon: Gamepad2, label: '游戏' },
  { key: 'Cpu', icon: Cpu, label: '硬件' },
  { key: 'Coffee', icon: Coffee, label: '餐饮' },
  { key: 'Lightbulb', icon: Lightbulb, label: '创意' },
  { key: 'Target', icon: Target, label: '目标' },
  { key: 'Trophy', icon: Trophy, label: '赛事' },
  { key: 'Heart', icon: Heart, label: '公益' },
  { key: 'Star', icon: Star, label: '收藏' },
  { key: 'Zap', icon: Zap, label: '快捷' },
]

export const PROJECT_COLORS = [
  { key: '#3b82f6', label: '蓝色' },
  { key: '#8b5cf6', label: '紫色' },
  { key: '#22c55e', label: '绿色' },
  { key: '#f59e0b', label: '琥珀' },
  { key: '#ef4444', label: '红色' },
  { key: '#06b6d4', label: '青色' },
  { key: '#ec4899', label: '粉色' },
  { key: '#f97316', label: '橙色' },
  { key: '#64748b', label: '灰色' },
  { key: '#0f172a', label: '深黑' },
]

const iconMap = new Map(PROJECT_ICONS.map(i => [i.key, i.icon]))

export function getProjectIcon(key?: string): LucideIcon {
  return iconMap.get(key || '') || FolderKanban
}
