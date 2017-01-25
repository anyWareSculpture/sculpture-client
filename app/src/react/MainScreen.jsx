import React from 'react';
import StatusView from './StatusView';
import DiskView from './DiskView';

const Version = ({versionStr}) => <div id="version"><p>{versionStr}</p></div>;
const manifest = chrome.runtime.getManifest();

export default class MainScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  // FIXME: Pass the center prop to StatusView based on game status (isPlayingNoGame?)
  render() {
    return <div>
      <StatusView/>
      <DiskView/>
      <Version versionStr={`V${manifest.version}`}/>
      <button onClick={this.props.restart} style={{zIndex: 20, position: "relative"}}>Restart</button>
    </div>;
  }
}

