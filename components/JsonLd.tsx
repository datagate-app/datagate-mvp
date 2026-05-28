import { siteConfig } from "@/lib/landing-config";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    url: siteConfig.url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "PLN",
      availability: "https://schema.org/PreOrder",
      description: "Wczesny dostęp do MVP",
    },
    creator: { "@type": "Organization", name: siteConfig.company.parent },
    inLanguage: "pl-PL",
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD musi być w innerHTML, nie jako children — to standard schema.org w Next
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
