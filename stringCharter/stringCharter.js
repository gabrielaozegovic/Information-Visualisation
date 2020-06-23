// var svg;
function changeLineColor(line_colour){
    d3.selectAll("path")
    .filter(function(d, i) { return i > 3; })
    .transition()
    .duration(500)
    .attr("stroke", line_colour)
    .attr("fill", "none")
}

function getLineColour(line_colour){
    this.line_colour = line_colour
}

var direction = "->"
function setDirection(){
    var e = document.getElementById("dir");
    direction = e.options[e.selectedIndex].text;
    console.log(direction)
    drawGraph(csv_data)
}

function timeStringToFloat(time) {
    var hoursMinutes = time.split(/[.:]/);
    var hours = parseInt(hoursMinutes[0], 10);
    var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
    return hours + minutes / 60;
}

function clearOldChart()
{
    d3.select("#stringcharter").remove();
    document.getElementById("contentDiv").innerHTML = "";
}

function getStationTicks(data, station_names){
    console.log(station_names)
    let total_stations = station_names.length;
    let distance = Array(total_stations).fill(0);
    
    for (c=1; c<total_stations; c++){
        for (i=0; i<data.length; i++){
            var first_stn_time = data[i][station_names[0]];
            if (timeStringToFloat(first_stn_time)>21){ //take distance from day trains, more consistent
                continue;
            }
            if(data[i][station_names[c]]!='-' && first_stn_time!='-'){
                first_stn = timeStringToFloat(first_stn_time);
                next_stn = timeStringToFloat(data[i][station_names[c]]);
                distance[c] = Math.abs(first_stn-next_stn);
                break;
            }
        }
    }

    // for night trains (or specifically for the case of innsbruck to wien (salzburg sudbahnhof))
    for (c=1;c<distance.length;c++){
        if (distance[c]==0){
            for (i=0; i<data.length; i++){
                var first_stn_time = data[i][station_names[0]];
                if(data[i][station_names[c]]!='-' && first_stn_time!='-'){
                    first_stn = timeStringToFloat(first_stn_time);
                    next_stn = timeStringToFloat(data[i][station_names[c]]);
                    distance[c] = Math.abs(first_stn-next_stn);
                    break;
                }
            } 
        }
    }

    var station_ticks = [];
    let last_stn = distance[distance.length-1];

    for (i=0; i<distance.length;i++){
        // console.log(stn_time)
        var x_pt = (distance[i]/last_stn) * total_stations;
        station_ticks.push(x_pt) //append(x position of station)
    }
    return station_ticks;
}

function min_max_start_time(data, station_names){
    let min = 24;
    let max = 0;
    let min_station = station_names[0]
    let max_station = station_names[station_names.length-1]

    for (i=0; i<data.length; i++){
        let direction = data[i]['direction'];
        if (direction==0){
            if (timeStringToFloat(data[i][min_station]) < min){
                min = Math.floor(timeStringToFloat(data[i][min_station]));
            }
            if (timeStringToFloat(data[i][max_station]) > max){
                max = Math.ceil(timeStringToFloat(data[i][max_station]));
            }
            if (timeStringToFloat(data[i][min_station]) >=24){
                min = 0;
            }
        }
        if (direction==1){
            if (timeStringToFloat(data[i][max_station]) < min){
                min = Math.floor(timeStringToFloat(data[i][max_station]));
            }
            if (timeStringToFloat(data[i][min_station]) > max){
                max = Math.ceil(timeStringToFloat(data[i][min_station]));
            }
            if (timeStringToFloat(data[i][max_station]) >=24){
                min = 0;
            }
        }
    }
    return [min, max];
}

// set the dimensions and margins of the graph
var margin = {top: 150, right: 100, bottom: 150, left: 100}, // if margins/height/width not set correctly, export svg doesnt work well
height = 1000
width = 1000

