/**
 * Swagger/OpenAPI Configuration
 */
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Permit Assistant API',
            version: '1.0.0',
            description: 'API for permit pricing, requirements, paperwork, and jurisdiction comparison',
            contact: { name: 'Permit Assistant', email: 'support@permitassistant.com' }
        },
        servers: [{ url: process.env.API_URL || 'http://localhost:5001', description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development' }],
        tags: [
            { name: 'Permits', description: 'Permit pricing and requirements' },
            { name: 'Paperwork', description: 'Permit forms and documents' },
            { name: 'Comparison', description: 'Jurisdiction comparison tools' },
            { name: 'Admin', description: 'Admin dashboard and monitoring' }
        ]
    },
    apis: ['./swagger-routes.js']
};

module.exports = swaggerJsdoc(options);
