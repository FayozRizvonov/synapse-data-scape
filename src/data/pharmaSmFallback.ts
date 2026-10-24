// GENERATED FILE -- DO NOT EDIT BY HAND.
//
// Regenerate with:  node scripts/generate-pharma-sm-fallback.mjs
//
// A snapshot of `get_pharma_sm_metrics_merged`, used only when that call fails. It exists so
// a Supabase blip during a client demo renders correct figures rather than an error panel.
//
// It is generated, not written, because a hand-maintained copy of reconciled numbers is
// precisely what produced the defect this whole path replaced: the assistant reporting a
// $20.8M total with a $39.5M quarterly breakdown beside a dashboard showing $21.3M. The
// generator asserts the identities below before writing, so a snapshot that does not add up
// cannot reach the bundle.
//
// Snapshot taken: 2026-10-23
// Verified at generation time:
//   base + seasonality + trend + incremental = 21.30 = total 21.30
//   channel contributions                    = 3.25 = incremental
//   Q1..Q4                                   = 21.30 = total
//
// Being a snapshot, it goes stale the moment the database changes. When it is used at
// runtime the hook logs a warning, so a silent fallback cannot masquerade as live data.

import type { MetricCard } from '@/data/metricsKnowledgeBase';

export const PHARMA_SM_FALLBACK_SNAPSHOT_DATE = '2026-10-23';

