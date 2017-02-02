import React from 'react';
import StatusView from './StatusView';
import DiskView from './DiskView';
import config from '../config';
import './main.css';

const Version = ({versionStr}) => <div id="version"><p>{versionStr}</p></div>;
const manifest = chrome.runtime.getManifest();

const Canvas = ({children}) => <div style={{
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  overflow: "auto",
  background: "black",
  border: "1px solid red",
  zIndex: -1,
}}>
  {children}
</div>;

export default class MainScreen extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  // FIXME: Pass the center prop to StatusView based on game status (isPlayingNoGame?)
  render() {
    return <div>
      <Canvas>
        <StatusView  {...config.projectionParameters}/>
        <DiskView {...config.projectionParameters}/>
      </Canvas>
      <Version versionStr={`V${manifest.version}`}/>
      <button onClick={this.props.restart} style={{zIndex: 20, position: "relative"}}>Restart</button>
    </div>;
  }
}

