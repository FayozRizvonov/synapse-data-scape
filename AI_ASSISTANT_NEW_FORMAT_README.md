# CLAIRE AI Assistant - New JSON Response Format

## Overview

The CLAIRE AI Assistant has been updated to use a new structured JSON response format with expandable sections. This provides a more organized and user-friendly way to display AI insights.

## New Response Format

The AI assistant now returns responses in the following JSON structure:

```json
{
  "report": {
    "sections": [
      {
        "title": "Section Title",
        "short": "One line summary (15-20 words) with key insight",
        "full": {
          "snapshot": [
            "First detailed point up to 240 characters with specific data and insights",
            "Second detailed point up to 240 characters with actionable information"
          ],
          "chart": {
            "type": "bar|line|pie",
            "x": { "label": "X-axis label" },
            "y": { "label": "Y-axis label" },
            "series": [
              { "name": "Series 1", "data": [value1, value2, value3] },
              { "name": "Series 2", "data": [value1, value2, value3] }
            ],
            "style": { "colors": ["#3B82F6", "#10B981"], "height": 300 }
          },
          "recommendations": [
            "First detailed recommendation up to 220 characters with specific action",
            "Second detailed recommendation up to 220 characters with measurable outcome"
          ]
        }
      }
    ]
  }
}
```

## Key Features

### 1. **5 Sections Always**
- Every response contains exactly 5 sections
- Each section covers a different aspect of the analysis
- Consistent structure across all queries

### 2. **Expandable UI**
- **Short View**: Shows only title and brief summary (15-20 words)
- **Full View**: Expandable section with detailed insights, charts, and recommendations
- **"Learn More" Button**: Click to expand each section

### 3. **Structured Content**
- **Snapshot**: 2 detailed points with specific data and insights
- **Chart**: Visual representation with proper labels and styling
- **Recommendations**: 2 actionable recommendations with measurable outcomes

### 4. **Responsive Design**
- Mobile-friendly interface
- Smooth animations for expand/collapse
- Proper text wrapping and overflow handling

## Frontend Components

### ChatReportSection
New component that displays individual report sections with:
- Expandable/collapsible functionality
- Animated transitions using Framer Motion
- Responsive chart visualization
- Color-coded sections for different content types

### Updated ChatView
Enhanced to handle both legacy and new response formats:
- Backward compatibility with old metric cards
- New report section display
- Proper error handling for JSON validation

## Backend Changes

### AI Assistant Function
Updated system prompt to:
- Always return exactly 5 sections
- Use structured JSON format only
- Include specific data points and percentages
- Provide actionable recommendations
- Focus on pharmaceutical analytics

### Response Validation
- JSON structure validation
- Section count verification (must be 5)
- Field completeness checks
- Error handling for invalid responses

## Usage Examples

### Query: "Show key metrics"
Returns 5 sections:
1. Revenue Performance
2. Patient Acquisition  
3. Marketing ROI
4. Market Access
5. Regional Performance

### Query: "Show me QoQ Revenue Growth"
Returns 5 sections:
1. Revenue Growth Analysis
2. Stroke Clinic Performance
3. Regional Revenue Distribution
4. Digital Channel Impact
5. Future Revenue Outlook

## Technical Implementation

### TypeScript Interfaces
```typescript
interface AIReport {
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  short: string;
  full: {
    snapshot: string[];
    chart: {
      type: 'bar' | 'line' | 'pie';
      x: { label: string };
      y: { label: string };
      series: Array<{ name: string; data: number[] }>;
      style: { colors: string[]; height: number };
    };
    recommendations: string[];
  };
}
```

### Error Handling
- JSON parsing validation
- Structure completeness checks
- Fallback to legacy format if needed
- User-friendly error messages

## Testing

Use the provided test file `test-new-ai-format.js` to verify:
- JSON response structure
- Section count validation
- Field completeness
- Error handling

## Deployment

The updated AI assistant function has been deployed to Supabase Edge Functions. The frontend components are ready for use with the new response format.

## Migration Notes

- **Backward Compatible**: Old metric card format still supported
- **Gradual Rollout**: New format used for all new queries
- **No Breaking Changes**: Existing functionality preserved
- **Enhanced UX**: Better organization and readability

## Future Enhancements

- Advanced charting library integration
- Export functionality for reports
- Customizable section templates
- Multi-language support
- Advanced filtering and sorting
