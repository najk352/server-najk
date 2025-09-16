const { BlobServiceClient } = require('@azure/storage-blob');
const dotenv = require('dotenv');
dotenv.config();

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || 'uploads'; // Default container name

if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
    console.warn('Azure Storage credentials not fully configured. File uploads will not work in production.');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
    `DefaultEndpointsProtocol=https;AccountName=${AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`
);

const getBlobClient = async (filename, containerName = AZURE_CONTAINER_NAME) => {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists(); // Ensure container exists
    return containerClient.getBlockBlobClient(filename);
};

const uploadFileToBlob = async (filePath, originalName, buffer, mimetype, containerName = AZURE_CONTAINER_NAME) => {
    const blockBlobClient = await getBlobClient(originalName, containerName);
    await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: mimetype }
    });
    return blockBlobClient.url; // Return the public URL of the uploaded blob
};

module.exports = {
    uploadFileToBlob
};