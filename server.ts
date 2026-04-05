import express from "express";
import { createServer as createViteServer } from "vite";
import { BlobServiceClient } from "@azure/storage-blob";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Lazy initialization for Azure Blob Storage
  let containerClient: any = null;

  function getContainerClient() {
    if (!containerClient) {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      const containerName = process.env.AZURE_STORAGE_CONTAINER;

      if (!connectionString || !containerName) {
        throw new Error("AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER are required.");
      }

      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
      containerClient = blobServiceClient.getContainerClient(containerName);
    }
    return containerClient;
  }

  // API endpoint to save records to Azure Blob Storage
  app.post("/api/save-record", async (req, res) => {
    try {
      const record = req.body;
      const client = getContainerClient();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `record-${timestamp}-${Math.random().toString(36).substring(7)}.json`;
      
      const content = JSON.stringify(record, null, 2);
      const blockBlobClient = client.getBlockBlobClient(filename);

      await blockBlobClient.upload(content, content.length);

      console.log(`Uploaded record to Azure Blob Storage: ${filename}`);
      res.json({ success: true, filename });
    } catch (error: any) {
      console.error("Error saving to Azure Blob Storage:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
