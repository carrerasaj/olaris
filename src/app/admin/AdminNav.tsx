'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  exact?: boolean
}

const ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/suppliers', label: 'Suppliers' },
]

export function AdminNav() {
  const pathname = usePathname() ?? ''
  return (
    <nav className="adm-nav">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link key={item.href} href={item.href} className={active ? 'is-active' : ''}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
