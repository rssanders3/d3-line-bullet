(function() {

    d3.lineBullet = function() {
        var margin = {top: 0, right: 10, bottom: 0, left: 10},
            orient = "left", // TODO top & bottom
            reverse = false,
            duration = 0,
            title = function(d) {return d.title;},
            subtitle = function(d) {return d.subtitle;},
            min = function(d) {return d.min;},
            mean = function(d) {return d.mean;},
            max = function(d) {return d.max;},
            markers = function(d) {return d.markers;},
            width = 150,
            height = 50,
            noData = 'No Data Available.',
            addBackgroundColor = false,
            highIsGood = true,
            showNumbers = false,
            numberFormat = "integer",
            tooltip = null;

        function chart(g) {
            g.each(function(d, i) {
                var markerz = markers.call(this, d, i).slice().sort(d3.descending),
                    minz = min.call(this, d, i),
                    meanz = mean.call(this, d, i),
                    maxz = max.call(this, d, i),
                    container = d3.select(this);

                // Compute the new x-scale.
                var x1 = d3.scale.linear()
                    .domain(d3.extent([minz, maxz]))
                    .range([margin.left, width - margin.right]);
                // Stash the new scale.
                this.__chart__ = x1;
                // Derive width-scales from the x-scales.
                var w1 = function (d) {
                    return Math.abs(x1(d) - x1(minz))
                };

                // Setup containers and skeleton of chart
                tooltip = d3.select(this.parentNode).append("div")
                    .attr("class", "lineBullet-tooltip")
                    .style("opacity", 0);

                container.attr("width", width).attr("height", height);

                var wrap = container.selectAll('g.lineBullet').data([d]);
                var wrapEnter = wrap.enter()
                    .append('g')
                    .attr('class', 'lineBullet')
                    .attr('transform', 'translate(' + 0 + ',' + 10 + ')');

                var lineBulletLine = wrapEnter.append('g').attr('class', 'lineBullet-line');
                var lineBulletTickMin = wrapEnter.append('g').attr('class', 'lineBullet-tick lineBullet-tick-min');
                var lineBulletTickMean = wrapEnter.append('g').attr('class', 'lineBullet-tick lineBullet-tick-mean');
                var lineBulletTickMax = wrapEnter.append('g').attr('class', 'lineBullet-tick lineBullet-tick-max');
                var lineBulletMarker = wrapEnter.append('g').attr('class', 'lineBullet-marker');

                //update draw line from min to max
                //<line x1="20" y1="10" x2="285" y2="10" stroke="black" stroke-width="2"></line>
                lineBulletLine.append("line")
                    .attr("x1", x1(minz))
                    .attr("y1", 10)
                    .attr("x2", x1(maxz))
                    .attr("y2", 10)
                    .attr("stroke", "black")
                    .attr("stroke-width", 2)
                    .transition()
                    .duration(duration);

                linBulletCreateTick(lineBulletTickMin, minz, x1, showNumbers, numberFormat, "start");
                linBulletCreateTick(lineBulletTickMean, meanz, x1, showNumbers, numberFormat, "middle");
                linBulletCreateTick(lineBulletTickMax, maxz, x1, showNumbers, numberFormat, "end");

                /*
                 <text text-anchor="middle" dy="0" x="45" y="0">100</text>
                 <path class="lineBullet-markerTriangle" transform="translate(45,5)" d="M0,1.6666666666666667L1.6666666666666667,-1.6666666666666667 -1.6666666666666667,-1.6666666666666667Z"></path>
                 */
                var h3 = 30 / 10;
                if (typeof(markerz[0]) != 'undefined' && markerz[0] != null) {
                    var xPos = x1(markerz[0]);
                    lineBulletMarker.append("path")
                        .attr("class", "lineBullet-markerTriangle")
                        .attr('transform', function (d) {
                            return 'translate(' + xPos + ',5)'
                        })
                        .attr('d', 'M0,' + h3 + 'L' + h3 + ',' + (-h3) + ' ' + (-h3) + ',' + (-h3) + 'Z');

                    if(showNumbers) {
                        var anchor = "middle";
                        if (xPos - x1(minz) < 10)
                            anchor = "start";
                        if (x1(maxz) - xPos < 10)
                            anchor = "end";

                        lineBulletMarker.append("text")
                            .attr("text-anchor", anchor)
                            .attr("x", xPos)
                            .attr("y", 0)
                            .attr("dy", "0")
                            .text(lineBulletFormatNumber(numberFormat, markerz[0]));
                    }
                }

                container.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", width)
                    .attr("height", height)
                    .attr("fill","none")
                    .attr('pointer-events', 'all')
                    .on("mouseover", chart.showToolTip)
                    .on("mouseout", chart.hideToolTip);

                if(addBackgroundColor && typeof(markerz[0]) != 'undefined' && markerz[0] != null) {
                    var markerValue = markerz[0];
                    if(markerValue < (meanz + minz)/2) { //low
                        if(highIsGood)
                            container.attr("class", "bad");
                        else
                            container.attr("class", "good");
                    }
                    else if(markerValue > (meanz + maxz)/2) { //high
                        if(highIsGood)
                            container.attr("class", "good");
                        else
                            container.attr("class", "bad");
                    }
                    else { //medium
                        container.attr("class", "ok");
                    }
                }

            });
            d3.timer.flush();
        }

        // left, right, top, bottom
        chart.orient = function(x) {
            if (!arguments.length) return orient;
            orient = x;
            reverse = orient == "right" || orient == "bottom";
            return chart;
        };

        // markers (previous, goal)
        chart.markers = function(x) {
            if (!arguments.length) return markers;
            markers = x;
            return chart;
        };

        chart.width = function(x) {
            if (!arguments.length) return width;
            width = x;
            return chart;
        };

        chart.height = function(x) {
            if (!arguments.length) return height;
            height = x;
            return chart;
        };

        chart.margin = function(_) {
            if (!arguments.length) return margin;
            margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
            margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
            margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
            margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
            return chart;
        };

        chart.showNumbers = function(x) {
            if (!arguments.length) return showNumbers;
            showNumbers = x;
            return chart;
        };

        chart.numberFormat = function(x) {
            if (!arguments.length) return numberFormat;
            numberFormat = x;
            return chart;
        };

        chart.duration = function(x) {
            if (!arguments.length) return duration;
            duration = x;
            return chart;
        };

        chart.noData = function(_) {
            if (!arguments.length) return noData;
            noData = _;
            return chart;
        };

        chart.addBackgroundColor = function(x) {
            if (!arguments.length) return addBackgroundColor;
            addBackgroundColor = x;
            return chart;
        };

        chart.highIsGood = function(x) {
            if (!arguments.length) return highIsGood;
            highIsGood = x;
            return chart;
        };

        chart.showToolTip = function (d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip
                .html(lineBulletCreateTooltipHTML(title(d), subtitle(d), min(d), mean(d), max(d), markers(d)[0], numberFormat))
                .style("left", (this.parentNode.offsetLeft + this.parentNode.offsetWidth) + "px")
                .style("top", this.parentNode.offsetTop + "px");
        };

        chart.hideToolTip = function (d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        };

        return chart;
    };

    /*
     <line x1="20" y1="5" x2="20" y2="15" stroke="black" stroke-width="2"></line>
     <text text-anchor="middle" dy="1em" x="20" y="15">16</text>
     */

    function linBulletCreateTick(tickObject, value, x1, showNumbers, numberFormat, anchor) {
        if(typeof(anchor) == "undefiend")
            anchor = "middle"; //start, middle, end

        tickObject.append("line")
            .attr("x1", x1(value))
            .attr("y1", 5)
            .attr("x2", x1(value))
            .attr("y2", 15)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .transition();

        if(showNumbers) {
            tickObject.append("text")
                .attr("text-anchor", anchor)
                .attr("x", x1(value))
                .attr("y", 15)
                .attr("dy", "1em")
                .text(lineBulletFormatNumber(numberFormat, value));
        }

        return tickObject;
    }

    function lineBulletFormatNumber(format, number) {
        if(format == "integer") {
            number = number.toFixed(0).replace(/./g, function(c, i, a) {
                return i && c !== "." && !((a.length - i) % 3) ? ',' + c : c;
            });
        }
        else if(format == "double") {
            number = number.toFixed(2).replace(/./g, function(c, i, a) {
                return i && c !== "." && !((a.length - i) % 3) ? ',' + c : c;
            });
        }
        else if(format == "currency") {
            number = "$"+number.toFixed(2).replace(/./g, function(c, i, a) {
                return i && c !== "." && !((a.length - i) % 3) ? ',' + c : c;
            });
        }
        else if(format == "currency-no-cents") {
            number = "$"+number.toFixed(0).replace(/./g, function(c, i, a) {
                return i && c !== "." && !((a.length - i) % 3) ? ',' + c : c;
            });
        }
        return number;
    }

    function lineBulletCreateTooltipHTML(title, subtitle, min, mean, max, actual, numberFormat) {
        var html = "";
        var preApendedHTML = "";
        if(typeof(title) != 'undefiend' && title != null)
            preApendedHTML += "<h3>" + title + "</h3>";
        if(typeof(subtitle) != 'undefiend' && subtitle != null)
            preApendedHTML += "<h6>" + subtitle + "</h6>";
        html += preApendedHTML +
            "<table class='no-padding'>" +
            "<tr><td>" +
                "<table><tr><td class='key'>Actual:</td><td class='value'>" + lineBulletFormatNumber(numberFormat, actual) + "</td></tr></table>" +
            "</td>" +
            "<td>" +
                "<table>" +
                    "<tr><td class='key'>Min:</td><td class='value'>" + lineBulletFormatNumber(numberFormat, min) + "</td></tr>" +
                    "<tr><td class='key'>Mean:</td><td class='value'>" + lineBulletFormatNumber(numberFormat, mean) + "</td></tr>" +
                    "<tr><td class='key'>Max:</td><td class='value'>" + lineBulletFormatNumber(numberFormat, max) + "</td></tr>" +
                "</table>" +
            "</td></tr>" +
            "</table>";

        return html;
    }

})();