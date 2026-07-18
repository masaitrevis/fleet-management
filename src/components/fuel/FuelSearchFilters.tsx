'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface FuelSearchFiltersProps {
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
}

export default function FuelSearchFilters({ onSearch, onFilter }: FuelSearchFiltersProps) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    fuelType: '',
    status: '',
    vehicle: '',
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch?.(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search fuel logs..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
          <select
            value={filters.fuelType}
            onChange={(e) => handleFilterChange('fuelType', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Fuel Types</option>
            <option value="DIESEL">Diesel</option>
            <option value="PETROL">Petrol</option>
            <option value="PREMIUM_DIESEL">Premium Diesel</option>
            <option value="PREMIUM_PETROL">Premium Petrol</option>
            <option value="LPG">LPG</option>
            <option value="CNG">CNG</option>
            <option value="ELECTRIC">Electric</option>
            <option value="HYBRID">Hybrid</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="DISPUTED">Disputed</option>
            <option value="REJECTED">Rejected</option>
            <option value="APPROVED">Approved</option>
          </select>

          <input
            type="text"
            placeholder="Vehicle registration..."
            value={filters.vehicle}
            onChange={(e) => handleFilterChange('vehicle', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}
