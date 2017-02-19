import React from 'react';
import GAMES from 'anyware/lib/game-logic/constants/games';
import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import DisksActionCreator from 'anyware/lib/game-logic/actions/disks-action-creator';
import DiskModel from 'anyware/lib/game-logic/utils/DiskModel';
import dispatcher from '../dispatcher';
import {sculptureStore} from '../stores';
import config from '../config';
import Graphics from './disk-game.svg';

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
    this.diskActions = new DisksActionCreator(dispatcher);

    this.physicalDisks = {
      disk0: new DiskModel(),
      disk1: new DiskModel(),
      disk2: new DiskModel(),
    };
    this.state = {
      disk0: 0,
      disk1: 0,
      disk2: 0,
      level: 0,
      active: false,
    };
  }

  get disks() {
    return sculptureStore.data.get('disks');
  }

  componentWillMount() {
    sculptureStore.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
    
    // Start physical disk model
    Object.keys(this.physicalDisks).forEach((diskId) => {
      this.physicalDisks[diskId].start();
      this.physicalDisks[diskId].on('position', (pos) => this.sendDiskUpdate(diskId, pos));
    });
    this.interval = setInterval(() => {
      Object.keys(this.physicalDisks).forEach((key) => this.physicalDisks[key].tick());
    }, 30);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    Object.keys(this.physicalDisks).forEach((key) => this.physicalDisks[key].removeAllListeners('position'));
  }

  sendDiskUpdate(diskId, position) {
// FIXME: Commented out this as it's handled in _handleChanges when it comes back from the store
// Not sure if we should proactively set the state here.
//    this.setState({[diskId]: position});
    this.diskActions.sendDiskUpdate(diskId, { position });
  }

  resetDisks() {
    Object.keys(this.physicalDisks).forEach((diskId) => {
      this.physicalDisks[diskId].stop();
      const pos = this.disks.get(diskId).get('position');
      this.physicalDisks[diskId].position = pos;
      this.sendDiskUpdate(diskId, pos);
    });
  }

  _handleChanges(changes) {
    this.setState({active: sculptureStore.isPlayingDiskGame});

    // Handle game changes
    if (changes.hasOwnProperty('currentGame')) {
      // Reset on start of playing the disk game and on start of games cycle
      if (changes.currentGame === GAMES.DISK || changes.currentGame === GAMES.HANDSHAKE) {
        setTimeout(this.resetDisks.bind(this), 0);
      }
    }

    // Handle level changes
    const diskGameChanges = changes.disk;
    if (diskGameChanges && diskGameChanges.level) {
      this.setState({level: diskGameChanges.level});
    }

    // Handle disk position changes
    const diskChanges = changes.disks;
    if (!diskChanges) return;

    for (const diskId of Object.keys(diskChanges)) {
      const disk = this.disks.get(diskId);
      const newDiskValues = diskChanges[diskId];

      let position, user, targetSpeed;
      if (newDiskValues.hasOwnProperty('position') && newDiskValues.position !== this.state[diskId]) {
        position = newDiskValues.position;
      }
      else {
        // leave position undefined because sending a position that
        // is already set stops the disk

        // FIXME: This might not be the best way of solving this:
        // If the changes are discarded due to the above previousHardwarePosition check, and there
        // are no other changes, we don't need to send anything as it would be redundant.
        delete newDiskValues.position;
        if (Object.keys(newDiskValues).length === 0) continue;
      }
      if (newDiskValues.hasOwnProperty('user')) {
        user = newDiskValues.user;
      }
      else {
        user = disk.getUser();
      }
      if (newDiskValues.hasOwnProperty('targetSpeed')) {
        targetSpeed = newDiskValues.targetSpeed;
      }
      else {
        targetSpeed = disk.getTargetSpeed();
      }

      if (targetSpeed !== undefined) {
        this.physicalDisks[diskId].setTargetSpeed(targetSpeed);
      }
      if (position !== undefined) {
        this.physicalDisks[diskId].position = position;
        this.setState({[diskId]: position});
      }
      // FIXME: Update physical model "user" state?
    }
  }

  render() {
    return this.state.active && <svg id="disk-view" viewBox="0 0 700 700" style={{
      position: "relative",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
    }}>
      <g display="none"><Graphics/></g>
      <g className="transformOrigin" style={{transform: `translate(${this.props.translate[0]}px, ${this.props.translate[1]}px) scale(${this.props.scale})`}}>
          <use xlinkHref="#circle"/>
          <use xlinkHref="#disk0" style={{transformOrigin: "192px 213px ", transform: `rotate(${this.state.disk0}deg)`}}/>
          <use xlinkHref="#disk1" style={{transformOrigin: "468.5px 426.5px", transform: `rotate(${this.state.disk1}deg)`}}/>
          <use xlinkHref="#disk2" style={{transformOrigin: "350px 350px", transform: `rotate(${this.state.disk2}deg)`}}/>
          <use xlinkHref={`#level${this.state.level + 1}`}/>
      </g>
    </svg>;
  }
}
