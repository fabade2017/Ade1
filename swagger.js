                        // const swaggerJsdoc = require('swagger-jsdoc');
                        // const swaggerUi = require('swagger-ui-express');
                        
                        // const options = {
                        //     definition: {
                        //         openapi: '3.0.0',
                        //         info: {
                        //             title: 'InstituteConnect 2',
                        //             version: '1.0.0',
                        //             description: 'Detailed API for InstituteConnect 2',
                        //         },
                        //         servers: [
                        //             {
                        //                 url: 'https://institutionconnect.com', // Replace with your actual server URL
                        //                 description: 'Production server',
                        //             },
                        //             {
                        //                 url: 'http://localhost:7000', // Replace with your local development URL if different
                        //                 description: 'Local development server',
                        //             },
                        //         ],
                        //     },
                        //     apis: ['./serverupdate.js'], // Assuming your main server file is named 'server.js'
                        // };
                        
                        // const swaggerSpec = swaggerJsdoc(options);
                        
                        // function setupSwagger(app) {
                        //     app.use('/usersms/swagger/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
                        // }
                        
                        // module.exports = setupSwagger;                

// const swaggerJsdoc = require('swagger-jsdoc');
                    // const swaggerUi = require('swagger-ui-express');
                    
                    // const options = {
                    //     definition: {
                    //         openapi: '3.0.0',
                    //         info: {
                    //             title: 'InstituteConnect 2',
                    //             version: '1.0.0',
                    //             description: 'Detailed API',
                    //         },
                    //         servers: [
                    //             {
                    //                 url: 'https://institutionconnect.com', // Replace with your server URL
                    //             },
                    //         ],
                    //     },
                    //     apis: ['./your-main-server-file.js'], // Path to your main server file where routes are defined
                    // };
                    
                    // const swaggerSpec = swaggerJsdoc(options);
                    
                    // function setupSwagger(app) {
                    //     app.use('/usersms/swagger/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
                    // }
                    
                    // module.exports = setupSwagger;
/*
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
function generateSwaggerSpec(app) {
    const paths = {};

    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            const routePath = middleware.route.path;
            const methods = Object.keys(middleware.route.methods);

            if (!paths[routePath]) {
                paths[routePath] = {};
            }

            methods.forEach((method) => {
                paths[routePath][method] = {
                    summary: `Auto-Generated endpoint for ${method.toUpperCase()}`,
                    responses: {
                        200: {
                            description: 'Success',
                        },
                    },
                };
            });
        } else if (middleware.name === 'app' && middleware.handle && middleware.handle.stack) {
            middleware.handle.stack.forEach((subMiddleware) => {
                if (subMiddleware.route) {
                    const routePath = subMiddleware.route.path;
                    const methods = Object.keys(subMiddleware.route.methods);

                    if (!paths[routePath]) {
                        paths[routePath] = {};
                    }

                    methods.forEach((method) => {
                        paths[routePath][method] = {
                            summary: `Auto-Generated sub-endpoint for ${method.toUpperCase()}`,
                            responses: {
                                200: {
                                    description: 'Success',
                                },
                            },
                        };
                    });
                }
            });
        }
    });

    return {
        openapi: '3.0.0',
        info: {
            title: 'InstituteConnect 2',
            version: '1.0.0',
            description: 'Detailed API',
        },
        servers: [
            {
                url: 'https://institutionconnect.com', // Replace with your server URL
            },
        ],
        paths: paths, // Use 'paths' here
    };
}

function setupSwagger(app) {
    const swaggerSpec = generateSwaggerSpec(app);
    app.use('/usersms/swagger/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
*/
                    
                    // const swaggerJsdoc = require('swagger-jsdoc');
                    // const swaggerUi = require('swagger-ui-express');
                    // const swaggerDocument = require('./swagger_output.json');
                    
                    // const options = {
                    //     definition: {
                    //         openapi: '3.0.0',
                    //         info: {
                    //             title: 'InstituteConnect 2',
                    //             version: '1.0.0',
                    //             description: 'Detailed API for InstituteConnect 2',
                    //         },
                    //         servers: [
                    //             {
                    //                 url: 'https://institutionconnect.com', // Replace with your actual server URL
                    //                 description: 'Production server',
                    //             },
                    //             {
                    //                 url: 'https://institutionconnect.com', // Replace with your local development URL if different
                    //                 description: 'Local development server',
                    //             },
                    //         ],
                    //     },
                    //     apis: ['serverupdate.js'], // Assuming your main server file is named 'server.js'
                    // };
                    
                    // const swaggerSpec = swaggerJsdoc(options);
                    
                    // function setupSwagger(app) {
                    //     app.use('/usersms/swagger/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
                    // }
                    
                    // module.exports = setupSwagger;
                    
                    const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json');

function setupSwagger(app) {
    app.use('/usersms/swagger/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = setupSwagger;