export const pharmaSmFallbackCards: MetricCard[] = [
  {
    "id": "total-sales",
    "icon": "TrendingUp",
    "title": "Total Sales",
    "value": "$21.3M",
    "change": "+6.3%",
    "details": {
      "breakdown": [
        {
          "label": "Q1 Sales",
          "value": "$4.33M"
        },
        {
          "label": "Q2 Sales",
          "value": "$5.36M"
        },
        {
          "label": "Q3 Sales",
          "value": "$6.10M"
        },
        {
          "label": "Q4 Sales",
          "value": "$5.51M"
        },
        {
          "label": "Full Year",
          "value": "$21.30M"
        },
        {
          "label": "Volume",
          "value": "1,065,000 units"
        },
        {
          "label": "Realised Price",
          "value": "$20.00"
        },
        {
          "label": "FY2023 Total",
          "value": "$20.03M"
        }
      ],
      "description": "Volume x realised price, aggregated from the monthly series. The four quarters sum to the annual total."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "total",
      "sales",
      "revenue",
      "performance",
      "quarterly"
    ],
    "chartData": {
      "data": [
        {
          "name": "Q1",
          "revenue": 4.33
        },
        {
          "name": "Q2",
          "revenue": 5.36
        },
        {
          "name": "Q3",
          "revenue": 6.1
        },
        {
          "name": "Q4",
          "revenue": 5.51
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Total Revenue",
    "description": "Sales value is volume multiplied by realised unit price. Quarters sum to the year by construction."
  },
  {
    "id": "base-sales",
    "icon": "BarChart3",
    "title": "Base Sales",
    "value": "$17.25M",
    "change": "+5.9%",
    "details": {
      "breakdown": [
        {
          "label": "Base",
          "value": "$17.25M"
        },
        {
          "label": "Seasonality",
          "value": "$0.30M"
        },
        {
          "label": "Trend",
          "value": "$0.50M"
        },
        {
          "label": "Incremental",
          "value": "$3.25M"
        },
        {
          "label": "Total Sales",
          "value": "$21.30M"
        },
        {
          "label": "Share of Sales",
          "value": "81.0%"
        }
      ],
      "description": "Total sales = base + seasonality + trend + incremental. Base is the residual, so the four always sum to the total."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "base",
      "baseline",
      "non-media",
      "organic"
    ],
    "chartData": {
      "data": [
        {
          "name": "Base",
          "revenue": 17.25
        },
        {
          "name": "Seasonality",
          "revenue": 0.3
        },
        {
          "name": "Trend",
          "revenue": 0.5
        },
        {
          "name": "Incremental",
          "revenue": 3.25
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Revenue Attribution",
    "description": "Sales that would have occurred without promotional activity, seasonal swing or underlying growth. The residual of the four-way split."
  },
  {
    "id": "incremental",
    "icon": "TrendingUp",
    "title": "Incremental",
    "value": "$3.25M",
    "change": "+9.4%",
    "details": {
      "breakdown": [
        {
          "label": "SF Calls",
          "value": "$1.35M"
        },
        {
          "label": "Digital",
          "value": "$1.19M"
        },
        {
          "label": "1-to-1 Email",
          "value": "$0.40M"
        },
        {
          "label": "Web Virtual Calls",
          "value": "$0.31M"
        },
        {
          "label": "Incremental Total",
          "value": "$3.25M"
        },
        {
          "label": "Share of Sales",
          "value": "15.3%"
        }
      ],
      "description": "Each channel contributes spend x its own ROI. The channel rows sum to this total."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "incremental",
      "media",
      "media-driven",
      "attribution"
    ],
    "chartData": {
      "data": [
        {
          "name": "SF Calls",
          "revenue": 1.35
        },
        {
          "name": "Digital",
          "revenue": 1.19
        },
        {
          "name": "1-to-1 Email",
          "revenue": 0.4
        },
        {
          "name": "Web Virtual Calls",
          "revenue": 0.31
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Incremental Revenue",
    "description": "Media-driven sales, summed from each channel's spend multiplied by its ROI."
  },
  {
    "id": "promotional-spend",
    "icon": "DollarSign",
    "title": "Promotional Spend",
    "value": "$1.20M",
    "change": "+9.1%",
    "details": {
      "breakdown": [
        {
          "label": "SF Calls",
          "value": "$0.54M"
        },
        {
          "label": "Digital",
          "value": "$0.36M"
        },
        {
          "label": "1-to-1 Email",
          "value": "$0.18M"
        },
        {
          "label": "Web Virtual Calls",
          "value": "$0.12M"
        },
        {
          "label": "Total Spend",
          "value": "$1.20M"
        },
        {
          "label": "Spend as % of Sales",
          "value": "5.6%"
        }
      ],
      "description": "Channel spend sums to the total promotional budget."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "spend",
      "budget",
      "investment",
      "promotional"
    ],
    "chartData": {
      "data": [
        {
          "name": "SF Calls",
          "revenue": 0.54
        },
        {
          "name": "Digital",
          "revenue": 0.36
        },
        {
          "name": "1-to-1 Email",
          "revenue": 0.18
        },
        {
          "name": "Web Virtual Calls",
          "revenue": 0.12
        }
      ],
      "type": "pie",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Total Promotional Budget",
    "description": "Total media and field investment across all promotional channels."
  },
  {
    "id": "roi",
    "icon": "Target",
    "title": "ROI",
    "value": "2.7x",
    "change": "+0.3%",
    "details": {
      "breakdown": [
        {
          "label": "Incremental Sales",
          "value": "$3.25M"
        },
        {
          "label": "Promotional Spend",
          "value": "$1.20M"
        },
        {
          "label": "Incremental ROI",
          "value": "2.71x"
        },
        {
          "label": "FY2023 ROI",
          "value": "2.70x"
        }
      ],
      "description": "ROI is incremental sales divided by promotional spend. Total sales also includes base demand, which no spend is credited for."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "roi",
      "return",
      "efficiency",
      "incremental"
    ],
    "chartData": {
      "data": [
        {
          "name": "Digital",
          "revenue": 3.3
        },
        {
          "name": "Web Virtual Calls",
          "revenue": 2.6
        },
        {
          "name": "SF Calls",
          "revenue": 2.5
        },
        {
          "name": "1-to-1 Email",
          "revenue": 2.2
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Incremental Return on Investment",
    "description": "Incremental sales per dollar of promotional spend."
  },
  {
    "id": "vrr",
    "icon": "Activity",
    "title": "VRR",
    "value": "3.6x",
    "change": "+18.0%",
    "details": {
      "breakdown": [
        {
          "label": "Response Rate",
          "value": "3.6x"
        },
        {
          "label": "Incremental Units",
          "value": "162,500 units"
        },
        {
          "label": "Volume Growth YoY",
          "value": "+4.4%"
        },
        {
          "label": "FY2023 Response Rate",
          "value": "3.1x"
        }
      ],
      "description": "A stored presentational figure, like seasonality and trend. It sits outside the base + seasonality + trend + incremental identity, so it participates in no sum. At a flat realised price a volume-basis return equals the value-basis ROI, so this is deliberately not derived as incremental / spend."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "vrr",
      "volume",
      "response",
      "units",
      "efficiency"
    ],
    "chartData": {
      "data": [
        {
          "name": "FY2023",
          "revenue": 3.1
        },
        {
          "name": "Current",
          "revenue": 3.6
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Volume Response Rate",
    "description": "How strongly promotional activity converts into incremental volume."
  },
  {
    "id": "seasonality",
    "icon": "Calendar",
    "title": "Seasonality",
    "value": "$0.30M",
    "change": "+7.1%",
    "details": {
      "breakdown": [
        {
          "label": "Seasonality",
          "value": "$0.30M"
        },
        {
          "label": "Share of Sales",
          "value": "1.4%"
        },
        {
          "label": "Peak Quarter",
          "value": "Q3"
        },
        {
          "label": "Trough Quarter",
          "value": "Q1"
        }
      ],
      "description": "One of the four components of total sales: base + seasonality + trend + incremental."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "seasonality",
      "seasonal",
      "base",
      "pattern"
    ],
    "chartData": {
      "data": [
        {
          "name": "Q1",
          "revenue": 4.33
        },
        {
          "name": "Q2",
          "revenue": 5.36
        },
        {
          "name": "Q3",
          "revenue": 6.1
        },
        {
          "name": "Q4",
          "revenue": 5.51
        }
      ],
      "type": "line",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Revenue Attribution",
    "description": "The portion of total sales explained by seasonal demand patterns."
  },
  {
    "id": "trend",
    "icon": "TrendingUp",
    "title": "Trend",
    "value": "$0.50M",
    "change": "+2.0%",
    "details": {
      "breakdown": [
        {
          "label": "Trend",
          "value": "$0.50M"
        },
        {
          "label": "Share of Sales",
          "value": "2.3%"
        },
        {
          "label": "Volume Growth YoY",
          "value": "+4.4%"
        },
        {
          "label": "Price Growth YoY",
          "value": "+1.9%"
        }
      ],
      "description": "One of the four components of total sales: base + seasonality + trend + incremental."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "trend",
      "growth",
      "base",
      "underlying"
    ],
    "chartData": {
      "data": [
        {
          "name": "Q1",
          "revenue": 4.33
        },
        {
          "name": "Q2",
          "revenue": 5.36
        },
        {
          "name": "Q3",
          "revenue": 6.1
        },
        {
          "name": "Q4",
          "revenue": 5.51
        }
      ],
      "type": "line",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Revenue Attribution",
    "description": "The portion of total sales explained by the underlying growth trend."
  },
  {
    "id": "channel-sf-calls",
    "icon": "BarChart3",
    "title": "SF Calls",
    "value": "$1.35M",
    "change": "2.50x",
    "details": {
      "breakdown": [
        {
          "label": "Spend",
          "value": "$0.54M"
        },
        {
          "label": "Channel ROI",
          "value": "2.50x"
        },
        {
          "label": "Incremental Sales",
          "value": "$1.35M"
        },
        {
          "label": "Share of Incremental",
          "value": "41.5%"
        }
      ],
      "description": "Channel contribution is spend x channel ROI. The figure beside the value is this channel ROI, coloured by whether it beats the blended rate."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "channel",
      "attribution",
      "sf calls"
    ],
    "chartData": {
      "data": [
        {
          "name": "Spend",
          "revenue": 0.54
        },
        {
          "name": "Incremental",
          "revenue": 1.35
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "negative",
    "comparison": "Revenue Attribution",
    "description": "SF Calls contributed $1.35M of incremental sales on $0.54M of spend."
  },
  {
    "id": "channel-digital",
    "icon": "BarChart3",
    "title": "Digital",
    "value": "$1.19M",
    "change": "3.30x",
    "details": {
      "breakdown": [
        {
          "label": "Spend",
          "value": "$0.36M"
        },
        {
          "label": "Channel ROI",
          "value": "3.30x"
        },
        {
          "label": "Incremental Sales",
          "value": "$1.19M"
        },
        {
          "label": "Share of Incremental",
          "value": "36.6%"
        }
      ],
      "description": "Channel contribution is spend x channel ROI. The figure beside the value is this channel ROI, coloured by whether it beats the blended rate."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "channel",
      "attribution",
      "digital"
    ],
    "chartData": {
      "data": [
        {
          "name": "Spend",
          "revenue": 0.36
        },
        {
          "name": "Incremental",
          "revenue": 1.19
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "positive",
    "comparison": "Revenue Attribution",
    "description": "Digital contributed $1.19M of incremental sales on $0.36M of spend."
  },
  {
    "id": "channel-1-to-1-email",
    "icon": "BarChart3",
    "title": "1-to-1 Email",
    "value": "$0.40M",
    "change": "2.20x",
    "details": {
      "breakdown": [
        {
          "label": "Spend",
          "value": "$0.18M"
        },
        {
          "label": "Channel ROI",
          "value": "2.20x"
        },
        {
          "label": "Incremental Sales",
          "value": "$0.40M"
        },
        {
          "label": "Share of Incremental",
          "value": "12.3%"
        }
      ],
      "description": "Channel contribution is spend x channel ROI. The figure beside the value is this channel ROI, coloured by whether it beats the blended rate."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "channel",
      "attribution",
      "1-to-1 email"
    ],
    "chartData": {
      "data": [
        {
          "name": "Spend",
          "revenue": 0.18
        },
        {
          "name": "Incremental",
          "revenue": 0.4
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "negative",
    "comparison": "Revenue Attribution",
    "description": "1-to-1 Email contributed $0.40M of incremental sales on $0.18M of spend."
  },
  {
    "id": "channel-web-virtual-calls",
    "icon": "BarChart3",
    "title": "Web Virtual Calls",
    "value": "$0.31M",
    "change": "2.60x",
    "details": {
      "breakdown": [
        {
          "label": "Spend",
          "value": "$0.12M"
        },
        {
          "label": "Channel ROI",
          "value": "2.60x"
        },
        {
          "label": "Incremental Sales",
          "value": "$0.31M"
        },
        {
          "label": "Share of Incremental",
          "value": "9.5%"
        }
      ],
      "description": "Channel contribution is spend x channel ROI. The figure beside the value is this channel ROI, coloured by whether it beats the blended rate."
    },
    "section": "pharma-sm",
    "category": "situation",
    "keywords": [
      "channel",
      "attribution",
      "web virtual calls"
    ],
    "chartData": {
      "data": [
        {
          "name": "Spend",
          "revenue": 0.12
        },
        {
          "name": "Incremental",
          "revenue": 0.31
        }
      ],
      "type": "bar",
      "valueKey": "revenue"
    },
    "changeType": "negative",
    "comparison": "Revenue Attribution",
    "description": "Web Virtual Calls contributed $0.31M of incremental sales on $0.12M of spend."
  }
];
