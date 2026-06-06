import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '留圈管理后台 - UniLink Admin',
  description: '留学生社区平台管理后台',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
