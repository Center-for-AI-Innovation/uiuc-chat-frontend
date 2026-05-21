import { describe, expect, it } from 'vitest'
import { BuildingIcon } from '../BuildingIcon'
import { GraduationCapIcon } from '../GraduationCapIcon'
import { MicroscopeIcon } from '../MicroscopeIcon'
import { UserCreatedIcon } from '../UserCreatedIcon'
import { UsersRoundIcon } from '../UsersRoundIcon'
import { getProjectTypeIcon } from '../projectTypeIcon'

describe('getProjectTypeIcon', () => {
  it('returns GraduationCapIcon for Course', () => {
    expect(getProjectTypeIcon('Course')).toBe(GraduationCapIcon)
  })

  it('returns BuildingIcon for Department', () => {
    expect(getProjectTypeIcon('Department')).toBe(BuildingIcon)
  })

  it('returns MicroscopeIcon for Research', () => {
    expect(getProjectTypeIcon('Research')).toBe(MicroscopeIcon)
  })

  it('returns UsersRoundIcon for Student Org.', () => {
    expect(getProjectTypeIcon('Student Org.')).toBe(UsersRoundIcon)
  })

  it('falls back to UserCreatedIcon for Entertainment', () => {
    expect(getProjectTypeIcon('Entertainment')).toBe(UserCreatedIcon)
  })

  it('falls back to UserCreatedIcon when projectType is undefined', () => {
    expect(getProjectTypeIcon(undefined)).toBe(UserCreatedIcon)
  })

  it('falls back to UserCreatedIcon when projectType is empty', () => {
    expect(getProjectTypeIcon('')).toBe(UserCreatedIcon)
  })

  it('falls back to UserCreatedIcon for unknown values', () => {
    expect(getProjectTypeIcon('Something Weird')).toBe(UserCreatedIcon)
  })
})
