import React from 'react';
import Disk from 'anyware/lib/game-logic/utils/disk';
import GAMES from 'anyware/lib/game-logic/constants/games';
import SculptureStore from 'anyware/lib/game-logic/sculpture-store';
import DisksActionCreator from 'anyware/lib/game-logic/actions/disks-action-creator';
import DiskModel from 'anyware/lib/game-logic/utils/DiskModel';

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
    sculpture: React.PropTypes.object.isRequired,
    config: React.PropTypes.object.isRequired,
    dispatcher: React.PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.diskActions = new DisksActionCreator(this.props.dispatcher);

    this.physicalDisks = {
      disk0: new DiskModel(),
      disk1: new DiskModel(),
      disk2: new DiskModel(),
    };
    this.state = {
      disk0: 0,
      disk1: 0,
      disk2: 0,
    };
  }

  get disks() {
    return this.props.sculpture.data.get('disks');
  }

  componentWillMount() {
    this.props.sculpture.on(SculptureStore.EVENT_CHANGE, this._handleChanges.bind(this));
    
    // Start physical disk model
    Object.keys(this.physicalDisks).forEach((diskId) => {
      this.physicalDisks[diskId].start();
      this.physicalDisks[diskId].on('position', (pos) => {
        this.setState({[diskId]: pos});
        this.diskActions.sendDiskUpdate(diskId, { position: pos });
      });
    });
    this.interval = setInterval(() => {
      Object.keys(this.physicalDisks).forEach((key) => this.physicalDisks[key].tick());
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    Object.keys(this.physicalDisks).forEach((key) => this.physicalDisks[key].removeAllListeners('position'));
  }

  resetDisks() {
    Object.keys(this.physicalDisks).forEach((key) => {
      this.physicalDisks[key].direction = Disk.STOPPED;
      this.physicalDisks[key].position = 0;
    });
  }

  _handleChanges(changes) {
    if (changes.hasOwnProperty('currentGame')) {
      // Reset on start of playing the disk game and on start of games cycle
      if (changes.currentGame === GAMES.DISK || changes.currentGame === GAMES.HANDSHAKE) {
        this.resetDisks();
      }
    }

    const diskChanges = changes.disks;
    if (!diskChanges) return;

    for (const diskId of Object.keys(diskChanges)) {
      const disk = this.disks.get(diskId);
      const newDiskValues = diskChanges[diskId];

      let position, direction, user;
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
      if (newDiskValues.hasOwnProperty('direction')) {
        direction = newDiskValues.direction;
      }
      else {
        direction = disk.getDirection();
      }
      if (newDiskValues.hasOwnProperty('user')) {
        user = newDiskValues.user;
      }
      else {
        user = disk.getUser();
      }

      if (direction !== undefined) this.physicalDisks[diskId].direction = direction;
      if (position !== undefined) this.physicalDisks[diskId].position = position;
      // FIXME: Update physical model "user" state?
    }
  }

  render() {
    return <svg id="disk-view" viewBox="-50 -50 100 100" style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      zIndex: -1,
    }}>
      <g x="50%" y="50%" transform="scale(0.8 0.8)">
        <circle cx="0" cy="0" r="50" style={{fill: "white"}}/>
        <SingleDisk position={this.state.disk0} url={this.props.config.diskUrls.disk0}/>
        <SingleDisk position={this.state.disk1} url={this.props.config.diskUrls.disk1}/>
        <SingleDisk position={this.state.disk2} url={this.props.config.diskUrls.disk2}/>
      </g>
    </svg>;
  }
}
