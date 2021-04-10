export const GA_TRACKING_ID = process.env.GA_MEASUREMENT_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: URL) => {
  ;(window as any).gtag("config", GA_TRACKING_ID, {
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
  ;(window as any).gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}
