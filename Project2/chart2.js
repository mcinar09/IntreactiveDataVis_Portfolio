export function chart2() {
    /**
   * CONSTANTS AND GLOBALS
   * */
    const margin = { top: 10, bottom: 60, left: 60, right: 60 },
        radius = 2, time = 1000,
        default_selection = "Select a Country",
        /**
         This extrapolated function allows us to replace the "G" with "B" min the case of billions.
         We cannot do this in the .tickFormat() because we need to pass a function as an argument,
         and replace needs to act on the text (result of the function).  */
        formatNum = (num) => d3.format(".2f")(num),
        formatComma = (num) => d3.format(",")(num),
        formatDate = d3.timeFormat('%Y');
    let svg, width, height, xscale, yscale, yaxis, xaxis, div, hvlines;
    /**
     * Application State 
     * */
    let state = { data: [], selectedCountry: null };
    /**
 * LOAD DATA
 * Using a Promise.all([]), we can load more than one dataset at a time
 * */
    /*Promise.all([*/
    d3.csv('Data/GDPGrowth1.csv',
        d => ({
            year: new Date(d.year, 0, 1),
            country: d.country,
            rate: +d.GDPgrowth

        }))//])
        .then(data => {
            console.log('data', data);
            state.data = data;
            init();
        });

    /**
     * INITIALIZING FUNCTION
     * This will be run *one time* when the data finishes loading in
     **/
    function init() {
        svg = d3
            .select('#d3-container-2')
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        console.log("svg", svg);
        console.log("svg.node().clientWidth", svg.node().clientWidth);
        width = svg.node().clientWidth;
        const aspectRatio = 0.33;
        height = width * aspectRatio;
        console.log("height", height);
        //Scales
        xscale = d3
            .scaleTime()
            .domain(d3.extent(state.data, d => d.year))
            .range([margin.left, width - margin.right])
            .nice();
        yscale = d3
            .scaleLinear()
            .domain([d3.min(state.data, d => d.rate), d3.max(state.data, d => d.rate)])
            .range([height - margin.bottom, margin.top])
            .nice();
        //axes
        xaxis = d3.axisBottom(xscale);
        yaxis = d3.axisLeft(yscale).tickFormat(formatNum);

        svg
            .append("g")
            .attr("class", "axis x_axis")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(xaxis)
            .append("text")
            .attr("class", "axis_label")
            .attr("x", width - margin.right)
            .attr("y", -3)
            .text("Year");

        //add y-axis
        svg
            .append("g")
            .attr("class", "axis y_axis")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yaxis)
            .append("text")
            .attr("class", "axis_label")
            .attr("y", "50%")
            .attr("dx", "-4em")
            .attr("writing-mode", "vertical-rl")
            .text("GDP Growth Rate");


        //UI Element Setup
        const selectElement = d3.select("#dropdown2")
            .on("change", function () {
                state.selectedCountry = this.value;
                console.log("new selected entity is ", this.value);
                // `this` === the selectElement
                // this.value holds the dropdown value a user just selected
                draw();
            });
        // Add in dropdown options from the unique values in the data
        selectElement
            .selectAll("option")
            .data([
                ...Array.from(new Set(state.data.map(d => d.country))),
                default_selection])
            .join("option")
            .attr("value", d => d)
            .text(d => d);
        // This ensures that the selected value is the same as what we have
        // in state when we initialize the options
        selectElement.property("value", default_selection);
        //add the xAxis
        /*svg
            .append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(xaxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width - margin.right)
            .attr("y", -5)
            .attr("dy", "3em")
            .text("Year");

        //add y-axis
        svg
            .append("g")
            .attr("class", "axis y-axis")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(yaxis)
            .append("text")
            .attr("y", "50%")
            .attr("dx", "-4em")
            .attr("writing-mode", "vertical-rl")
            .text("GDP Growth Rate");*/

        //tooltip
        div = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip");

        //hover lines
        hvlines = svg
            .append("line")
            .attr("class", "hover-line");

        draw();
    }
    /**
     * draw function
     * we call this every time there is an update to the data/state
     */
    function draw() {
        //filter the data for selected party
        let filteredData2 = [];
        if (state.selectedCountry !== null) {
            filteredData2 = state.data.filter(d => d.country === state.selectedCountry)
        }
        //update the scale domain (now that our data has changed)
        yscale.domain([d3.min(filteredData2, d => d.rate), d3.max(filteredData2, d => d.rate)]);
        //redraw the yAxis since yScale is updated with the new data
        d3.select("g.y_axis")
            .transition()
            .duration(time)
            //this updates the yAxis' scale for the updated one
            .call(yaxis);
        //update the scale domain  (now that our data has changed)
        xscale.domain([d3.min(filteredData2, d => d.year), d3.max(filteredData2, d => d.year)]);
        //redraw our xAxis since our xScale is updated with the new data
        d3.select("g.x_axis")
            .transition()
            .duration(time)
            .call(xaxis);
        //we define our line function generator telling it how to access the x, y values for each point
        const lineFunc = d3
            .area()
            .curve(d3.curveLinear)
            .x(d => xscale(d.year))
            .y(d => yscale(d.rate))
            .y1(d => yscale(d.rate));
        const dot = svg
            .selectAll(".dot1")
            .data(filteredData2, d => d.country)
            .join(
                enter =>
                    enter
                        .append("circle")
                        .attr("class", "dot1")
                        .attr("r", radius)
                        .attr("cy", d => yscale(d.rate))
                        .attr("cx", d => xscale(d.year))
                        // initial value - to be transitioned
                        .on("mouseover", function (d) {
                            d3.select(this)
                                .transition()
                                .duration(time)
                                .attr("r", 3 * radius)
                            div.transition()
                                .duration(time)
                                .style("opacity", 0.8)
                            div.html(`${formatNum(d.rate)}` + " GDP Growth in " + `${formatDate(d.year)}`)
                                .style('left', (d3.event.pageX) + "px")
                                .style("top", (d3.event.pageY - 30) + "px")

                            hvlines
                                .style("opacity", 0.5)
                                .attr("x1", xscale(d.year))
                                .attr("y1", yscale(d.rate))
                                .attr("x2", xscale(d.year))
                                .attr("y2", height - margin.bottom)
                        })
                        .on("mouseout", function () {
                            d3.select(this)
                                .transition()
                                .duration(time)
                                .attr("r", radius)
                            div.transition()
                                .duration(time)
                                .style("opacity", 0)

                        }),
                update => update,
                exit =>
                    exit.call(exit =>
                        exit
                            .transition()
                            .duration(time)
                            .attr("cy", height - margin.bottom)
                            .remove())

            )
            .call(selection =>
                selection
                    .transition()
                    .duration(time)
                    .attr("cy", d => yscale(d.rate))
            );

        const line = svg
            .selectAll("path.trend")
            .data([filteredData2])
            .join(
                enter =>
                    enter
                        .append("path")
                        .attr("class", "trend")
                        .attr("stroke", "#d7a29e")
                        .attr("stroke-width", 1),
                update => update,
                exit => exit
                    .remove()
            )
            .call(selection =>
                selection
                    .transition()
                    .duration(time)
                    .attr("d", d => lineFunc(d)));

    }


}