function drawGraph(data){
    clearOldChart()
    var line_colour = document.getElementById("lc").value

    // var data = [{"trip_id": "14","direction": "1", "Graz Hbf": "20:33:00", "Bruck/Mur Bahnhof": "19:58:00", "Kapfenberg Bahnhof": "19:52:00", "Murzzuschlag Bahnhof": "19:30:00", "Semmering Bahnhof": "19:15:00", "Wr.Neustadt Hbf": "18:32:00", "Wien Meidling Bahnhof": "18:05:00", "Wien Hbf": "17:58:00"}]
    // This function is called by the buttons on top of the plot
    var stations = Object.keys(data[0])
    stations.splice(0, 3) //remove trip_id, direction, and train_id

    var station_tick_positions = getStationTicks(data, stations);

    var viewbox_val = "0 0 a b".replace('a', width).replace('b', height)
    // append the svg object to the body of the page
    var svg = d3.select("#contentDiv")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", viewbox_val)
    .append("g")
    .attr("id", "stringcharter");

    // X scale and Axis
    var x = d3.scaleLinear()
    .domain([0, stations.length])         // This is the min and the max of the data: 0 to 100 if percentages
    .range([margin.left, width-margin.right]);       // This is the corresponding value I want in Pixels

    var first_stn = timeStringToFloat(data[0][stations[0]])
    var last_stn = timeStringToFloat(data[0][stations[stations.length - 1]])

    var x_axis_bot = d3.axisBottom().scale(x).tickValues(station_tick_positions).tickFormat(function (d) {return stations[station_tick_positions.indexOf(d)];});
    var x_axis_top = d3.axisTop().scale(x).tickValues(station_tick_positions).tickFormat(function (d) {return stations[station_tick_positions.indexOf(d)];});

    let bot_axis_transform = "translate(0, y)".replace("y", height-margin.bottom)
    svg.append('g')
    .attr("transform", bot_axis_transform)
    .call(x_axis_bot)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-10")
    .attr("dy", "-5")
    .attr("transform", "rotate(-90)");

    let top_axis_transform = "translate(0, y)".replace("y", margin.top)
    svg.append('g')
    .attr("transform", top_axis_transform)
    .call(x_axis_top)
    .selectAll("text")  
    .style("text-anchor", "end")
    .attr("dx", "-10")
    .attr("dy", "10")
    .attr("transform", "rotate(90)");

    // Y scale and Axis
    var min_max = min_max_start_time(data, stations)
    var num_ticks = Math.ceil((min_max[1] - min_max[0])/2);
    // console.log(min_max[0])
    // console.log(min_max[1])
    var y = d3.scaleLinear()
    .domain([min_max[0], min_max[1]])
    // .domain([0, 25])         // This is the min and the max of the data: 0 to 100 if percentages
    .range([margin.top, height-margin.bottom]);       // Reverse order since we want time to ascend

    var y_axis_left = d3.axisLeft().scale(y).tickFormat(function (d) {return (d>24 ? d-24 : d) + ":00";}).ticks(num_ticks);
    var y_axis_right = d3.axisRight().scale(y).tickFormat(function (d) {return (d>24 ? d-24 : d) + ":00";}).ticks(num_ticks);

    let right_axis_transform = "translate(x, 0)".replace("x", width-margin.right);
    svg.append('g')
    .attr("transform", right_axis_transform)
    .call(y_axis_right);

    let left_axis_transform = "translate(x, 0)".replace("x", margin.left);
    svg.append('g')
    .attr("transform", left_axis_transform)
    .call(y_axis_left);

    // Actually plot trips
    // Draw line with d3's line generator
    var line = d3.line()
    .x(function(d) { return x(d[0]); }) // set the x values for the line generator
    .y(function(d) { return y(d[1]); });

    // 9. Append the path, bind the data, and call the line generator
    // TODO: Add some way to distinguish to and from trips
    var data_pts = []
    for (i=0; i<data.length; i++){
        trip = data[i]
        train_id = trip['trip_short_name']
        let line_pts = []
        var first_stn_time = timeStringToFloat(trip[stations[0]])
        var last_stn_time = timeStringToFloat(trip[stations[stations.length-1]])
        // console.log(first_stn_time)
        // console.log(last_stn_time)

        for (j=0; j<stations.length;j++){
            if (trip[stations[j]] != '-'){
                let time_as_float = timeStringToFloat(trip[stations[j]]);
                // if (time_as_float>=24){
                //     time_as_float-=24
                // }

                if(trip['direction']==1 && direction=="<-"){
                    if (last_stn_time>=24){ //wrap round trips that start after midnight and have format>2400 e.g. 2450
                        time_as_float=time_as_float - 24
                    }
                    let point = [station_tick_positions[j]].concat([time_as_float, stations[j], train_id])
                    // console.log(point)
                    line_pts.push(point)
                    data_pts.push(point)
                } else if(trip['direction']==0 && direction=="->"){
                    if (first_stn_time>=24){
                        time_as_float=time_as_float - 24
                    }
                    let point = [station_tick_positions[j]].concat([time_as_float, stations[j], train_id])
                    // console.log(point)
                    line_pts.push(point)
                    data_pts.push(point)
                } else if(direction=="<->"){
                    if (trip['direction']==0 && first_stn_time>=24){
                        time_as_float=time_as_float - 24
                    } else if (trip['direction']==1 && last_stn_time>=24){
                        time_as_float=time_as_float - 24
                    }

                    let point = [station_tick_positions[j]].concat([time_as_float, stations[j], train_id])
                    // console.log(point)
                    line_pts.push(point)
                    data_pts.push(point)
                }
            }
        }

        var linestyle;
        //highlight railjet trains
        if (train_id.substring(0, 2)=="RJ"){
             linestyle ="5,5";
        } else{
            linestyle = "";
        }
        if (line_pts.length!=0){
            svg.append("path")
            .attr("stroke", line_colour)
            .attr("fill", "none")
            .attr("stroke-dasharray", linestyle)
            .attr("d", line(line_pts)); // 11. Calls the line generator 
        }
    }

    function floatToTime(num){
        // console.log(num)
        // console.log(moment().startOf('day').add(parseFloat(num), "hours").format("HH:mm"))
        return " "+ moment().startOf('day').add(parseFloat(num), "hours").format("HH:mm");
    }
    
    // dots
    var dot_size = 3.5;
    svg.selectAll(".dot")
    .data(data_pts)
    .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("fill", "black")
        .attr("cx", function(d) { return x(d[0]) })
        .attr("cy", function(d) { return y(d[1]) })
        .attr("r", dot_size)

        // tooltip on hover
        .on('mouseover', function (d, i) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '.3')
                .attr('r', dot_size+2.5);
    })     .on('mouseout', function (d, i) {
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1')
                .attr("r", dot_size);
    })
    .append("svg:title")
    .text(function(d) { return d[3] + ": " + d[2] + floatToTime(d[1]); });
    console.log(csv_data[0])
    return svg;
}

