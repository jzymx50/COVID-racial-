
/** set up map scale.*/
// let devicePixelRatio = window.devicePixelRatio || 1;
let devicePixelRatio = 1;
let width = 950 * devicePixelRatio;
let height = 530 * devicePixelRatio;

/** append the svg map.*/
let svg = d3
  .select('#usmap')
  .insert('svg', 'div')
  .attr('width', width)
  .attr('height', height)
  .attr('transform', `scale(${devicePixelRatio})`)
  .append('g')



/** set up map projection.*/
let projection = d3.geoAlbersUsa();
let path = d3.geoPath().projection(projection);

d3.selectAll(".tooltip").style("display", 'none')


d3.select('body').style('opacity', 0)

const commonVariable = {}

d3.json('cb_2019_us_state_20m.json').then(function (us) {

  /**
   * This part draws states.
   */

  svg.selectAll(".region")
    .data(topojson.feature(us, us.objects.cb_2019_us_state_20m).features.filter(d => d.properties.STUSPS !== 'PR'))
    .enter()
    .append("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("abbr", d => d.properties.STUSPS)
    .attr('name', d => d.properties.NAME)
    .on('mouseenter', mouseEnter)
    .on('mouseleave', mouseLeave)
    .on('mousemove', mouseMove)


  /**
   * This part draws the legend.
   */
  const rects = [0, 1, 2, 3, 4]

  svg.selectAll('rect')
    .data(rects)
    .enter()
    .append('rect')
    .attr('class', 'legend')
    .attr('width', '35px')
    .attr('height', '15px')
    .attr('x', d => 750 + d * 35 + 'px')
    .attr('y', '375px')



}).then(() => {

  d3.csv('dataset.csv').then(function (data) {
    // set up color scales
    const normalizedArray = {
      cases: {
        all: data.map(row => row.Cases_TotalN),
        white: data.map(row => row.Cases_WhiteN),
        black: data.map(row => row.Cases_BlackN),
        asian: data.map(row => row.Cases_AsianN),
      },
      deaths: {
        all: data.map(row => row.Deaths_TotalN),
        white: data.map(row => row.Deaths_WhiteN),
        black: data.map(row => row.Deaths_BlackN),
        asian: data.map(row => row.Deaths_AsianN),
      }
    }

    // set up slider's default status
    const dates = setupSlider(data, normalizedArray)

    // draw the default map
    handleRaceClick('all', data, dates, normalizedArray)

    // display the map
    d3.select('body').style('opacity', 1)

    // handle buttons click
    d3.select('#all').on('click', e => handleRaceClick('all', data, dates, normalizedArray))
    d3.select('#white').on('click', e => handleRaceClick('white', data, dates, normalizedArray))
    d3.select('#black').on('click', e => handleRaceClick('black', data, dates, normalizedArray))
    d3.select('#asian').on('click', e => handleRaceClick('asian', data, dates, normalizedArray))

    d3.select('#cases').on('click', e => handleTypeClick('cases', data, dates, normalizedArray))
    d3.select('#deaths').on('click', e => handleTypeClick('deaths', data, dates, normalizedArray))

    // draw the line chart
    drawLineChart(data)

    // handle the click event.
    document.querySelectorAll('#usmap path').forEach(path => {
      path.addEventListener('click', e => {
        const selected = document.querySelector('.strong-state')
        if (!selected || selected.getAttribute('name') != e.target.getAttribute('name')) {
          handleStateClick(e.target, data)
        }
      })
    })
  })
})


function mouseEnter(d) {
  d3.selectAll(".state")
    .style("opacity", .5)
  d3.select(this)
    .style("opacity", 1)
    .style("stroke-width", "2px")
  d3.select('#usmap .tooltip')
    .style('display', 'block')
}

function mouseLeave(d) {
  d3.selectAll(".state")
    .style("opacity", 1)
  d3.select(this)
    .style("stroke-width", "1px")
  d3.select('#usmap .tooltip')
    .style('display', 'none')
}

function mouseMove(d) {

  d3.select('#usmap .tooltip')
    .style("left", (d3.mouse(this)[0] + 30) + "px")
    .style("top", (d3.mouse(this)[1]) + "px")

  const t = d3.select(this)

  d3.select('#usmap .tooltip .name').text(t.attr('race') + ' people in ' + t.attr('name'))
  const date = document.querySelector('#date').textContent
  d3.select('#usmap .tooltip .date').text(date)
  d3.select('#usmap .tooltip .total .cases').text(t.attr('cases'))
  d3.select('#usmap .tooltip .total .deaths').text(t.attr('deaths'))
  d3.select('#usmap .tooltip .percentage .cases').text((t.attr('casesN') * 100).toFixed(2) + '%')
  d3.select('#usmap .tooltip .percentage .deaths').text((t.attr('deathsN') * 100).toFixed(2) + '%')
}

function updateMap(data, dates, normalizedArray) {
  const type = getMapType()
  const race = getRaceType()
  const oneDay = getSelectedDay(dates)
  const rows = data.filter(row => row.Date == oneDay)
  const filteredData = filterRows(type, race, rows)


  d3.selectAll('path.state').each(function () {
    const state = d3.select(this);
    const name = state.attr('abbr');
    const row = filteredData.find(row => row.state == name)
    if (typeof row !== 'undefined') {
      const percent = row[type][race + 'N']
      state.style('fill', getColorScale(normalizedArray[type][race], type)(percent))
      state.attr(`cases`, row.cases[race])
        .attr(`casesN`, row.cases[race + 'N'])
        .attr(`deaths`, row.deaths[race])
        .attr(`deathsN`, row.deaths[race + 'N'])
        .attr(`race`, race)
    }
  })



}

function setupSlider(data, normalizedArray) {
  let dates = data.map(row => row.Date)
  dates = new Set(dates)
  dates = Array.from(dates).sort((a, b) => new Date(a) - new Date(b))

  d3.select('#timeslide')
    .attr('max', dates.length - 1)
    .attr('value', 0)
    .attr('step', 1)
    .on('input', () => updateView(dates, data, normalizedArray))

  // default date
  const dayString = new Date(dates[0]).toDateString().slice(4)
  d3.select('#date').text(dayString)

  return dates

}

function updateView(dates, data, normalizedArray) {

  const oneDay = getSelectedDay(dates)
  // update date string
  const dayString = new Date(oneDay).toDateString().slice(4)
  d3.select('#date').text(dayString)

  // update map
  updateMap(data, dates, normalizedArray)

  // update the line chart
  const chart = document.querySelector('#chart svg')
  if (chart) {
    const x = commonVariable.x
    d3.select('#chart .current')
      .attr('x1', x(new Date(oneDay)))
      .attr('x2', x(new Date(oneDay)))
  }

}

function getColorScale(filteredData, type) {

  const max = Math.max(...filteredData)
  return d3.scaleSequential()
    .domain([0, max])
    .interpolator(type == 'cases' ? d3.interpolateOranges : d3.interpolateGreys);


}

function handleRaceClick(race, data, dates, normalizedArray) {

  d3.selectAll('#RaceButtonContainer .btn').classed('active', false)
  d3.select(`#${race}`).classed("active", true)
  updateMap(data, dates, normalizedArray)
  const type = getMapType()
  const array = normalizedArray[type][race]
  const colors = getColorScale(array, type)
  updateLegend(colors, array, type)

}


function handleTypeClick(type, data, dates, normalizedArray) {
  // toggle the button status
  d3.selectAll('#CaseButtonContainer .btn').classed('active-type', false)
  d3.select(`#${type}`).classed("active-type", true)

  // redraw line chart
  const selected = document.querySelector('.selected-state')
  handleStateClick(selected, data)


  updateMap(data, dates, normalizedArray)
  const race = getRaceType()
  const array = normalizedArray[type][race]
  const colors = getColorScale(array, type)
  updateLegend(colors, array, type)
}

function getMapType() {
  return document.querySelector('.active-type').getAttribute('id')
}
function getRaceType() {
  return document.querySelector('.active').getAttribute('id')
}

function getSelectedDay(dates) {
  const sliderVal = document.querySelector('#timeslide').value
  return dates[sliderVal]
}

function filterRows(type, race, oneDay) {
  let filteredData = []

  filteredData = oneDay.map(row => {
    return {
      state: row.State,
      cases: {
        all: row.Cases_Total,
        allN: row.Cases_TotalN,
        white: row.Cases_White,
        whiteN: row.Cases_WhiteN,
        black: row.Cases_Black,
        blackN: row.Cases_BlackN,
        asian: row.Cases_Asian,
        asianN: row.Cases_AsianN
      },
      deaths: {
        all: row.Deaths_Total,
        allN: row.Deaths_TotalN,
        white: row.Deaths_White,
        whiteN: row.Deaths_WhiteN,
        black: row.Deaths_Black,
        blackN: row.Deaths_BlackN,
        asian: row.Deaths_Asian,
        asianN: row.Deaths_AsianN
      },
    }
  })

  return filteredData
}

function updateLegend(colors, array, type) {
  const max = Math.max(...array)
  const min = 0

  d3.selectAll('.legend')
    .style('fill', d => colors((d + 1) / 5 * max))

  svg.selectAll('text').remove()

  const text = [1, 2, 3, 4]
  svg.selectAll('text')
    .data(text)
    .enter()
    .append('text')
    .text(d => type == 'cases'
      ? (d / 5 * max * 100).toFixed(1) + '%'
      : (d / 5 * max * 1000).toFixed(1) + '‰')
    .attr('x', d => 770 + 35 * (d - 1) + 'px')
    .attr('y', '405px')
    .style('fill', 'white')
    .style('font-size', '13px')
    .style('letter-spacing', '-0.05em')

}


function drawLineChart(data) {
  const margin = { top: 30, right: 100, bottom: 60, left: 100 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  commonVariable.height = height

  // append the svg object to the body of the page
  const svg = d3.select("#chart")
    .insert('svg', 'div')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style('opacity', 0)
    .append("g")
    .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

  commonVariable.svg = svg

  // calculate the time interval
  const timeArray = data.map(row => new Date(row.Date))
  const maxDate = Math.max(...timeArray)
  const minDate = Math.min(...timeArray)

  // add x axis
  const x = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([0, width])

  commonVariable.x = x


  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr('id', 'x-axis')
    .call(d3.axisBottom(x));

  svg.append('text')
    .attr('text-anchor', 'end')
    .attr('x', 0)
    .attr('y', -15)
    .text('Percentage*')

  // add a legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr("transform", "translate(" + (width + 20) + ",0)")

  const metrics = ['Total', 'White', 'Black', 'Asian', 'AIAN', 'NHPI']
  const colors = d3.scaleOrdinal(d3.schemeCategory10)
  commonVariable.metrics = metrics
  commonVariable.colors = colors

  metrics.forEach((type, idx) => {
    legend.append('rect')
      .attr('class', `${type}-legend`)
      .attr('x', 0)
      .attr('y', idx * 20 + 'px')
      .attr('width', '35px')
      .attr('height', '5px')
      .attr('fill', colors(type))

    legend.append('text')
      .attr('text-anchor', 'start')
      .attr('x', '40px')
      .attr('y', idx * 20 + 5 + 'px')
      .text(type)

  })

  // add a title
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('class', 'title')
    .attr('x', width / 2)
    .attr('y', height + 50)


}

function handleStateClick(path, data) {
  // toggle the selected status
  d3.select('.selected-state').classed('selected-state', false)
  path.classList.toggle('selected-state')
  const state = path.getAttribute('abbr')



  const type = getMapType()
  const date = new Date(document.querySelector('#date').textContent)
  const svg = commonVariable.svg
  const height = commonVariable.height
  const x = commonVariable.x
  const metrics = commonVariable.metrics
  const colors = commonVariable.colors

  d3.select('#y-axis').remove()
  d3.select('#chart .current').remove()
  d3.selectAll('#chart .line-group').remove()
  d3.select('.strong-state').remove()

  d3.select('#chart svg').style('opacity', 1)

  // copy the state path to emphasize clicking status
  const copy = path.cloneNode(true)
  d3.select(copy)
    .attr('style', '')
    .attr('stroke-width', '2px')
    .attr('stroke', '#ffffff')
    .attr('fill', 'url(#pattern-circles)')
    .attr('class', 'strong-state')
    .on('click', e => {
      d3.select('#usmap svg > .strong-state').remove()
      d3.select('#chart svg').style('opacity', 0)
    })

  const rgb = path.style.fill.match(/\d+/g)

  const fill = ((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000) < 128
    ? '#ffffff' : '#00436f'

  if (!document.querySelector('#usmap pattern')) {
    document.querySelector('#usmap svg').insertAdjacentHTML('afterbegin', `<pattern id="pattern-circles" x = "0" y = "0" width = "4" height = "4" patternUnits = "userSpaceOnUse" patternContentUnits = "userSpaceOnUse" > <circle id="pattern-circle" cx="2" cy="2" r="1" /></pattern >`)
  }
  d3.select('#usmap pattern circle').attr('fill', fill)
  document.querySelector('#usmap svg').appendChild(copy)


  const stateStats = data.filter(row => row.State == state)

  let cases_percents = stateStats.map(row => [row.Cases_TotalN, row.Cases_WhiteN, row.Cases_AsianN, row.Cases_BlackN, row.Cases_AIANN, row.Cases_NHPIN,])
  cases_percents = cases_percents.flat()

  let deaths_percents = stateStats.map(row => [row.Deaths_TotalN, row.Deaths_WhiteN, row.Deaths_AsianN, row.Deaths_BlackN, row.Deaths_AIANN, row.Deaths_NHPIN])
  deaths_percents = deaths_percents.flat()

  const yMax = type == 'cases' ? Math.max(...cases_percents)
    : Math.max(...deaths_percents)

  // add y axis
  const y = d3.scaleLinear()
    .domain([0, yMax])
    .nice()
    .range([height, 0])

  svg.append("g")
    .attr('id', 'y-axis')
    .call(d3.axisLeft(y).ticks(5, '.1%'))


  // show title name
  d3.select('#chart .title').text(path.getAttribute('name'))
  const lineGroup = svg.append('g').attr('class', 'line-group')
  // draw lines for each race
  metrics.forEach(e => {
    createLine(e, lineGroup, stateStats, x, y, colors, type)
  })

  // add a current date line

  svg.append('line')
    .attr('x1', x(date))
    .attr('y1', 0)
    .attr('x2', x(date))
    .attr('y2', height)
    .attr('class', 'current')
    .attr('stroke-width', '5px')
    .attr('stroke', colors('line'))
    // .attr('stroke-dasharray', 10)
    .on('mouseenter', e => d3.select('#chart .tooltip').style('display', 'block'))
    .on('mousemove', e => showLineDetail(stateStats, metrics))
    .on('mouseleave', e => d3.select('#chart .tooltip').style('display', 'none'))

}
function showLineDetail(stateStats, metrics) {
  const type = getMapType()
  const date = new Date(document.querySelector('#date').textContent)
  const row = stateStats.find(e => new Date(e.Date).getTime() == date.getTime())
  const target = document.querySelector('#chart .current')
  const tooltip = d3.select('#chart .tooltip')
    .style("left", (d3.mouse(target)[0] + 130) + "px")
    .style("top", (d3.mouse(target)[1]) + "px")

  let report_rate = type == 'cases' ? (1 - row.Cases_Unknown / row.Cases_Total)
    : (1 - row.Deaths_Unknown / row.Deaths_Total)

  if (isNaN(report_rate)) {
    report_rate = 'None'
  } else {
    // convert to percentage
    report_rate = (report_rate * 100).toFixed(2) + '%'
  }
  tooltip.select('.name').text(type + ` (report rate: ${report_rate})`)

  metrics.forEach(m => {
    const c = (m == 'Total') ? 'all' : m
    tooltip.select(`.total .${c}`).text(type == 'cases' ? row[`Cases_${m}`] : row[`Deaths_${m}`])
    tooltip.select(`.percentage .${c}`).text(type == 'cases' ? (row[`Cases_${m}N`] * 100).toFixed(2) + '%' : (row[`Deaths_${m}N`] * 100).toFixed(2) + '%')
  })



}
function createLine(e, lineGroup, stateStats, x, y, colors, type) {
  let points
  if (type == 'cases') {
    points = stateStats.map(row => ({ date: new Date(row.Date), val: row['Cases_' + e + 'N'] }))
  } else {
    points = stateStats.map(row => ({ date: new Date(row.Date), val: row['Deaths_' + e + 'N'] }))
  }


  const line = lineGroup.selectAll('.myline')
    .data([points], d => d.date)

  line
    .enter()
    .append('path')
    .attr('class', 'line')
    .attr('d', d3.line()
      .x(d => x(d.date))
      .y(d => y(d.val)))
    .attr("fill", "none")
    .attr("stroke", colors(e))
    .attr("stroke-width", 2.5)

}
