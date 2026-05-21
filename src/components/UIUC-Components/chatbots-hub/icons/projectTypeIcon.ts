import type { ComponentType } from 'react'
import { BuildingIcon } from './BuildingIcon'
import { GraduationCapIcon } from './GraduationCapIcon'
import { MicroscopeIcon } from './MicroscopeIcon'
import { UserCreatedIcon } from './UserCreatedIcon'
import { UsersRoundIcon } from './UsersRoundIcon'

type IconComponent = ComponentType<{ className?: string }>

const PROJECT_TYPE_ICON: Record<string, IconComponent> = {
  Course: GraduationCapIcon,
  Department: BuildingIcon,
  Research: MicroscopeIcon,
  'Student Org.': UsersRoundIcon,
}

// Falls back to UserCreatedIcon (the "Personal" icon) when projectType is
// missing or is the legacy 'Entertainment' value.
export function getProjectTypeIcon(projectType?: string): IconComponent {
  if (!projectType) return UserCreatedIcon
  return PROJECT_TYPE_ICON[projectType] ?? UserCreatedIcon
}
