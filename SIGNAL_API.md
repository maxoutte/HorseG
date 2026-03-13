# API — Réception des Signaux Oracle

## Authentification

Toutes les requêtes vers `POST /api/signals` nécessitent la clé API :

```
X-Api-Key: <votre_clé>    (header)
# ou
?api_key=<votre_clé>       (query param)
```

---

## Envoyer un Signal

### `POST /api/signals`

```json
{
  "source": "mon_oracle_v1",
  "race": {
    "date": "2024-06-15",
    "reunion": 1,
    "course": 3,
    "hippodrome": "Longchamp"
  },
  "horses": [4, 7],
  "betType": "couple",
  "amount": 10,
  "strength": "high",
  "metadata": {
    "confidence": 0.87,
    "model": "xgboost_v3"
  }
}
```

### Champs

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `source` | string | ✓ | Identifiant de l'oracle |
| `race.date` | string (YYYY-MM-DD) | ✓ | Date de la course |
| `race.reunion` | number | ✓ | Numéro de réunion |
| `race.course` | number | ✓ | Numéro de course |
| `race.hippodrome` | string | — | Nom de l'hippodrome |
| `horses` | number[] | ✓ | Numéros de chevaux (max 20) |
| `betType` | enum | ✓ | Type de pari (voir ci-dessous) |
| `amount` | number | ✓ | Mise en euros (max 500€) |
| `strength` | enum | ✓ | Force du signal |
| `metadata` | object | — | Données supplémentaires (libres) |

### Types de paris (`betType`)

| Valeur | Description |
|--------|-------------|
| `simple_gagnant` | Simple gagnant |
| `simple_place` | Simple placé |
| `couple` | Couplé |
| `tierce` | Tiercé |
| `quarte` | Quarté+ |
| `quinte` | Quinté+ |
| `multi` | Multi |

### Force du signal (`strength`)

| Valeur | Description |
|--------|-------------|
| `low` | Confiance faible |
| `medium` | Confiance moyenne |
| `high` | Confiance élevée |
| `critical` | Confiance maximale |

### Réponse

```json
{
  "ok": true,
  "signalId": "uuid",
  "betId": "uuid",
  "message": "Signal traité — pari abc12345 créé"
}
```

En cas d'ignorance du signal (garde-fous) :

```json
{
  "ok": true,
  "signalId": "uuid",
  "skipped": true,
  "reason": "Montant 100€ supérieur au maximum autorisé (50€)"
}
```

---

## Exemples cURL

```bash
# Envoyer un signal simple gagnant
curl -X POST http://localhost:3001/api/signals \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: dev_key_change_me" \
  -d '{
    "source": "oracle_v1",
    "race": { "date": "2024-06-15", "reunion": 1, "course": 5, "hippodrome": "Vincennes" },
    "horses": [3],
    "betType": "simple_gagnant",
    "amount": 5,
    "strength": "high"
  }'

# Consulter les paris
curl http://localhost:3001/api/bets

# Stats
curl http://localhost:3001/api/bets/stats
```

---

## Événements WebSocket

Le serveur émet les événements suivants en temps réel :

| Événement | Données | Description |
|-----------|---------|-------------|
| `signal:received` | `{signalId, signal, timestamp}` | Signal reçu |
| `signal:skipped` | `{signalId, reason}` | Signal ignoré |
| `bet:created` | `{betId, signal}` | Pari créé |
| `bet:placing` | `{betId}` | Placement en cours |
| `bet:placed` | `{betId, pmuBetId}` | Pari placé sur PMU |
| `bet:error` | `{betId, error}` | Erreur de placement |
| `bet:result` | `{betId, result, gain}` | Résultat enregistré |
| `stats:update` | `DashboardStats` | Statistiques mises à jour |

---

## Garde-fous automatiques

Le système vérifie automatiquement avant chaque pari :

1. **Paris activés** — config `betting_enabled = true`
2. **Montant max** — config `max_bet_amount` (défaut: 50€)
3. **Limite journalière** — config `daily_limit` (défaut: 200€)
4. **Force minimale** — config `min_signal_strength` (défaut: medium)
5. **Connexion PMU** — si placement automatique activé
