import React from 'react';
import StatusView from './StatusView';
import DiskView from './DiskView';
import DebugView from './DebugView';
import config from '../config';
import './main.css';

const Version = ({versionStr}) => <div id="version"><p>{versionStr}</p></div>;

Version.propTypes = {
  versionStr: React.PropTypes.string.isRequired,
};

const manifest = chrome.runtime.getManifest();

const Canvas = ({children}) => <div style={{
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  overflow: "visible",
  background: "black",
// For projection debugging  border: "1px solid red",
  zIndex: -1,
}}>
  {children}
</div>;

Canvas.propTypes = {
  children: React.PropTypes.node,
};

export default class MainScreen extends React.Component {

  static propTypes = {
    restart: React.PropTypes.func,
  }
  
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  // FIXME: Pass the center prop to StatusView based on game status (isPlayingNoGame?)
  render() {
    return <div>
      <Canvas>
        <StatusView debug={config.DEBUG.status} {...config.projectionParameters}/>
        {config.DEBUG.debugView && <DebugView {...config.projectionParameters}/>}
        <DiskView {...config.projectionParameters}/>
      </Canvas>
      {config.DEBUG.status && <div>
        <Version versionStr={`V${manifest.version}`}/>
        <button onClick={this.props.restart} style={{zIndex: 20, position: "relative"}}>Restart</button>
      </div>}
    </div>;
  }
}

