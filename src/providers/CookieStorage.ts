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
    this.opts.secure ??= true

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
    Cookies.set(this.getPrefix() + key, value, {
      expires: this.opts.expiresDays,
      path: this.opts.path,
      domain: this.opts.domain,
      sameSite: this.opts.sameSite,
      secure: this.opts.secure,
    })
    if (!this.keys.includes(key)) this.keys.push(key)
  }

  removeItem(key: string) {
    Cookies.remove(this.getPrefix() + key, {
      path: this.opts.path,
      domain: this.opts.domain,
    })
    this.keys = this.keys.filter((k) => k !== key)
  }

  clear() {
    for (const k of [...this.keys]) this.removeItem(k)
  }
}
