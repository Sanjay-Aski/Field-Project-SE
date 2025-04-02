import React, { useState } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaTimesCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const DataTable = ({ 
  columns, 
  data, 
  title, 
  searchable = true, 
  pagination = true, 
  pageSize = 10, 
  actions = null,
  emptyMessage = "No data available"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  
  // Handle searching
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };
  
  // Handle clearing search
  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };
  
  // Handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };
  
  // Enhanced search function that can handle nested objects
  const getSortedData = () => {
    let sortableData = [...data];
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      sortableData = sortableData.filter(item => {
        // Check all properties including nested ones
        return Object.keys(item).some(key => {
          const value = item[key];
          
          // Check if it's a nested object
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.values(value).some(nestedValue => 
              String(nestedValue).toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          // Check if it's an array
          if (Array.isArray(value)) {
            return value.some(arrayItem => 
              String(arrayItem).toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          // Regular value
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }
    
    // Sort data if sort config is set
    if (sortConfig.key && sortConfig.direction) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle undefined or null values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'ascending' ? 1 : -1;
        
        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableData;
  };
  
  // Pagination
  const sortedData = getSortedData();
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <FaSort className="inline ml-1 text-gray-400" />;
    }
    
    if (sortConfig.direction === 'ascending') {
      return <FaSortUp className="inline ml-1 text-primary-500" />;
    }
    
    if (sortConfig.direction === 'descending') {
      return <FaSortDown className="inline ml-1 text-primary-500" />;
    }
    
    return <FaSort className="inline ml-1 text-gray-400" />;
  };
  
  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;
    
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);
    
    if (endPage - startPage < 2) {
      startPage = Math.max(1, endPage - 2);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaChevronLeft className="mr-1 h-3 w-3" /> Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next <FaChevronRight className="ml-1 h-3 w-3" />
          </button>
        </div>
        
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(indexOfLastItem, sortedData.length)}
              </span>{' '}
              of <span className="font-medium">{sortedData.length}</span> results
            </p>
          </div>
          
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">First</span>
                <span className="h-5 w-5 flex items-center justify-center" aria-hidden="true">&laquo;</span>
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <FaChevronLeft className="h-3 w-3" />
              </button>
              
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === number
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 font-bold'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                  aria-current={currentPage === number ? 'page' : undefined}
                >
                  {number}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <FaChevronRight className="h-3 w-3" />
              </button>
              
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Last</span>
                <span className="h-5 w-5 flex items-center justify-center" aria-hidden="true">&raquo;</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the table
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-lg font-semibold text-secondary-800 mb-3 sm:mb-0">{title}</h2>
        
        <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-3">
          {searchable && (
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search..."
                className="w-full sm:w-64 pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button onClick={clearSearch} className="text-gray-400 hover:text-gray-600">
                    <FaTimesCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {actions && (
            <div className="sm:ml-3 w-full sm:w-auto">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full overflow-x-auto">
        <div className="min-w-full">
          {currentItems.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                      onClick={() => column.sortable !== false && requestSort(column.key)}
                    >
                      <div className="flex items-center">
                        <span>{column.label}</span>
                        {column.sortable !== false && (
                          <span className="ml-1">
                            {renderSortIcon(column.key)}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-sm text-gray-700">
                        <div className={`${column.nowrap ? 'whitespace-nowrap' : 'whitespace-normal break-words'}`}>
                          {column.render ? column.render(item) : item[column.key] || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
      
      {renderPagination()}
    </div>
  );
};

export default DataTable;
