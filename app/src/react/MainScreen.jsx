import React from 'react';
import StatusView from './StatusView';
import DiskView from 'anyware/lib/views/DiskView';
import SimonView from 'anyware/lib/views/SimonView';
import DebugView from './DebugView';
import {sculptureStore} from '../stores';
import config from '../config';
import './main.css';

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

  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return <div>
      <Canvas>
        <StatusView debug={config.DEBUG.status} {...config.projectionParameters}/>
        {config.DEBUG.debugView && <DebugView {...config.projectionParameters}/>}
        <DiskView store={sculptureStore} config={config} {...config.projectionParameters}/>
        <SimonView store={sculptureStore} config={config} {...config.projectionParameters}/>
      </Canvas>
    </div>;
  }
}

