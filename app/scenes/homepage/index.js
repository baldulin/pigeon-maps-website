import React, { Component } from 'react'
import { connect } from 'kea'

import Map from 'pigeon-maps'
import Marker from 'pigeon-marker'

import state from './state'

const mapboxEnabled = false

// please change this if you take some code from here.
// otherwise the demo page will run out of credits and that would be very sad :(
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoicGlnZW9uLW1hcHMiLCJhIjoiY2l3eW01Y2E2MDA4dzJ6cWh5dG9pYWlwdiJ9.cvdCf-7PymM1Y3xp5j71NQ'

const mapbox = (mapboxId, accessToken) => (x, y, z) => {
  const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? '@2x' : ''
  return `https://api.mapbox.com/styles/v1/mapbox/${mapboxId}/tiles/256/${z}/${x}/${y}${retina}?access_token=${accessToken}`
}

const providers = {
  osm: (x, y, z) => {
    const s = String.fromCharCode(97 + (x + y + z) % 3)
    return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`
  },
  wikimedia: (x, y, z) => {
    const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? '@2x' : ''
    return `https://maps.wikimedia.org/osm-intl/${z}/${x}/${y}${retina}.png`
  },
  stamen: (x, y, z) => {
    const retina = typeof window !== 'undefined' && window.devicePixelRatio >= 2 ? '@2x' : ''
    return `https://stamen-tiles.a.ssl.fastly.net/terrain/${z}/${x}/${y}${retina}.jpg`
  },
  streets: mapbox('streets-v10', MAPBOX_ACCESS_TOKEN),
  satellite: mapbox('satellite-streets-v10', MAPBOX_ACCESS_TOKEN),
  outdoors: mapbox('outdoors-v10', MAPBOX_ACCESS_TOKEN),
  light: mapbox('light-v9', MAPBOX_ACCESS_TOKEN),
  dark: mapbox('dark-v9', MAPBOX_ACCESS_TOKEN)
}

const markers = {
  leuven1: [[50.879, 4.6997], 13],
  leuven2: [[50.874, 4.6947], 13],
  brussels: [[50.85050, 4.35149], 11],
  ghent: [[51.0514, 3.7103], 12],
  coast: [[51.2214, 2.9541], 10]
}

function isMapBox (provider) {
  return provider === 'streets' || provider === 'satellite' || provider === 'outdoors' || provider === 'light' || provider === 'dark'
}

const MapboxAttribution = () => (
  <span className='map-attribution'>
    <span>© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a></span>{' | '}
    <span>© <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a></span>{' | '}
    <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>
  </span>
)

const StamenAttribution = () => (
  <span className='map-attribution'>
    Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.
  </span>
)

const WikimediaAttribution = () => (
  <span className='map-attribution'>
    Map tiles by <a href='https://foundation.wikimedia.org/w/index.php?title=Maps_Terms_of_Use#Where_does_the_map_data_come_from.3F'>Wikimedia</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>
  </span>
)

@connect({
  props: [
    state, [
      'values'
    ]
  ],
  actions: [
    state, [
      'updateValues'
    ]
  ]
})
export default class App extends Component {
  zoomIn = () => {
    const { updateValues } = this.actions
    updateValues({
      zoom: Math.min(this.state.zoom + 1, 18)
    })
  }

  zoomOut = () => {
    const { updateValues } = this.actions
    updateValues({
      zoom: Math.max(this.state.zoom - 1, 1)
    })
  }

  handleBoundsChange = ({ center, zoom, bounds, initial }) => {
    if (initial) {
      console.log('Got initial bounds: ', bounds)
    }
    const { updateValues } = this.actions
    updateValues({ center, zoom })
  }

  handleClick = ({ event, latLng, pixel }) => {
    console.log('Map clicked!', latLng, pixel)
  }

  handleMarkerClick = ({ event, payload, anchor }) => {
    console.log(`Marker #${payload} clicked at: `, anchor)
  }

  handleAnimationStart = () => {
    const { updateValues } = this.actions
    updateValues({ animating: true })
  }

  handleAnimationStop = () => {
    const { updateValues } = this.actions
    updateValues({ animating: false })
  }

