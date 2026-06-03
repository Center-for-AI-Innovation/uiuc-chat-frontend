import { IconX } from '@tabler/icons-react'
import { type FC } from 'react'

import { useTranslation } from 'next-i18next'

interface Props {
  placeholder: string
  searchTerm: string
  onSearch: (searchTerm: string) => void
}
const Search: FC<Props> = ({ placeholder, searchTerm, onSearch }) => {
  const { t } = useTranslation('sidebar')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  const clearSearch = () => {
    onSearch('')
  }

  return (
    <div className="relative flex items-center">
      <input
        className="w-full flex-1 rounded-md border border-[--button-border] bg-transparent px-4 py-3 pr-10 text-[14px] leading-3 text-[--foreground] focus:border-[--button]"
        type="text"
        placeholder={t(placeholder) || ''}
        aria-label={t(placeholder) || 'Search'}
        value={searchTerm}
        onChange={handleSearchChange}
      />

      {searchTerm && (
        <button
          className="absolute right-4 cursor-pointer border-none bg-transparent p-0 text-[--foreground-faded] hover:text-[--foreground]"
          aria-label="Clear search"
          onClick={clearSearch}
        >
          <IconX size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default Search
