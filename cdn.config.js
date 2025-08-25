/**
 * CDN Configuration for PayPass
 * Content Delivery Network setup for global performance optimization
 * CDN Configuration: Enabled for global content delivery
 */

// CDN Provider configurations
const cdnProviders = {
  cloudflare: {
    enabled: true,
    zones: {
      main: process.env.CLOUDFLARE_ZONE_ID,
      assets: process.env.CLOUDFLARE_ASSETS_ZONE_ID
    },
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    settings: {
      caching: {
        level: 'aggressive',
        browserTtl: 31536000, // 1 year
        edgeTtl: 2592000      // 30 days
      },
      compression: {
        gzip: true,
        brotli: true
      },
      minification: {
        css: true,
        js: true,
        html: true
      },
      optimization: {
        polish: 'lossy',
        mirage: true,
        rocket_loader: true
      }
    }
  },
  
  aws_cloudfront: {
    enabled: false,
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    originDomain: process.env.CLOUDFRONT_ORIGIN_DOMAIN,
    settings: {
      priceClass: 'PriceClass_All',
      viewerProtocolPolicy: 'redirect-to-https',
      compress: true,
      cachingPolicy: {
        ttl: {
          defaultTtl: 86400,    // 24 hours
          maxTtl: 31536000      // 1 year
        }
      }
    }
  }
};

// Asset optimization rules
const assetRules = {
  images: {
    formats: ['webp', 'avif', 'jpeg', 'png'],
    compression: {
      quality: 85,
      progressive: true
    },
    responsive: {
      breakpoints: [640, 768, 1024, 1280, 1536],
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
    },
    caching: {
      maxAge: 31536000, // 1 year
      staleWhileRevalidate: 86400 // 24 hours
    }
  },
  
  css: {
    minification: true,
    purging: {
      enabled: true,
      safelist: ['btn-*', 'text-*', 'bg-*']
    },
    critical: {
      inline: true,
      dimensions: [1300, 900]
    },
    caching: {
      maxAge: 31536000, // 1 year
      immutable: true
    }
  },
  
  javascript: {
    minification: true,
    compression: 'gzip',
    bundling: {
      splitting: true,
      chunks: ['vendor', 'common', 'runtime']
    },
    caching: {
      maxAge: 31536000, // 1 year
      immutable: true
    }
  },
  
  fonts: {
    formats: ['woff2', 'woff', 'ttf'],
    preload: true,
    display: 'swap',
    caching: {
      maxAge: 31536000, // 1 year
      crossOrigin: 'anonymous'
    }
  }
};

// Geographic distribution settings
const geoDistribution = {
  regions: [
    {
      name: 'North America',
      locations: ['us-east-1', 'us-west-1', 'ca-central-1'],
      priority: 1
    },
    {
      name: 'Europe',
      locations: ['eu-west-1', 'eu-central-1', 'eu-north-1'],
      priority: 1
    },
    {
      name: 'Asia Pacific',
      locations: ['ap-southeast-1', 'ap-northeast-1', 'ap-south-1'],
      priority: 2
    },
    {
      name: 'Africa',
      locations: ['af-south-1'],
      priority: 3
    }
  ],
  
  routingPolicy: 'latency-based',
  healthChecks: {
    enabled: true,
    interval: 30, // seconds
    failureThreshold: 3
  }
};

// Cache control headers
const cacheHeaders = {
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Expires': new Date(Date.now() + 31536000000).toUTCString()
  },
  
  dynamic: {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    'Vary': 'Accept-Encoding, Accept'
  },
  
  api: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    'Vary': 'Accept, Authorization'
  },
  
  html: {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'Vary': 'Accept-Encoding'
  }
};

// Performance monitoring
const monitoring = {
  metrics: {
    cacheHitRatio: {
      target: 90, // 90%
      alert: 80   // Alert if below 80%
    },
    responseTime: {
      target: 200,  // 200ms
      alert: 500    // Alert if above 500ms
    },
    availability: {
      target: 99.9, // 99.9%
      alert: 99.5   // Alert if below 99.5%
    }
  },
  
  reporting: {
    interval: '1h',
    retention: '30d',
    dashboards: ['cloudflare', 'datadog', 'grafana']
  }
};

// CDN configuration export
const cdnConfig = {
  providers: cdnProviders,
  assets: assetRules,
  distribution: geoDistribution,
  headers: cacheHeaders,
  monitoring: monitoring,
  
  // Helper functions
  getCacheHeaders(assetType) {
    const typeMapping = {
      'css': 'static',
      'js': 'static', 
      'image': 'static',
      'font': 'static',
      'html': 'html',
      'api': 'api'
    };
    
    return this.headers[typeMapping[assetType] || 'dynamic'];
  },
  
  isStaticAsset(url) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.ico'];
    return staticExtensions.some(ext => url.endsWith(ext));
  },
  
  getOptimalRegion(userLocation) {
    // Simple region selection based on user location
    // In production, use actual geolocation service
    const regionMap = {
      'US': 'us-east-1',
      'CA': 'ca-central-1', 
      'GB': 'eu-west-1',
      'DE': 'eu-central-1',
      'JP': 'ap-northeast-1',
      'SG': 'ap-southeast-1',
      'AU': 'ap-southeast-2'
    };
    
    return regionMap[userLocation] || 'us-east-1';
  }
};

// Next.js CDN integration
const nextjsConfig = {
  images: {
    domains: [
      'cdn.paypass.com',
      'assets.paypass.com',
      'img.paypass.com'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000
  },
  
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.paypass.com'
    : '',
    
  compress: false, // Handled by CDN
  
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-CDN-Provider',
          value: 'Cloudflare'
        },
        {
          key: 'X-Cache-Status',
          value: 'MISS'
        }
      ]
    },
    {
      source: '/api/(.*)',
      headers: Object.entries(cacheHeaders.api).map(([key, value]) => ({
        key,
        value
      }))
    }
  ]
};

module.exports = {
  cdnConfig,
  nextjsConfig,
  cdnProviders,
  assetRules,
  geoDistribution,
  cacheHeaders,
  monitoring
};
