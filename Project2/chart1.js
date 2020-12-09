export function chart1() {
    /**
  * CONSTANTS AND GLOBALS
  * */
    const margin = { top: 20, bottom: 50, left: 60, right: 40 },
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
    let svg, xScale, yScale, yAxis, xAxis;
    /**
     * APPLICATION STATE
     **/
    let state = { data: [], selectedCountry: null };
    /**
     * LOAD DATA
     **/

    d3.csv("../data/CO2EmissionOf9Countries.csv",
        d => ({
            year: new Date(d.year, 0, 1),
            country: d.country,
            emission: +d.emission
        }))
        .then(data => {
            console.log('data', data);
            state.data = data;

            IntersectionObserver()
        });
    /**
     * INITIALIZING FUNCTION
     * This will be run *one time* when the data finishes loading in
     **/
    function init() {
        //Scales
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

        //UI Element Setup


    }









}