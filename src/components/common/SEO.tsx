import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    canonical?: string;
    ogType?: string;
    ogImage?: string;
    twitterHandle?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description = "Kasb.AI - The AI-powered platform for startups and investors. Matching innovation with capital.",
    keywords = "Kasb.AI, AI-powered startup platform, startup fundraising, investor deal flow, venture capital, angel investors, startup matchmaking",
    canonical = "https://kasbai.online",
    ogType = "website",
    ogImage = "https://kasbai.online/logo.webp",
    twitterHandle = "@kasbai2025",
}) => {
    const siteTitle = "Kasb.AI";
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

    return (
        <Helmet>
            {/* Standard metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={canonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonical} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
            {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify([
                    {
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Kasb.AI",
                        "url": "https://kasbai.online",
                        "description": description,
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": "https://kasbai.online/#features",
                            "query-input": "required name=search_term_string"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Kasb.AI",
                        "url": "https://kasbai.online",
                        "logo": "https://kasbai.online/logo.webp",
                        "sameAs": [
                            "https://x.com/kasbai2025",
                            "https://www.linkedin.com/in/kasb-ai-33173839b/",
                            "https://www.instagram.com/kasb.ai/"
                        ],
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "email": "kasbai2025@gmail.com",
                            "contactType": "customer service"
                        }
                    },
                    {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Home",
                                "item": "https://kasbai.online/"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": title || "Platform",
                                "item": canonical
                            }
                        ]
                    }
                ])}
            </script>
        </Helmet>
    );
};
