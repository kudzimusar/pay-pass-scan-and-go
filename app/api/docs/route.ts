import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// API Documentation endpoint that serves OpenAPI specification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const version = searchParams.get('version') || 'latest';

    // Read OpenAPI specification file
    const openApiPath = join(process.cwd(), 'docs', 'api', 'openapi.yaml');
    const openApiContent = readFileSync(openApiPath, 'utf8');
    
    // Parse YAML content
    const openApiSpec = yaml.load(openApiContent) as any;

    // Add runtime information
    const enhancedSpec = {
      ...openApiSpec,
      servers: [
        {
          url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`,
          description: 'Current environment'
        },
        ...openApiSpec.servers
      ],
      info: {
        ...openApiSpec.info,
        'x-generated-at': new Date().toISOString(),
        'x-environment': process.env.NODE_ENV || 'development',
        'x-version': version
      }
    };

    // Return in requested format
    if (format === 'yaml') {
      return new NextResponse(yaml.dump(enhancedSpec), {
        headers: {
          'Content-Type': 'application/x-yaml',
          'Content-Disposition': 'attachment; filename="paypass-api.yaml"'
        }
      });
    }

    // Default to JSON format
    return NextResponse.json({
      success: true,
      data: enhancedSpec,
      metadata: {
        format,
        version,
        generatedAt: new Date().toISOString(),
        endpoints: Object.keys(enhancedSpec.paths || {}).length,
        schemas: Object.keys(enhancedSpec.components?.schemas || {}).length
      }
    });

  } catch (error) {
    console.error('API documentation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load API documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Swagger UI HTML generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme = 'light', layout = 'BaseLayout' } = body;

    const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PayPass API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    <link rel="icon" type="image/png" href="/favicon.png" sizes="32x32" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin: 0;
            background: ${theme === 'dark' ? '#1f1f1f' : '#fafafa'};
        }
        .swagger-ui .topbar {
            background-color: #2c3e50;
        }
        .swagger-ui .topbar .download-url-wrapper .download-url-button {
            background: #3498db;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api/docs?format=json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "${layout}",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                docExpansion: 'list',
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                tryItOutEnabled: true,
                requestInterceptor: function(req) {
                    // Add API key if available
                    const apiKey = localStorage.getItem('paypass_api_key');
                    if (apiKey) {
                        req.headers['Authorization'] = 'Bearer ' + apiKey;
                    }
                    return req;
                },
                responseInterceptor: function(res) {
                    // Log responses for debugging
                    console.log('API Response:', res);
                    return res;
                }
            });

            // Add custom functionality
            window.ui = ui;
            
            // Add API key input
            setTimeout(() => {
                const topbar = document.querySelector('.topbar');
                if (topbar) {
                    const apiKeyInput = document.createElement('div');
                    apiKeyInput.innerHTML = \`
                        <div style="display: flex; align-items: center; margin-left: 20px;">
                            <label style="color: white; margin-right: 10px;">API Key:</label>
                            <input type="text" id="api-key-input" placeholder="Enter your API key" 
                                   style="padding: 5px; margin-right: 10px; border-radius: 3px; border: none;">
                            <button onclick="setApiKey()" style="padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">
                                Set Key
                            </button>
                        </div>
                    \`;
                    topbar.appendChild(apiKeyInput);
                }
            }, 1000);
        };

        function setApiKey() {
            const input = document.getElementById('api-key-input');
            const apiKey = input.value.trim();
            if (apiKey) {
                localStorage.setItem('paypass_api_key', apiKey);
                alert('API key set successfully!');
            } else {
                localStorage.removeItem('paypass_api_key');
                alert('API key cleared.');
            }
        }
    </script>
</body>
</html>`;

    return new NextResponse(swaggerHtml, {
      headers: {
        'Content-Type': 'text/html',
      }
    });

  } catch (error) {
    console.error('Swagger UI generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate Swagger UI'
      },
      { status: 500 }
    );
  }
}

// API Statistics endpoint
export async function PATCH(request: NextRequest) {
  try {
    // Mock API statistics
    const stats = {
      endpoints: {
        total: 47,
        active: 45,
        deprecated: 2,
        beta: 3
      },
      usage: {
        totalRequests: 2456789,
        requestsToday: 145678,
        averageResponseTime: 127,
        errorRate: 2.37
      },
      versions: {
        'v1': {
          usage: 78,
          endpoints: 35,
          status: 'stable'
        },
        'v2': {
          usage: 18,
          endpoints: 12,
          status: 'stable'
        },
        'v3': {
          usage: 4,
          endpoints: 8,
          status: 'beta'
        }
      },
      documentation: {
        lastUpdated: new Date().toISOString(),
        completeness: 94.2,
        examples: 156,
        schemas: 42
      },
      security: {
        authenticationMethods: ['API Key', 'Bearer Token', 'OAuth 2.0'],
        rateLimits: {
          basic: '100/hour',
          premium: '1000/hour',
          enterprise: '10000/hour'
        },
        encryption: 'TLS 1.3'
      }
    };

    return NextResponse.json({
      success: true,
      data: stats,
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      }
    });

  } catch (error) {
    console.error('API statistics error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve API statistics'
      },
      { status: 500 }
    );
  }
}
