function setDateSlider (map, startDate, endDate) {
    const formatDateIntoYear = function (date) {
        const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthText = month[date.getMonth()];
        return monthText + ' ' + date.getFullYear();
    };
    const formatDate = d3.timeFormat("%b %Y");

    var startDate = new Date(startDate),
        endDate = new Date(endDate);

    var margin = {top:4, right:12, bottom:4, left:12},
        width = 250 - margin.left - margin.right,
        height = 80 - margin.top - margin.bottom;

    var svg = d3.select("#vis")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);


    var moving = false;
    var currentValue = 0;
    var targetValue = width;

    const playButton = d3.select("#play-button");
    const currentDateInfo = d3.select('#current-date-info');
        
    var x = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, targetValue])
        .clamp(true);

    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + height/5 + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("end drag", function() {
                currentValue = d3.event.x;
                update(x.invert(currentValue)); 
            })
            // .on("end", function() {
            //     currentValue = d3.event.x;
            //     updateDate(x.invert(currentValue)); 
            // })
        );

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
        .data(x.ticks(3))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatDateIntoYear(d); });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    var label = slider.append("text")  
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDate(startDate))
        .attr("transform", "translate(0," + (-25) + ")")

    playButton
        .on("click", function() {
        var button = d3.select(this);
        if (button.text() == "Pause") {
        moving = false;
        clearInterval(timer);
        // timer = 0;
        button.text("Play");
        } else {
        moving = true;
        timer = setInterval(step, 100);
        button.text("Pause");
        }
        console.log("Slider moving: " + moving);
    });

    function step() {
        update(x.invert(currentValue));
        //updateDate(x.invert(currentValue));
        currentValue = currentValue + (targetValue/151);
        if (currentValue > targetValue) {
            moving = false;
            currentValue = 0;
            clearInterval(timer);
            // timer = 0;
            playButton.text("Play");
            console.log("Slider moving: " + moving);
        }
    }

    function update(h) {
        // update position and text of label according to slider scale
        handle.attr("cx", x(h));
        label
            .attr("x", x(h))
            .text(formatDate(h));

        updateDate(h);
    }

    function updateDate(h) {
        const selectedDate = (h.getMonth() + 1) + '/' + h.getDate() + '/' + h.getFullYear().toString().substr(-2);
        //console.log(selectedDate);
        currentDateInfo.text(selectedDate);

        filterDate = [
            'match',
            ['get', 'date'],
            [selectedDate],
            true,
            false
        ];
        map.setFilter('covid-circle', ['all', filterDate]);
    }

    update(new Date(endDate));
}

function addHeatmapLayer() {
    map.addLayer({
        'id': 'covid-heat',
        'type': 'heatmap',
        'source': 'covid',
        'maxzoom': 9,
        'layout': {
            'visibility': 'none'
        },
        'paint': {
            // Increase the heatmap weight based on frequency and property magnitude
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'confirmed'],
                0,
                0,
                10,
                2,
                100,
                8,
                1000,
                16,
                5000,
                32,
                10000,
                64
            ],
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                1,
                9,
                3
            ],
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparancy color
            // to create a blur-like effect.
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(33,102,172,0)',
                0.2,
                'rgb(103,169,207)',
                0.4,
                'rgb(209,229,240)',
                0.6,
                'rgb(253,219,199)',
                0.8,
                'rgb(239,138,98)',
                1,
                'rgb(178,24,43)'
            ],
            // Adjust the heatmap radius by zoom level
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                2,
                9,
                20
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                1,
                9,
                0
            ]
            }
        },
        'waterway-label'
    );
         
        // map.addLayer({
        //     'id': 'covid-point',
        //     'type': 'circle',
        //     'source': 'covid',
        //     'minzoom': 7,
        //     'paint': {
        //     // Size circle radius by earthquake magnitude and zoom level
        //     'circle-radius': [
        //     'interpolate',
        //     ['linear'],
        //     ['zoom'],
        //     7,
        //     ['interpolate', ['linear'], ['get', 'mag'], 1, 1, 6, 4],
        //     16,
        //     ['interpolate', ['linear'], ['get', 'mag'], 1, 5, 6, 50]
        //     ],
        //     // Color circle by earthquake magnitude
        //     'circle-color': [
        //     'interpolate',
        //     ['linear'],
        //     ['get', 'confirmed'],
        //     0,
        //     'rgba(33,102,172,0)',
        //     10,
        //     'rgb(103,169,207)',
        //     100,
        //     'rgb(209,229,240)',
        //     1000,
        //     'rgb(253,219,199)',
        //     5000,
        //     'rgb(239,138,98)',
        //     10000,
        //     'rgb(178,24,43)'
        //     ],
        //     'circle-stroke-color': 'white',
        //     'circle-stroke-width': 1,
        //     // Transition from heatmap to circle layer by zoom level
        //     'circle-opacity': [
        //     'interpolate',
        //     ['linear'],
        //     ['zoom'],
        //     7,
        //     0,
        //     8,
        //     1
        //     ]
        //     }
        //     },
        //     'waterway-label'
        // );
}

function addCircleLayer() {
    map.addLayer({
        id: 'covid-circle',
        type: 'circle',
        source: 'covid',
        'layout': {
            'visibility': 'visible'
        },
        paint: {
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['number', ['get', 'confirmed']],
                0,
                4,
                10,
                8,
                100,
                12,
                1000,
                16,
                5000,
                20,
                10000,
                24
            ],
            'circle-color': [
                'interpolate',
                ['linear'],
                ['number', ['get', 'confirmed']],
                0,
                '#2DC4B2',
                10,
                '#3BB3C3',
                100,
                '#669EC4',
                1000,
                '#8B88B6',
                5000,
                '#A2719B',
                10000,
                '#AA5E79'
            ],
            'circle-opacity': 0.8
        },
        //'filter': ['all', filterHour, filterDay]
    });

    filterDate = [
        'match',
        ['get', 'date'],
        [endDateString],
        true,
        false
    ];
    map.setFilter('covid-circle', ['all', filterDate]);
}

function toggleLayer(clickedLayer) {
    const visibility = map.getLayoutProperty(clickedLayer, 'visibility');
 
    if (visibility === 'visible') {
        map.setLayoutProperty(clickedLayer, 'visibility', 'none');
    } else {
        map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
    }
}

function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZXMiLCJhIjoiY2p0MG01MXRqMW45cjQzb2R6b2ptc3J4MSJ9.zA2W0IkI0c6KaAhJfk9bWg';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v10',
        //style: 'mapbox://styles/mapbox/dark-v10',
        //center: [-74.0059, 40.7128],
        //zoom: 11
    });

    map.on('load', function() {
        // We use D3 to fetch the JSON here so that we can parse and use it separately
        // from GL JS's use in the added source. You can use any request method (library
        // or otherwise) that you want.
        d3.json('./covid.geojson', function(err, data) {
            map.addSource('covid', {
                'type': 'geojson',
                'data': data
            });
            startDateString = data.features[0].properties.date;
            endDateString = data.features[data.features.length - 1].properties.date;
            //console.log(startDateString, endDateString);

            addCircleLayer();
            addHeatmapLayer();
            setDateSlider(map, startDateString, endDateString);
        });
    });
}

var map;
var startDateString
var endDateString;
initMap();