  render () {
    const { values } = this.props
    const { updateValues } = this.actions

    const {
      center,
      zoom,
      provider,
      animate,
      metaWheelZoom,
      twoFingerDrag,
      zoomSnap,
      mouseEvents,
      touchEvents,
      animating,
      minZoom,
      maxZoom
    } = values

    return (
      <div style={{textAlign: 'center', marginTop: 50}}>
        <div style={{maxWidth: 600, margin: '0 auto'}}>
          <Map
            {...values}
            provider={providers[provider]}
            onBoundsChanged={this.handleBoundsChange}
            onClick={this.handleClick}
            onAnimationStart={this.handleAnimationStart}
            onAnimationStop={this.handleAnimationStop}
            attribution={
              isMapBox(provider)
                ? <MapboxAttribution />
                : provider === 'stamen'
                  ? <StamenAttribution />
                  : provider === 'wikimedia'
                    ? <WikimediaAttribution />
                    : null}
            defaultWidth={600}
            height={400}>
            {Object.keys(markers).map(key => (
              <Marker key={key} anchor={markers[key][0]} payload={key} onClick={this.handleMarkerClick} />
            ))}
            {isMapBox(provider) && <span className='mapbox-wordmark' />}
          </Map>
        </div>
        <div>
          <button onClick={this.zoomIn}>Zoom In</button>
          <button onClick={this.zoomOut}>Zoom Out</button>
          {' '}
          {Math.round(center[0] * 10000) / 10000}
          {' x '}
          {Math.round(center[1] * 10000) / 10000}
          {' @ '}
          {Math.round(zoom * 100) / 100}
          {' - '}
          {animating ? 'animating' : 'stopped'}
        </div>
        <div style={{marginTop: 20}}>
          {Object.keys(providers).map(key => (
            <button
              key={key}
              onClick={() => isMapBox(key) && !mapboxEnabled ? window.alert('Mapbox tiles disabled! See issue #33 for details!') : this.setState({ provider: key })}
              style={{fontWeight: provider === key ? 'bold' : 'normal', color: isMapBox(key) && !mapboxEnabled ? '#aaa' : '#000'}}>
              {key}
            </button>
          ))}
        </div>
        <div style={{marginTop: 20}}>
          <button onClick={() => updateValues({ animate: !animate })}>{animate ? '[X] animation' : '[ ] animation'}</button>
          <button onClick={() => updateValues({ twoFingerDrag: !twoFingerDrag })}>{twoFingerDrag ? '[X] two finger drag' : '[ ] two finger drag'}</button>
          <button onClick={() => updateValues({ metaWheelZoom: !metaWheelZoom })}>{metaWheelZoom ? '[X] meta wheel zoom' : '[ ] meta wheel zoom'}</button>
          <button onClick={() => updateValues({ zoomSnap: !zoomSnap })}>{zoomSnap ? '[X] zoom snap' : '[ ] zoom snap'}</button>
          <button onClick={() => updateValues({ mouseEvents: !mouseEvents })}>{mouseEvents ? '[X] mouse events' : '[ ] mouse events'}</button>
          <button onClick={() => updateValues({ touchEvents: !touchEvents })}>{touchEvents ? '[X] touch events' : '[ ] touch events'}</button>
        </div>
        <div style={{marginTop: 20}}>
          minZoom: <input onChange={(e) => updateValues({ minZoom: parseInt(e.target.value) || 1 })} value={minZoom} type='number' style={{ width: 40 }} />
          {' '}
          maxZoom: <input onChange={(e) => updateValues({ maxZoom: parseInt(e.target.value) || 18 })} value={maxZoom} type='number' style={{ width: 40 }} />
        </div>
        <div style={{marginTop: 20}}>
          {Object.keys(markers).map(key => (
            <button key={key} onClick={() => updateValues({ center: markers[key][0], zoom: markers[key][1] })}>{key}</button>
          ))}
        </div>
        <div style={{marginTop: 20}}>
          <a href='https://github.com/mariusandra/pigeon-maps'>Documentation and more on GitHub</a>
        </div>
      </div>
    )
  }
}
