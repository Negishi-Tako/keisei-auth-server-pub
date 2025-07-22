import { Hono } from 'hono'
import { requireLogin } from '../middleware';

async function get_projects(project_ids: number[] | null) {
    try {
        const pool = await db.getPool();
        const request = pool.request();
        return await request.query('SELECT * FROM projects');
    } catch (err) {
        const dbError = err as DatabaseError;
        console.error('Failed to get projects:', dbError.message);
        throw dbError;
    }
}

async function generatePrivateBlobSASUrl() {
    try {
        // Generate SAS URL for private blobs with 30-minute expiration
        const sasResponse = await blobService.generateContainerSASUrl({
            containerName: 'private', // Replace with your actual container name
            permissions: 'r', // Read-only permissions
            expiresIn: 30, // 30 minutes
            prefix: 'private/'
        });
        return sasResponse;
    } catch (err) {
        console.error('Failed to generate SAS URL:', err);
        return null;
    }
}

route_projects.get('/', requireLogin, async (c) => {
    try {
        const idParam = c.req.query('id');
        let project_ids: number[] | null = null;
        if (idParam) {
            project_ids = idParam
                .split(',')
                .map(id => parseInt(id.trim()))
                .filter(id => !isNaN(id));
            if (project_ids.length === 0) {
                project_ids = null;
            }
        }
        let res = await get_projects(project_ids);
        if (res.recordset.length === 0) {
            res = await get_projects(null);
        }

        // Generate SAS URL for private blobs
        const sasUrl = await generatePrivateBlobSASUrl();

        // Return projects data along with SAS URL
        const response = {
            projects: res.recordset,
            privateBlobAccess: sasUrl ? {
                sasUrl: sasUrl.url,
                expiresAt: sasUrl.expiresAt,
                containerName: sasUrl.containerName,
                prefix: sasUrl.prefix
            } : null
        };

        return c.json(response, 200);
    } catch (err) {
        return c.json({ message: 'Internal Server Error' }, 500);
    }
});

export default route_projects;