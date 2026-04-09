import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../features/ui/Button'
import Input from '../features/ui/Input'
import EmptyState from '../features/ui/EmptyState'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>保存</Button>)
    expect(screen.getByText('保存')).toBeInTheDocument()
  })

  it('calls onClick handler', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>点击</Button>)
    fireEvent.click(screen.getByText('点击'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>禁用</Button>)
    expect(screen.getByText('禁用').closest('button')).toBeDisabled()
  })
})

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="请输入" />)
    expect(screen.getByPlaceholderText('请输入')).toBeInTheDocument()
  })

  it('fires onChange', () => {
    const onChange = vi.fn()
    render(<Input placeholder="输入" onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('输入'), { target: { value: '测试' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('shows label when provided', () => {
    render(<Input label="用户名" placeholder="输入" />)
    expect(screen.getByText('用户名')).toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="暂无数据" />)
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<EmptyState title="暂无数据" subtitle="请稍后再试" />)
    expect(screen.getByText('请稍后再试')).toBeInTheDocument()
  })
})
