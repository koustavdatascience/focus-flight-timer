import { useEffect } from "react";
import { useLocation } from "wouter";
import { canonicalForPath, seoForPath } from "@/services/seo";

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function SeoMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const seo = seoForPath(location);
    const canonicalUrl = canonicalForPath(location);
    document.title = seo.title;
    setMeta("name", "description", seo.description);
    setMeta("name", "robots", seo.indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow");
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", canonicalUrl);
    setMeta("name", "twitter:card", "summary");
    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    document.head.querySelectorAll('script[data-focusflight-structured-data="true"]').forEach((script) => script.remove());
    const structuredData = seo.structuredData ? (Array.isArray(seo.structuredData) ? seo.structuredData : [seo.structuredData]) : [];
    structuredData.forEach((entry) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.focusflightStructuredData = "true";
      script.text = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }, [location]);

  return null;
}
