MPS.controller(
    'bioactivities_heatmap_controller',
    [
        '$scope', '$http', 'bioactivities_heatmap_filter',
        function ($scope, $http, bioactivities_heatmap_filter) {
            'use strict';

            var bioactivities_filter = bioactivities_heatmap_filter.bioactivities;
            var targets_filter = bioactivities_heatmap_filter.targets;
            var compounds_filter = bioactivities_heatmap_filter.compounds;

            $scope.alerts = [];

            $scope.add_alert = function (message, level) {
                $scope.alerts.push({type: level, msg: message});
            };

            $scope.close_alert = function () {
                $scope.alerts.pop();
            };

            $http(
                {
                    url: '/bioactivities/gen_heatmap/',
                    method: 'POST',
                    data: {
                        'bioactivities_filter': bioactivities_filter,
                        'targets_filter': targets_filter,
                        'compounds_filter': compounds_filter
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    }
                }
            ).success(
                function (data) {

                    if (data["data_csv"] != undefined) {
                        $scope.heatmap_data_csv = data["data_csv"];
                        $scope.load_d3_heatmap();

                    } else {
                        console.log("------- critical error -------");
                        console.log("data csv  - " + $scope.heatmap_data_csv);
                    }
                }
            ).error(
                function () {
                    alert("HTTP Error: Could not get bioactivities data.");
                }
            );


            $scope.load_d3_heatmap = function () {

                var margin = { top: 650, right: 50, bottom: 50, left: 125 };
                var cell_size = 10;
                var legend_element_width = cell_size * 2.5;

                var colors = [
                    '#005824', '#1A693B', '#347B53', '#4F8D6B', '#699F83',
                    '#83B09B',
                    '#9EC2B3', '#B8D4CB', '#D2E6E3', '#EDF8FB', '#FFFFFF',
                    '#F1EEF6',
                    '#E6D3E1', '#DBB9CD', '#D19EB9', '#C684A4', '#BB6990',
                    '#B14F7C',
                    '#A63467', '#9B1A53', '#91003F'
                ];
                var color_buckets = colors.length;

                d3.csv(
                    $scope.heatmap_data_csv,
                    function (d) {
                        return {
                            compound: d.compound,
                            bioactivity: d.bioactivity,
                            value: +d.value  /* + converts string to number */
                        };
                    },
                    function (error, data) {

                        var i;
                        var cols_list = [];
                        var rows_list = [];
                        for (i = 0; i < data.length; i += 1) {
                            var current_bioactivity = data[i]["bioactivity"];
                            var current_compound = data[i]["compound"];
                            if (cols_list.indexOf(current_bioactivity) === -1) {
                                cols_list.push(current_bioactivity);
                            }
                            if (rows_list.indexOf(current_compound) === -1) {
                                rows_list.push(current_compound);
                            }

                        }

                        var width = cell_size * cols_list.length;
                        var height = cell_size * rows_list.length;

                        var colorScale = d3.scale.quantile()
                            .domain([-10 , 0, 10])
                            .range(colors);

                        var svg = d3.select("#heatmap").append("svg")
                            .attr(
                            "width", width + margin.left + margin.right
                        )
                            .attr(
                            "height", height + margin.top + margin.bottom
                        )
                            .append("g")
                            .attr(
                            "transform",
                            "translate(" +
                            margin.left + "," + margin.top
                                + ")"
                        );

                        var row_sort_order = false;
                        var col_sort_order = false;
                        var row_labels = svg.append("g")
                                .selectAll(".row_labelg")
                                .data(rows_list)
                                .enter()
                                .append("text")
                                .text(
                                function (d) {
                                    return d;
                                }
                            )
                                .attr("x", 0)
                                .attr(
                                "y", function (d, i) {
                                    console.log(i);
                                    return (rows_list.indexOf(d) + 1) * cell_size;
                                }
                            )
                                .style("text-anchor", "end")
                                .attr(
                                "transform",
                                "translate(-6," + cell_size / 1.5 + ")"
                            )
                                .attr(
                                "class", function (d, i) {
                                    return "row_label mono r" + i;
                                }
                            )
                                .on(
                                "mouseover", function (d) {
                                    d3.select(this).classed("text-hover", true);
                                }
                            )
                                .on(
                                "mouseout", function (d) {
                                    d3.select(this).classed(
                                        "text-hover", false
                                    );
                                }
                            )
                                .on(
                                "click", function (d, i) {
                                    row_sort_order = !row_sort_order;
                                    sort_by_label("r", i, row_sort_order);
                                    d3.select("#order").property(
                                        "selectedIndex", 4
                                    ).node();
                                }
                            )
                            ;

                        var col_labels = svg.append("g")
                                .selectAll(".col_labelg")
                                .data(cols_list)
                                .enter()
                                .append("text")
                                .text(
                                function (d) {
                                    return d;
                                }
                            )
                                .attr("x", 0)
                                .attr(
                                "y", function (d, i) {
                                    return (cols_list.indexOf(d) + 1) * cell_size;
                                }
                            )
                                .style("text-anchor", "left")
                                .attr(
                                "transform", "translate(" + cell_size / 2
                                    + ",-6) rotate (-90)"
                            )
                                .attr(
                                "class", function (d, i) {
                                    return "col_label mono c" + i;
                                }
                            )
                                .on(
                                "mouseover", function (d) {
                                    d3.select(this).classed("text-hover", true);
                                }
                            )
                                .on(
                                "mouseout", function (d) {
                                    d3.select(this).classed(
                                        "text-hover", false
                                    );
                                }
                            )
                                .on(
                                "click", function (d, i) {
                                    col_sort_order = !col_sort_order;
                                    sort_by_label("c", i, col_sort_order);
                                    d3.select("#order").property(
                                        "selectedIndex", 4
                                    ).node().focus();
                                    ;
                                }
                            )
                            ;

                        var heat_map = svg.append("g").attr("class", "g3")
                                .selectAll(".cellg")
                                .data(
                                data, function (d) {
                                    return d["compound"] + ": " + d["bioactivity"];
                                }
                            )
                                .enter()
                                .append("rect")
                                .attr(
                                "x", function (d) {
                                    console.log("heatmap x: " + d);
                                    return (cols_list.indexOf(d["bioactivity"]) + 1) * cell_size;
                                }
                            )
                                .attr(
                                "y", function (d) {
                                    console.log("heatmap y: " + d);
                                    return (rows_list.indexOf(d["compound"]) + 1) * cell_size;
                                }
                            )
                                .attr(
                                "class", function (d) {
                                    return "cell cell-border cr" + (
                                        d.row - 1
                                        ) + " cc" + (
                                               d.col - 1
                                               );
                                }
                            )
                                .attr("width", cell_size)
                                .attr("height", cell_size)
                                .style(
                                "fill", function (d) {
                                    return colorScale(d.value);
                                }
                            )
                                .on(
                                "click", function (d) {
                                    var rowtext = d3.select(
                                            ".r" + (
                                            d.row - 1
                                            )
                                    );
                                    if (rowtext.classed("text-selected")
                                        == false) {
                                        rowtext.classed("text-selected", true);
                                    } else {
                                        rowtext.classed("text-selected", false);
                                    }
                                }
                            )
                                .on(
                                "mouseover", function (d) {
                                    //highlight text
                                    d3.select(this).classed("cell-hover", true);
                                    d3.selectAll(".row_label").classed(
                                        "text-highlight", function (r, ri) {
                                            return ri == (
                                                d.row - 1
                                                );
                                        }
                                    );
                                    d3.selectAll(".col_label").classed(
                                        "text-highlight", function (c, ci) {
                                            return ci == (
                                                d.col - 1
                                                );
                                        }
                                    );

                                    //Update the tooltip position and value
                                    d3.select("#tooltip")
                                        .style(
                                        "left", (
                                                    d3.event.pageX + 10
                                                    ) + "px"
                                    )
                                        .style(
                                        "top", (
                                                   d3.event.pageY - 10
                                                   ) + "px"
                                    )
                                        .select("#value")
                                        .text(
                                            "lables:"
                                            + rows_list[d.row - 1]
                                            + ","
                                            + cols_list[d.col - 1]
                                            + "\ndata:"
                                            + d.value
                                            + "\nrow-col-idx:" + d.col + ","
                                            + d.row
                                            + "\ncell-xy "
                                            + this.x.baseVal.value + ", "
                                            + this.y.baseVal.value
                                    );
                                    //Show the tooltip
                                    d3.select("#tooltip").classed(
                                        "hidden", false
                                    );
                                }
                            )
                                .on(
                                "mouseout", function () {
                                    d3.select(this).classed(
                                        "cell-hover", false
                                    );
                                    d3.selectAll(".row_label").classed(
                                        "text-highlight", false
                                    );
                                    d3.selectAll(".col_label").classed(
                                        "text-highlight", false
                                    );
                                    d3.select("#tooltip").classed(
                                        "hidden", true
                                    );
                                }
                            )
                            ;

                        var legend = svg.selectAll(".legend")
                            .data(
                            [
                                -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1,
                                2, 3, 4, 5, 6, 7,
                                8, 9, 10
                            ]
                        )
                            .enter().append("g")
                            .attr("class", "legend");

                        legend.append("rect")
                            .attr(
                            "x", function (d, i) {
                                return legend_element_width * i;
                            }
                        )
                            .attr(
                            "y", height + (
                                cell_size * 2
                                )
                        )
                            .attr("width", legend_element_width)
                            .attr("height", cell_size)
                            .style(
                            "fill", function (d, i) {
                                return colors[i];
                            }
                        );

                        legend.append("text")
                            .attr("class", "mono")
                            .text(
                            function (d) {
                                return d;
                            }
                        )
                            .attr("width", legend_element_width)
                            .attr(
                            "x", function (d, i) {
                                return legend_element_width * i;
                            }
                        )
                            .attr(
                            "y", height + (
                                cell_size * 4
                                )
                        );

                        // Change ordering of cells

                        function sort_by_label(rORc, i, sortOrder) {
                            var t = svg.transition().duration(5000);
                            var log2r = [];
                            var sorted; // sorted is zero-based index
                            d3.selectAll(".c" + rORc + i)
                                .filter(
                                function (ce) {
                                    log2r.push(ce.value);
                                }
                            )
                            ;
                            if (rORc == "r") { // sort log2ratio of a gene
                                sorted = d3.range(col_number).sort(
                                    function (a, b) {
                                        if (sortOrder) {
                                            return log2r[b] - log2r[a];
                                        } else {
                                            return log2r[a] - log2r[b];
                                        }
                                    }
                                );
                                t.selectAll(".cell")
                                    .attr(
                                    "x", function (d) {
                                        return sorted.indexOf(d.col - 1)
                                            * cell_size;
                                    }
                                )
                                ;
                                t.selectAll(".col_label")
                                    .attr(
                                    "y", function (d, i) {
                                        return sorted.indexOf(i) * cell_size;
                                    }
                                )
                                ;
                            } else { // sort log2ratio of a contrast
                                sorted = d3.range(row_number).sort(
                                    function (a, b) {
                                        if (sortOrder) {
                                            return log2r[b] - log2r[a];
                                        } else {
                                            return log2r[a] - log2r[b];
                                        }
                                    }
                                );
                                t.selectAll(".cell")
                                    .attr(
                                    "y", function (d) {
                                        return sorted.indexOf(d.row - 1)
                                            * cell_size;
                                    }
                                )
                                ;
                                t.selectAll(".row_label")
                                    .attr(
                                    "y", function (d, i) {
                                        return sorted.indexOf(i) * cell_size;
                                    }
                                )
                                ;
                            }
                        }

                        d3.select("#order").on(
                            "change", function () {
                                order(this.value);
                            }
                        );

                        function order(value) {
                            if (value == "hclust") {
                                var t = svg.transition().duration(5000);
                                t.selectAll(".cell")
                                    .attr(
                                    "x", function (d) {
                                        return cols_list.indexOf(d.col)
                                            * cell_size;
                                    }
                                )
                                    .attr(
                                    "y", function (d) {
                                        return rows_list.indexOf(d.row)
                                            * cell_size;
                                    }
                                )
                                ;

                                t.selectAll(".row_label")
                                    .attr(
                                    "y", function (d, i) {
                                        return rows_list.indexOf(i + 1)
                                            * cell_size;
                                    }
                                )
                                ;

                                t.selectAll(".col_label")
                                    .attr(
                                    "y", function (d, i) {
                                        return cols_list.indexOf(i + 1)
                                            * cell_size;
                                    }
                                )
                                ;

                            } else if (value == "probecontrast") {
                                var t = svg.transition().duration(5000);
                                t.selectAll(".cell")
                                    .attr(
                                    "x", function (d) {
                                        return (
                                                   d.col - 1
                                                   ) * cell_size;
                                    }
                                )
                                    .attr(
                                    "y", function (d) {
                                        return (
                                                   d.row - 1
                                                   ) * cell_size;
                                    }
                                )
                                ;

                                t.selectAll(".row_label")
                                    .attr(
                                    "y", function (d, i) {
                                        return i * cell_size;
                                    }
                                )
                                ;

                                t.selectAll(".col_label")
                                    .attr(
                                    "y", function (d, i) {
                                        return i * cell_size;
                                    }
                                )
                                ;

                            } else if (value == "probe") {
                                var t = svg.transition().duration(5000);
                                t.selectAll(".cell")
                                    .attr(
                                    "y", function (d) {
                                        return (
                                                   d.row - 1
                                                   ) * cell_size;
                                    }
                                )
                                ;

                                t.selectAll(".row_label")
                                    .attr(
                                    "y", function (d, i) {
                                        return i * cell_size;
                                    }
                                )
                                ;
                            } else if (value == "contrast") {
                                var t = svg.transition().duration(5000);
                                t.selectAll(".cell")
                                    .attr(
                                    "x", function (d) {
                                        return (
                                                   d.col - 1
                                                   ) * cell_size;
                                    }
                                )
                                ;
                                t.selectAll(".col_label")
                                    .attr(
                                    "y", function (d, i) {
                                        return i * cell_size;
                                    }
                                )
                                ;
                            }
                        }

                        //
                        var sa = d3.select(".g3")
                                .on(
                                "mousedown", function () {
                                    if (!d3.event.altKey) {
                                        d3.selectAll(".cell-selected").classed(
                                            "cell-selected", false
                                        );
                                        d3.selectAll(".row_label").classed(
                                            "text-selected", false
                                        );
                                        d3.selectAll(".col_label").classed(
                                            "text-selected", false
                                        );
                                    }
                                    var p = d3.mouse(this);
                                    sa.append("rect")
                                        .attr(
                                        {
                                            rx: 0,
                                            ry: 0,
                                            class: "selection",
                                            x: p[0],
                                            y: p[1],
                                            width: 1,
                                            height: 1
                                        }
                                    )
                                }
                            )
                                .on(
                                "mousemove", function () {
                                    var s = sa.select("rect.selection");

                                    if (!s.empty()) {
                                        var p = d3.mouse(this),
                                            d = {
                                                x: parseInt(s.attr("x"), 10),
                                                y: parseInt(s.attr("y"), 10),
                                                width: parseInt(
                                                    s.attr("width"), 10
                                                ),
                                                height: parseInt(
                                                    s.attr("height"), 10
                                                )
                                            },
                                            move = {
                                                x: p[0] - d.x,
                                                y: p[1] - d.y
                                            }
                                            ;

                                        if (move.x < 1 || (
                                            move.x * 2 < d.width
                                            )) {
                                            d.x = p[0];
                                            d.width -= move.x;
                                        } else {
                                            d.width = move.x;
                                        }

                                        if (move.y < 1 || (
                                            move.y * 2 < d.height
                                            )) {
                                            d.y = p[1];
                                            d.height -= move.y;
                                        } else {
                                            d.height = move.y;
                                        }
                                        s.attr(d);

                                        // deselect all temporary selected state objects
                                        d3.selectAll('.cell-selection.cell-selected').classed(
                                            "cell-selected", false
                                        );
                                        d3.selectAll(".text-selection.text-selected").classed(
                                            "text-selected", false
                                        );

                                        d3.selectAll('.cell').filter(
                                            function (cell_d, i) {
                                                if (
                                                    !d3.select(this).classed("cell-selected")
                                                    &&
                                                    // inner circle inside selection frame
                                                    (
                                                        this.x.baseVal.value
                                                        ) + cell_size >= d.x
                                                    && (
                                                           this.x.baseVal.value
                                                           )
                                                        <= d.x
                                                           + d.width
                                                    &&
                                                    (
                                                        this.y.baseVal.value
                                                        ) + cell_size >= d.y
                                                    && (
                                                           this.y.baseVal.value
                                                           )
                                                        <= d.y
                                                           + d.height
                                                    ) {

                                                    d3.select(this)
                                                        .classed(
                                                        "cell-selection", true
                                                    )
                                                        .classed(
                                                        "cell-selected", true
                                                    );

                                                    d3.select(
                                                            ".r" + (
                                                            cell_d.row - 1
                                                            )
                                                    )
                                                        .classed(
                                                        "text-selection", true
                                                    )
                                                        .classed(
                                                        "text-selected", true
                                                    );

                                                    d3.select(
                                                            ".c" + (
                                                            cell_d.col - 1
                                                            )
                                                    )
                                                        .classed(
                                                        "text-selection", true
                                                    )
                                                        .classed(
                                                        "text-selected", true
                                                    );
                                                }
                                            }
                                        );
                                    }
                                }
                            )
                                .on(
                                "mouseup", function () {
                                    // remove selection frame
                                    sa.selectAll("rect.selection").remove();

                                    // remove temporary selection marker class
                                    d3.selectAll('.cell-selection').classed(
                                        "cell-selection", false
                                    );
                                    d3.selectAll(".text-selection").classed(
                                        "text-selection", false
                                    );
                                }
                            )
                                .on(
                                "mouseout", function () {
                                    if (d3.event.relatedTarget.tagName
                                        == 'html') {
                                        // remove selection frame
                                        sa.selectAll("rect.selection").remove();
                                        // remove temporary selection marker class
                                        d3.selectAll('.cell-selection').classed(
                                            "cell-selection", false
                                        );
                                        d3.selectAll(".row_label").classed(
                                            "text-selected", false
                                        );
                                        d3.selectAll(".col_label").classed(
                                            "text-selected", false
                                        );
                                    }
                                }
                            )
                            ;
                    }
                );
            }

        }
    ]
);