var svg_data;
function saveAsSVG() {

    var svgString = getSVGString(svg_data.node());
    var svg_text = new Blob([svgString],
        { type: "image/svg+xml;charset=utf-8" }); // type:"text/svg;charset=utf-8"
    saveAs(svg_text, "test.svg");

    // catch (e){
    //     console.log(e)
    //     alert("Please load a CSV file.");
    // }

}

// https://stackoverflow.com/questions/23218174/how-do-i-save-export-an-svg-file-after-creating-an-svg-with-d3-js-ie-safari-an
function getSVGString(svgNode){
    const xmlns = "http://www.w3.org/2000/xmlns/";
    const xlinkns = "http://www.w3.org/1999/xlink";
    const svgns = "http://www.w3.org/2000/svg";
    // var svgString = d3.select("#stringcharter").node().innerHTML; // inner or outer html? svg
    var svgString = document.getElementById("contentDiv").innerHTML;
    //add name spaces.
    svgString = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" >" + svgString + "</svg>";
    return svgString;
}

var csv_data;
var openFile = function(event) {
    var input = event.target;
    console.log(input.files[0]);

    d3.csv(input.files[0].path).then(function(data) {
        csv_data = data
        svg_data = drawGraph(data)
        // //GET ALL DATA FROM CSV HERE
        // console.log(data[0]);
        // console.log(data[1]);
      });
  };
