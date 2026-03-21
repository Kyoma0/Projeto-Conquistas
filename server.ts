
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import fs from 'fs';
import { sendConfirmationEmail, sendPasswordResetEmail } from './services/emailService';
import { ADMIN_EMAIL } from './constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // WebSocket Server for Chunked Uploads and Real-time Chat
  const wss = new WebSocketServer({ server });
  const uploadSessions = new Map<string, { 
    filename: string, 
    chunks: Buffer[], 
    totalChunks: number, 
    receivedChunks: number 
  }>();

  // Map to store active chat connections: userId -> WebSocket
  const chatClients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    let currentUserId: string | null = null;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'IDENTIFY') {
          currentUserId = data.userId;
          if (currentUserId) {
            chatClients.set(currentUserId, ws);
            // Broadcast user online
            const onlinePayload = JSON.stringify({ type: 'USER_ONLINE', userId: currentUserId });
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(onlinePayload);
              }
            });
            // Send current online users to the new client
            const onlineUsers = Array.from(chatClients.keys());
            ws.send(JSON.stringify({ type: 'ONLINE_USERS_LIST', users: onlineUsers }));
          }
        }

        else if (data.type === 'UPLOAD_START') {
          const sessionId = `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          uploadSessions.set(sessionId, {
            filename: data.filename,
            chunks: [],
            totalChunks: data.totalChunks,
            receivedChunks: 0
          });
          ws.send(JSON.stringify({ type: 'UPLOAD_SESSION_READY', sessionId }));
        } 
        
        else if (data.type === 'UPLOAD_CHUNK') {
          const session = uploadSessions.get(data.sessionId);
          if (session) {
            // Convert base64 chunk back to buffer
            const chunkBuffer = Buffer.from(data.chunk, 'base64');
            session.chunks[data.chunkIndex] = chunkBuffer;
            session.receivedChunks++;
            
            // Progress update
            ws.send(JSON.stringify({ 
              type: 'UPLOAD_PROGRESS', 
              progress: Math.round((session.receivedChunks / session.totalChunks) * 100) 
            }));

            if (session.receivedChunks === session.totalChunks) {
              // Reassemble
              const finalBuffer = Buffer.concat(session.chunks);
              const fileExt = path.extname(session.filename);
              const safeFilename = `${data.sessionId}${fileExt}`;
              const filePath = path.join(uploadsDir, safeFilename);
              
              fs.writeFileSync(filePath, finalBuffer);
              
              const publicUrl = `/uploads/${safeFilename}`;
              ws.send(JSON.stringify({ type: 'UPLOAD_COMPLETE', url: publicUrl }));
              uploadSessions.delete(data.sessionId);
            }
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    ws.on('close', () => {
      if (currentUserId) {
        chatClients.delete(currentUserId);
        // Broadcast user offline
        const offlinePayload = JSON.stringify({ type: 'USER_OFFLINE', userId: currentUserId });
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(offlinePayload);
          }
        });
      }
      if (uploadSessions.size > 100) uploadSessions.clear(); // Basic cleanup
    });
  });

  console.log('Iniciando servidor...');

  app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  app.use(cors());
  app.use(express.json({ limit: '1024mb' }));
  app.use(express.urlencoded({ limit: '1024mb', extended: true }));

  // --- STEAM AUTH & API PROXY ---
  app.get('/api/auth/steam/url', (req, res) => {
    let appUrl = process.env.APP_URL;
    
    // Dynamic detection if APP_URL is not set or is localhost but request is remote
    if (!appUrl || (appUrl.includes('localhost') && req.headers.host && !req.headers.host.includes('localhost'))) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      appUrl = `${protocol}://${host}`;
      console.log(`Using dynamic APP_URL for Steam: ${appUrl}`);
    }

    const redirectUri = `${appUrl}/api/auth/steam/callback`;
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': redirectUri,
      'openid.realm': appUrl,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    const authUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;
    res.json({ url: authUrl });
  });

  app.get('/api/auth/steam/callback', async (req, res) => {
    try {
      const params = req.query;
      const verifyParams = new URLSearchParams(params as any);
      verifyParams.set('openid.mode', 'check_authentication');
      
      const response = await fetch('https://steamcommunity.com/openid/login', {
        method: 'POST',
        body: verifyParams.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const text = await response.text();
      console.log('Steam OpenID Verification Response:', text);
      const isValid = text.includes('is_valid:true');
      
      if (isValid) {
        const claimedId = params['openid.claimed_id'] as string;
        const steamId = claimedId.split('/').pop();
        console.log('Steam ID extracted:', steamId);
        
        if (!steamId) {
          console.error('Steam ID not found in claimed_id:', claimedId);
          return res.status(400).send('Steam ID não encontrado na resposta');
        }

        res.send(`
          <html>
            <body style="background: #0d1117; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <div style="text-align: center; padding: 20px; border-radius: 12px; background: #171a21; border: 1px solid #2a475e;">
                <h2 style="color: #66c0f4; margin-bottom: 10px;">Autenticação Steam Concluída!</h2>
                <p style="color: #8f98a0;">Sincronizando dados... Esta janela fechará automaticamente.</p>
                <div style="margin-top: 20px; height: 4px; background: #2a475e; border-radius: 2px; overflow: hidden;">
                  <div style="height: 100%; background: #66c0f4; width: 50%; animation: loading 2s infinite ease-in-out;"></div>
                </div>
                <style>
                  @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                  }
                </style>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ 
                      type: 'STEAM_AUTH_SUCCESS', 
                      steamId: '${steamId}'
                    }, '*');
                    setTimeout(() => window.close(), 1500);
                  } else {
                    window.location.href = '/';
                  }
                </script>
              </div>
            </body>
          </html>
        `);
      } else {
        console.error('Steam OpenID validation failed. Response text:', text);
        res.status(400).send('Falha na autenticação Steam: Resposta inválida do servidor Steam');
      }
    } catch (error) {
      console.error('Steam Auth Callback Error:', error);
      res.status(500).send('Erro interno na autenticação Steam');
    }
  });

  app.get('/api/steam/config', (req, res) => {
    const apiKey = process.env.STEAM_API_KEY;
    const isConfigured = !!apiKey && apiKey !== 'your_steam_api_key_here';
    res.json({ isConfigured });
  });

  app.get('/api/steam/owned-games/:steamId', async (req, res) => {
    const { steamId } = req.params;
    const apiKey = process.env.STEAM_API_KEY;
    
    if (!apiKey || apiKey === 'your_steam_api_key_here') {
      return res.status(500).json({ 
        error: 'STEAM_API_KEY não configurada no servidor.' 
      });
    }
    
    try {
      const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=1`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Steam API error response (${response.status}):`, errorBody);
        
        if (response.status === 403) {
          return res.status(403).json({ error: 'Acesso negado pela Steam. Verifique se o seu perfil e os "Detalhes do Jogo" estão configurados como "Público" nas configurações de privacidade da Steam.' });
        }
        
        return res.status(response.status).json({ error: `Erro na API da Steam (${response.status}) ao buscar biblioteca.` });
      }

      const data = await response.json();
      
      if (data.response && data.response.games) {
        res.json(data.response.games);
      } else {
        console.warn('Steam API owned games empty response:', data);
        res.status(400).json({ 
          error: 'A Steam não retornou nenhum jogo. Verifique se o seu perfil e os "Detalhes do Jogo" estão configurados como "Público".' 
        });
      }
    } catch (error) {
      console.error('Steam API Error:', error);
      res.status(500).json({ error: 'Erro ao consultar API da Steam' });
    }
  });

  app.get('/api/steam/achievements/:steamId/:appId', async (req, res) => {
    const { steamId, appId } = req.params;
    const apiKey = process.env.STEAM_API_KEY;
    
    if (!apiKey || apiKey === 'your_steam_api_key_here') {
      return res.status(500).json({ 
        error: 'STEAM_API_KEY não configurada no servidor. Por favor, adicione sua Steam Web API Key nas configurações do projeto.' 
      });
    }
    
    try {
      const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${apiKey}&steamid=${steamId}&l=portuguese`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Steam API error response (${response.status}):`, errorBody);
        
        if (response.status === 403) {
          return res.status(403).json({ error: 'Acesso negado pela Steam. Verifique se o seu perfil e os detalhes do jogo estão configurados como "Público" nas configurações de privacidade da Steam.' });
        }
        
        return res.status(response.status).json({ error: `Erro na API da Steam (${response.status}). Verifique se o ID do jogo e o seu SteamID estão corretos.` });
      }

      const data = await response.json();
      
      if (data.playerstats && data.playerstats.success) {
        const achievements = data.playerstats.achievements || [];
        const unlocked = achievements.filter((a: any) => a.achieved === 1);
        res.json(unlocked);
      } else {
        const steamError = data.playerstats?.error || 'Erro desconhecido';
        console.warn('Steam API success false:', steamError);
        res.status(400).json({ 
          error: `A Steam retornou um erro: ${steamError}. Certifique-se de que você possui o jogo e que seu perfil é público.` 
        });
      }
    } catch (error) {
      console.error('Steam API Error:', error);
      res.status(500).json({ error: 'Erro ao consultar API da Steam' });
    }
  });

  app.get('/api/steam/game-schema/:appId', async (req, res) => {
    const { appId } = req.params;
    const apiKey = process.env.STEAM_API_KEY;
    
    if (!apiKey || apiKey === 'your_steam_api_key_here') {
      return res.status(500).json({ 
        error: 'STEAM_API_KEY não configurada no servidor.' 
      });
    }
    
    try {
      const url = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appId}&l=portuguese`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: `Erro na API da Steam (${response.status}) ao buscar esquema do jogo.` });
      }

      const data = await response.json();
      
      if (data.game && data.game.availableGameStats && data.game.availableGameStats.achievements) {
        res.json(data.game.availableGameStats.achievements);
      } else {
        res.status(400).json({ error: 'A Steam não retornou conquistas para este AppID. Verifique se o ID está correto.' });
      }
    } catch (error) {
      console.error('Steam API Error:', error);
      res.status(500).json({ error: 'Erro ao consultar API da Steam' });
    }
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
