'use client';

import * as React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface ChartItem {
  id: string;      // arbpl
  label: string;   // e.g. "111001"
  value: number;   // orderQuantity
  color: string;   // hex color
  jobCount: number;
}

interface InteractiveDonutChartProps {
  data: ChartItem[];
  selectedValue: string;
  onSelect: (id: string) => void;
  totalValue: number;
}

export default function InteractiveDonutChart({
  data,
  selectedValue,
  onSelect,
  totalValue,
}: InteractiveDonutChartProps) {
  const theme = useTheme();
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // SVG configuration (Larger Pie Chart sizing)
  const size = 150;
  const center = size / 2;
  const radius = 35;
  const strokeWidth = 70; // w = 2 * r makes it a solid PIE chart (no donut cutout)
  const circumference = 2 * Math.PI * radius; // ~219.91
  const gapSize = data.filter((item) => item.value > 0).length > 1 ? 1.6 : 0; // Thin gaps separating wedges

  // Format numbers nicely
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('th-TH').format(val);
  };

  const activeIndex = hoveredIndex;
  
  let displayedLabel = 'ยอดรวม QTY';
  let displayedSubLabel = 'ทุกเครื่องจักร';
  let displayedValue = totalValue;
  let displayedColor = theme.palette.text.secondary;
  let displayedPercent = '100%';

  const selectedItemIndex = data.findIndex((item) => item.id === selectedValue);

  if (activeIndex !== null && data[activeIndex] && data[activeIndex].value > 0) {
    const activeItem = data[activeIndex];
    displayedLabel = `เครื่อง ${activeItem.label}`;
    displayedSubLabel = `WC ${activeItem.label}`;
    displayedValue = activeItem.value;
    displayedColor = activeItem.color;
    displayedPercent = `${((activeItem.value / (totalValue || 1)) * 100).toFixed(0)}%`;
  } else if (selectedValue !== 'ALL' && selectedItemIndex !== -1 && data[selectedItemIndex]) {
    const selectedItem = data[selectedItemIndex];
    displayedLabel = `เครื่อง ${selectedItem.label}`;
    displayedSubLabel = `WC ${selectedItem.label}`;
    displayedValue = selectedItem.value;
    displayedColor = selectedItem.color;
    displayedPercent = `${((selectedItem.value / (totalValue || 1)) * 100).toFixed(0)}%`;
  }

  // Pre-calculate segments with their offset, lengths, and starting percentages
  let accumulatedValue = 0;
  const segments = data.map((item, index) => {
    const share = totalValue > 0 ? item.value / totalValue : 0;
    const itemLength = share * circumference;
    
    // Position offset: accumulated offset + standard gaps
    const strokeOffset = totalValue > 0 
      ? -((accumulatedValue / totalValue) * circumference) - (gapSize / 2)
      : 0;

    // Ensure a minimum stroke length for visibility if value > 0
    const strokeLength = totalValue > 0
      ? Math.max(item.value > 0 ? 1.8 : 0, itemLength - gapSize)
      : 0;

    const startPercent = (accumulatedValue / (totalValue || 1)) * 100;

    if (item.value > 0) {
      accumulatedValue += item.value;
    }

    const isSelected = selectedValue === item.id;
    const isHovered = hoveredIndex === index;
    const isAnyHovered = hoveredIndex !== null;

    // Dim other slices if something else is hovered or selected
    let opacity = 1;
    if (isAnyHovered) {
      opacity = isHovered ? 1 : 0.45;
    } else if (selectedValue !== 'ALL') {
      opacity = isSelected ? 1 : 0.5;
    }

    return {
      ...item,
      index,
      strokeLength,
      strokeOffset,
      opacity,
      isSelected,
      isHovered,
      share: share * 100,
      startPercent,
    };
  });

  const handleSliceClick = (id: string) => {
    if (selectedValue === id) {
      onSelect('ALL');
    } else {
      onSelect(id);
    }
  };

  const hasActiveFilterOrHover = activeIndex !== null || selectedValue !== 'ALL';

  return (
    <Box sx={{ width: '100%' }}>
      {/* Pie Graphic Container - Positioned closely below Title */}
      <Box 
        sx={{ 
          position: 'relative', 
          width: size, 
          height: size, 
          mx: 'auto', 
          mb: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* SVG Pie Chart - Rotated by -90deg uniformly as a container for 100% bug-free circle scaling */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          <defs>
            {/* Soft glow shadow for hovered/selected slices using userSpaceOnUse */}
            <filter id="pie-glow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="190" height="190">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodOpacity="0.2" floodColor="#0f172a" />
            </filter>
            {/* Center dot pin shadow */}
            <filter id="pin-shadow" x="-35%" y="-35%" width="170%" height="170%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodOpacity="0.12" floodColor="#000" />
            </filter>
          </defs>

          {/* Background circle if total value is zero */}
          {totalValue === 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
            />
          )}

          {/* Main pie segments - Sorted to render the focused one last (on top of others) */}
          {[...segments]
            .sort((a, b) => {
              const aFocus = a.isHovered || (hoveredIndex === null && selectedValue === a.id);
              const bFocus = b.isHovered || (hoveredIndex === null && selectedValue === b.id);
              if (aFocus && !bFocus) return 1;
              if (!aFocus && bFocus) return -1;
              return 0;
            })
            .map((seg) => {
              if (seg.value === 0) return null;

              const isFocus = seg.isHovered || (hoveredIndex === null && selectedValue === seg.id);

              return (
                <circle
                  key={seg.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${seg.strokeLength} ${circumference}`}
                  strokeDashoffset={seg.strokeOffset}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, filter 0.3s ease',
                    opacity: seg.opacity,
                    // Simple scale from the center. Zero drifting because circles are not individually rotated anymore!
                    transform: isFocus ? 'scale(1.06)' : 'scale(1)',
                    transformOrigin: 'center',
                    filter: isFocus ? 'url(#pie-glow)' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIndex(seg.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleSliceClick(seg.id)}
                />
              );
            })
          }

          {/* White center pin/hub dot to anchor the solid slices neatly */}
          <circle
            cx={center}
            cy={center}
            r={3.5}
            fill="#ffffff"
            style={{
              filter: 'url(#pin-shadow)',
            }}
          />

          {/* Percentage text labels rendered on top (Counter-rotated by 90deg to counteract parent SVG's -90deg rotation) */}
          {segments.map((seg) => {
            if (seg.value === 0 || seg.share < 5) return null;

            const isFocus = seg.isHovered || (hoveredIndex === null && selectedValue === seg.id);
            const midPercent = seg.startPercent + seg.share / 2;
            
            // Calculate label position inside SVG space (unrotated space)
            const theta = (midPercent / 100) * 2 * Math.PI;
            const labelRadius = radius + 8; // Sweet spot distance from center inside the slice
            const labelX = Number((center + labelRadius * Math.cos(theta)).toFixed(2));
            const labelY = Number((center + labelRadius * Math.sin(theta)).toFixed(2));

            return (
              <text
                key={`label-${seg.id}`}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  pointerEvents: 'none', // Allow hovering the circle behind the text!
                  userSelect: 'none',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)', // High contrast shadow for readability
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
                  opacity: seg.opacity,
                  // We rotate the text back by 90deg clockwise so it is perfectly upright on screen!
                  transform: isFocus ? 'rotate(90deg) scale(1.15)' : 'rotate(90deg) scale(1)',
                  transformOrigin: `${labelX}px ${labelY}px`,
                }}
              >
                {seg.share.toFixed(0)}%
              </text>
            );
          })}
        </svg>
      </Box>

      {/* Dynamic Info Header - Placed below Pie Chart to prevent layout shift */}
      <Box 
        onClick={() => onSelect('ALL')}
        sx={{ 
          mb: 1.75, 
          textAlign: 'center', 
          cursor: hasActiveFilterOrHover ? 'pointer' : 'default',
          py: 0.25,
          borderRadius: 2,
          minHeight: '36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          '&:hover': { bgcolor: hasActiveFilterOrHover ? 'rgba(248, 250, 252, 0.8)' : 'transparent' },
          transition: 'background-color 0.2s ease'
        }}
      >
        {hasActiveFilterOrHover ? (
          <>
            <Typography
              sx={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {displayedLabel}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 900,
                fontSize: '0.88rem',
                color: displayedColor !== theme.palette.text.secondary ? displayedColor : '#0f172a',
                mt: 0.15,
                lineHeight: 1.2,
              }}
            >
              {formatNumber(displayedValue)} QTY
              <Box component="span" sx={{ fontSize: '0.68rem', fontWeight: 800, ml: 0.4, opacity: 0.8 }}>
                ({displayedPercent})
              </Box>
            </Typography>
          </>
        ) : null}
      </Box>

      {/* 2-Column Legend Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 0.75,
        }}
      >
        {segments.map((item, index) => {
          const isSelected = selectedValue === item.id;
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;
          
          let opacity = 1;
          if (isAnyHovered) {
            opacity = isHovered ? 1 : 0.45;
          } else if (selectedValue !== 'ALL') {
            opacity = isSelected ? 1 : 0.55;
          }

          return (
            <Box
              key={item.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleSliceClick(item.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.85,
                px: 1,
                py: 0.45,
                borderRadius: '6px',
                cursor: 'pointer',
                bgcolor: isSelected 
                  ? `${item.color}08` 
                  : isHovered 
                    ? 'rgba(248, 250, 252, 0.9)' 
                    : 'transparent',
                border: '1px solid',
                borderColor: isSelected 
                  ? `${item.color}22` 
                  : isHovered 
                    ? 'rgba(226, 232, 240, 0.6)' 
                    : 'transparent',
                opacity: opacity,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-1.5px)',
                },
              }}
            >
              {/* Colored Legend Indicator Dot */}
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: item.color,
                  boxShadow: `0 1px 3px ${item.color}35`,
                  transition: 'transform 0.2s ease',
                  transform: isHovered || isSelected ? 'scale(1.2)' : 'scale(1)',
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography
                  noWrap
                  sx={{
                    color: isSelected || isHovered ? '#0f172a' : '#475569',
                    fontSize: '0.68rem',
                    fontWeight: isSelected || isHovered ? 800 : 700,
                    lineHeight: 1.2,
                  }}
                >
                  เครื่อง {item.label}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
