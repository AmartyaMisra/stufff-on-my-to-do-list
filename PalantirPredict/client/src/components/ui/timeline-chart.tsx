import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { TimelineEvent } from '@/lib/types';

interface TimelineChartProps {
  events: TimelineEvent[];
  height?: number;
  onEventClick?: (event: TimelineEvent) => void;
  className?: string;
}

export function TimelineChart({ 
  events, 
  height = 100, 
  onEventClick, 
  className 
}: TimelineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = svgRef.current.getBoundingClientRect().width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Time scale
    const timeExtent = d3.extent(events, d => new Date(d.timestamp)) as [Date, Date];
    const xScale = d3.scaleTime()
      .domain(timeExtent)
      .range([0, width]);

    // Risk score scale for size
    const riskScale = d3.scaleLinear()
      .domain([0, 100])
      .range([4, 12]);

    // Color scale for priority
    const colorMap: Record<string, string> = {
      'CRITICAL': 'hsl(var(--destructive))',
      'HIGH': 'hsl(var(--secondary))',
      'MEDIUM': 'hsl(var(--muted-foreground))',
      'LOW': 'hsl(var(--accent))'
    };

    // Timeline line
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", chartHeight / 2)
      .attr("y2", chartHeight / 2)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-width", 2);

    // Event circles
    const circles = g.selectAll(".timeline-event")
      .data(events)
      .enter()
      .append("circle")
      .attr("class", "timeline-event timeline-node")
      .attr("cx", d => xScale(new Date(d.timestamp)))
      .attr("cy", chartHeight / 2)
      .attr("r", d => riskScale(d.riskScore))
      .attr("fill", d => colorMap[d.priority] || colorMap['LOW'])
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        if (onEventClick) {
          onEventClick(d);
        }
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 3);

        // Tooltip
        const tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "hsl(var(--popover))")
          .style("border", "1px solid hsl(var(--border))")
          .style("border-radius", "6px")
          .style("padding", "8px")
          .style("font-size", "12px")
          .style("z-index", "1000")
          .style("opacity", 0);

        tooltip.transition()
          .duration(200)
          .style("opacity", 1);

        tooltip.html(`
          <div class="text-foreground">
            <div class="font-medium">${d.title}</div>
            <div class="text-muted-foreground">Risk: ${d.riskScore}</div>
            <div class="text-muted-foreground">${new Date(d.timestamp).toLocaleTimeString()}</div>
          </div>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 2);

        d3.selectAll(".tooltip").remove();
      });

    // Time axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat("%H:%M"));

    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("fill", "hsl(var(--muted-foreground))")
      .style("font-size", "10px");

    g.selectAll(".domain, .tick line")
      .style("stroke", "hsl(var(--border))");

  }, [events, height, onEventClick]);

  return (
    <div className={className} data-testid="timeline-chart">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{ overflow: 'visible' }}
      />
    </div>
  );
}
