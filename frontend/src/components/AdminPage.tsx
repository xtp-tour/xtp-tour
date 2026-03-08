import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPI } from '../services/apiProvider';
import { AdminFacility } from '../types/api';

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const api = useAPI();
  const [facilities, setFacilities] = useState<AdminFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const data = await api.adminListFacilities();
        setFacilities(data);
      } catch {
        setError(t('admin.accessDenied'));
      } finally {
        setIsLoading(false);
      }
    };
    loadFacilities();
  }, [api, t]);

  const toggleStatus = async (facility: AdminFacility) => {
    const newStatus = facility.status === 'active' ? 'hidden' : 'active';
    setUpdatingId(facility.id);
    try {
      await api.adminUpdateFacility(facility.id, newStatus);
      setFacilities(prev =>
        prev.map(f => f.id === facility.id ? { ...f, status: newStatus } : f)
      );
    } catch {
      setError(t('admin.updateError'));
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning text-center py-4" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">{t('admin.title')}</h2>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>{t('admin.columns.name')}</th>
              <th>{t('admin.columns.address')}</th>
              <th>{t('admin.columns.source')}</th>
              <th>{t('admin.columns.status')}</th>
              <th>{t('admin.columns.addedBy')}</th>
              <th>{t('admin.columns.createdAt')}</th>
              <th>{t('admin.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map((facility) => (
              <tr key={facility.id}>
                <td>{facility.name}</td>
                <td><small>{facility.address}</small></td>
                <td>
                  <span className={`badge ${facility.source === 'seed' ? 'bg-secondary' : 'bg-info'}`}>
                    {facility.source}
                  </span>
                </td>
                <td>
                  <span className={`badge ${facility.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
                    {facility.status}
                  </span>
                </td>
                <td><small>{facility.addedBy || '-'}</small></td>
                <td><small>{facility.createdAt ? new Date(facility.createdAt).toLocaleDateString() : '-'}</small></td>
                <td>
                  <button
                    className={`btn btn-sm ${facility.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                    onClick={() => toggleStatus(facility)}
                    disabled={updatingId === facility.id}
                  >
                    {updatingId === facility.id ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      facility.status === 'active' ? t('admin.hide') : t('admin.activate')
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;
