import React, { useEffect, useState } from 'react';
import { getProgramme, getBookmakers } from '../services/api';

export default function RacesPage() {
  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmakers, setBookmakers] = useState([]);
  const [selectedBookmaker, setSelectedBookmaker] = useState('pmu');

  useEffect(() => {
    getBookmakers()
      .then(({ data }) => {
        setBookmakers(data.bookmakers || []);
        setSelectedBookmaker(data.default || 'pmu');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProgramme(null, selectedBookmaker)
      .then(({ data }) => setProgramme(data))
      .catch((err) => setError(err.response?.data?.error || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [selectedBookmaker]);

  const currentBookmaker = bookmakers.find(b => b.id === selectedBookmaker);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Courses du jour</h2>
          <p>Programme {currentBookmaker?.name || 'PMU'} en temps réel</p>
        </div>

        {bookmakers.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {bookmakers.map((bm) => (
              <button
                key={bm.id}
                className={selectedBookmaker === bm.id ? 'btn-primary' : 'btn-secondary'}
                onClick={() => setSelectedBookmaker(bm.id)}
                title={bm.description}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: selectedBookmaker === bm.id ? 700 : 400,
                  opacity: selectedBookmaker === bm.id ? 1 : 0.7,
                }}
              >
                {bm.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="card empty-state">
          <p className="pulse">Chargement du programme {currentBookmaker?.name || ''}...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <p style={{ color: 'var(--warning)' }}>{error}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
            L'API {currentBookmaker?.name || 'du bookmaker'} peut être indisponible. Vérifiez votre connexion.
          </p>
        </div>
      )}

      {programme && programme.programme && (
        <div className="grid" style={{ gap: 16 }}>
          {(programme.programme.reunions || []).map((reunion, ri) => (
            <div key={ri} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3>R{reunion.numOfficiel} — {reunion.hippodrome?.libelleCourt || 'Hippodrome'}</h3>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {reunion.disciplinesMere || reunion.audience}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-info">{reunion.pays?.code || 'FR'}</span>
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Libellé</th>
                    <th>Heure</th>
                    <th>Partants</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {(reunion.courses || []).map((course, ci) => (
                    <tr key={ci}>
                      <td>C{course.numOrdre}</td>
                      <td>{course.libelle || '—'}</td>
                      <td>{course.heureDepart ? new Date(course.heureDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{course.nombreDeclaresPartants || '—'}</td>
                      <td>{course.distance ? `${course.distance}m` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {programme && !programme.programme && (
        <div className="card empty-state">
          <p>Aucune course disponible pour aujourd'hui sur {currentBookmaker?.name || 'ce bookmaker'}</p>
        </div>
      )}
    </div>
  );
}
