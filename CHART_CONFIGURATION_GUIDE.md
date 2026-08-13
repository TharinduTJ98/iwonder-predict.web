# Chart Configuration Guide

## Where to Configure Chart Lines and Colors

### 1. **Line Names** (Legend Display)
**File:** `src/pages/dashboard/dashboard.ts`  
**Location:** `loadComparisonData()` method  
**Lines:** Around line 148-159

```typescript
this.chartSeries = [
    {
        name: `Predicted Quotes ${this.currentYear}`,  // ← Change this text
        data: result.year1.map(x => Math.round(x.predictedQuotes))
    },
    {
        name: `Actual Quotes ${this.currentYear}`,  // ← Change this text
        data: result.year1.map(x => Math.round(x.actualQuotes || 0))
    },
    {
        name: `Predicted Quotes ${this.lastYear}`,  // ← Change this text
        data: result.year2.map(x => Math.round(x.predictedQuotes))
    },
    {
        name: `Actual Quotes ${this.lastYear}`,  // ← Change this text
        data: result.year2.map(x => Math.round(x.actualQuotes || 0))
    }
];
```

---

### 2. **Line Colors**
**File:** `src/pages/dashboard/dashboard.ts`  
**Location:** `chartColors` property (around line 59)

```typescript
// Chart colors configuration - customize line colors here
chartColors = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78'];
//             color1    color2    color3    color4
```

**Color Order:**
- Index 0: Predicted Quotes (Current Year) - Blue
- Index 1: Actual Quotes (Current Year) - Light Blue
- Index 2: Predicted Quotes (Last Year) - Orange
- Index 3: Actual Quotes (Last Year) - Light Orange

**Common Color Codes:**
- `#1f77b4` - Dark Blue
- `#ff7f0e` - Orange
- `#2ca02c` - Green
- `#d62728` - Red
- `#9467bd` - Purple
- `#8c564b` - Brown

---

### 3. **Line Width & Style**
**File:** `src/pages/dashboard/dashboard.ts`  
**Location:** `stroke` property (around line 95)

```typescript
stroke: ApexStroke = {
    curve: 'smooth',           // ← Line curve type: 'smooth', 'straight', 'stepline'
    width: [2, 2, 2, 2],       // ← Line thickness for each series (in pixels)
    dashArray: [0, 5, 0, 5]    // ← Dash pattern: 0=solid, 5=dashed
};
```

**Stroke Options:**
- `width`: 1-5 pixels (thicker = bolder)
- `dashArray`: 
  - `0` = Solid line
  - `5` = Dashed line
  - `10` = More dashes
  - `[5, 5]` = Custom dash pattern

---

### 4. **Line Opacity & Fill**
**File:** `src/pages/dashboard/dashboard.ts`  
**Location:** `fill` property (around line 100)

```typescript
fill: ApexFill = {
    type: 'solid',             // ← Fill type: 'solid', 'gradient'
    opacity: [0.8, 0.2, 0.8, 0.2]  // ← Opacity for each series (0=transparent, 1=opaque)
};
```

**Opacity Values:**
- `0.0` - Completely transparent
- `0.2` - Very light (barely visible)
- `0.5` - Half transparent
- `0.8` - Almost opaque
- `1.0` - Completely opaque

---

### 5. **X-Axis Labels** (Month Display)
**File:** `src/pages/dashboard/dashboard.ts`  
**Location:** `loadComparisonData()` method (around line 138)

```typescript
const categories = result.year1.map(x =>
    new Date(x.forecastDate).toLocaleDateString('en-GB', {
      month: 'short'  // ← 'short' = "Jan", 'long' = "January", '2-digit' = "01"
    }));

this.xaxis.categories = categories;
```

**Month Display Options:**
- `'short'` - "Jan", "Feb", "Mar"
- `'long'` - "January", "February", "March"
- `'numeric'` - "1", "2", "3"
- `'2-digit'` - "01", "02", "03"

---

### 6. **Legend Position**
**File:** `src/pages/dashboard/dashboard.ts`  
**Location:** `legend` property (around line 102)

```typescript
legend: ApexLegend = {
    position: 'top',            // ← 'top', 'bottom', 'right', 'left'
    horizontalAlign: 'left'     // ← 'left', 'center', 'right'
};
```

---

### 7. **HTML Template - Enable Colors**
**File:** `src/pages/dashboard/dashboard.html`  
**Location:** apx-chart component (around line 86)

```html
<apx-chart
    [series]="chartSeries"
    [chart]="chart"
    [colors]="chartColors"      <!-- ← This binds the colors -->
    [xaxis]="xaxis"
    [stroke]="stroke"
    [fill]="fill"
    [legend]="legend"
    [tooltip]="tooltip">
</apx-chart>
```

---

## Quick Customization Examples

### Example 1: Make All Lines Solid
```typescript
stroke: ApexStroke = {
    curve: 'smooth',
    width: [2, 2, 2, 2],
    dashArray: [0, 0, 0, 0]  // All solid
};
```

### Example 2: Thicker Lines
```typescript
stroke: ApexStroke = {
    curve: 'smooth',
    width: [3, 3, 3, 3],  // Thicker
    dashArray: [0, 5, 0, 5]
};
```

### Example 3: More Opaque Fill
```typescript
fill: ApexFill = {
    type: 'solid',
    opacity: [0.9, 0.4, 0.9, 0.4]  // More visible
};
```

### Example 4: Professional Color Scheme
```typescript
chartColors = ['#3366cc', '#66b3ff', '#ff9999', '#ff3333'];
//             Current Predicted, Current Actual, Last Predicted, Last Actual
```

---

## Summary
| Configuration | File | Property | Line# |
|---|---|---|---|
| **Line Names** | dashboard.ts | chartSeries | 148-159 |
| **Line Colors** | dashboard.ts | chartColors | 59 |
| **Line Width** | dashboard.ts | stroke.width | 95 |
| **Line Style** | dashboard.ts | stroke.dashArray | 95 |
| **Opacity** | dashboard.ts | fill.opacity | 100 |
| **Month Labels** | dashboard.ts | categories | 138 |
| **Legend Position** | dashboard.ts | legend | 102 |
| **Enable Colors** | dashboard.html | [colors] | 86 |
