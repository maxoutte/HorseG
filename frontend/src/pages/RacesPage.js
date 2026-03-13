import React, { useEffect, useState } from 'react';
import { getProgramme } from '../services/api';

export default function RacesPage() {
  const [programme, setProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getProgramme()
      .then(({ data }) => setProgramme(data))
      .catch((err) => setError(err.response?.data?.error || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Courses du jour</h2>
        <p>Programme PMU en temps réel</p>
      </div>

      {loading && (
        <div className="card empty-state">
          <p className="pulse">Chargement du programme...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <p style={{ color: 'var(--warning)' }}>{error}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
            L'API PMU peut être indisponible. Vérifiez votre connexion.
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
                <span className="badge badge-info">{reunion.pays?.code || 'FR'}</span>
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
          <p>Aucune course disponible pour aujourd'hui</p>
        </div>
      )}
    </div>
  );
}
