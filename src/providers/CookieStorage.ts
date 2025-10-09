// cookie-storage.ts
import Cookies from 'js-cookie'

type CookieOpts = {
  prefix?: string
  /** days until expiry */
  expiresDays?: number
  path?: string
  domain?: string
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
}

export class CookieStorage implements Storage {
  private keys: string[] = []
  constructor(private opts: CookieOpts = {}) {
    this.opts.expiresDays ??= 1 // keep short
    this.opts.path ??= '/'
    this.opts.sameSite ??= 'lax'
    // Don't set default for secure - let it be undefined if not provided
    // this.opts.secure ??= true
    // Don't set default for domain - let it be undefined if not provided
    // this.opts.domain ??= undefined

    // Build an index of keys (best-effort)
    const all = document.cookie.split(';').map((c) => c.trim())
    const prefix = this.getPrefix()
    this.keys = all
      .map((c) => decodeURIComponent(c.split('=')[0] ?? ''))
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length))
  }

  private getPrefix(): string {
    return this.opts.prefix ?? ''
  }

  get length() {
    return this.keys.length
  }

  key(index: number) {
    return this.keys[index] ?? null
  }

  getItem(key: string) {
    const v = Cookies.get(this.getPrefix() + key)
    return v === undefined ? null : v
  }

  setItem(key: string, value: string) {
    const cookieOptions: any = {}

    // Only set sameSite if it's explicitly provided
    if (this.opts.sameSite !== undefined) {
      cookieOptions.sameSite = this.opts.sameSite
    }

    // Only set path if it's explicitly provided
    if (this.opts.path !== undefined) {
      cookieOptions.path = this.opts.path
    }

    // Only set expires if it's explicitly provided
    if (this.opts.expiresDays !== undefined) {
      cookieOptions.expires = this.opts.expiresDays
    }

    // Only set domain if it's explicitly provided
    if (this.opts.domain !== undefined) {
      cookieOptions.domain = this.opts.domain
    }

    // Only set secure if it's explicitly provided
    if (this.opts.secure !== undefined) {
      cookieOptions.secure = this.opts.secure
    }

    Cookies.set(this.getPrefix() + key, value, cookieOptions)
    if (!this.keys.includes(key)) this.keys.push(key)
  }

  removeItem(key: string) {
    const removeOptions: any = {}

    // Only set sameSite if it's explicitly provided
    if (this.opts.sameSite !== undefined) {
      removeOptions.sameSite = this.opts.sameSite
    }

    // Only set path if it's explicitly provided
    if (this.opts.path !== undefined) {
      removeOptions.path = this.opts.path
    }

    // Only set expires if it's explicitly provided
    if (this.opts.expiresDays !== undefined) {
      removeOptions.expires = this.opts.expiresDays
    }

    // Only set domain if it's explicitly provided
    if (this.opts.domain !== undefined) {
      removeOptions.domain = this.opts.domain
    }

    // Only set secure if it's explicitly provided
    if (this.opts.secure !== undefined) {
      removeOptions.secure = this.opts.secure
    }

    Cookies.remove(this.getPrefix() + key, removeOptions)
    this.keys = this.keys.filter((k) => k !== key)
  }

  clear() {
    for (const k of [...this.keys]) this.removeItem(k)
  }
}
