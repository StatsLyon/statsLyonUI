import * as d3 from "d3";
import {inject} from "aurelia-framework";
import {Endpoint} from "aurelia-api";
import {Layer} from "./layer";

@inject(Endpoint.of('api'))
export class TrafficLayer extends Layer {

  name              = "Traffic";
  featureCollection = null;
  traffic           = null;
  file              = 'traffic.json';
  svg               = null;
  map               = null;

  neutral = '#000000';
  orange  = '#FF9632';
  red     = '#a8002d';
  green   = '#22ff22';
  grey    = '#dbdbdb';

  strokeWidth = 1;

  constructor(endpoint) {
    super();
    this.endpoint = endpoint;
  }

  /**
   * Initialize own layer.
   * @param mainLayer
   */
  initialize(mainLayer) {
    this.mainLayer = mainLayer;
    this.initializeOwnVectorLayer();

    if (!this.traffic || !this.featureCollection) {
      this.fetch();
    }
    else {
      this.load();
    }
  }

  /**
   * Select a color depending on the state.
   * @param state
   * @return {*}
   */
  selectColor(state) {
    let color;
    switch (state) {
      case 'N':
        color = this.neutral;
        break;
      case 'O':
        color = this.orange;
        break;
      case 'R':
        color = this.red;
        break;
      case 'V':
        color = this.green;
        break;
      case 'G':
      default:
        color = this.grey;
        break;
    }
    return color;
  }

  /**
   * Draw traffic lines.
   */
  draw() {
    this.ownVectorLayer
      .selectAll('path')
      .data(this.featureCollection.features)
      .enter()
      .append('path')
      .attr('d', this.path)
      .attr('stroke-width', this.strokeWidth)
      .style('stroke', (feature) => {
        const matchingFeature = this.traffic.values.find((trafficFeature) => {
          return trafficFeature.twgid == feature.properties.twgid;
        });

        const state = matchingFeature ? matchingFeature.etat : '';

        return this.selectColor(state);
      })
      .attr('fill', 'transparent');
  }

  /**
   * Fetch traffic information.
   * @return {Promise}
   */
  fetchTraffic() {
    return this.endpoint
      .find(`traffic`)
      .then(response => {
        this.traffic = response;
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * Fetch traffic sections.
   * @return {Promise}
   */
  fetchFeatureCollection() {
    return new Promise((resolve, reject) => {
      d3.json(this.file, (error, response) => {
        if (error) {
          return reject(error);
        }
        this.featureCollection = response;
        resolve();
      });
    });
  }

  /**
   * Fetch every needed piece of data and load afterwards.
   */
  fetch() {
    Promise.all([
      this.fetchTraffic(),
      this.fetchFeatureCollection()
    ])
      .then(() => {
        this.load();
      })
      .catch(error => {
        console.error(error);
      })
  }

}
