export const GA_TRACKING_ID = process.env.GA_MEASUREMENT_ID

function hasGtag() {
  return typeof window !== "undefined" && typeof window.gtag === "function"
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: URL) => {
  if (!GA_TRACKING_ID || !hasGtag()) return

  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  })
}

type GTagEvent = {
  action: string
  category: string
  label: string
  value: number
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: GTagEvent) => {
  if (!GA_TRACKING_ID || !hasGtag()) return

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}
