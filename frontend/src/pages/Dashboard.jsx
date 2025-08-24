import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Filter, Edit, Trash2, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeads = useCallback(async (newPage = pagination.page, newFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page: newPage,
        limit: pagination.limit,
        ...newFilters
      };

      // Add search term to filters if present
      if (searchTerm.trim()) {
        params.company_contains = searchTerm.trim();
      }

      const response = await leadsAPI.getLeads(params);
      const { data, page, limit, total, totalPages } = response.data;
      
      setLeads(data);
      setPagination({ page, limit, total, totalPages });
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, searchTerm]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads(1, filters);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filters };
    if (value === '' || value === null) {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = value;
    }
    setFilters(newFilters);
    fetchLeads(1, newFilters);
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      await leadsAPI.deleteLead(id);
      toast.success('Lead deleted successfully');
      fetchLeads(pagination.page);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handlePageChange = (newPage) => {
    fetchLeads(newPage);
  };

  const ActionCellRenderer = (params) => {
    const { data } = params;
    
    return (
      <div className="flex items-center space-x-2">
        <Link
          to={`/leads/${data.id}/edit`}
          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Link>
        <button
          onClick={() => handleDeleteLead(data.id)}
          className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </button>
      </div>
    );
  };

  const StatusCellRenderer = (params) => {
    const statusColors = {
      new: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      qualified: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      won: 'bg-purple-100 text-purple-800'
    };

    const status = params.value;
    const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const SourceCellRenderer = (params) => {
    const source = params.value;
    return source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const columnDefs = useMemo(() => [
    {
      field: 'firstName',
      headerName: 'First Name',
      sortable: true,
      filter: true,
      width: 120
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      sortable: true,
      filter: true,
      width: 120
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
      filter: true,
      width: 200
    },
    {
      field: 'company',
      headerName: 'Company',
      sortable: true,
      filter: true,
      width: 160
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140
    },
    {
      field: 'city',
      headerName: 'City',
      sortable: true,
      filter: true,
      width: 100
    },
    {
      field: 'state',
      headerName: 'State',
      sortable: true,
      filter: true,
      width: 80
    },
    {
      field: 'source',
      headerName: 'Source',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: SourceCellRenderer
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: StatusCellRenderer
    },
    {
      field: 'score',
      headerName: 'Score',
      sortable: true,
      filter: true,
      width: 80,
      type: 'numericColumn'
    },
    {
      field: 'leadValue',
      headerName: 'Value',
      sortable: true,
      filter: true,
      width: 100,
      type: 'numericColumn',
      valueFormatter: (params) => `$${params.value?.toLocaleString() || 0}`
    },
    {
      field: 'isQualified',
      headerName: 'Qualified',
      width: 100,
      cellRenderer: (params) => params.value ? '✅' : '❌'
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      sortable: true,
      width: 120,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      headerName: 'Actions',
      width: 140,
      cellRenderer: ActionCellRenderer,
      sortable: false,
      filter: false,
      pinned: 'right'
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true
  }), []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and track your leads effectively
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/leads/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Lead
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{pagination.total}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                  <dd className="text-lg font-medium text-gray-900">{pagination.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex-1 max-w-lg">
              <div className="relative">
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search by company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </form>
            
            <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <button
                onClick={() => fetchLeads(pagination.page)}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  onChange={(e) => handleFilterChange('status_equals', e.target.value)}
                  value={filters.status_equals || ''}
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="lost">Lost</option>
                  <option value="won">Won</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  onChange={(e) => handleFilterChange('source_equals', e.target.value)}
                  value={filters.source_equals || ''}
                >
                  <option value="">All Sources</option>
                  <option value="website">Website</option>
                  <option value="facebook_ads">Facebook Ads</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="referral">Referral</option>
                  <option value="events">Events</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualified</label>
                <select
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  onChange={(e) => handleFilterChange('is_qualified_equals', e.target.value)}
                  value={filters.is_qualified_equals || ''}
                >
                  <option value="">All</option>
                  <option value="true">Qualified</option>
                  <option value="false">Not Qualified</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="0"
                  onChange={(e) => handleFilterChange('score_gt', e.target.value)}
                  value={filters.score_gt || ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter city"
                  onChange={(e) => handleFilterChange('city_contains', e.target.value)}
                  value={filters.city_contains || ''}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={leads}
            defaultColDef={defaultColDef}
            pagination={false}
            loading={loading}
            suppressPaginationPanel={true}
            suppressScrollOnNewData={true}
            animateRows={true}
          />
        </div>
        
        {/* Custom Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1 || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages || loading}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {((pagination.page - 1) * pagination.limit) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1 || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    pagination.totalPages - 4,
                    pagination.page - 2
                  )) + i;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;