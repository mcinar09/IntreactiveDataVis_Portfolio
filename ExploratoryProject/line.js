const width = window.innerWidth * 0.7,
    height = window.innerHeight * 0.7,
    margin = { top: 20, bottom: 40, left: 60, right: 20 },
    radius = 3, time = 1000,
    default_selection = "Select a Country",

    /**
    * This extrapolated function allows us to replace the "G" with "B" min the case of billions.
    * We cannot do this in the .tickFormat() because we need to pass a function as an argument,
    * and replace needs to act on the text (result of the function). 
    **/
    formatBillions = (num) => d3.format(".2s")(num).replace(/G/, 'B'),
    formatComma = (num) => d3.format(",")(num),
    formatDate = d3.timeFormat('%Y');

/**
 * These variables allow us to access anything we manipulate in
 * init() but need access to in draw().
 * All these variables are empty before we assign something to them.
 **/
let svg, xScale, yScale, yAxis, xAxis, hvlines, div;
/**
 * APPLICATION STATE
 **/
let state = { data: [], selectedCountry: null };

/**
 * LOAD DATA
 **/
d3.csv("../data/co2_emission1.csv",
    d => ({
        year: new Date(d.Year, 0, 1),
        country: d.Entity,
        emission: +d.emission
    }))
    .then(data => {
        console.log("data", data);
        state.data = data;


        init()
    }
    );

/**
 * INITIALIZING FUNCTION
 * This will be run *one time* when the data finishes loading in
 **/
function init() {
    // SCALES
    xScale = d3
        .scaleTime()
        .domain(d3.extent(state.data, d => d.year))
        .range([margin.left, width - margin.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, d3.max(state.data, d => d.emission)])
        .range([height - margin.bottom, margin.top])
        .nice();

    //axes
    xAxis = d3.axisBottom(xScale);

    yAxis = d3.axisLeft(yScale).tickFormat(formatBillions);

    //UI Element setup
    const selectElement = d3.select("#dropdown")
        .on("change", function () {
            state.selectedCountry = this.value;
            console.log("new selected entity is", this.value);
            // `this` === the selectElement
            // this.value holds the dropdown value a user just selected
            //state.selectedCountry = this.value;
            draw() // re-draw the graph based on this selection
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

    //Create an svg element in our main `d3-container` element
    svg = d3
        .select("#d3-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // add the xAxis
    svg
        .append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis)
        .append("text")
        .attr("class", "axis-label")
        .attr("x", width - margin.right)
        //.attr("x", "50%")
        //.attr("dy", "3em")
        .attr("y", -6)
        .text("Year");


    // add the yAxis
    svg
        .append("g")
        .attr("class", "axis y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis)
        .append("text")
        .attr("class", "axis-label")
        //.attr("transform", "rotate(-90)")
        //.attr("x", - margin.top)
        .attr("y", "50%")
        .attr("dx", "-3em")
        .attr("writing-mode", "vertical-rl")
        .text("CO2 Emission");

    //tooltip
    div = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip");

    hvlines = svg
        .append("line")
        .attr("class", "hover-line");

    draw() // call the draw function
}

/**
* DRAW FUNCTION
We call this everytime there is an update to the data/state
 */
function draw() {
    //filter the data for the selected party
    let filteredData = [];
    if (state.selectedCountry !== null) {
        filteredData = state.data.filter(d => d.country === state.selectedCountry)
    }
    //update the scale domain (now that our data has changed)
    yScale.domain([0, d3.max(filteredData, d => d.emission)]);

    // redraw the yAxis since yScale is updated with the new data
    d3.select("g.y-axis")
        .transition()
        .duration(time)
        //this updates the yAxis' scale for the updated one
        .call(yAxis);

    // update the scale domain (now that our data has changed)
    xScale.domain([d3.min(filteredData, d => d.year), d3.max(filteredData, d => d.year)]);

    // re-draw our xAxis since our xScale is updated with the new data
    d3.select("g.x-axis")
        .transition()
        .duration(time)
        .call(xAxis); // this updates the xAxis' scale to be our newly updated one


    // We define our line function generator telling it how to access the x,y values for each point
    const lineFunc = d3
        .area()
        .curve(d3.curveLinear)
        .x(d => xScale(d.year))
        .y0(yScale(0))
        .y(d => yScale(d.emission));
    /**const areaFunc = d3
        .area()
        .x(d => xScale(d.year_month))
        .y0(yScale(0))
        .y1(d => yScale(d.emission));*/


    const dot = svg
        .selectAll(".dot")
        .data(filteredData, d => d.country) //use `d.year` as the `key` to match between HTML and data elements
        .join(
            enter =>
                //enter selection --all data elements that don't have a `.dot` element attached to them yet
                enter
                    .append("circle")
                    .attr("class", "dot")
                    .attr("r", radius)
                    .attr("cy", d => yScale(d.emission))
                    .attr("cx", d => xScale(d.year))


                    // initial value - to be transitioned
                    .on("mouseover", function (d) {
                        d3.select(this)
                            .transition()
                            .duration(time)
                            .attr("r", 3 * radius)
                        div.transition()
                            .duration(time)
                            .style("opacity", 0.8)
                        //div.html("CO2 Emission in " + `${formatDate(d.year)}` + ": " + `${formatComma(Math.round(d.emission))}`)
                        div.html("CO2 Emissions in " + `${formatDate(d.year)}` + ": " + `${formatBillions(d.emission)}`)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 30) + "px")

                        hvlines
                            .style("opacity", 0.5)
                            .attr("x1", xScale(d.year))
                            .attr("y1", yScale(d.emission))
                            .attr("x2", xScale(d.year))
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
                        hvlines
                            .style("opacity", 0)
                    }),
            update => update,
            exit =>
                exit.call(exit =>
                    // exit selections -- all the `.dot` elements that no longer match to html elements
                    exit
                        .transition()
                        .duration(time)
                        .attr("cy", height - margin.bottom)
                        .remove())

        )
        .call(selection =>
            selection
                .transition()// sets the transition on the 'Enter' + 'Update' selections together
                .duration(time)
                .attr("cy", d => yScale(d.emission))
        );

    const line = svg
        .selectAll("path.trend")
        .data([filteredData])
        .join(
            enter =>
                enter
                    .append("path")
                    .attr("class", "trend")
                    .attr("stroke", "#d7a29e")  //Creates a line on peaks - but thought it looked cool without.
                    .attr("stroke-width", 1),
            //.style("fill", "pink"),

            update => update,
            exit => exit
                //.transition()
                .remove()
        )
        .call(selection =>
            selection
                .transition()
                .duration(time)
                .attr("d", d => lineFunc(d))
        )

    /*const area = svg
        .selectAll(".area")
        .data([filteredData])
        .join("path")
        .attr("class", "area")
        .attr("cx", (width - margin.left))
        .attr("d", d => areaFunc(d))
    //.style("fill", "blue");*/




}