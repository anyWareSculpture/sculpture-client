import React from 'react';
import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import {sculptureStore} from '../stores';
import Graphics from './svg/disk-game.svg';
import config from './config';

const diskOrigins = {
  level0: {
    disk0: [374.66, 570.39],
    disk1: [219.369, 322.276],
    disk2: [439.437, 161.5],
  },
  level1: {
    disk0: [350, 350],
    disk1: [350, 350],
    disk2: [350, 350],
  },
  level2: {
    disk0: [350, 350],
    disk1: [468.5, 426.5],
    disk2: [192, 213],
  },
};

const SingleDisk = ({position, url}) => {
  return <image xlinkHref={url} x={0} y={0} height={100} width={100}
                transform={`rotate(${position}) translate(-50 -50)`}/>;
};

SingleDisk.propTypes = {
  position: React.PropTypes.number.isRequired,
  url: React.PropTypes.string.isRequired,
};

export default class DiskView extends React.Component {
  static propTypes = {
    scale: React.PropTypes.number,
    translate: React.PropTypes.arrayOf(React.PropTypes.number),
  };
  static defaultProps = {
    scale: 1,
    translate: [0, 0],
  };

  constructor(props) {
    super(props);

    this.state = {
      disk0: 0,
      disk1: 0,
      disk2: 0,
      level: 0,
      active: false,
      showCircle: false,
      showPuzzle: false,
    };
  }

  get disks() {
    return sculptureStore.data.get('disk').get('disks');
  }

  get lightArray() {
    return sculptureStore.data.get('lights');
  }

  componentWillMount() {
    // FIXME: Remove on unmount
    sculptureStore.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
    sculptureStore.on(SculptureStore.EVENT_LOCAL_CHANGE, this._handleLocalChanges.bind(this));
  }

  componentWillUnmount() {
  }

  _handleChanges(changes) {
    this.setState({active: sculptureStore.isPlayingDiskGame});

    if (changes.lights && changes.lights[config.LIGHTS.ART_LIGHTS_STRIP]) {
      this.setState({showCircle: this.lightArray.getIntensity(config.LIGHTS.ART_LIGHTS_STRIP, '3') > 0});
    }
    if (changes.disk) {
      // Show puzzle when active
      if (changes.disk.hasOwnProperty('active')) {
        this.setState({showPuzzle: changes.disk.active});
      }
      // Handle level changes
      if (changes.disk.hasOwnProperty('level')) {
        this.setState({level: changes.disk.level});
      }
    }
  }

  _handleLocalChanges() {
    // Handle local position state
    for (let diskId of ['disk0', 'disk1', 'disk2']) {
      this.setState({[diskId]: sculptureStore.getDiskPosition(diskId)});
    }
  }

  render() {
    return this.state.active && this.state.level < 3 && <svg id="disk-view" viewBox="0 0 700 700" style={{
      position: "relative",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
    }}>
      <g display="none"><Graphics/></g>
      <g className="transformOrigin" style={{transform: `translate(${this.props.translate[0]}px, ${this.props.translate[1]}px) scale(${this.props.scale})`}}>
          {this.state.showCircle && <use xlinkHref="#circle"/>}
          <use xlinkHref={`#level${this.state.level}`}
               style={{
                 opacity: this.state.showPuzzle ? 1 : 0,
                 transition: "opacity 2s ease-in",
               }}/>
      { ['disk0', 'disk1', 'disk2'].map((diskId) => {
        return <use key={diskId}
                    xlinkHref={`#level${this.state.level}-${diskId}`}
                    style={{
                      transformOrigin: diskOrigins[`level${this.state.level}`][diskId].map((c) => `${c}px`).join(' '),
                      transform: `rotate(${this.state[diskId]}deg)`,
                      opacity: this.state.showPuzzle ? 1 : 0,
                      transition: "opacity 2s ease-in",
                    }}/>;
      }) }
      </g>
    </svg>;
  }
}
