import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPI } from '../services/apiProvider';
import { PlaceSearchResult } from '../types/api';
import { Location } from '../services/apiProvider';

interface Props {
  show: boolean;
  onHide: () => void;
  onPlaceAdded: (location: Location) => void;
}

const PlaceSearchModal: React.FC<Props> = ({ show, onHide, onPlaceAdded }) => {
  const { t } = useTranslation();
  const api = useAPI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const places = await api.searchPlaces(value.trim());
        setResults(places);
      } catch {
        setError(t('placeSearch.searchError'));
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [api, t]);

  const handleSelectPlace = async (place: PlaceSearchResult) => {
    if (!place.placeId) return;
    setIsAdding(place.placeId);
    setError(null);
    try {
      const location = await api.addPlace(place.placeId);
      onPlaceAdded(location);
      handleClose();
    } catch {
      setError(t('placeSearch.addError'));
    } finally {
      setIsAdding(null);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsAdding(null);
    onHide();
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t('placeSearch.title')}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder={t('placeSearch.placeholder')}
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <div className="alert alert-danger py-2" role="alert">
                <small>{error}</small>
              </div>
            )}

            {isSearching && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">{t('common.loading')}</span>
                </div>
              </div>
            )}

            {!isSearching && results.length === 0 && query.length >= 2 && (
              <p className="text-muted text-center py-3 mb-0">
                {t('placeSearch.noResults')}
              </p>
            )}

            {results.length > 0 && (
              <div className="list-group">
                {results.map((place) => (
                  <button
                    key={place.placeId ?? ''}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                    onClick={() => handleSelectPlace(place)}
                    disabled={isAdding !== null}
                  >
                    <div className="me-2">
                      <div className="fw-semibold">{place.name ?? ''}</div>
                      <small className="text-muted">{place.address ?? ''}</small>
                    </div>
                    {isAdding === place.placeId && (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">{t('common.loading')}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceSearchModal;
