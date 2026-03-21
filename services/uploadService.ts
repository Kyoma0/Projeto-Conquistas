
export async function chunkedUpload(file: File, onProgress?: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let sessionId = '';

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'UPLOAD_START',
        filename: file.name,
        totalChunks
      }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'UPLOAD_SESSION_READY') {
        sessionId = data.sessionId;
        
        // Start sending chunks
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunk = file.slice(start, end);
          
          // Read chunk as base64
          const reader = new FileReader();
          reader.readAsDataURL(chunk);
          await new Promise((r) => reader.onload = r);
          
          const base64Chunk = (reader.result as string).split(',')[1];
          
          socket.send(JSON.stringify({
            type: 'UPLOAD_CHUNK',
            sessionId,
            chunkIndex: i,
            chunk: base64Chunk
          }));
        }
      }

      if (data.type === 'UPLOAD_PROGRESS') {
        if (onProgress) onProgress(data.progress);
      }

      if (data.type === 'UPLOAD_COMPLETE') {
        socket.close();
        resolve(data.url);
      }
    };

    socket.onerror = (err) => {
      socket.close();
      reject(err);
    };

    socket.onclose = () => {
      // If not resolved yet, it's an unexpected close
    };
  });
}
