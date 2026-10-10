import React from 'react';
import { BlogFilters } from '../../types/blog';

interface SearchFilterProps {
    filters: BlogFilters;
    availableTags: string[];
    onFiltersChange: (filters: BlogFilters) => void;
    resultsCount: number;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
    filters,
    availableTags,
    onFiltersChange,
    resultsCount
}) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({
            ...filters,
            searchQuery: e.target.value
        });
    };

    const handleTagToggle = (tag: string) => {
        const newSelectedTags = filters.selectedTags.includes(tag)
            ? filters.selectedTags.filter(t => t !== tag)
            : [...filters.selectedTags, tag];

        onFiltersChange({
            ...filters,
            selectedTags: newSelectedTags
        });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFiltersChange({
            ...filters,
            sortBy: e.target.value as BlogFilters['sortBy']
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            searchQuery: '',
            selectedTags: [],
            sortBy: 'date-desc'
        });
    };

    const hasActiveFilters = filters.searchQuery || filters.selectedTags.length > 0;

    return (
        <div className='bg-white p-6 rounded-lg shadow-md mb-8'>
            {/* Search input */}
            <div className='mb-6'>
                <label htmlFor='search' className='block text-sm font-medium text-gray-700 mb-2'>
                    Search Posts
                </label>
                <div className='relative'>
                    <input
                        type='text'
                        id='search'
                        value={filters.searchQuery}
                        onChange={handleSearchChange}
                        placeholder='Search by title, content, or tags...'
                        className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                    {filters.searchQuery && (
                        <button
                            onClick={() => onFiltersChange({ ...filters, searchQuery: ''})}
                            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover: text-gray-600'
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Tags Filter */}
            <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Filter by Tags
                </label>
                <div className='flex flex-wrap gap-2'>
                {availableTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            filters.selectedTags.includes(tag)
                                ? 'bg.blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>

        {/* Sort and Results */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center gap-4'>
                <select
                    value={filters.sortBy}
                    onChange={handleSortChange}
                    className='px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="title">Title A-z</option>
                </select>

                <span className='text-sm text-gray-600'>
                    {resultsCount} post{resultsCount !== 1 ? 's' : ''} found
                </span>
            </div>

            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline'
                >
                    Clear all filters
                </button>
            )}
        </div>
    </div>
    );
};

export default SearchFilter;