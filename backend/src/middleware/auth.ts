import { Request, Response, NextFunction } from 'express';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const expectedKey = process.env.API_SECRET_KEY || 'dev_key_change_me';

  if (!apiKey || apiKey !== expectedKey) {
    res.status(401).json({ error: 'Clé API manquante ou invalide' });
    return;
  }
  next();
}
