import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { leadsAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [gridApi, setGridApi] = useState(null);

  const columnDefs = [
    { headerName: "Company", field: "company", sortable: true, filter: true },
    { headerName: "Contact Person", field: "contactPerson", sortable: true, filter: true },
    { headerName: "Email", field: "email", sortable: true, filter: true },
    { headerName: "Phone", field: "phone", sortable: true, filter: true },
    { headerName: "Status", field: "status", sortable: true, filter: true },
    { headerName: "Created At", field: "createdAt", sortable: true, filter: true },
  ];

  const defaultColDef = {
    flex: 1,
    minWidth: 120,
    resizable: true,
  };

  const fetchLeads = useCallback(async (newPage = pagination.page, newFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page: newPage,
        limit: pagination.limit,
        ...newFilters,
      };

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

  // Handle grid overlays for loading/no data
  useEffect(() => {
    if (gridApi) {
      if (loading) {
        gridApi.showLoadingOverlay();
      } else if (leads.length === 0) {
        gridApi.showNoRowsOverlay();
      } else {
        gridApi.hideOverlay();
      }
    }
  }, [loading, leads, gridApi]);

  return (
    <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={leads}
        defaultColDef={defaultColDef}
        pagination={false}
        suppressPaginationPanel={true}
        suppressScrollOnNewData={true}
        animateRows={true}
        overlayLoadingTemplate={
          '<span class="ag-overlay-loading-center">Loading...</span>'
        }
        overlayNoRowsTemplate={
          '<span class="ag-overlay-loading-center">No Leads Found</span>'
        }
        onGridReady={(params) => setGridApi(params.api)}
      />
    </div>
  );
}
